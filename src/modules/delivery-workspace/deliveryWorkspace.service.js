/**
 * Delivery Workspace — Servicio: archivos del workspace y commit & push.
 * Pre-Git Workflow: base_commit_hash, snapshot completo (path/status/content/hash), compare.
 */

const crypto = require("crypto");
const deliveryFileRepository = require("./deliveryFile.repository");
const deliveryCommitRepository = require("./deliveryCommit.repository");
const deliveryReviewRepository = require("./deliveryReview.repository");
const reviewCommentRepository = require("./reviewComment.repository");
const codeDeliveryRepository = require("../code-deliveries/codeDelivery.repository");
const workOrderRepository = require("../work-orders/workOrder.repository");
const githubCommitService = require("../github-integration/github-commit.service");
const githubService = require("../github-integration/github.service");
const githubRepositoryService = require("../github-integration/github.repository.service");
const gitService = require("./git.service");
const aiService = require("../ai-review/ai.service");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const logger = require("../../config/logger");
const gitDiffService = require("../deliveries/services/gitDiff.service");

/** FASE 5: Si el archivo supera este tamaño (bytes), no se guarda contenido en snapshot y se marca large_file. */
const MAX_FILE_SIZE_FOR_DIFF = 512 * 1024; // 512 KB
/**
 * Límites por tipo para persistir en MySQL.
 * MySQL `TEXT` suele limitarse a ~65KB; evitar `ER_DATA_TOO_LONG`.
 */
const MAX_DB_TEXT_BYTES = 60 * 1024; // ~60KB de margen

// Cache para clasificación diff vs master (FASE 8-9). TTL 5 min.
const DIFF_CACHE_TTL_MS = 5 * 60 * 1000;
const masterPathsCache = new Map();
const masterFilesMapCache = new Map();

function getMasterPathsCacheKey(projectId, baseBranch) {
  return `${projectId || ""}:${baseBranch || "main"}`;
}

function getMasterContent(projectId, userId, baseBranch, path) {
  const key = getMasterPathsCacheKey(projectId, baseBranch);
  let mapEntry = masterFilesMapCache.get(key);
  if (!mapEntry || Date.now() - mapEntry.at > DIFF_CACHE_TTL_MS) {
    mapEntry = { map: new Map(), at: Date.now() };
    masterFilesMapCache.set(key, mapEntry);
  }
  if (mapEntry.map.has(path)) return Promise.resolve(mapEntry.map.get(path));
  return githubRepositoryService.getFileContent(projectId, userId, path, baseBranch).then((r) => {
    const content = r ? r.content : null;
    mapEntry.map.set(path, content);
    return content;
  });
}

async function ensureDeliveryBelongsToProject(deliveryId, projectId, organizationId) {
  const delivery = await codeDeliveryRepository.findByIdAndProject(deliveryId, projectId);
  if (!delivery) {
    throw new AppError("Entrega no encontrada o no pertenece al proyecto", {
      statusCode: 404,
      code: ERROR_CODES.CODE_DELIVERY_NOT_FOUND
    });
  }
  return delivery;
}

/** FASE 1: Solo permitir commit si status es READY o LOCKED. */
function ensureDeliveryReadyOrLockedForCommit(delivery) {
  const plain = delivery.toJSON ? delivery.toJSON() : delivery;
  const status = (plain.status || "").toUpperCase();
  if (status !== "READY" && status !== "LOCKED") {
    throw new AppError(
      "Solo se puede hacer commit cuando la entrega está en estado READY o LOCKED. Estado actual: " + (plain.status || "—"),
      { statusCode: 400, code: "DELIVERY_STATUS_NOT_COMMITTABLE" }
    );
  }
}

/** FASE 2: Si la entrega está LOCKED, no permitir modificar archivos ni re-sincronizar. */
function ensureDeliveryNotLocked(delivery) {
  const plain = delivery.toJSON ? delivery.toJSON() : delivery;
  const status = (plain.status || "").toUpperCase();
  if (status === "LOCKED") {
    throw new AppError(
      "La entrega está bloqueada (LOCKED). No se pueden modificar archivos ni sincronizar desde Git.",
      { statusCode: 400, code: "DELIVERY_LOCKED" }
    );
  }
}

async function listFiles(projectId, deliveryId, organizationId, context) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, organizationId);
  const rows = await deliveryFileRepository.listByDelivery(deliveryId, projectId);

  // Detección REAL contra master (solo existencia por path para performance):
  // - Si el archivo existe en master ⇒ MODIFIED
  // - Si no existe en master ⇒ ADDED
  // Nota: el diff de líneas se calcula en /compare (contenido base vs workspace) al abrir el archivo.
  let masterPathsSet = null;
  let baseBranch = "master";
  const userId = context && context.user && context.user.id;
  if (userId && rows.length) {
    try {
      // Usa la rama por defecto real del repo (evita reclasificar con "master" fijo)
      baseBranch = await githubService.getDefaultBranch(projectId, userId).catch(() => baseBranch);
      const cacheKey = getMasterPathsCacheKey(projectId, baseBranch);
      const hit = masterPathsCache.get(cacheKey);
      if (hit && Date.now() - hit.at <= DIFF_CACHE_TTL_MS) {
        masterPathsSet = hit.set;
      } else {
        let tree;
        try {
          tree = await githubRepositoryService.getRepositoryTree(projectId, userId, baseBranch);
        } catch (_) {
          // Fallback: rama por defecto (por si el branch actual no está disponible)
          baseBranch = await githubService.getDefaultBranch(projectId, userId).catch(() => "main");
          tree = await githubRepositoryService.getRepositoryTree(projectId, userId, baseBranch);
        }
        masterPathsSet = new Set((tree && tree.paths) ? tree.paths : []);
        masterPathsCache.set(getMasterPathsCacheKey(projectId, baseBranch), { set: masterPathsSet, at: Date.now() });
        logger.info(
          { event: "MASTER_FILES_LOADED", project_id: projectId, base_branch: baseBranch, count: masterPathsSet.size },
          "Master files tree loaded"
        );
      }
    } catch (_) {
      masterPathsSet = null;
    }
  }

  const out = rows.map((r) => {
    const p = r.toJSON ? r.toJSON() : r;
    let status = p.status;
    // Corrección solo cuando el status guardado sea "ADDED".
    // Evita que "existe en master/main" sobreescriba un "MODIFIED" real ya detectado por Git.
    if (masterPathsSet && status === "ADDED") {
      const path = String(p.file_path || "")
        .replace(/\\/g, "/")
        .trim()
        .replace(/^\.\//, "") // normaliza "./foo" -> "foo"
        .replace(/^\/+/, "");
      if (masterPathsSet.has(path)) status = "MODIFIED";
    }
    const item = {
      id: p.id,
      file_path: p.file_path,
      status: status,
      created_at: p.created_at,
      updated_at: p.updated_at
    };
    if (p.old_file_path) item.old_file_path = p.old_file_path;
    item.is_binary = gitService.isBinaryPath(p.file_path);
    return item;
  });

  logger.info(
    { event: "DELIVERY_FILES_LOADED", project_id: projectId, delivery_id: deliveryId, count: out.length },
    "Delivery files loaded"
  );

  return out;
}

async function addFile(projectId, deliveryId, payload, context) {
  const delivery = await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  ensureDeliveryNotLocked(delivery);
  const { file_path, content, content_base64, status } = payload;
  const allowedStatuses = ["ADDED", "MODIFIED", "DELETED", "RENAMED", "COPIED"];
  let statusVal = status && allowedStatuses.includes(status) ? status : "ADDED";
  // Si viene como ADDED o sin status, comprobar en GitHub (rama base) si el archivo ya existe → MODIFIED
  if (statusVal === "ADDED" && (file_path || "").trim()) {
    const userId = context.user?.id;
    if (userId) {
      try {
        const baseBranch = await githubService.getDefaultBranch(projectId, userId).catch(() => "main");
        const gh = await githubService.getFileContentByPath(file_path.trim(), baseBranch, projectId, userId);
        if (gh) statusVal = "MODIFIED";
      } catch (_) {
        // Sin repo o error: mantener ADDED
      }
    }
  }
  const created = await deliveryFileRepository.create({
    project_id: projectId,
    delivery_id: deliveryId,
    file_path: file_path || "",
    content: content ?? null,
    content_base64: content_base64 ?? null,
    status: statusVal
  });
  logger.info(
    { event: "DELIVERY_WORKSPACE_FILE_ADDED", project_id: projectId, delivery_id: deliveryId, file_path: file_path, file_id: created.id, status: statusVal },
    "Delivery workspace file added"
  );
  const p = created.toJSON ? created.toJSON() : created;
  return { id: p.id, file_path: p.file_path, status: p.status, created_at: p.created_at };
}

