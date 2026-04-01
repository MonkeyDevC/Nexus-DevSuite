/**
 * ----
 * Módulo: Política de módulos opcionales
 * Descripción: Define catálogo global de módulos opcionales y utilidades para respuestas/errores consistentes.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

const OPTIONAL_MODULES = Object.freeze(["ai-review", "rules-engine", "workflow-intelligence"]);

function buildFeatureDisabledResponse(moduleName, data) {
  void moduleName;
  return {
    available: false,
    data: data == null ? {} : data,
    error: {
      code: "FEATURE_DISABLED",
      message: "Module not implemented"
    }
  };
}

function assertOptionalModuleEnabled(moduleName) {
  return buildFeatureDisabledResponse(moduleName, {
    module: moduleName
  });
}

module.exports = {
  OPTIONAL_MODULES,
  buildFeatureDisabledResponse,
  assertOptionalModuleEnabled
};
