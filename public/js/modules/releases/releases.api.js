/**
 * Release Planning — Capa API.
 * GET/POST /api/v1/projects/:projectId/releases
 */
(function () {
  "use strict";

  var fetchApi = window.fetchApi;

  function getReleases(projectId) {
    return fetchApi("/projects/" + projectId + "/releases");
  }

  function createRelease(projectId, payload) {
    return fetchApi("/projects/" + projectId + "/releases", {
      method: "POST",
      body: JSON.stringify(payload || {})
    });
  }

  function getRelease(projectId, releaseId) {
    return fetchApi("/projects/" + projectId + "/releases/" + releaseId);
  }

  function addFeature(projectId, releaseId, featureId) {
    return fetchApi("/projects/" + projectId + "/releases/" + releaseId + "/features", {
      method: "POST",
      body: JSON.stringify({ feature_id: featureId })
    });
  }

  function removeFeature(projectId, releaseId, featureId) {
    return fetchApi("/projects/" + projectId + "/releases/" + releaseId + "/features/" + featureId, {
      method: "DELETE"
    });
  }

  function updateReleaseStatus(projectId, releaseId, status) {
    return fetchApi("/projects/" + projectId + "/releases/" + releaseId + "/status", {
      method: "PATCH",
      body: JSON.stringify({ status: status })
    });
  }

  function updateRelease(projectId, releaseId, payload) {
    return fetchApi("/projects/" + projectId + "/releases/" + releaseId, {
      method: "PATCH",
      body: JSON.stringify(payload || {})
    });
  }

  function deleteRelease(projectId, releaseId) {
    return fetchApi("/projects/" + projectId + "/releases/" + releaseId, { method: "DELETE" });
  }

  function syncGithubReleases(projectId) {
    return fetchApi("/projects/" + projectId + "/releases/sync-github", { method: "GET" });
  }

  function publishRelease(projectId, releaseId) {
    return fetchApi("/projects/" + projectId + "/releases/" + releaseId + "/publish", { method: "POST" });
  }

  function getNextVersion(projectId) {
    return fetchApi("/projects/" + projectId + "/releases/next-version", { method: "GET" });
  }

  window.ReleasesAPI = {
    getReleases: getReleases,
    createRelease: createRelease,
    getRelease: getRelease,
    addFeature: addFeature,
    removeFeature: removeFeature,
    updateReleaseStatus: updateReleaseStatus,
    updateRelease: updateRelease,
    deleteRelease: deleteRelease,
    syncGithubReleases: syncGithubReleases,
    publishRelease: publishRelease,
    getNextVersion: getNextVersion
  };
})();
