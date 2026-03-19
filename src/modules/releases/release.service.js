/**
 * Módulo Releases - Service
 * Reglas: SemVer, anti-downgrade, workflow, RELEASE_EMPTY, ARCHIVED bloqueado, inmutabilidad version, auditoría.
 */

const releaseRepository = require("./release.repository");
const featureRepository = require("../backlog/feature.repository");
const authRepository = require("../auth/auth.repository");
const changeRequestService = require("../changeRequests/changeRequest.service");
const { validateSemVer, compareSemVer, parseSemVer } = require("./semver.validator");
const { validateReleaseTransition } = require("./release.workflow.validator");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function toPlain(release) {
  if (!release) return null;
  const r = typeof release.toJSON === "function" ? release.toJSON() : release;
  return {
    id: r.id,
    version: r.version,
    status: r.status,
    description: r.description,
    organization_id: r.organization_id,
    created_by: r.created_by,
    released_at: r.released_at,
    created_at: r.created_at,
    updated_at: r.updated_at
  };
}

function ensureAuditContext(context) {
  const { user, requestId, ip, userAgent } = context || {};
  if (!user?.id || !requestId) {
    throw new AppError("Contexto de auditoría incompleto", {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR
    });
  }
  return {
    user_id: user.id,
    request_id: requestId,
    ip_address: ip || null,
    user_agent: userAgent || null
  };
}

function rejectVersionInPayload(payload) {
  if (payload && Object.prototype.hasOwnProperty.call(payload, "version")) {
    throw new AppError("El campo version no puede modificarse", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_VERSION_IMMUTABLE
    });
  }
}

async function createRelease(payload, context = {}) {
  const { version, description } = payload || {};
  validateSemVer(version);

  const existing = await releaseRepository.findByVersion(version);
  if (existing) {
    throw new AppError("Ya existe una release con esa versión", {
      statusCode: 409,
      code: ERROR_CODES.RELEASE_ALREADY_EXISTS
    });
  }

  const latestReleased = await releaseRepository.findLatestReleased();
  if (latestReleased && compareSemVer(version, latestReleased.version) <= 0) {
    throw new AppError("La nueva versión debe ser mayor que la última release publicada", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_VERSION_NOT_ALLOWED
    });
  }

  const organizationId = context.organizationId;
  const created = await releaseRepository.create({
    version: version.trim(),
    description: description || null,
    status: "PLANNED",
    organization_id: organizationId || null,
    created_by: context.user?.id
  });
  return toPlain(created);
}

async function getReleaseById(id, organizationId) {
  const release = await releaseRepository.findById(id);
  if (!release) {
    throw new AppError("Release no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.RELEASE_NOT_FOUND
    });
  }
  if (organizationId != null && release.organization_id !== organizationId) {
    throw new AppError("No tiene acceso a esta release", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }
  const { getModels } = require("../../infrastructure/db/loadModels");
  const { Feature } = getModels();
  const features = await Feature.findAll({
    where: { release_id: id },
    attributes: ["id", "title", "status", "project_id", "number"],
    order: [["created_at", "DESC"]],
    raw: true
  });
  const plain = toPlain(release);
  plain.features = features || [];
  return plain;
}

async function listReleases(options = {}) {
  const { items, total } = await releaseRepository.list({
    page: options.page,
    limit: options.limit,
    status: options.status,
    organizationId: options.organizationId
  });
  return {
    data: items.map(toPlain),
    meta: {
      total,
      page: options.page || 1,
      limit: options.limit || 10,
      totalPages: total === 0 ? 0 : Math.ceil(total / (options.limit || 10))
    }
  };
}

async function updateStatus(id, nextStatus, context) {
  await getReleaseById(id, context.organizationId);
  const changeRequestId = context.changeRequestId;
  const validatedCr = await changeRequestService.validateAndConsumeChangeRequest(changeRequestId, "RELEASE", id, context);

  const release = await releaseRepository.findById(id);
  if (!release) {
    throw new AppError("Release no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.RELEASE_NOT_FOUND
    });
  }
  if (release.status === "ARCHIVED") {
    throw new AppError("No se puede modificar una release archivada", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_ARCHIVED
    });
  }
  validateReleaseTransition(release.status, nextStatus);

  if (nextStatus === "RELEASED") {
    const count = await releaseRepository.countFeaturesByReleaseId(id);
    if (count === 0) {
      throw new AppError("No se puede publicar una release sin features asociadas", {
        statusCode: 400,
        code: ERROR_CODES.RELEASE_EMPTY
      });
    }
    const { getModels } = require("../../infrastructure/db/loadModels");
    const { Feature } = getModels();
    const features = await Feature.findAll({
      where: { release_id: id },
      attributes: ["id", "title", "status"]
    });
    const notDone = features.filter((f) => f.status !== "DONE");
    if (notDone.length > 0) {
      const titles = notDone.map((f) => (f.title || f.id).slice(0, 50)).join(", ");
      throw new AppError(
        "No se puede publicar la release: todas las features deben estar en estado DONE. Features no completadas: " + titles,
        { statusCode: 400, code: ERROR_CODES.RELEASE_FEATURES_NOT_DONE }
      );
    }
  }

  const updatePayload = { status: nextStatus };
  if (release.status === "QA" && nextStatus === "RELEASED") {
    updatePayload.released_at = new Date();
  }

  const updated = await releaseRepository.update(id, updatePayload);
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "STATUS_CHANGE",
    entity: "RELEASE",
    entity_id: id,
    metadata: { from: release.status, to: nextStatus }
  });
  await changeRequestService.markAsImplemented(changeRequestId || validatedCr.id, context);
  return toPlain(updated);
}