async function getFile(fileId, projectId, deliveryId, organizationId) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, organizationId);
  const file = await deliveryFileRepository.findByIdAndDelivery(fileId, deliveryId, projectId);
  if (!file) {
    throw new AppError("Archivo no encontrado", { statusCode: 404, code: "DELIVERY_FILE_NOT_FOUND" });
  }
  const p = file.toJSON ? file.toJSON() : file;
  return {
    id: p.id,
    file_path: p.file_path,
    content: p.content,
    content_base64: p.content_base64,
    status: p.status,
    created_at: p.created_at,
    updated_at: p.updated_at
  };
}

async function updateFile(fileId, projectId, deliveryId, payload, context) {
  const delivery = await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  ensureDeliveryNotLocked(delivery);
  const file = await deliveryFileRepository.findByIdAndDelivery(fileId, deliveryId, projectId);
  if (!file) {
    throw new AppError("Archivo no encontrado", { statusCode: 404, code: "DELIVERY_FILE_NOT_FOUND" });
  }
  const updatePayload = {};
  if (payload.content !== undefined) updatePayload.content = payload.content;
  if (payload.content_base64 !== undefined) updatePayload.content_base64 = payload.content_base64;
  if (payload.file_path !== undefined) updatePayload.file_path = payload.file_path;
  if (payload.status !== undefined && ["ADDED", "MODIFIED", "DELETED", "RENAMED", "COPIED"].includes(payload.status)) updatePayload.status = payload.status;
  if (Object.keys(updatePayload).length === 0) {
    const p = file.toJSON ? file.toJSON() : file;
    return { id: p.id, file_path: p.file_path, status: p.status, updated_at: p.updated_at };
  }
  await deliveryFileRepository.update(fileId, deliveryId, projectId, updatePayload);
  logger.info(
    { event: "DELIVERY_WORKSPACE_FILE_MODIFIED", project_id: projectId, delivery_id: deliveryId, file_id: fileId },
    "Delivery workspace file modified"
  );
  const updated = await deliveryFileRepository.findByIdAndDelivery(fileId, deliveryId, projectId);
  const p = updated.toJSON ? updated.toJSON() : updated;
  return { id: p.id, file_path: p.file_path, status: p.status, updated_at: p.updated_at };
}

async function deleteFile(fileId, projectId, deliveryId, organizationId) {
  const delivery = await ensureDeliveryBelongsToProject(deliveryId, projectId, organizationId);
  ensureDeliveryNotLocked(delivery);
  const file = await deliveryFileRepository.findByIdAndDelivery(fileId, deliveryId, projectId);
  if (!file) {
    throw new AppError("Archivo no encontrado", { statusCode: 404, code: "DELIVERY_FILE_NOT_FOUND" });
  }
  await deliveryFileRepository.remove(fileId, deliveryId, projectId);
  return { deleted: true, id: fileId };
}

async function clearFiles(projectId, deliveryId, context) {
  const delivery = await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  ensureDeliveryNotLocked(delivery);
  const deletedCount = await deliveryFileRepository.removeAllByDelivery(deliveryId, projectId);
  logger.info(
    { event: "DELIVERY_WORKSPACE_CLEARED", project_id: projectId, delivery_id: deliveryId, deleted_count: deletedCount },
    "Delivery workspace cleared"
  );
  return { deleted: true, deleted_count: deletedCount };
}

async function commitDelivery(projectId, deliveryId, payload, context) {
  const delivery = await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  ensureDeliveryReadyOrLockedForCommit(delivery);
  const userId = context.user?.id;
  if (!userId) {
    throw new AppError("Usuario no autenticado", { statusCode: 401, code: "UNAUTHORIZED" });
  }
  const plain = delivery.toJSON ? delivery.toJSON() : delivery;
  const branch = plain.branch_name;
  if (!branch || !branch.trim()) {
    throw new AppError("La entrega no tiene rama asignada. Crea la rama desde Repository (Create Branch) antes de hacer Commit & Push.", {
      statusCode: 400,
      code: "DELIVERY_NO_BRANCH"
    });
  }

  let deliveryFiles = await deliveryFileRepository.listByDelivery(deliveryId, projectId);
  const selectedPaths = Array.isArray(payload.selected_file_paths) ? payload.selected_file_paths.map((p) => String(p || "").trim()).filter(Boolean) : null;
  if (selectedPaths && selectedPaths.length > 0) {
    const pathSet = new Set(selectedPaths);
    deliveryFiles = deliveryFiles.filter((f) => {
      const p = (f.file_path || "").trim();
      return pathSet.has(p);
    });
  }
  if (selectedPaths && selectedPaths.length > 0 && deliveryFiles.length === 0) {
    throw new AppError("Ninguno de los archivos seleccionados pertenece a esta entrega.", { statusCode: 400, code: "NO_FILES_SELECTED" });
  }

  // FASE 3: Validación pre-commit — si el código cambió desde el snapshot, bloquear
  const comparison = await compareSnapshotWithCurrent(projectId, deliveryId, context.organizationId);
  if (comparison.modified.length > 0 || comparison.missing.length > 0) {
    throw new AppError("Tu código ha cambiado desde la creación de la entrega. Sincroniza de nuevo desde Git o revierte los cambios antes de hacer commit.", {
      statusCode: 400,
      code: "SNAPSHOT_DRIFT"
    });
  }

  const commitMessage = (payload.commit_message || "").trim() || "chore: delivery update from Nexus DevSuite";
  const result = await githubCommitService.commitAndPushToBranch(
    projectId,
    userId,
    branch.trim(),
    commitMessage,
    deliveryFiles
  );

  logger.info(
    { event: "COMMIT_CREATED", project_id: projectId, delivery_id: deliveryId, commit_sha: result.sha, files_count: deliveryFiles.length },
    "Commit created"
  );
  logger.info(
    { event: "PUSH_EXECUTED", project_id: projectId, delivery_id: deliveryId, branch: branch.trim(), commit_sha: result.sha },
    "Push executed"
  );

  const updatePayload = { commit_hash: result.sha, status: "COMMITTED" };
  let prUrl = null;

  if (payload.create_pr === true) {
    try {
      const baseBranch = await githubService.getDefaultBranch(projectId, userId).catch(() => "main");
      const prBody = (plain.description || "").trim() || commitMessage;
      const pr = await githubService.createPullRequest(commitMessage, branch.trim(), baseBranch, prBody, projectId, userId);
      prUrl = pr.html_url || pr.url || null;
      updatePayload.pull_request_url = prUrl;
      updatePayload.status = "PR_CREATED";
      logger.info(
        { event: "PR_CREATED", project_id: projectId, delivery_id: deliveryId, pr_url: prUrl, pr_number: pr.number },
        "Pull Request created"
      );
      try {
        await createInitialDeliveryReview(deliveryId, projectId, userId);
      } catch (er) {
        logger.warn({ event: "INITIAL_REVIEW_CREATE_FAILED", delivery_id: deliveryId }, "Could not create initial delivery review");
      }
    } catch (e) {
      logger.warn(
        { event: "PR_CREATE_FAILED", project_id: projectId, delivery_id: deliveryId, error: (e && e.message) || "" },
        "Could not create PR after commit"
      );
    }
  }

  const { getModels } = require("../../infrastructure/db/loadModels");
  const { CodeDelivery } = getModels();
  const sequelize = CodeDelivery.sequelize;

  const author = context.user?.email || context.user?.name || "Nexus User";
  const deletedCount = await sequelize.transaction(async (t) => {
    await codeDeliveryRepository.update(deliveryId, projectId, updatePayload, { transaction: t });
    await deliveryCommitRepository.create(
      {
        project_id: projectId,
        delivery_id: deliveryId,
        work_order_id: plain.work_order_id ?? null,
        commit_sha: result.sha,
        commit_message: commitMessage,
        author
      },
      { transaction: t }
    );
    return deliveryFileRepository.removeAllByDelivery(deliveryId, projectId, { transaction: t });
  });
  logger.info(
    { event: "DELIVERY_WORKSPACE_AUTO_CLEARED", project_id: projectId, delivery_id: deliveryId, deleted_count: deletedCount },
    "Delivery workspace auto-cleared after commit"
  );

  return {
    sha: result.sha,
    message: commitMessage,
    branch: branch.trim(),
    workspace_cleared: true,
    workspace_deleted_files: deletedCount,
    pull_request_url: prUrl
  };
}

