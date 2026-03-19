/**
 * Code Deliveries — Capa API.
 * GET /api/v1/projects/:projectId/code-deliveries
 */
(function () {
  "use strict";

  var fetchApi = window.fetchApi;

  function listDeliveries(projectId, params) {
    var q = "?page=" + (params.page || 1) + "&limit=" + (params.limit || 50);
    if (params.task_id) q += "&task_id=" + encodeURIComponent(params.task_id);
    if (params.work_order_id) q += "&work_order_id=" + encodeURIComponent(params.work_order_id);
    if (params.status) q += "&status=" + encodeURIComponent(params.status);
    return fetchApi("/projects/" + projectId + "/code-deliveries" + q);
  }

  function createDelivery(projectId, payload) {
    return fetchApi("/projects/" + projectId + "/code-deliveries", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  window.DeliveriesAPI = {
    listDeliveries: listDeliveries,
    createDelivery: createDelivery
  };
})();
