/**
 * Delivery Workspace — Controller
 * Fase 10: validar delivery pertenece al project, usuario tiene permisos, rama existe (en service).
 */

const deliveryWorkspaceService = require("./deliveryWorkspace.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext: buildContextBase, assertRequestValid } = require("../../shared/utils/controllerUtils");

function buildContext(req) {
  return {
    ...buildContextBase(req),
    organizationId: req.organizationId
  };
}

async function listFilesController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.listFiles(
      req.params.projectId,
      req.params.deliveryId,
      req.organizationId,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function addFileController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.addFile(
      req.params.projectId,
      req.params.deliveryId,
      req.body,
      context
    );
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getFileController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await deliveryWorkspaceService.getFile(
      req.params.fileId,
      req.params.projectId,
      req.params.deliveryId,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function updateFileController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.updateFile(
      req.params.fileId,
      req.params.projectId,
      req.params.deliveryId,
      req.body,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function deleteFileController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await deliveryWorkspaceService.deleteFile(
      req.params.fileId,
      req.params.projectId,
      req.params.deliveryId,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function clearFilesController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.clearFiles(req.params.projectId, req.params.deliveryId, context);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function commitDeliveryController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.commitDelivery(
      req.params.projectId,
      req.params.deliveryId,
      req.body,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function suggestCommitMessageController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await deliveryWorkspaceService.suggestCommitMessage(
      req.params.projectId,
      req.params.deliveryId,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getCommitPreviewController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.getCommitPreview(
      req.params.projectId,
      req.params.deliveryId,
      req.body || {},
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function simulateCommitController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.simulateCommit(
      req.params.projectId,
      req.params.deliveryId,
      req.body || {},
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listCommitsController(req, res, next) {
  try {
    assertRequestValid(req);
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const data = await deliveryWorkspaceService.listCommits(
      req.params.projectId,
      req.params.deliveryId,
      req.organizationId,
      { limit }
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function compareFileController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.compareFileWithGitHub(
      req.params.fileId,
      req.params.projectId,
      req.params.deliveryId,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getFileGitDiffController(req, res, next) {
  try {
    assertRequestValid(req);
    const stagedOnly = req.query.stagedOnly === "true" || req.query.stagedOnly === "1";
    const data = await deliveryWorkspaceService.getFileGitDiff(
      req.params.projectId,
      req.params.deliveryId,
      req.params.fileId,
      req.organizationId,
      { stagedOnly }
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getDiffClassificationController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.getDiffClassification(
      req.params.projectId,
      req.params.deliveryId,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getMasterFileContentForDeletedController(req, res, next) {
  try {
    assertRequestValid(req);
    const path = typeof req.query.path === "string" ? req.query.path.trim() : "";
    if (!path) {
      return res.status(400).json({ success: false, error: "query path is required" });
    }
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.getMasterFileContentForDeleted(
      req.params.projectId,
      req.params.deliveryId,
      path,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getGitHubChangedFilesController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.getGitHubChangedFiles(
      req.params.projectId,
      req.params.deliveryId,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getGitStatusController(req, res, next) {
  try {
    assertRequestValid(req);
    const stagedOnly = req.query.stagedOnly === "true" || req.query.stagedOnly === "1";
    const expectedHead = typeof req.query.expectedHead === "string" ? req.query.expectedHead.trim() : undefined;
    const data = await deliveryWorkspaceService.getGitStatusForDelivery(
      req.params.projectId,
      req.params.deliveryId,
      req.organizationId,
      { stagedOnly, expectedHead: expectedHead || undefined }
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getRepoStatusMetaController(req, res, next) {
  try {
    assertRequestValid(req);
    const expectedHead = typeof req.query.expectedHead === "string" ? req.query.expectedHead.trim() : undefined;
    const data = await deliveryWorkspaceService.getRepoStatusMetaForDelivery(
      req.params.projectId,
      req.params.deliveryId,
      req.organizationId,
      { expectedHead: expectedHead || undefined }
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function syncFromGitController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const stagedOnly = req.body && (req.body.stagedOnly === true || req.body.stagedOnly === "true");
    const data = await deliveryWorkspaceService.syncDeliveryFromGit(
      req.params.projectId,
      req.params.deliveryId,
      context,
      { stagedOnly }
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function compareSnapshotWithCurrentController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await deliveryWorkspaceService.compareSnapshotWithCurrent(
      req.params.projectId,
      req.params.deliveryId,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function compareDeliveriesController(req, res, next) {
  try {
    assertRequestValid(req);
    const otherDeliveryId = req.params.otherDeliveryId;
    if (!otherDeliveryId) {
      return res.status(400).json({ success: false, error: "otherDeliveryId is required" });
    }
    const data = await deliveryWorkspaceService.compareDeliveries(
      req.params.projectId,
      req.params.deliveryId,
      otherDeliveryId,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function generateReleaseNotesController(req, res, next) {
  try {
    assertRequestValid(req);
    const otherDeliveryId = req.query.otherDeliveryId;
    if (!otherDeliveryId) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "otherDeliveryId es obligatorio" } });
    }
    const data = await deliveryWorkspaceService.generateReleaseNotes(
      req.params.projectId,
      req.params.deliveryId,
      otherDeliveryId,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listReviewCommentsController(req, res, next) {
  try {
    assertRequestValid(req);
    const file_path = req.query.file_path ? String(req.query.file_path).trim() : undefined;
    const line_number = req.query.line_number != null ? parseInt(req.query.line_number, 10) : undefined;
    const data = await deliveryWorkspaceService.listReviewComments(
      req.params.projectId,
      req.params.deliveryId,
      req.organizationId,
      { file_path, line_number }
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function addReviewCommentController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.addReviewComment(
      req.params.projectId,
      req.params.deliveryId,
      req.body,
      context
    );
    res.status(201).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function listDeliveryReviewsController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await deliveryWorkspaceService.listDeliveryReviews(
      req.params.projectId,
      req.params.deliveryId,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getMyDeliveryReviewController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.getMyDeliveryReview(
      req.params.projectId,
      req.params.deliveryId,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function submitDeliveryReviewController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = buildContext(req);
    const data = await deliveryWorkspaceService.submitDeliveryReview(
      req.params.projectId,
      req.params.deliveryId,
      req.body,
      context
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function canMergeDeliveryController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await deliveryWorkspaceService.canMergeDelivery(
      req.params.projectId,
      req.params.deliveryId,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listFilesController,
  addFileController,
  getFileController,
  updateFileController,
  deleteFileController,
  clearFilesController,
  commitDeliveryController,
  suggestCommitMessageController,
  getCommitPreviewController,
  simulateCommitController,
  generateReleaseNotesController,
  listCommitsController,
  compareFileController,
  getFileGitDiffController,
  getDiffClassificationController,
  getMasterFileContentForDeletedController,
  getGitHubChangedFilesController,
  getGitStatusController,
  getRepoStatusMetaController,
  syncFromGitController,
  compareSnapshotWithCurrentController,
  compareDeliveriesController,
  listReviewCommentsController,
  addReviewCommentController,
  listDeliveryReviewsController,
  getMyDeliveryReviewController,
  submitDeliveryReviewController,
  canMergeDeliveryController
};