/**
 * FASE 4/5: Genera mensaje de commit con IA. Incluye título WO, tipo, archivos y resumen. Formato: feat(scope): mensaje.
 */
async function suggestCommitMessage(projectId, deliveryId, organizationId) {
  const delivery = await ensureDeliveryBelongsToProject(deliveryId, projectId, organizationId);
  const rows = await deliveryFileRepository.listByDelivery(deliveryId, projectId);
  const plain = delivery.toJSON ? delivery.toJSON() : delivery;
  const deliveryType = plain.delivery_type || "FEATURE";

  let workOrderTitle = "";
  if (plain.work_order_id) {
    try {
      const wo = await workOrderRepository.findById(plain.work_order_id);
      if (wo) {
        const woPlain = wo.toJSON ? wo.toJSON() : wo;
        workOrderTitle = (woPlain.title || woPlain.ot_number || "").toString().trim();
        if (woPlain.ot_number && workOrderTitle !== String(woPlain.ot_number)) workOrderTitle = `OT-${woPlain.ot_number}: ${workOrderTitle}`.trim();
      }
    } catch (_) {}
  }

  const statusCounts = { ADDED: 0, MODIFIED: 0, DELETED: 0, RENAMED: 0, COPIED: 0 };
  let linesAddedApprox = 0;
  let linesRemovedApprox = 0;
  const fileLines = rows.slice(0, 50).map((r) => {
    const p = r.toJSON ? r.toJSON() : r;
    const st = p.status || "MODIFIED";
    statusCounts[st] = (statusCounts[st] || 0) + 1;
    let content = p.content;
    if (content == null && p.content_base64) {
      try {
        content = Buffer.from(p.content_base64, "base64").toString("utf8");
      } catch (_) {}
    }
    const lineCount = typeof content === "string" ? (content.match(/\n/g) || []).length + (content.length ? 1 : 0) : 0;
    if (st === "ADDED" || st === "COPIED") linesAddedApprox += lineCount;
    else if (st === "DELETED") linesRemovedApprox += lineCount;
    return `  ${st} ${(p.file_path || "").trim()}`;
  });
  const fileList = fileLines.length ? fileLines.join("\n") : "  (no files)";
  const diffSummary = `added: ${statusCounts.ADDED || 0}, modified: ${statusCounts.MODIFIED || 0}, deleted: ${statusCounts.DELETED || 0}${(statusCounts.RENAMED || statusCounts.COPIED) ? ", renamed/copied: " + ((statusCounts.RENAMED || 0) + (statusCounts.COPIED || 0)) : ""}`;
  const linesSummary = `Approximate lines: +${linesAddedApprox} added (new/copied files), -${linesRemovedApprox} removed (deleted files)`;

  const prompt = `Generate exactly ONE conventional commit line for a code delivery.
Mandatory format: type(scope): description
- type: feat | fix | chore | refactor | docs (use feat for features, fix for bugfix/hotfix)
- scope: optional short identifier (e.g. module name)
- description: imperative, no period at end, max 72 chars total

Context:
Work order: ${workOrderTitle || "(none)"}
Delivery type: ${deliveryType}
Change summary: ${diffSummary}
${linesSummary}

Files:
${fileList}

Reply with ONLY the single commit line, nothing else. Example: feat(auth): add login validation`;

  try {
    const res = await aiService.complete(prompt, { max_tokens: 150 });
    let raw = (res.content || "").trim().split(/\n/)[0].trim().slice(0, 200);
    if (raw && !/^(feat|fix|chore|refactor|docs)(\([^)]*\))?:\s*.+/.test(raw)) {
      raw = (deliveryType === "BUGFIX" || deliveryType === "HOTFIX" ? "fix" : "feat") + (raw.indexOf(":") >= 0 ? "" : ": ") + raw.replace(/^(feat|fix|chore|refactor|docs)(\([^)]*\))?:\s*/i, "");
    }
    const commit_message = raw || (deliveryType === "BUGFIX" ? "fix: resolve issue" : deliveryType === "HOTFIX" ? "fix: hotfix" : "feat: delivery update");
    return { commit_message };
  } catch (e) {
    logger.warn({ event: "COMMIT_MESSAGE_SUGGEST_FAILED", project_id: projectId, delivery_id: deliveryId }, "AI suggest failed");
    const fallback = deliveryType === "BUGFIX" ? "fix: resolve issue" : deliveryType === "HOTFIX" ? "fix: hotfix" : "feat: delivery update";
    return { commit_message: fallback };
  }
}

async function listCommits(projectId, deliveryId, organizationId, { limit } = {}) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, organizationId);
  const rows = await deliveryCommitRepository.listByDelivery(deliveryId, projectId, { limit: limit || 50 });
  return rows.map((r) => {
    const p = r.toJSON ? r.toJSON() : r;
    return {
      id: p.id,
      commit_sha: p.commit_sha,
      commit_message: p.commit_message,
      author: p.author,
      created_at: p.created_at
    };
  });
}

/**
 * FASE 4 + 7: Preview de commit: archivos seleccionados, validación snapshot, mensaje sugerido, resumen de impacto.
 */
async function getCommitPreview(projectId, deliveryId, payload, context) {
  const delivery = await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  ensureDeliveryReadyOrLockedForCommit(delivery);
  const plain = delivery.toJSON ? delivery.toJSON() : delivery;
  const branch = (plain.branch_name || "").trim();

  let deliveryFiles = await deliveryFileRepository.listByDelivery(deliveryId, projectId);
  const selectedPaths = Array.isArray(payload.selected_file_paths) ? payload.selected_file_paths.map((p) => String(p || "").trim()).filter(Boolean) : null;
  if (selectedPaths && selectedPaths.length > 0) {
    const pathSet = new Set(selectedPaths);
    deliveryFiles = deliveryFiles.filter((f) => pathSet.has((f.file_path || "").trim()));
  }

  const files = deliveryFiles.map((f) => {
    const p = f.toJSON ? f.toJSON() : f;
    const path = (p.file_path || "").trim();
    let content = p.content;
    if (content == null && p.content_base64) {
      try {
        content = Buffer.from(p.content_base64, "base64").toString("utf8");
      } catch (_) {}
    }
    const lineCount = typeof content === "string" ? (content.match(/\n/g) || []).length + (content.length ? 1 : 0) : 0;
    return { file_path: path, status: p.status || "MODIFIED", lines: lineCount };
  });

  const impact = { files_count: files.length, added: 0, modified: 0, deleted: 0, lines_added: 0, lines_removed: 0 };
  files.forEach((f) => {
    if (f.status === "ADDED" || f.status === "COPIED") {
      impact.added++;
      impact.lines_added += f.lines || 0;
    } else if (f.status === "MODIFIED" || f.status === "RENAMED") {
      impact.modified++;
    } else if (f.status === "DELETED") {
      impact.deleted++;
      impact.lines_removed += f.lines || 0;
    }
  });

  const comparison = await compareSnapshotWithCurrent(projectId, deliveryId, context.organizationId);
  const can_commit = comparison.modified.length === 0 && comparison.missing.length === 0;

  let suggested_message = "chore: delivery update from Nexus DevSuite";
  try {
    const res = await suggestCommitMessage(projectId, deliveryId, context.organizationId);
    suggested_message = res.commit_message || suggested_message;
  } catch (_) {}

  return {
    can_commit,
    comparison: can_commit ? undefined : { modified: comparison.modified, missing: comparison.missing },
    files,
    suggested_message,
    impact,
    branch: branch || null
  };
}

