/**
 * Módulo Documents - Controller
 */

const documentService = require("./document.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext: buildContextBase, assertRequestValid } = require("../../shared/utils/controllerUtils");

function buildContext(req) {
  return { ...buildContextBase(req), organizationId: req.organizationId };
}

async function createDocumentController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await documentService.createDocument(req.body, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listDocumentsController(req, res, next) {
  try {
    assertRequestValid(req);
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const project_id = req.query.project_id || undefined;
    const result = await documentService.listDocuments({ page, limit, project_id }, req.organizationId);
    res.status(200).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getDocumentByCodeController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await documentService.getDocumentByCode(req.params.code, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getDocumentByIdController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await documentService.getDocumentById(req.params.id, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function createVersionController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await documentService.createVersion(req.params.documentId, req.body, context);
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listVersionsController(req, res, next) {
  try {
    assertRequestValid(req);
    const status = req.query.status || undefined;
    const result = await documentService.listVersionsByDocumentId(req.params.documentId, { status }, req.organizationId);
    res.status(200).json(buildSuccess({ data: result }, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getVersionByIdController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await documentService.getVersionById(req.params.documentId, req.params.versionId, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function patchVersionController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await documentService.updateVersion(
      req.params.documentId,
      req.params.versionId,
      req.body,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function patchVersionStatusController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await documentService.updateVersionStatus(
      req.params.documentId,
      req.params.versionId,
      req.body.status,
      { change_reason: req.body.change_reason },
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createDocumentController,
  listDocumentsController,
  getDocumentByCodeController,
  getDocumentByIdController,
  createVersionController,
  listVersionsController,
  getVersionByIdController,
  patchVersionController,
  patchVersionStatusController
};
