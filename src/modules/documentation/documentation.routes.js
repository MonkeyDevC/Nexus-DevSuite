/**
 * ----
 * Módulo: Documentation Routes
 * Descripción: API REST para documentation_contents (contenido documental de plataforma).
 * Nota: /api/v1/documents está reservado al módulo ISO documents; este recurso se expone en /api/v1/documentation.
 * Orden mutaciones: autenticación → dedup_key → validación express-validator → scope lock → controller
 * (idempotency/atomicCommit global reservan dedup antes del router).
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const express = require("express");
const {
  createDocumentationController,
  listDocumentationController,
  getDocumentationController,
  patchDocumentationController,
  deleteDocumentationController
} = require("./documentation.controller");
const {
  documentationIdParamValidator,
  createDocumentationValidator,
  listDocumentationQueryValidator,
  patchDocumentationValidator
} = require("./documentation.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");
const { requireDedupKeyMiddleware } = require("../../middlewares/requireDedupKey.middleware");
const { documentationContentsScopeLockMiddleware } = require("../../middlewares/scopeLock.middleware");

const router = express.Router();

const readHandlers = [authenticateMiddleware, authorizeMiddleware("MASTER", "EMPLOYEE")];

router.get("/", ...readHandlers, listDocumentationQueryValidator, listDocumentationController);
router.get("/:id", ...readHandlers, documentationIdParamValidator, getDocumentationController);

const mutationAuthDedup = [
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  requireDedupKeyMiddleware
];

router.post(
  "/",
  ...mutationAuthDedup,
  createDocumentationValidator,
  documentationContentsScopeLockMiddleware,
  createDocumentationController
);
router.patch(
  "/:id",
  ...mutationAuthDedup,
  documentationIdParamValidator,
  patchDocumentationValidator,
  documentationContentsScopeLockMiddleware,
  patchDocumentationController
);
router.delete(
  "/:id",
  ...mutationAuthDedup,
  documentationIdParamValidator,
  documentationContentsScopeLockMiddleware,
  deleteDocumentationController
);

module.exports = router;