/**
 * FASE 8: Dry run — valida sin ejecutar commit/push. Archivos existen, rama válida, sin drift.
 */
async function simulateCommit(projectId, deliveryId, payload, context) {
  const delivery = await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  ensureDeliveryReadyOrLockedForCommit(delivery);
  const plain = delivery.toJSON ? delivery.toJSON() : delivery;
  const errors = [];

  if (!plain.branch_name || !String(plain.branch_name).trim()) {
    errors.push({ code: "DELIVERY_NO_BRANCH", message: "La entrega no tiene rama asignada." });
  }

  let deliveryFiles = await deliveryFileRepository.listByDelivery(deliveryId, projectId);
  const selectedPaths = Array.isArray(payload.selected_file_paths) ? payload.selected_file_paths.map((p) => String(p || "").trim()).filter(Boolean) : null;
  if (selectedPaths && selectedPaths.length > 0) {
    const pathSet = new Set(selectedPaths);
    deliveryFiles = deliveryFiles.filter((f) => pathSet.has((f.file_path || "").trim()));
    if (deliveryFiles.length === 0) errors.push({ code: "NO_FILES_SELECTED", message: "Ninguno de los archivos seleccionados pertenece a esta entrega." });
  }

  const comparison = await compareSnapshotWithCurrent(projectId, deliveryId, context.organizationId);
  if (comparison.modified.length > 0 || comparison.missing.length > 0) {
    errors.push({
      code: "SNAPSHOT_DRIFT",
      message: "Tu código ha cambiado desde la creación de la entrega. Sincroniza o revierte antes de hacer commit."
    });
  }

  const repoMeta = gitService.getRepoStatusMeta(projectId, {});
  if (!repoMeta.branch && !errors.some((e) => e.code === "DELIVERY_NO_BRANCH")) {
    errors.push({ code: "GIT_REPO_UNAVAILABLE", message: "No se pudo leer el estado del repositorio Git." });
  }

  const ok = errors.length === 0;
  logger.info(
    { event: "COMMIT_SIMULATED", project_id: projectId, delivery_id: deliveryId, ok, errors_count: errors.length },
    "Commit dry run"
  );
  return { ok, validations: ok ? [{ check: "branch", ok: true }, { check: "files", ok: true }, { check: "snapshot", ok: true }] : [], errors: errors.length ? errors : undefined };
}

/** FASE 6: Al crear PR, crear automáticamente un review (PENDING) del autor. */
async function createInitialDeliveryReview(deliveryId, projectId, userId) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, null);
  const existing = await deliveryReviewRepository.findByDeliveryAndReviewer(deliveryId, projectId, userId);
  if (existing) return existing;
  const review = await deliveryReviewRepository.create({
    delivery_id: deliveryId,
    project_id: projectId,
    reviewer_id: userId,
    status: "PENDING"
  });
  logger.info({ event: "DELIVERY_REVIEW_CREATED", delivery_id: deliveryId, reviewer_id: userId }, "Initial delivery review created");
  return review;
}

/** Code Review: listar revisiones de la entrega. */
async function listDeliveryReviews(projectId, deliveryId, organizationId) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, organizationId);
  const rows = await deliveryReviewRepository.listByDelivery(deliveryId, projectId);
  const { User } = require("../../infrastructure/db/loadModels").getModels();
  const reviews = [];
  for (const r of rows) {
    const p = r.toJSON ? r.toJSON() : r;
    const out = { id: p.id, reviewer_id: p.reviewer_id, status: p.status, submitted_at: p.submitted_at, created_at: p.created_at };
    if (p.reviewer_id && User) {
      try {
        const user = await User.findByPk(p.reviewer_id, { attributes: ["id", "email", "name"] });
        if (user) out.reviewer = { id: user.id, email: user.email, name: user.name };
      } catch (_) {}
    }
    reviews.push(out);
  }
  return reviews;
}

/** Code Review: aprobar o solicitar cambios. */
async function submitDeliveryReview(projectId, deliveryId, payload, context) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  const userId = context.user?.id;
  if (!userId) throw new AppError("Usuario no autenticado", { statusCode: 401, code: "UNAUTHORIZED" });
  const status = payload.status === "CHANGES_REQUESTED" ? "CHANGES_REQUESTED" : "APPROVED";
  const review = await deliveryReviewRepository.upsertReview(deliveryId, projectId, userId, status);
  logger.info({ event: "DELIVERY_REVIEW_SUBMITTED", delivery_id: deliveryId, reviewer_id: userId, status }, "Delivery review submitted");
  const p = review.toJSON ? review.toJSON() : review;
  return { id: p.id, reviewer_id: p.reviewer_id, status: p.status, submitted_at: p.submitted_at };
}

/** Code Review: obtener o crear la revisión del usuario actual (para mostrar estado Approve / Request changes). */
async function getMyDeliveryReview(projectId, deliveryId, context) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  const userId = context.user?.id;
  if (!userId) return { review: null };
  let review = await deliveryReviewRepository.findByDeliveryAndReviewer(deliveryId, projectId, userId);
  if (!review) {
    review = await deliveryReviewRepository.create({
      delivery_id: deliveryId,
      project_id: projectId,
      reviewer_id: userId,
      status: "PENDING"
    });
  }
  const p = review.toJSON ? review.toJSON() : review;
  return { review: { id: p.id, status: p.status, submitted_at: p.submitted_at } };
}

/** Code Review: listar comentarios (por entrega o por archivo/línea). */
async function listReviewComments(projectId, deliveryId, organizationId, { file_path, line_number } = {}) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, organizationId);
  const rows = file_path != null
    ? await reviewCommentRepository.listByFileAndLine(deliveryId, projectId, file_path, line_number)
    : await reviewCommentRepository.listByDelivery(deliveryId, projectId);
  const { User } = require("../../infrastructure/db/loadModels").getModels();
  const comments = [];
  for (const r of rows) {
    const p = r.toJSON ? r.toJSON() : r;
    const out = { id: p.id, file_path: p.file_path, line_number: p.line_number, body: p.body, author_id: p.author_id, parent_id: p.parent_id, created_at: p.created_at };
    if (p.author_id && User) {
      try {
        const user = await User.findByPk(p.author_id, { attributes: ["id", "email", "name"] });
        if (user) out.author = { id: user.id, email: user.email, name: user.name };
      } catch (_) {}
    }
    comments.push(out);
  }
  return comments;
}

/** Code Review: agregar comentario (nuevo o respuesta). */
async function addReviewComment(projectId, deliveryId, payload, context) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  const userId = context.user?.id;
  if (!userId) throw new AppError("Usuario no autenticado", { statusCode: 401, code: "UNAUTHORIZED" });
  const { file_path, line_number, body, parent_id } = payload;
  if (!(file_path && body && String(body).trim())) {
    throw new AppError("file_path y body son obligatorios", { statusCode: 400, code: "VALIDATION_ERROR" });
  }
  if (parent_id) {
    const parent = await reviewCommentRepository.findById(parent_id, projectId);
    if (!parent || parent.delivery_id !== deliveryId) {
      throw new AppError("Comentario padre no encontrado", { statusCode: 404, code: "PARENT_COMMENT_NOT_FOUND" });
    }
  }
  const comment = await reviewCommentRepository.create({
    delivery_id: deliveryId,
    project_id: projectId,
    author_id: userId,
    file_path: String(file_path).trim().slice(0, 1024),
    line_number: line_number != null ? parseInt(line_number, 10) : null,
    body: String(body).trim(),
    parent_id: parent_id || null
  });
  const p = comment.toJSON ? comment.toJSON() : comment;
  const { User } = require("../../infrastructure/db/loadModels").getModels();
  const out = { id: p.id, file_path: p.file_path, line_number: p.line_number, body: p.body, author_id: p.author_id, parent_id: p.parent_id, created_at: p.created_at };
  try {
    const user = await User.findByPk(userId, { attributes: ["id", "email", "name"] });
    if (user) out.author = { id: user.id, email: user.email, name: user.name };
  } catch (_) {}
  return out;
}