async function assignFeatureToRelease(releaseId, featureId, context) {
  await getReleaseById(releaseId, context.organizationId);

  const release = await releaseRepository.findById(releaseId);
  if (!release) {
    throw new AppError("Release no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.RELEASE_NOT_FOUND
    });
  }
  if (release.status === "ARCHIVED") {
    throw new AppError("No se puede asignar features a una release archivada", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_ARCHIVED
    });
  }

  const feature = await featureRepository.findById(featureId);
  if (!feature) {
    throw new AppError("Feature no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.FEATURE_NOT_FOUND
    });
  }
  if (feature.release_id != null && feature.release_id !== releaseId) {
    throw new AppError("La feature ya está asignada a otra release", {
      statusCode: 400,
      code: ERROR_CODES.FEATURE_ALREADY_IN_RELEASE
    });
  }
  if (feature.release_id === releaseId) {
    return toPlain(release);
  }

  const changeRequestId = context.changeRequestId;
  const validatedCr = await changeRequestService.validateAndConsumeChangeRequest(changeRequestId, "FEATURE", featureId, context);

  await featureRepository.update(featureId, { release_id: releaseId });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "FEATURE_ASSIGN_RELEASE",
    entity: "FEATURE",
    entity_id: featureId,
    metadata: { release_id: releaseId, feature_id: featureId }
  });
  // Regla de negocio: asociar feature a release valida CR, pero no lo consume todavía.
  // El CR no debe pasar a IMPLEMENTED en esta etapa previa de planificación/ensamble.
  return toPlain(await releaseRepository.findById(releaseId));
}

async function removeFeatureFromRelease(releaseId, featureId, context) {
  await getReleaseById(releaseId, context.organizationId);

  const release = await releaseRepository.findById(releaseId);
  if (!release) {
    throw new AppError("Release no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.RELEASE_NOT_FOUND
    });
  }
  if (release.status === "ARCHIVED") {
    throw new AppError("No se puede desasociar features de una release archivada", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_ARCHIVED
    });
  }

  const feature = await featureRepository.findById(featureId);
  if (!feature) {
    throw new AppError("Feature no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.FEATURE_NOT_FOUND
    });
  }
  if (feature.release_id !== releaseId) {
    return await getReleaseById(releaseId, context.organizationId);
  }

  await featureRepository.update(featureId, { release_id: null });
  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "FEATURE_UNASSIGN_RELEASE",
    entity: "FEATURE",
    entity_id: featureId,
    metadata: { release_id: releaseId, feature_id: featureId }
  });
  return await getReleaseById(releaseId, context.organizationId);
}

async function updateReleaseDescription(id, payload, context) {
  await getReleaseById(id, context.organizationId);
  const changeRequestId = context.changeRequestId ?? payload?.change_request_id;
  const validatedCr = await changeRequestService.validateAndConsumeChangeRequest(changeRequestId, "RELEASE", id, context);

  rejectVersionInPayload(payload);
  const release = await releaseRepository.findById(id);
  if (!release) {
    throw new AppError("Release no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.RELEASE_NOT_FOUND
    });
  }
  if (release.status === "ARCHIVED") {
    throw new AppError("No se puede modificar una release archivada", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_ARCHIVED
    });
  }
  const updated = await releaseRepository.update(id, { description: payload?.description ?? release.description });
  await changeRequestService.markAsImplemented(changeRequestId || validatedCr.id, context);
  return toPlain(updated);
}

/**
 * Crea una release de hotfix desde una release en estado RELEASED.
 * Nueva versión = same major.minor, patch+1. Estado IN_PROGRESS. No copia features. Audita HOTFIX_CREATED.
 */
