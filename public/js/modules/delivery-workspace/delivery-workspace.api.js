/**
 * Delivery Workspace — API para archivos y commit & push.
 * GET/POST /api/v1/projects/:projectId/code-deliveries/:deliveryId/files, etc.
 */
(function () {
  "use strict";

  var fetchApi = window.fetchApi;

  function getDelivery(projectId, deliveryId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId);
  }

  function listFiles(projectId, deliveryId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/files");
  }

  function addFile(projectId, deliveryId, payload) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/files", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function getFile(projectId, deliveryId, fileId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/files/" + fileId);
  }

  function compareFile(projectId, deliveryId, fileId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/files/" + fileId + "/compare");
  }

  function getFileGitDiff(projectId, deliveryId, fileId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/files/" + fileId + "/git-diff");
  }

  function getDiffClassification(projectId, deliveryId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/diff-classification");
  }

  function getDeletedFileContent(projectId, deliveryId, path) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/deleted-file-content?path=" + encodeURIComponent(path));
  }

  function getGitHubChangedFiles(projectId, deliveryId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/github-changed-files");
  }

  function getGitStatus(projectId, deliveryId, stagedOnly, expectedHead) {
    var params = [];
    if (stagedOnly) params.push("stagedOnly=true");
    if (expectedHead) params.push("expectedHead=" + encodeURIComponent(expectedHead));
    var q = params.length ? "?" + params.join("&") : "";
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/git-status" + q);
  }

  function getRepoStatus(projectId, deliveryId, expectedHead) {
    var q = expectedHead ? "?expectedHead=" + encodeURIComponent(expectedHead) : "";
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/repo-status" + q);
  }

  function syncFromGit(projectId, deliveryId, stagedOnly) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/sync-from-git", {
      method: "POST",
      body: JSON.stringify({ stagedOnly: !!stagedOnly })
    });
  }

  function updateFile(projectId, deliveryId, fileId, payload) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/files/" + fileId, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }

  function deleteFile(projectId, deliveryId, fileId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/files/" + fileId, {
      method: "DELETE"
    });
  }

  function clearFiles(projectId, deliveryId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/files", {
      method: "DELETE"
    });
  }

  function suggestCommitMessage(projectId, deliveryId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/suggest-commit-message");
  }

  function getCommitPreview(projectId, deliveryId, payload) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/commit-preview", {
      method: "POST",
      body: JSON.stringify(payload || {})
    });
  }

  function simulateCommit(projectId, deliveryId, payload) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/commit-simulate", {
      method: "POST",
      body: JSON.stringify(payload || {})
    });
  }

  function generateReleaseNotes(projectId, deliveryId, baseDeliveryId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/release-notes?otherDeliveryId=" + encodeURIComponent(baseDeliveryId));
  }

  function commitDelivery(projectId, deliveryId, payload) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/commit", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function listCommits(projectId, deliveryId, params) {
    var q = "?limit=" + (params && params.limit ? params.limit : 50);
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/commits" + q);
  }

  function runAIReview(projectId, deliveryId) {
    return fetchApi("/ai/review/deliveries/" + deliveryId + "?project_id=" + encodeURIComponent(projectId), {
      method: "POST"
    });
  }

  function getAIReview(projectId, deliveryId) {
    return fetchApi("/ai/review/deliveries/" + deliveryId + "?project_id=" + encodeURIComponent(projectId));
  }

  function listReviewComments(projectId, deliveryId, opts) {
    var q = [];
    if (opts && opts.file_path) q.push("file_path=" + encodeURIComponent(opts.file_path));
    if (opts && opts.line_number != null) q.push("line_number=" + opts.line_number);
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/review-comments" + (q.length ? "?" + q.join("&") : ""));
  }

  function addReviewComment(projectId, deliveryId, payload) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/review-comments", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function listDeliveryReviews(projectId, deliveryId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/delivery-reviews");
  }

  function getMyDeliveryReview(projectId, deliveryId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/delivery-reviews/me");
  }

  function submitDeliveryReview(projectId, deliveryId, status) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/delivery-reviews/submit", {
      method: "POST",
      body: JSON.stringify({ status: status })
    });
  }

  function canMergeDelivery(projectId, deliveryId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/can-merge");
  }

  window.DeliveryWorkspaceAPI = {
    getDelivery: getDelivery,
    listFiles: listFiles,
    addFile: addFile,
    getFile: getFile,
    compareFile: compareFile,
    getFileGitDiff: getFileGitDiff,
    getDiffClassification: getDiffClassification,
    getDeletedFileContent: getDeletedFileContent,
    getGitHubChangedFiles: getGitHubChangedFiles,
    getGitStatus: getGitStatus,
    getRepoStatus: getRepoStatus,
    syncFromGit: syncFromGit,
    updateFile: updateFile,
    deleteFile: deleteFile,
    clearFiles: clearFiles,
    suggestCommitMessage: suggestCommitMessage,
    getCommitPreview: getCommitPreview,
    simulateCommit: simulateCommit,
    generateReleaseNotes: generateReleaseNotes,
    commitDelivery: commitDelivery,
    listCommits: listCommits,
    runAIReview: runAIReview,
    getAIReview: getAIReview,
    listReviewComments: listReviewComments,
    addReviewComment: addReviewComment,
    listDeliveryReviews: listDeliveryReviews,
    getMyDeliveryReview: getMyDeliveryReview,
    submitDeliveryReview: submitDeliveryReview,
    canMergeDelivery: canMergeDelivery
  };
})();