/** FASE 5: No permitir merge si no hay aprobación o hay cambios solicitados. */
async function canMergeDelivery(projectId, deliveryId, organizationId) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, organizationId);
  const rows = await deliveryReviewRepository.listByDelivery(deliveryId, projectId);
  const hasApproved = rows.some((r) => (r.status || "").toUpperCase() === "APPROVED");
  const hasChangesRequested = rows.some((r) => (r.status || "").toUpperCase() === "CHANGES_REQUESTED");
  const can_merge = hasApproved && !hasChangesRequested;
  return { can_merge, has_approval: hasApproved, has_changes_requested: hasChangesRequested, reviews_count: rows.length };
}

/**
 * Clasificación real contra master: ADDED / MODIFIED / UNCHANGED. Y lista de paths eliminados (en master pero no en delivery).
 * FASE 3-5, 8-10: mapa master, solo paths en delivery para contenido, cache 5 min, logs.
 */
async function getDiffClassification(projectId, deliveryId, context) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  const userId = context.user?.id;
  if (!userId) {
    throw new AppError("Usuario no autenticado", { statusCode: 401, code: "UNAUTHORIZED" });
  }

  const baseBranch = await githubService.getDefaultBranch(projectId, userId).catch(() => "main");
  const cacheKey = getMasterPathsCacheKey(projectId, baseBranch);

  let masterPathsSet = null;
  const pathsCacheHit = masterPathsCache.get(cacheKey);
  if (pathsCacheHit && Date.now() - pathsCacheHit.at < DIFF_CACHE_TTL_MS) {
    masterPathsSet = pathsCacheHit.set;
  } else {
    const tree = await githubRepositoryService.getRepositoryTree(projectId, userId, baseBranch);
    masterPathsSet = new Set((tree.paths || []).filter(Boolean));
    masterPathsCache.set(cacheKey, { set: masterPathsSet, at: Date.now() });
    logger.info(
      { event: "MASTER_FILES_LOADED", project_id: projectId, base_branch: baseBranch, count: masterPathsSet.size },
      "Master tree loaded for diff classification"
    );
  }

  const rows = await deliveryFileRepository.listByDelivery(deliveryId, projectId);
  const deliveryFiles = rows.map((r) => {
    const p = r.toJSON ? r.toJSON() : r;
    return {
      id: p.id,
      file_path: (p.file_path || "").trim(),
      content: p.content != null ? String(p.content) : (p.content_base64 ? Buffer.from(String(p.content_base64), "base64").toString("utf8") : "")
    };
  });

  logger.info(
    { event: "DELIVERY_FILES_LOADED", project_id: projectId, delivery_id: deliveryId, count: deliveryFiles.length },
    "Delivery files loaded for diff classification"
  );

  const deliveryPathsSet = new Set(deliveryFiles.map((f) => f.file_path).filter(Boolean));
  const result = { added: [], modified: [], unchanged: [], deleted: [], files: [] };

  const pathInMaster = (path) => masterPathsSet.has(path);

  for (const f of deliveryFiles) {
    if (!f.file_path) continue;
    if (!pathInMaster(f.file_path)) {
      result.added.push({ id: f.id, file_path: f.file_path });
      result.files.push({ id: f.id, file_path: f.file_path, status: "ADDED" });
      continue;
    }
    const masterContent = await getMasterContent(projectId, userId, baseBranch, f.file_path);
    const same = (masterContent || "") === (f.content || "");
    if (same) {
      result.unchanged.push({ id: f.id, file_path: f.file_path });
      result.files.push({ id: f.id, file_path: f.file_path, status: "UNCHANGED" });
    } else {
      result.modified.push({ id: f.id, file_path: f.file_path });
      result.files.push({ id: f.id, file_path: f.file_path, status: "MODIFIED" });
    }
  }

  for (const path of masterPathsSet) {
    if (!path || deliveryPathsSet.has(path)) continue;
    result.deleted.push({ file_path: path });
  }

  logger.info(
    {
      event: "DIFF_CLASSIFICATION_RESULT",
      project_id: projectId,
      delivery_id: deliveryId,
      added: result.added.length,
      modified: result.modified.length,
      deleted: result.deleted.length,
      unchanged: result.unchanged.length
    },
    "Diff classification result"
  );

  return {
    files: result.files,
    deletedPaths: result.deleted.map((d) => d.file_path),
    base_branch: baseBranch,
    summary: { added: result.added.length, modified: result.modified.length, deleted: result.deleted.length, unchanged: result.unchanged.length }
  };
}

async function compareFileWithGitHub(fileId, projectId, deliveryId, context) {
  const delivery = await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  const userId = context.user?.id;
  if (!userId) {
    throw new AppError("Usuario no autenticado", { statusCode: 401, code: "UNAUTHORIZED" });
  }
  const plainDelivery = delivery.toJSON ? delivery.toJSON() : delivery;
  const branch = (plainDelivery.branch_name || "").trim();
  if (!branch) {
    throw new AppError("La entrega no tiene rama asignada", { statusCode: 400, code: "DELIVERY_NO_BRANCH" });
  }

  const file = await deliveryFileRepository.findByIdAndDelivery(fileId, deliveryId, projectId);
  if (!file) {
    throw new AppError("Archivo no encontrado", { statusCode: 404, code: "DELIVERY_FILE_NOT_FOUND" });
  }
  const f = file.toJSON ? file.toJSON() : file;
  const isBinary = gitService.isBinaryPath(f.file_path);
  if (isBinary) {
    let baseBranchForBinary = "main";
    try {
      baseBranchForBinary = await githubService.getDefaultBranch(projectId, userId);
    } catch (err) {
      // Si GitHub falla, el Diff Viewer ya no puede computar diff real; registramos el motivo.
      logger.warn(
        { event: "GITHUB_DEFAULT_BRANCH_FAILED_FOR_BINARY", project_id: projectId, delivery_id: deliveryId, file_id: fileId, file_path: f.file_path, err: err && err.message ? err.message : String(err) },
        "GitHub falló al obtener default branch (binario)"
      );
      baseBranchForBinary = "unavailable";
    }
    return {
      file_path: f.file_path,
      branch,
      base_branch: baseBranchForBinary,
      workspace_content: "",
      github_content: "",
      github_sha: null,
      github_exists: false,
      status: "MODIFIED",
      binary: true,
      binary_message: "Archivo binario modificado"
    };
  }
  const workspaceContent =
    f.content != null
      ? String(f.content)
      : f.content_base64
        ? Buffer.from(String(f.content_base64), "base64").toString("utf8")
        : "";

  let baseBranch = "main";
  let gh = null;
  let githubUnavailable = false;
  try {
    baseBranch = await githubService.getDefaultBranch(projectId, userId);
    gh = await githubService.getFileContentByPath(f.file_path, baseBranch, projectId, userId);
  } catch (error) {
    // Fallback explícito: si GitHub falla (HTTP real, auth, token, red, etc),
    // evitamos romper el Diff Viewer y marcamos github_unavailable=true.
    githubUnavailable = true;
    baseBranch = "unavailable";
    gh = null;
    logger.warn(
      { event: "GITHUB_FILE_CONTENT_FAILED", project_id: projectId, delivery_id: deliveryId, file_id: fileId, file_path: f.file_path, err: error && error.message ? error.message : String(error) },
      "GitHub falló al obtener contenido para diff"
    );
  }
  let baseContent = gh ? gh.content : null;
  let status = "ADDED";
  if (gh) {
    if ((baseContent || "") === (workspaceContent || "")) status = "UNCHANGED";
    else status = "MODIFIED";
  }
  if (status === "MODIFIED" && baseContent == null) {
    logger.error(
      { event: "DIFF_BASE_CONTENT_NULL", project_id: projectId, delivery_id: deliveryId, file_id: fileId, file_path: f.file_path },
      "FIX CRÍTICO: baseContent null para archivo MODIFIED; no generar diff sin base"
    );
    baseContent = "";
    status = "ADDED";
  }
  return {
    file_path: f.file_path,
    branch,
    base_branch: baseBranch,
    workspace_content: workspaceContent,
    github_content: baseContent,
    github_sha: gh ? gh.sha : null,
    github_exists: !!gh,
    status,
    github_unavailable: githubUnavailable
  };
}

