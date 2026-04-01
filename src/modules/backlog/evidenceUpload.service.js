/**
 * Almacenamiento de imágenes pegadas en evidencia de proyecto (jerarquía proyecto / feature / story).
 */
const path = require("path");
const fs = require("fs/promises");
const { v4: uuidv4 } = require("uuid");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const projectsService = require("./projects.service");
const featureService = require("./feature.service");
const userStoryService = require("./userStory.service");

const UPLOAD_ROOT = path.join(__dirname, "../../../public/uploads/evidence");

const ALLOWED_MIME_EXT = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/gif", ".gif"],
  ["image/webp", ".webp"],
]);

const MAX_BYTES = 5 * 1024 * 1024;

function normalizeUuid(value) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)) {
    throw new AppError("Identificador UUID inválido", {
      statusCode: 422,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }
  return s;
}

/**
 * Resuelve carpeta relativa (posix) bajo uploads/evidence/ y valida pertenencia al proyecto.
 * @returns {Promise<{ relDir: string, absDir: string }>}
 */
async function resolveEvidenceDirectory(projectId, organizationId, featureIdRaw, storyIdRaw) {
  const projectIdNorm = normalizeUuid(projectId);
  await projectsService.getProjectById(projectIdNorm, organizationId);

  let featureId = featureIdRaw != null && String(featureIdRaw).trim() !== "" ? normalizeUuid(featureIdRaw) : null;
  let storyId = storyIdRaw != null && String(storyIdRaw).trim() !== "" ? normalizeUuid(storyIdRaw) : null;

  if (storyId) {
    const story = await userStoryService.getStoryById(storyId, organizationId);
    const storyFeatureId = story.feature_id ? String(story.feature_id) : null;
    if (!storyFeatureId) {
      throw new AppError("Historia sin feature asociada", {
        statusCode: 422,
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }
    const feat = await featureService.getFeatureById(storyFeatureId, organizationId);
    if (String(feat.project_id) !== projectIdNorm) {
      throw new AppError("La historia no pertenece a este proyecto", {
        statusCode: 403,
        code: ERROR_CODES.STORY_PROJECT_MISMATCH,
      });
    }
    if (featureId && featureId !== storyFeatureId) {
      throw new AppError("feature_id no coincide con la historia", {
        statusCode: 422,
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }
    featureId = storyFeatureId;
    const relDir = path.posix.join(projectIdNorm, "features", featureId, "stories", storyId);
    const absDir = path.join(UPLOAD_ROOT, projectIdNorm, "features", featureId, "stories", storyId);
    return { relDir, absDir };
  }

  if (featureId) {
    const feat = await featureService.getFeatureById(featureId, organizationId);
    if (String(feat.project_id) !== projectIdNorm) {
      throw new AppError("La feature no pertenece a este proyecto", {
        statusCode: 403,
        code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION,
      });
    }
    const relDir = path.posix.join(projectIdNorm, "features", featureId);
    const absDir = path.join(UPLOAD_ROOT, projectIdNorm, "features", featureId);
    return { relDir, absDir };
  }

  const relDir = path.posix.join(projectIdNorm, "project");
  const absDir = path.join(UPLOAD_ROOT, projectIdNorm, "project");
  return { relDir, absDir };
}

/**
 * @param {object} params
 * @param {string} params.projectId
 * @param {string} params.organizationId
 * @param {string|null} [params.featureId]
 * @param {string|null} [params.storyId]
 * @param {Buffer} params.buffer
 * @param {string} params.mimeType
 * @param {string} [params.originalname]
 */
async function saveEvidenceImage(params) {
  const { projectId, organizationId, featureId, storyId, buffer, mimeType, originalname } = params;
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new AppError("Archivo de imagen requerido", {
      statusCode: 422,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }
  if (buffer.length > MAX_BYTES) {
    throw new AppError("Imagen demasiado grande (máx. 5 MB)", {
      statusCode: 422,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }
  const mime = String(mimeType || "").toLowerCase();
  const ext = ALLOWED_MIME_EXT.get(mime);
  if (!ext) {
    throw new AppError("Tipo de imagen no permitido", {
      statusCode: 422,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  const { relDir, absDir } = await resolveEvidenceDirectory(projectId, organizationId, featureId, storyId);
  await fs.mkdir(absDir, { recursive: true });

  const base = uuidv4();
  const filename = `${base}${ext}`;
  const absFile = path.join(absDir, filename);
  await fs.writeFile(absFile, buffer);

  const publicPath = path.posix.join("/uploads/evidence", relDir.replace(/\\/g, "/"), filename);
  return {
    url: publicPath,
    relative_path: path.posix.join(relDir, filename),
    filename,
    mime_type: mime,
    size_bytes: buffer.length,
  };
}

module.exports = {
  saveEvidenceImage,
  UPLOAD_ROOT,
};
