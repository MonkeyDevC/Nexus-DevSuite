/**
 * Módulo Documents - Rutas
 * GET /documents/code/:code debe ir ANTES de GET /documents/:id para que "code" no se interprete como :id.
 */

const express = require("express");
const {
  createDocumentController,
  listDocumentsController,
  getDocumentByCodeController,
  getDocumentByIdController,
  createVersionController,
  listVersionsController,
  getVersionByIdController,
  patchVersionController,
  patchVersionStatusController
} = require("./document.controller");
const {
  createDocumentValidator,
  documentIdParamValidator,
  idParamValidator,
  versionIdParamValidator,
  codeParamValidator,
  createVersionValidator,
  patchVersionStatusValidator,
  patchVersionValidator,
  listDocumentsQueryValidator,
  listVersionsQueryValidator
} = require("./document.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router();

router.post(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  createDocumentValidator,
  createDocumentController
);
router.get(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  listDocumentsQueryValidator,
  listDocumentsController
);
router.get(
  "/code/:code",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  codeParamValidator,
  getDocumentByCodeController
);
router.get(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  idParamValidator,
  getDocumentByIdController
);

router.post(
  "/:documentId/versions",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  documentIdParamValidator,
  createVersionValidator,
  createVersionController
);
router.get(
  "/:documentId/versions",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  documentIdParamValidator,
  listVersionsQueryValidator,
  listVersionsController
);
router.get(
  "/:documentId/versions/:versionId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  documentIdParamValidator,
  versionIdParamValidator,
  getVersionByIdController
);
router.patch(
  "/:documentId/versions/:versionId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  documentIdParamValidator,
  versionIdParamValidator,
  patchVersionValidator,
  patchVersionController
);
router.patch(
  "/:documentId/versions/:versionId/status",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  documentIdParamValidator,
  versionIdParamValidator,
  patchVersionStatusValidator,
  patchVersionStatusController
);

module.exports = router;
