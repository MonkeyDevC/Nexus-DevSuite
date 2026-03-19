"use strict";

const logger = require("../../config/logger");

const workOrderService = require("../work-orders/workOrder.service");

async function executeAction(action, ctx) {
  if (!action || !action.type) return { ok: false, error: "Acción inválida" };

  const type = String(action.type);
  const payload = action.payload || {};

  if (type === "assign_user") {
    const workOrderId = ctx.work_order_id;
    const projectId = ctx.project_id;
    let userId = payload.user_id;
    // Tokens resolubles desde el contexto del evento (por ejemplo, "al creador").
    if (typeof userId === "string") {
      const normalized = userId.trim().toUpperCase();
      if (normalized === "CREATOR") userId = ctx.created_by_user_id;
      if (normalized === "ASSIGNED_TO") userId = ctx.assigned_to_user_id;
      if (normalized === "ACTOR") userId = ctx.actor_user_id;
    }
    if (!workOrderId || !projectId || !userId) return { ok: false, error: "Datos insuficientes para assign_user" };
    await workOrderService.assignWorkOrder(workOrderId, projectId, userId, ctx.contextForService);
    return { ok: true };
  }

  if (type === "change_status") {
    const workOrderId = ctx.work_order_id;
    const projectId = ctx.project_id;
    if (!workOrderId || !projectId || !payload.status) return { ok: false, error: "Datos insuficientes para change_status" };
    await workOrderService.changeStatus(workOrderId, projectId, payload.status, ctx.contextForService);
    return { ok: true };
  }

  if (type === "send_notification") {
    // Stub (future-ready). No rompe.
    let userId = payload.user_id;
    if (typeof userId === "string") {
      const normalized = userId.trim().toUpperCase();
      if (normalized === "CREATOR") userId = ctx.created_by_user_id;
      if (normalized === "ASSIGNED_TO") userId = ctx.assigned_to_user_id;
      if (normalized === "ACTOR") userId = ctx.actor_user_id;
    }
    logger.info(
      { event: "AUTOMATION_SEND_NOTIFICATION", rule_id: ctx.rule_id, work_order_id: ctx.work_order_id, to: userId || null },
      "Notification stub executed"
    );
    return { ok: true };
  }

  if (type === "link_delivery") {
    const workOrderId = ctx.work_order_id;
    const projectId = ctx.project_id;
    let deliveryId = payload.delivery_id;
    if (typeof deliveryId === "string" && deliveryId.trim().toUpperCase() === "DELIVERY") {
      // Token placeholder (sin utilidad real por ahora)
      deliveryId = null;
    }
    if (!workOrderId || !projectId || !deliveryId) return { ok: false, error: "Datos insuficientes para link_delivery" };
    // Usamos updateWorkOrder para mantener lógica core y (eventualmente) auditoría.
    await workOrderService.updateWorkOrder(workOrderId, projectId, { delivery_id: deliveryId }, ctx.contextForService);
    return { ok: true };
  }

  if (type === "add_comment") {
    // Future-ready stub.
    logger.info({ event: "AUTOMATION_ADD_COMMENT_STUB", rule_id: ctx.rule_id, work_order_id: ctx.work_order_id }, "Add comment stub executed");
    return { ok: true };
  }

  return { ok: false, error: "Acción no soportada: " + type };
}

module.exports = {
  executeAction
};

