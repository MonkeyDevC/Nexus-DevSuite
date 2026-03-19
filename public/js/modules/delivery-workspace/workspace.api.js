/**
 * Delivery Workspace — API para archivos y commit.
 * GET/POST /projects/:projectId/code-deliveries/:deliveryId/files, POST /commit, GET /commits
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

  function commitDelivery(projectId, deliveryId, payload) {
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/commit", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function listCommits(projectId, deliveryId, limit) {
    var q = limit ? "?limit=" + limit : "";
    return fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId + "/commits" + q);
  }

  window.WorkspaceAPI = {
    getDelivery: getDelivery,
    listFiles: listFiles,
    addFile: addFile,
    getFile: getFile,
    updateFile: updateFile,
    deleteFile: deleteFile,
    commitDelivery: commitDelivery,
    listCommits: listCommits
  };
})();
