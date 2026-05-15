/**
 * ----
 * Módulo: Rules Config
 * Descripción: Configuración de reglas por contexto de dominio consumidas por services.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-24
 * ----
 */

const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

const RULES_CONFIG = {
  START_DEVELOPMENT: {
    name: "START_DEVELOPMENT",
    type: "BLOCK",
    userMessage: "No puedes iniciar desarrollo",
    guidance: ["El sprint debe estar IN_PROGRESS (activo)", "La historia debe tener refinement_status READY"],
    rules: [
      {
        type: "block",
        conditions: {
          NOT: {
            AND: [
              {
                field: "sprint.status",
                operator: "EQUALS",
                value: "IN_PROGRESS",
                expected: "IN_PROGRESS"
              },
              {
                field: "story.refinement_status",
                operator: "EQUALS",
                value: "READY",
                expected: "READY"
              }
            ]
          }
        },
        message: "No puedes iniciar desarrollo"
      }
    ]
  }
};

/**
 * Catálogo ligero para panel (motor de reglas): sin exponer lógica interna completa.
 * @returns {{ id: string, label: string, description: string, active: boolean }[]}
 */
function listRulesCatalogForDashboard() {
  return Object.keys(RULES_CONFIG).map((id) => {
    const c = RULES_CONFIG[id];
    return {
      id,
      label: id,
      description: Array.isArray(c.guidance) && c.guidance[0] ? String(c.guidance[0]) : String(c.userMessage || ""),
      active: true
    };
  });
}

function getRuleConfig(ruleName) {
  const config = RULES_CONFIG[ruleName];
  if (!config) {
    throw new AppError("Regla no configurada: " + String(ruleName), {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR
    });
  }
  if (!config.userMessage || typeof config.userMessage !== "string") {
    throw new AppError("Regla inválida sin userMessage: " + String(ruleName), {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR
    });
  }
  if (!Array.isArray(config.guidance)) {
    throw new AppError("Regla inválida sin guidance: " + String(ruleName), {
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR
    });
  }
  return config;
}

module.exports = {
  getRuleConfig,
  listRulesCatalogForDashboard
};
