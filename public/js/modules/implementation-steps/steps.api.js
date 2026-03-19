/**
 * Implementation Steps — Capa API.
 * GET/POST /api/v1/projects/:projectId/work-orders/:workOrderId/implementation-steps
 */
(function () {
  "use strict";

  var fetchApi = window.fetchApi;

  function listByWorkOrder(projectId, workOrderId, params) {
    var q = "?page=" + (params.page || 1) + "&limit=" + (params.limit || 100);
    return fetchApi("/projects/" + projectId + "/work-orders/" + workOrderId + "/implementation-steps" + q);
  }

  function listByTask(projectId, workOrderId, taskId, params) {
    var q = "?page=" + (params.page || 1) + "&limit=" + (params.limit || 50);
    return fetchApi("/projects/" + projectId + "/work-orders/" + workOrderId + "/implementation-steps/tasks/" + taskId + "/steps" + q);
  }

  function createStep(projectId, workOrderId, taskId, payload) {
    return fetchApi("/projects/" + projectId + "/work-orders/" + workOrderId + "/implementation-steps/tasks/" + taskId + "/steps", {
      method: "POST",
      body: JSON.stringify(payload || {})
    });
  }

  function getStep(projectId, workOrderId, stepId) {
    return fetchApi("/projects/" + projectId + "/work-orders/" + workOrderId + "/implementation-steps/steps/" + stepId);
  }

  function startStep(projectId, workOrderId, stepId) {
    return fetchApi("/projects/" + projectId + "/work-orders/" + workOrderId + "/implementation-steps/steps/" + stepId + "/start", {
      method: "POST"
    });
  }

  function completeStep(projectId, workOrderId, stepId) {
    return fetchApi("/projects/" + projectId + "/work-orders/" + workOrderId + "/implementation-steps/steps/" + stepId + "/complete", {
      method: "POST"
    });
  }

  function failStep(projectId, workOrderId, stepId) {
    return fetchApi("/projects/" + projectId + "/work-orders/" + workOrderId + "/implementation-steps/steps/" + stepId + "/fail", {
      method: "POST"
    });
  }

  window.StepsAPI = {
    listByWorkOrder: listByWorkOrder,
    listByTask: listByTask,
    createStep: createStep,
    getStep: getStep,
    startStep: startStep,
    completeStep: completeStep,
    failStep: failStep
  };
})();
