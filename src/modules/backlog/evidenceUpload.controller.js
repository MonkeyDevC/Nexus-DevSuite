/**
 * POST multipart: imágenes de evidencia por proyecto (contexto opcional feature/story).
 */
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { assertRequestValid } = require("../../shared/utils/controllerUtils");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const evidenceUploadService = require("./evidenceUpload.service");

async function uploadEvidenceImageController(req, res, next) {
  try {
    assertRequestValid(req);
    const projectId = req.params.projectId;
    const organizationId = req.organizationId;
    if (!organizationId) {
      throw new AppError("Tenant no resuelto", { statusCode: 400, code: ERROR_CODES.TENANT_REQUIRED });
    }
    if (!req.file || !req.file.buffer) {
      throw new AppError("Archivo de imagen requerido (campo file)", {
        statusCode: 422,
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const featureId = req.query.feature_id != null && String(req.query.feature_id).trim() !== "" ? req.query.feature_id : null;
    const storyId = req.query.story_id != null && String(req.query.story_id).trim() !== "" ? req.query.story_id : null;

    const data = await evidenceUploadService.saveEvidenceImage({
      projectId,
      organizationId,
      featureId,
      storyId,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalname: req.file.originalname,
    });

    res.status(201).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  uploadEvidenceImageController,
};