async function getMasterFileContentForDeleted(projectId, deliveryId, filePath, context) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  const userId = context.user?.id;
  if (!userId) throw new AppError("Usuario no autenticado", { statusCode: 401, code: "UNAUTHORIZED" });
  const baseBranch = await githubService.getDefaultBranch(projectId, userId).catch(() => "main");
  const gh = await githubRepositoryService.getFileContent(projectId, userId, filePath, baseBranch);
  const content = gh ? gh.content : "";
  return {
    file_path: filePath,
    base_branch: baseBranch,
    workspace_content: "",
    github_content: content,
    github_exists: !!gh,
    status: "DELETED"
  };
}

/**
 * Diff real de Git por archivo (FASE 5 + 6 + 7 + Pre-Git FASE 1).
 * Si la entrega tiene base_commit_hash, los diffs se calculan contra ese commit.
 * stagedOnly: true → git diff --cached; false → git diff base_commit_hash|HEAD -- path.
 */
async function getFileGitDiff(projectId, deliveryId, fileId, organizationId, options = {}) {
  const delivery = await ensureDeliveryBelongsToProject(deliveryId, projectId, organizationId);
  if (!gitService.isGitLocalAvailable(projectId)) {
    throw new AppError("Git local no configurado en el servidor.", { statusCode: 400, code: "GIT_LOCAL_NOT_AVAILABLE" });
  }
  const file = await deliveryFileRepository.findByIdAndDelivery(fileId, deliveryId, projectId);
  if (!file) {
    throw new AppError("Archivo no encontrado", { statusCode: 404, code: "DELIVERY_FILE_NOT_FOUND" });
  }
  const p = file.toJSON ? file.toJSON() : file;
  const filePath = (p.file_path || "").trim();
  if (!filePath) {
    throw new AppError("Archivo sin ruta", { statusCode: 400, code: "INVALID_FILE" });
  }
  const stagedOnly = !!options.stagedOnly;
  const plain = delivery.toJSON ? delivery.toJSON() : delivery;
  const baseRef = (plain.base_commit_hash || "").trim() || undefined;
  const binaryPaths = gitService.getBinaryPathsFromDiffNumstat(projectId, stagedOnly);
  const isBinary = gitService.isBinaryFilePath
    ? gitService.isBinaryFilePath(projectId, filePath, binaryPaths)
    : gitService.isBinaryPath(filePath);
  if (isBinary) {
    return { binary: true, message: "Archivo binario modificado" };
  }
  const diff = await gitDiffService.generateUnifiedDiffForFile({
    projectId,
    filePath,
    stagedOnly,
    baseRef
  });
  return { diff: diff || "" };
}

/**
 * "Git status" desde GitHub: lista archivos cambiados entre master...branch de la entrega.
 * Devuelve paths normalizados y un texto estilo git status --short para auditoría.
 */
async function getGitHubChangedFiles(projectId, deliveryId, context) {
  const delivery = await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  const userId = context.user?.id;
  if (!userId) throw new AppError("Usuario no autenticado", { statusCode: 401, code: "UNAUTHORIZED" });
  const plain = delivery.toJSON ? delivery.toJSON() : delivery;
  const headBranch = (plain.branch_name || "").trim();
  if (!headBranch) throw new AppError("La entrega no tiene rama asignada", { statusCode: 400, code: "DELIVERY_NO_BRANCH" });

  let baseBranch = "master";
  let cmp;
  try {
    cmp = await githubRepositoryService.getCompareFiles(projectId, userId, baseBranch, headBranch);
  } catch (_) {
    baseBranch = await githubService.getDefaultBranch(projectId, userId).catch(() => "main");
    cmp = await githubRepositoryService.getCompareFiles(projectId, userId, baseBranch, headBranch);
  }

  const files = Array.isArray(cmp.files) ? cmp.files : [];
  const paths = [];
  const lines = [];
  for (const f of files) {
    const status = String(f.status || "").toLowerCase();
    const filename = String(f.filename || "").replace(/^\/+/, "");
    const prev = f.previous_filename ? String(f.previous_filename).replace(/^\/+/, "") : "";
    if (!filename) continue;
    if (status === "removed") {
      paths.push(filename);
      lines.push(` D ${filename}`);
    } else if (status === "added") {
      paths.push(filename);
      lines.push(` A ${filename}`);
    } else if (status === "modified") {
      paths.push(filename);
      lines.push(` M ${filename}`);
    } else if (status === "renamed") {
      paths.push(filename);
      lines.push(` R ${prev || "?"} -> ${filename}`);
    } else {
      paths.push(filename);
      lines.push(` M ${filename}`);
    }
  }

  logger.info(
    { event: "GITHUB_CHANGED_FILES_LOADED", project_id: projectId, delivery_id: deliveryId, base_branch: baseBranch, head_branch: headBranch, count: paths.length },
    "GitHub changed files loaded"
  );

  return { base_branch: baseBranch, head_branch: headBranch, paths, raw: lines.join("\n") };
}

/**
 * Estado Git real del repositorio en el servidor (fuente de verdad).
 * stagedOnly → git diff --cached --name-status; else → git diff HEAD --name-status + untracked.
 * Respeta .gitignore. Soporta RENAMED. Incluye meta (branch, headHash, syncWarning) para validación FASE 3-4.
 */
async function getGitStatusForDelivery(projectId, deliveryId, organizationId, options = {}) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, organizationId);
  const result = gitService.getGitStatus(projectId, { stagedOnly: !!options.stagedOnly });
  const meta = gitService.getRepoStatusMeta(projectId, { expectedHead: options.expectedHead });
  logger.info(
    { event: "FILES_DETECTED_COUNT", project_id: projectId, delivery_id: deliveryId, count: result.files.length, staged_only: !!options.stagedOnly },
    "Files detected from Git"
  );
  return {
    files: result.files,
    raw: result.raw,
    available: result.available,
    message: result.message || null,
    branch: meta.branch,
    headHash: meta.headHash,
    lastCommitDate: meta.lastCommitDate,
    syncWarning: meta.syncWarning,
    syncWarningMessage: meta.message
  };
}

/**
 * Meta del repo en el servidor para validación de consistencia (FASE 3-4).
 * expectedHead: si se envía, se compara con HEAD del servidor y se devuelve syncWarning.
 */
async function getRepoStatusMetaForDelivery(projectId, deliveryId, organizationId, options = {}) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, organizationId);
  return gitService.getRepoStatusMeta(projectId, { expectedHead: options.expectedHead });
}

/** FASE 3: Hash SHA-256 del contenido (texto o base64) para detección de cambios y dedup. */
function hashContent(content) {
  if (content == null || content === "") return crypto.createHash("sha256").update("", "utf8").digest("hex");
  if (typeof content === "string") return crypto.createHash("sha256").update(content, "utf8").digest("hex");
  if (Buffer.isBuffer(content)) return crypto.createHash("sha256").update(content).digest("hex");
  return crypto.createHash("sha256").update(String(content), "utf8").digest("hex");
}

/**
 * FASE 2-3-5-7: Snapshot completo con path, status, content (si tamaño permitido), hash.
 * content_by_hash evita duplicados; archivos grandes se marcan large_file sin contenido.
 */
