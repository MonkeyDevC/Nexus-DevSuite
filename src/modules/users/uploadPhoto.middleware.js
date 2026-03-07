/**
 * Middleware de subida de foto de perfil (multer).
 * Guarda en public/uploads/avatars; el endpoint debe actualizar profile_photo_url con la ruta relativa.
 */
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = (file.originalname && path.extname(file.originalname)) || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext.toLowerCase()) ? ext : ".jpg";
    cb(null, req.params.id + safeExt);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: function (_req, file, cb) {
    const allowed = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error("Solo se permiten imagenes (JPEG, PNG, GIF, WebP)."));
  }
});

module.exports = { uploadPhoto: upload.single("photo") };
