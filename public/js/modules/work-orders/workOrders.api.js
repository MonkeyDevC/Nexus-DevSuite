/**
 * Work Orders — Capa API (solo llamadas a backend).
 * Consume /api/v1/projects/:projectId/work-orders y tasks.
 */
(function () {
  "use strict";

  var fetchApi = window.fetchApi;

  function listWorkOrders(projectId, params) {
    var q = "?page=" + (params.page || 1) + "&limit=" + (params.limit || 20);
    if (params.status) q += "&status=" + encodeURIComponent(params.status);
    if (params.user_story_id) q += "&user_story_id=" + encodeURIComponent(params.user_story_id);
    return fetchApi("/projects/" + projectId + "/work-orders" + q);
  }

  function getWorkOrder(projectId, workOrderId) {
    return fetchApi("/projects/" + projectId + "/work-orders/" + workOrderId);
  }

  function createWorkOrder(projectId, payload) {
    return fetchApi("/projects/" + projectId + "/work-orders", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function updateWorkOrder(projectId, workOrderId, payload) {
    return fetchApi("/projects/" + projectId + "/work-orders/" + workOrderId, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }

  function listTasks(projectId, params) {
    var q = "?page=" + (params.page || 1) + "&limit=" + (params.limit || 50);
    if (params.work_order_id) q += "&work_order_id=" + encodeURIComponent(params.work_order_id);
    if (params.status) q += "&status=" + encodeURIComponent(params.status);
    if (params.user_story_id) q += "&user_story_id=" + encodeURIComponent(params.user_story_id);
    return fetchApi("/projects/" + projectId + "/tasks" + q);
  }

  function createTask(projectId, payload) {
    return fetchApi("/projects/" + projectId + "/tasks", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function getTask(projectId, taskId) {
    return fetchApi("/projects/" + projectId + "/tasks/" + taskId);
  }

  function updateTask(projectId, taskId, payload) {
    return fetchApi("/projects/" + projectId + "/tasks/" + taskId, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }

  window.WorkOrdersAPI = {
    listWorkOrders: listWorkOrders,
    getWorkOrder: getWorkOrder,
    createWorkOrder: createWorkOrder,
    updateWorkOrder: updateWorkOrder,
    listTasks: listTasks,
    createTask: createTask,
    getTask: getTask,
    updateTask: updateTask
  };
})();