function buildDeliverySnapshot(projectId, deliveryId, filesMeta, repoMeta) {
  const base_commit_hash = repoMeta?.headHash || null;
  const content_by_hash = Object.create(null);
  const files = [];

  for (const f of filesMeta || []) {
    const isBase64 = f.contentBase64 != null && f.contentBase64 !== "";
    const rawContent = f.content != null ? f.content : isBase64 ? Buffer.from(f.contentBase64, "base64") : "";
    const contentLength = isBase64
      ? Buffer.from(f.contentBase64, "base64").length
      : typeof rawContent === "string"
        ? Buffer.byteLength(rawContent, "utf8")
        : Buffer.isBuffer(rawContent)
          ? rawContent.length
          : 0;
    const storeContent = contentLength > 0 && contentLength <= MAX_FILE_SIZE_FOR_DIFF && !f.isBinary && typeof rawContent === "string";
    const hash = f.hash != null ? f.hash : hashContent(rawContent);

    const entry = {
      path: f.path,
      status: f.status,
      oldPath: f.oldPath || null,
      isBinary: f.isBinary || false,
      hash
    };
    if (contentLength > MAX_FILE_SIZE_FOR_DIFF || (f.isBinary && contentLength > 0)) {
      entry.large_file = true;
    }
    if (storeContent) {
      entry.contentHash = hash;
      if (!content_by_hash[hash]) content_by_hash[hash] = rawContent;
    }
    files.push(entry);
  }

  return {
    timestamp: new Date().toISOString(),
    project_id: projectId,
    delivery_id: deliveryId,
    base_commit_hash,
    headHash: repoMeta?.headHash || null,
    branch: repoMeta?.branch || null,
    files,
    content_by_hash: Object.keys(content_by_hash).length > 0 ? content_by_hash : undefined
  };
}

/**
 * Construye la entrega desde Git: fuente unificada (porcelain v2 + diff), sin duplicados.
 * Soporta RENAMED, COPIED (oldPath/newPath), binarios por numstat + extensión. FASE 6-9.
 */
async function syncDeliveryFromGit(projectId, deliveryId, context, options = {}) {
  const delivery = await ensureDeliveryBelongsToProject(deliveryId, projectId, context.organizationId);
  ensureDeliveryNotLocked(delivery);
  if (!gitService.isGitLocalAvailable(projectId)) {
    throw new AppError("Git local no configurado en el servidor. Configure NEXUS_REPOS_BASE_PATH y clone el repositorio.", {
      statusCode: 400,
      code: "GIT_LOCAL_NOT_AVAILABLE"
    });
  }

  const stagedOnly = !!options.stagedOnly;
  const statusResult = gitService.getGitStatus(projectId, { stagedOnly });
  if (!statusResult.available || !statusResult.files.length) {
    return { synced: 0, files: [], message: statusResult.message || "No hay cambios en Git o Git no está disponible." };
  }

  const binaryPaths = gitService.getBinaryPathsFromDiffNumstat(projectId, stagedOnly);
  const repoMeta = gitService.getRepoStatusMeta ? gitService.getRepoStatusMeta(projectId) : {};

  await deliveryFileRepository.removeAllByDelivery(deliveryId, projectId);

  const synced = [];
  const snapshotFiles = [];

  for (const entry of statusResult.files) {
    const { path: filePath, status, oldPath } = entry;
    const normStatus = status === "UNTRACKED" ? "ADDED" : status;
    const isBinary = gitService.isBinaryFilePath
      ? gitService.isBinaryFilePath(projectId, filePath, binaryPaths)
      : gitService.isBinaryPath(filePath);

    if (normStatus === "DELETED") {
      await deliveryFileRepository.create({
        project_id: projectId,
        delivery_id: deliveryId,
        file_path: filePath,
        content: null,
        content_base64: null,
        status: "DELETED"
      });
      synced.push({ path: filePath, status: "DELETED" });
      snapshotFiles.push({
        path: filePath,
        status: "DELETED",
        oldPath: null,
        isBinary: false,
        content: null,
        hash: hashContent(null)
      });
      continue;
    }

    let content = null;
    let contentBase64 = null;
    let binaryFileHash = null;
    if (!isBinary) {
      content = gitService.getFileContentFromFs(projectId, filePath);
      if (typeof content !== "string") content = "";
      // Evitar overflow en columna MySQL TEXT si el archivo es muy grande.
      if (typeof content === "string") {
        const bytes = Buffer.byteLength(content, "utf8");
        if (bytes > MAX_DB_TEXT_BYTES) content = null;
      }
    } else {
      try {
        const repoPath = gitService.getProjectRepoPath(projectId);
        if (repoPath) {
          const fs = require("fs");
          const path = require("path");
          const fullPath = path.join(repoPath, filePath);
          const buf = fs.readFileSync(fullPath);
          // No persistimos base64 en BD (TEXT ~65KB), pero sí el hash para detectar drift.
          binaryFileHash = hashContent(buf);
          contentBase64 = null;
        }
      } catch (_) {}
    }

    const createPayload = {
      project_id: projectId,
      delivery_id: deliveryId,
      file_path: filePath,
      content: content ?? null,
      content_base64: contentBase64,
      status: normStatus
    };
    if ((normStatus === "RENAMED" || normStatus === "COPIED") && oldPath) {
      createPayload.old_file_path = oldPath;
    }
    try {
      await deliveryFileRepository.create(createPayload);
    } catch (e) {
      logger.error(
        {
          event: "DELIVERY_FILE_CREATE_FAILED",
          project_id: projectId,
          delivery_id: deliveryId,
          file_path: filePath,
          old_file_path: createPayload.old_file_path || null,
          status: normStatus,
          // Incluir mensajes SQL ayuda mucho a identificar si es UNIQUE/ENUM/etc.
          error_message: e && e.message ? e.message : null,
          sql_message: e && (e.original && e.original.sqlMessage ? e.original.sqlMessage : null),
          sql_code: e && (e.original && e.original.code ? e.original.code : null)
        },
        "Failed to persist delivery_file during syncFromGit"
      );
      const wrapped = new Error(
        "No se pudo crear delivery_file. file_path=" +
          String(filePath || "") +
          " status=" +
          String(normStatus || "") +
          (e && e.message ? " | " + e.message : "")
      );
      wrapped.statusCode = 500;
      wrapped.code = e && e.code ? e.code : undefined;
      wrapped.details = { original: e && e.message ? e.message : null, sql: e && e.original ? e.original : null };
      throw wrapped;
    }
    const fileHash =
      binaryFileHash != null
        ? binaryFileHash
        : content != null
          ? hashContent(content)
          : contentBase64
            ? hashContent(Buffer.from(contentBase64, "base64"))
            : hashContent("");
    synced.push({
      path: filePath,
      status: normStatus,
      oldPath: normStatus === "RENAMED" || normStatus === "COPIED" ? oldPath : undefined
    });
    snapshotFiles.push({
      path: filePath,
      status: normStatus,
      oldPath: oldPath || null,
      isBinary,
      content: content ?? null,
      contentBase64: contentBase64 || null,
      hash: fileHash
    });
  }

  const snapshot = buildDeliverySnapshot(projectId, deliveryId, snapshotFiles, repoMeta);
  try {
    await codeDeliveryRepository.update(deliveryId, projectId, {
      base_commit_hash: repoMeta?.headHash || null,
      git_snapshot_json: JSON.stringify({ ...snapshot, staged_only: stagedOnly })
    });
  } catch (e) {
    logger.warn(
      { event: "DELIVERY_SNAPSHOT_SAVE_FAILED", project_id: projectId, delivery_id: deliveryId, error: (e && e.message) || "" },
      "Could not persist git snapshot"
    );
  }
  logger.info(
    {
      event: "DELIVERY_SYNCED_FROM_GIT",
      project_id: projectId,
      delivery_id: deliveryId,
      files_synced: synced.length
    },
    "Delivery synced from Git"
  );
  logger.info(
    {
      event: "DELIVERY_SNAPSHOT_CREATED",
      project_id: projectId,
      delivery_id: deliveryId,
      file_count: snapshot.files.length,
      headHash: snapshot.headHash
    },
    "Delivery snapshot created (reproducibilidad/auditoría)"
  );

  return { synced: synced.length, files: synced };
}

/**
 * FASE 4: Compara el snapshot guardado de una entrega con el estado actual (archivos del delivery en BD).
 * Detecta archivos modificados después de la entrega e inconsistencias (hash distinto).
 * @returns {{ modified: { path, snapshotHash, currentHash }[], missing: string[], extra: string[], base_commit_hash: string|null }}
 */
