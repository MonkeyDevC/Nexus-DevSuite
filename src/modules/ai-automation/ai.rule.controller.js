"use strict";

const { buildSuccess } = require("../../shared/responses/responseLayer");
const { assertRequestValid } = require("../../shared/utils/controllerUtils");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const eventBus = require("../../system/eventBus");

const { parseRuleFromNaturalLanguage } = require("./ai.rule.parser.service");
const automationRuleRepository = require("../automation/automation.rule.repository");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");

const authRepository = require("../auth/auth.repository");

function sanitizeWarnings(warnings) {
  return Array.isArray(warnings) ? warnings : [];
}

async function parseRuleController(req, res, next) {
  try {
    assertRequestValid(req);
    const { text } = req.body;
    const tenantId = req.organizationId;

    const result = await parseRuleFromNaturalLanguage({
      text,
      tenant_id: tenantId,
      context: null
    });

    // Auditoría de generación (no rompe).
    try {
      if (req.user && req.user.id) {
        await authRepository.createAuditLog({
          user_id: req.user.id,
          action: "AI_AUTOMATION_RULE_PARSED",
          entity: "automation_rule",
          entity_id: null,
          request_id: req.requestId || "no-request-id",
          metadata: {
            event_type: result.event_type,
            confidence_score: result.confidence_score,
            warnings: sanitizeWarnings(result.warnings)
          },
          ip_address: req.ip || null,
          user_agent: req.get("user-agent") || null
        });
      }
    } catch (_) {
      // best-effort
    }

    res.status(200).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function createRuleFromAiController(req, res, next) {
  try {
    assertRequestValid(req);

    const { text } = req.body;
    const tenantId = req.organizationId;

    const parsed = await parseRuleFromNaturalLanguage({
      text,
      tenant_id: tenantId,
      context: null
    });

    // No permitir creación si es ambigua.
    if (!parsed.event_type || parsed.confidence_score < 0.5) {
      throw new AppError("Regla generada no es suficientemente clara", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        details: { confidence_score: parsed.confidence_score, warnings: sanitizeWarnings(parsed.warnings) }
      });
    }

    const title = `AI Rule: ${text}`.slice(0, 200);

    const created = await automationRuleRepository.createRule({
      tenantId,
      name: title,
      description: "Generada por lenguaje natural (AI heurístico)",
      eventType: parsed.event_type,
      conditions: parsed.conditions,
      actions: parsed.actions,
      isActive: true,
      priority: 0
    });

    // Auditoría: creación.
    try {
      await authRepository.createAuditLog({
        user_id: req.user && req.user.id ? req.user.id : null,
        action: "AI_AUTOMATION_RULE_CREATED",
        entity: "automation_rule",
        entity_id: created.id,
        request_id: req.requestId || "no-request-id",
        metadata: {
          event_type: created.event_type,
          confidence_score: parsed.confidence_score,
          warnings: sanitizeWarnings(parsed.warnings)
        },
        ip_address: req.ip || null,
        user_agent: req.get("user-agent") || null
      });
    } catch (_) {
      // best-effort
    }

    // Emite evento (para observabilidad / posibles reglas futuras).
    eventBus.emit(
      "RULE_CREATED_FROM_AI",
      {
        automation_rule_id: created.id,
        event_type: created.event_type
      },
      {
        tenant_id: tenantId,
        request_id: req.requestId || "no-request-id",
        source: "ai_automation"
      }
    );

    res.status(201).json(
      buildSuccess(
        {
          created,
          parsed
        },
        { request_id: req.requestId || "no-request-id" }
      )
    );
  } catch (e) {
    next(e);
  }
}

module.exports = {
  parseRuleController,
  createRuleFromAiController
};