async function createHotfixFromRelease(releaseId, context) {
  await getReleaseById(releaseId, context.organizationId);
  const changeRequestId = context.changeRequestId;
  let validatedCr;
  try {
    validatedCr = await changeRequestService.validateAndConsumeChangeRequest(changeRequestId, "RELEASE", releaseId, context);
  } catch (err) {
    if (err && err.code === ERROR_CODES.CHANGE_REQUEST_REQUIRED) {
      throw new AppError(
        "Para crear hotfix se requiere un ChangeRequest aprobado asociado a esta RELEASE (no a sus features).",
        {
          statusCode: 400,
          code: ERROR_CODES.CHANGE_REQUEST_REQUIRED
        }
      );
    }
    throw err;
  }

  const release = await releaseRepository.findById(releaseId);
  if (!release) {
    throw new AppError("Release no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.RELEASE_NOT_FOUND
    });
  }
  if (release.status === "ARCHIVED") {
    throw new AppError("No se puede crear hotfix desde una release archivada", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_ARCHIVED
    });
  }
  if (release.status !== "RELEASED") {
    throw new AppError("Solo se puede crear hotfix desde una release en estado RELEASED", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_HOTFIX_NOT_ALLOWED
    });
  }
  if (release.released_at == null) {
    throw new AppError("La release origen debe tener released_at para crear hotfix", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_HOTFIX_NOT_ALLOWED
    });
  }

  const parsed = parseSemVer(release.version);
  if (!parsed) {
    throw new AppError("Versión de la release origen no es SemVer válido", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_INVALID_VERSION
    });
  }
  const newVersion = `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;

  const existing = await releaseRepository.findByVersion(newVersion);
  if (existing) {
    throw new AppError("Ya existe una release con la versión de hotfix calculada", {
      statusCode: 409,
      code: ERROR_CODES.RELEASE_ALREADY_EXISTS
    });
  }

  const latestReleased = await releaseRepository.findLatestReleased();
  if (latestReleased && compareSemVer(newVersion, latestReleased.version) <= 0) {
    throw new AppError("La nueva versión debe ser mayor que la última release publicada", {
      statusCode: 400,
      code: ERROR_CODES.RELEASE_VERSION_NOT_ALLOWED
    });
  }

  const created = await releaseRepository.create({
    version: newVersion,
    status: "IN_PROGRESS",
    description: `Hotfix de ${release.version}`,
    organization_id: release.organization_id ?? context.organizationId ?? null,
    created_by: context.user?.id
  });

  const auditCtx = ensureAuditContext(context);
  await authRepository.createAuditLog({
    ...auditCtx,
    action: "HOTFIX_CREATED",
    entity: "RELEASE",
    entity_id: created.id,
    metadata: {
      from_release_id: releaseId,
      from_version: release.version,
      to_version: newVersion
    }
  });

  await changeRequestService.markAsImplemented(changeRequestId || validatedCr.id, context);
  return toPlain(created);
}

async function deleteRelease(id, organizationId) {
  const release = await releaseRepository.findById(id);
  if (!release) {
    throw new AppError("Release no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.RELEASE_NOT_FOUND
    });
  }
  if (organizationId != null && release.organization_id !== organizationId) {
    throw new AppError("No tiene acceso a esta release", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }
  await featureRepository.updateReleaseIdToNull(id);
  await releaseRepository.deleteById(id);
  return { id: release.id, deleted: true };
}

async function deleteReleasesBulk(ids, organizationId) {
  if (!ids || ids.length === 0) {
    throw new AppError("Se requiere al menos un id de release", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
  const uniqueIds = [...new Set(ids.map((id) => String(id)))];
  const releases = await Promise.all(uniqueIds.map((id) => releaseRepository.findById(id)));
  const notFound = uniqueIds.filter((id, i) => !releases[i]);
  if (notFound.length > 0) {
    throw new AppError("Release(s) no encontrada(s): " + notFound.join(", "), {
      statusCode: 404,
      code: ERROR_CODES.RELEASE_NOT_FOUND
    });
  }
  if (organizationId != null) {
    const forbidden = releases.filter((r) => r && r.organization_id !== organizationId);
    if (forbidden.length > 0) {
      throw new AppError("No tiene acceso a una o más releases", {
        statusCode: 403,
        code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
      });
    }
  }
  for (const id of uniqueIds) {
    await featureRepository.updateReleaseIdToNull(id);
  }
  for (const id of uniqueIds) {
    await releaseRepository.deleteById(id);
  }
  return { deleted: uniqueIds.length, ids: uniqueIds };
}

module.exports = {
  createRelease,
  getReleaseById,
  listReleases,
  updateStatus,
  assignFeatureToRelease,
  removeFeatureFromRelease,
  updateReleaseDescription,
  createHotfixFromRelease,
  deleteRelease,
  deleteReleasesBulk,
  rejectVersionInPayload,
  toPlain
};