async function compareSnapshotWithCurrent(projectId, deliveryId, organizationId) {
  await ensureDeliveryBelongsToProject(deliveryId, projectId, organizationId);
  const delivery = await codeDeliveryRepository.findByIdAndProject(deliveryId, projectId);
  if (!delivery) throw new AppError("Entrega no encontrada", { statusCode: 404, code: ERROR_CODES.CODE_DELIVERY_NOT_FOUND });
  const plain = delivery.toJSON ? delivery.toJSON() : delivery;
  const snapshotJson = plain.git_snapshot_json;
  if (!snapshotJson) {
    return { modified: [], missing: [], extra: [], base_commit_hash: plain.base_commit_hash || null };
  }
  let snapshot;
  try {
    snapshot = typeof snapshotJson === "string" ? JSON.parse(snapshotJson) : snapshotJson;
  } catch (_) {
    return { modified: [], missing: [], extra: [], base_commit_hash: plain.base_commit_hash || null };
  }
  const snapshotFiles = (snapshot.files || []).filter((f) => f.path);
  const snapshotByPath = new Map(snapshotFiles.map((f) => [f.path, f]));

  const rows = await deliveryFileRepository.listByDelivery(deliveryId, projectId);
  const currentByPath = new Map();
  for (const r of rows) {
    const p = r.toJSON ? r.toJSON() : r;
    const path = (p.file_path || "").trim();
    if (!path) continue;
    let content = p.content;
    if (content == null && p.content_base64) {
      try {
        content = Buffer.from(p.content_base64, "base64").toString("utf8");
      } catch (_) {}
    }
    const currentHash = hashContent(content);
    currentByPath.set(path, { path, hash: currentHash });
  }

  const modified = [];
  const missing = [];
  const extra = [];

  for (const [path, snap] of snapshotByPath) {
    if (snap.status === "DELETED") continue;
    const cur = currentByPath.get(path);
    if (!cur) {
      missing.push(path);
      continue;
    }
    if (snap.hash !== cur.hash) {
      modified.push({ path, snapshotHash: snap.hash, currentHash: cur.hash });
    }
  }
  for (const path of currentByPath.keys()) {
    if (!snapshotByPath.has(path)) extra.push(path);
  }

  logger.info(
    {
      event: "SNAPSHOT_VS_CURRENT_COMPARED",
      project_id: projectId,
      delivery_id: deliveryId,
      modified_count: modified.length,
      missing_count: missing.length,
      extra_count: extra.length
    },
    "Snapshot vs current comparison"
  );

  return {
    modified,
    missing,
    extra,
    base_commit_hash: snapshot.base_commit_hash || plain.base_commit_hash || null
  };
}

/**
 * FASE 6: Compara dos entregas (deliveryA vs deliveryB). Para release notes, auditoría y versionado.
 * @returns {{ added: { path, status }[], removed: { path }[], modified: { path }[], onlyInA: string[], onlyInB: string[] }}
 */
async function compareDeliveries(projectId, deliveryAId, deliveryBId, organizationId) {
  await ensureDeliveryBelongsToProject(deliveryAId, projectId, organizationId);
  await ensureDeliveryBelongsToProject(deliveryBId, projectId, organizationId);

  const [rowsA, rowsB] = await Promise.all([
    deliveryFileRepository.listByDelivery(deliveryAId, projectId),
    deliveryFileRepository.listByDelivery(deliveryBId, projectId)
  ]);

  const toMap = (rows) => {
    const map = new Map();
    for (const r of rows) {
      const p = r.toJSON ? r.toJSON() : r;
      const path = (p.file_path || "").trim();
      if (!path) continue;
      let content = p.content;
      if (content == null && p.content_base64) {
        try {
          content = Buffer.from(p.content_base64, "base64").toString("utf8");
        } catch (_) {}
      }
      map.set(path, { path, status: p.status, hash: hashContent(content) });
    }
    return map;
  };

  const mapA = toMap(rowsA);
  const mapB = toMap(rowsB);

  const added = [];
  const removed = [];
  const modified = [];

  for (const [path, fileB] of mapB) {
    const fileA = mapA.get(path);
    if (!fileA) {
      added.push({ path, status: fileB.status });
    } else if (fileA.hash !== fileB.hash) {
      modified.push({ path });
    }
  }
  for (const path of mapA.keys()) {
    if (!mapB.has(path)) removed.push({ path });
  }

  logger.info(
    {
      event: "DELIVERIES_COMPARED",
      project_id: projectId,
      delivery_a_id: deliveryAId,
      delivery_b_id: deliveryBId,
      added_count: added.length,
      removed_count: removed.length,
      modified_count: modified.length
    },
    "Deliveries compared"
  );

  return {
    added,
    removed,
    modified,
    onlyInA: [...mapA.keys()].filter((p) => !mapB.has(p)),
    onlyInB: [...mapB.keys()].filter((p) => !mapA.has(p))
  };
}

/**
 * FASE 9: Genera release notes con IA a partir de compareDeliveries (current vs base).
 * Resumen de cambios: features, fixes, archivos nuevos/eliminados/modificados.
 */
async function generateReleaseNotes(projectId, currentDeliveryId, baseDeliveryId, organizationId) {
  await ensureDeliveryBelongsToProject(currentDeliveryId, projectId, organizationId);
  await ensureDeliveryBelongsToProject(baseDeliveryId, projectId, organizationId);

  const comparison = await compareDeliveries(projectId, currentDeliveryId, baseDeliveryId, organizationId);
  const newFiles = comparison.removed || []; // paths only in current (A) = new in current
  const deletedFiles = comparison.added || []; // paths only in base (B) = removed in current
  const modifiedFiles = (comparison.modified || []).map((m) => (m.path != null ? m.path : m));

  const newList = newFiles.length ? newFiles.map((f) => (typeof f === "string" ? f : f.path)).join(", ") : "(ninguno)";
  const deletedList = deletedFiles.length ? deletedFiles.map((f) => (typeof f === "string" ? f : f.path)).join(", ") : "(ninguno)";
  const modifiedList = modifiedFiles.length ? modifiedFiles.join(", ") : "(ninguno)";

  const prompt = `Generate short release notes (bullet list) for a code delivery comparison.
New files in this delivery: ${newList}
Deleted files (were in base): ${deletedList}
Modified files: ${modifiedList}

Output a concise markdown list with sections: ## Features / changes, ## Fixes (if any). Use 2-5 bullets. No preamble.`;

  try {
    const res = await aiService.complete(prompt, { max_tokens: 400 });
    const release_notes = (res.content || "").trim() || "## Changes\n- No summary generated.";
    logger.info(
      { event: "RELEASE_NOTES_GENERATED", project_id: projectId, current_delivery_id: currentDeliveryId, base_delivery_id: baseDeliveryId },
      "Release notes generated"
    );
    return { release_notes, comparison: { new_count: newFiles.length, deleted_count: deletedFiles.length, modified_count: modifiedFiles.length } };
  } catch (e) {
    logger.warn({ event: "RELEASE_NOTES_FAILED", project_id: projectId }, "AI release notes failed");
    const release_notes = `## Changes\n- New files: ${newList}\n- Deleted: ${deletedList}\n- Modified: ${modifiedList}`;
    return { release_notes, comparison: { new_count: newFiles.length, deleted_count: deletedFiles.length, modified_count: modifiedFiles.length } };
  }
}

module.exports = {
  listFiles,
  addFile,
  getFile,
  updateFile,
  deleteFile,
  clearFiles,
  commitDelivery,
  listCommits,
  compareFileWithGitHub,
  getDiffClassification,
  getMasterFileContentForDeleted,
  getFileGitDiff,
  getGitHubChangedFiles,
  getGitStatusForDelivery,
  getRepoStatusMetaForDelivery,
  syncDeliveryFromGit,
  compareSnapshotWithCurrent,
  compareDeliveries,
  suggestCommitMessage,
  generateReleaseNotes,
  getCommitPreview,
  simulateCommit,
  listDeliveryReviews,
  submitDeliveryReview,
  listReviewComments,
  addReviewComment,
  canMergeDelivery,
  getMyDeliveryReview,
  ensureDeliveryBelongsToProject
};
