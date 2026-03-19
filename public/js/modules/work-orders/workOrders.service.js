/**
 * Work Orders — Lógica de negocio (orquesta API y datos para la UI).
 */
(function () {
  "use strict";

  var API = window.WorkOrdersAPI;

  function listWorkOrders(projectId, params) {
    if (!projectId) return Promise.resolve({ success: false, data: [], meta: {} });
    return API.listWorkOrders(projectId, params || {}).then(function (res) {
      if (!res || !res.success) return { data: [], meta: {} };
      var data = res.data && res.data.data ? res.data.data : (res.data && Array.isArray(res.data) ? res.data : []);
      var meta = (res.data && res.data.meta) ? res.data.meta : { total: 0, page: 1, limit: 20 };
      return { data: data, meta: meta };
    });
  }

  function getWorkOrder(projectId, workOrderId) {
    if (!projectId || !workOrderId) return Promise.resolve(null);
    return API.getWorkOrder(projectId, workOrderId).then(function (res) {
      return res && res.success && res.data ? res.data : null;
    });
  }

  function createWorkOrder(projectId, payload) {
    if (!projectId) return Promise.resolve({ success: false });
    return API.createWorkOrder(projectId, payload);
  }

  function updateWorkOrder(projectId, workOrderId, payload) {
    if (!projectId || !workOrderId) return Promise.resolve({ success: false });
    return API.updateWorkOrder(projectId, workOrderId, payload);
  }

  function listTasks(projectId, workOrderId, params) {
    if (!projectId) return Promise.resolve({ data: [], meta: {} });
    var p = params || {};
    if (workOrderId) p.work_order_id = workOrderId;
    return API.listTasks(projectId, p).then(function (res) {
      if (!res || !res.success) return { data: [], meta: {} };
      var data = res.data && res.data.data ? res.data.data : (res.data && Array.isArray(res.data) ? res.data : []);
      var meta = (res.data && res.data.meta) ? res.data.meta : { total: 0, page: 1, limit: 50 };
      return { data: data, meta: meta };
    });
  }

  function createTask(projectId, payload) {
    if (!projectId) return Promise.resolve({ success: false });
    return API.createTask(projectId, payload);
  }

  window.WorkOrdersService = {
    listWorkOrders: listWorkOrders,
    getWorkOrder: getWorkOrder,
    createWorkOrder: createWorkOrder,
    updateWorkOrder: updateWorkOrder,
    listTasks: listTasks,
    createTask: createTask
  };
})();
