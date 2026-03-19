/**
 * Repository — Lógica de negocio (normaliza respuestas del API).
 */
(function () {
  "use strict";

  var API = window.RepositoryAPI;
  var fetchApi = window.fetchApi;

  function getBranches(projectId) {
    if (!projectId) return Promise.resolve({ branches: [] });
    return API.getBranches(projectId).then(function (res) {
      if (!res || !res.success || !res.data) return { branches: [] };
      return { branches: res.data.branches || [] };
    });
  }

  function getPullRequests(projectId, state) {
    if (!projectId) return Promise.resolve({ pull_requests: [] });
    return API.getPullRequests(projectId, state).then(function (res) {
      if (!res || !res.success || !res.data) return { pull_requests: [] };
      return { pull_requests: res.data.pull_requests || [] };
    });
  }

  function createBranch(projectId, payload) {
    if (!projectId) return Promise.resolve({ success: false });
    return API.createBranch(projectId, payload);
  }

  function createPR(projectId, payload) {
    if (!projectId) return Promise.resolve({ success: false });
    return API.createPR(projectId, payload);
  }

  function sync(projectId, payload) {
    if (!projectId) return Promise.resolve({ success: false });
    return API.sync(projectId, payload || {});
  }

  function listDeliveries(projectId) {
    return fetchApi("/projects/" + projectId + "/code-deliveries?page=1&limit=50").then(function (res) {
      if (!res || !res.success || !res.data) return { data: [] };
      var d = res.data.data != null ? res.data.data : (res.data.items || (Array.isArray(res.data) ? res.data : []));
      return { data: d };
    });
  }

  window.RepositoryService = {
    getBranches: getBranches,
    getPullRequests: getPullRequests,
    createBranch: createBranch,
    createPR: createPR,
    sync: sync,
    listDeliveries: listDeliveries
  };
})();
