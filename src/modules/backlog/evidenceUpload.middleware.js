/**
 * Multer en memoria para POST /projects/:projectId/evidence-images
 */
const multer = require("multer");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const ALLOWED = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]);

const storage = multer.memoryStorage();

const uploadEvidenceImageMemory = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const mime = String(file.mimetype || "").toLowerCase();
    if (ALLOWED.has(mime)) {
      cb(null, true);
      return;
    }
    cb(
      new AppError("Tipo de imagen no permitido", {
        statusCode: 422,
        code: ERROR_CODES.VALIDATION_ERROR,
      }),
    );
  },
});

module.exports = {
  uploadEvidenceImageMemory,
};
