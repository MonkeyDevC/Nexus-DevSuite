"use strict";

const { buildSuccess } = require("../../shared/responses/responseLayer");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const automationRuleRepository = require("./automation.rule.repository");

const { OPERATORS } = require("./automation.conditions");

const logger = require("../../config/logger");
const authRepository = require("../auth/auth.repository");
const { assertRequestValid } = require("../../shared/utils/controllerUtils");

const SUPPORTED_EVENT_TYPES = ["WORK_ORDER_CREATED", "WORK_ORDER_UPDATED", "WORK_ORDER_STATUS_CHANGED", "WORK_ORDER_ASSIGNED", "DELIVERY_LINKED", "DELIVERY_DELETED"];
const SUPPORTED_CONDITION_FIELDS = ["priority", "status", "assigned_to_user_id"];
const SUPPORTED_ACTION_TYPES = ["assign_user", "change_status", "send_notification", "link_delivery", "add_comment"];

function normalizeConditions(conditions) {
  if (!Array.isArray(conditions)) return [];
  return conditions
    .filter(Boolean)
    .map((c) => ({
      field: c.field,
      operator: c.operator,
      value: c.value
    }));
}

function normalizeActions(actions) {
  if (!Array.isArray(actions)) return [];
  return actions
    .filter(Boolean)
    .map((a) => ({
      type: a.type,
      payload: a.payload || {}
    }));
}

function validateRuleSchema({ event_type, conditions, actions }) {
  const errors = [];

  if (!event_type) errors.push("event_type es obligatorio");
  if (event_type && !SUPPORTED_EVENT_TYPES.includes(event_type)) errors.push("event_type no soportado");

  const condList = Array.isArray(conditions) ? conditions : [];
  const actionList = Array.isArray(actions) ? actions : [];
  if (condList.length === 0 && actionList.length === 0) errors.push("Debe existir al menos 1 condición o 1 acción");

  if (condList.length > 0) {
    for (const c of condList) {
      if (!c || !c.field) errors.push("condición inválida: field");
      if (c && !SUPPORTED_CONDITION_FIELDS.includes(c.field)) errors.push("condición no soportada: field " + c.field);
      if (c && (!c.operator || !Object.keys(OPERATORS).includes(c.operator))) errors.push("operador de condición no soportado");
      if (c && (c.value === undefined || c.value === null || String(c.value).trim() === "")) errors.push("value de condición requerido");
    }
  }

  if (actionList.length > 0) {
    for (const a of actionList) {
      if (!a || !a.type) errors.push("acción inválida: type");
      if (a && !SUPPORTED_ACTION_TYPES.includes(a.type)) errors.push("acción no soportada: " + a.type);
      if (a && a.type === "assign_user") {
        if (!a.payload || a.payload.user_id === undefined || a.payload.user_id === null || String(a.payload.user_id).trim() === "") errors.push("assign_user.user_id requerido");
      }
      if (a && a.type === "change_status") {
        if (!a.payload || !a.payload.status) errors.push("change_status.status requerido");
      }
      if (a && a.type === "send_notification") {
        if (!a.payload || !a.payload.user_id) errors.push("send_notification.user_id requerido");
      }
      if (a && a.type === "link_delivery") {
        if (!a.payload || !a.payload.delivery_id) errors.push("link_delivery.delivery_id requerido");
      }
    }
  }

  return errors;
}

async function createAutomationRuleController(req, res, next) {
  try {
    assertRequestValid(req);

    const organizationId = req.organizationId;
    if (!organizationId) {
      throw new AppError("Tenant no resoluble", { statusCode: 400, code: ERROR_CODES.VALIDATION_ERROR });
    }

    const body = req.body || {};
    const tenantIdFromBody = body.tenant_id ?? null;
    if (tenantIdFromBody && String(tenantIdFromBody) !== String(organizationId)) {
      throw new AppError("tenant_id no coincide con el tenant activo", { statusCode: 403, code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION });
    }

    const tenantId = organizationId;
    const event_type = body.event_type || null;
    const conditions = normalizeConditions(body.conditions);
    const actions = normalizeActions(body.actions);
    const name = body.name ? String(body.name).slice(0, 200) : "Regla de automatización";
    const description = body.description != null ? String(body.description).slice(0, 1000) : null;
    const is_active = body.is_active == null ? true : Boolean(body.is_active);
    const priority = body.priority != null ? parseInt(body.priority, 10) || 0 : 0;

    const schemaErrors = validateRuleSchema({ event_type, conditions, actions });
    if (schemaErrors.length) {
      throw new AppError("Regla inválida", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        details: { errors: schemaErrors }
      });
    }

    const created = await automationRuleRepository.createRule({
      tenantId,
      name,
      description,
      eventType: event_type,
      conditions,
      actions,
      isActive: is_active,
      priority
    });

    // Auditoría best-effort (no bloqueante)
    try {
      await authRepository.createAuditLog({
        user_id: req.user && req.user.id ? req.user.id : null,
        action: "AUTOMATION_RULE_CREATED",
        entity: "automation_rule",
        entity_id: created.id,
        request_id: req.requestId || "no-request-id",
        metadata: { event_type: created.event_type, priority: created.priority, tenant_id: tenantIdFromBody || tenantId },
        ip_address: req.ip || null,
        user_agent: req.get("user-agent") || null
      });
    } catch (err) {
      logger.warn({ err: err && err.message ? err.message : String(err) }, "No se pudo registrar auditoría de creación de regla");
    }

    res.status(201).json(buildSuccess(created, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createAutomationRuleController
};

