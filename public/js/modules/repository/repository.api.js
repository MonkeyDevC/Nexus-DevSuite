/**
 * Repository (GitHub) — Capa API.
 * GET/POST /api/v1/projects/:projectId/repository/*
 */
(function () {
  "use strict";

  var fetchApi = window.fetchApi;

  function getBranches(projectId) {
    return fetchApi("/projects/" + projectId + "/repository/branches");
  }

  function getPullRequests(projectId, state) {
    var q = state ? "?state=" + encodeURIComponent(state) : "";
    return fetchApi("/projects/" + projectId + "/repository/pull-requests" + q);
  }

  function createBranch(projectId, payload) {
    return fetchApi("/projects/" + projectId + "/repository/create-branch", {
      method: "POST",
      body: JSON.stringify(payload || {})
    });
  }

  function createPR(projectId, payload) {
    return fetchApi("/projects/" + projectId + "/repository/create-pr", {
      method: "POST",
      body: JSON.stringify(payload || {})
    });
  }

  function sync(projectId, payload) {
    return fetchApi("/projects/" + projectId + "/repository/sync", {
      method: "POST",
      body: JSON.stringify(payload || {})
    });
  }

  function getCommits(projectId, limit) {
    var q = limit != null ? "?limit=" + Math.min(20, Math.max(1, parseInt(limit, 10) || 20)) : "";
    return fetchApi("/projects/" + projectId + "/repository/commits" + q);
  }

  function getContributors(projectId) {
    return fetchApi("/projects/" + projectId + "/repository/contributors");
  }

  function getStats(projectId) {
    return fetchApi("/projects/" + projectId + "/repository/stats");
  }

  function getActivity(projectId) {
    return fetchApi("/projects/" + projectId + "/repository/activity");
  }

  window.RepositoryAPI = {
    getBranches: getBranches,
    getPullRequests: getPullRequests,
    createBranch: createBranch,
    createPR: createPR,
    sync: sync,
    getCommits: getCommits,
    getContributors: getContributors,
    getStats: getStats,
    getActivity: getActivity
  };
})();
