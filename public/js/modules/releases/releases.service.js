/**
 * Release Planning — Servicio (normaliza respuestas API).
 */
(function () {
  "use strict";

  var API = window.ReleasesAPI;

  function getReleases(projectId) {
    return API.getReleases(projectId).then(function (r) {
      return r && r.success && r.data && r.data.items ? r.data.items : [];
    });
  }

  function createRelease(projectId, payload) {
    return API.createRelease(projectId, payload).then(function (r) {
      return r && r.success ? r.data : null;
    });
  }

  function getRelease(projectId, releaseId) {
    return API.getRelease(projectId, releaseId).then(function (r) {
      return r && r.success ? r.data : null;
    });
  }

  function addFeature(projectId, releaseId, featureId) {
    return API.addFeature(projectId, releaseId, featureId).then(function (r) {
      return r && r.success ? r.data : null;
    });
  }

  function removeFeature(projectId, releaseId, featureId) {
    return API.removeFeature(projectId, releaseId, featureId).then(function (r) {
      return r && r.success ? r.data : null;
    });
  }

  function updateReleaseStatus(projectId, releaseId, status) {
    return API.updateReleaseStatus(projectId, releaseId, status).then(function (r) {
      return r && r.success ? r.data : null;
    });
  }

  function updateRelease(projectId, releaseId, payload) {
    return API.updateRelease(projectId, releaseId, payload).then(function (r) {
      return r && r.success ? r.data : null;
    });
  }

  function deleteRelease(projectId, releaseId) {
    return API.deleteRelease(projectId, releaseId).then(function (r) {
      return r && r.success ? r.data : null;
    });
  }

  function syncGithubReleases(projectId) {
    return API.syncGithubReleases(projectId).then(function (r) {
      return r && r.success ? r.data : null;
    });
  }

  function publishRelease(projectId, releaseId) {
    return API.publishRelease(projectId, releaseId).then(function (r) {
      return r && r.success ? r.data : null;
    });
  }

  function getNextVersion(projectId) {
    return API.getNextVersion(projectId).then(function (r) {
      return r && r.success ? r.data : null;
    });
  }

  window.ReleasesService = {
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
