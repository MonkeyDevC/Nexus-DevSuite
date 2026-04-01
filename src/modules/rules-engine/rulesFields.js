/**
 * ----
 * Módulo: Rules Fields Catalog
 * Descripción: Catálogo de campos renderizables para UI Builder de reglas.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-24
 * ----
 */

const RULE_FIELDS = [
  {
    value: "sprint.status",
    label: "Estado del Sprint",
    type: "enum",
    options: ["ACTIVE", "INACTIVE"]
  },
  {
    value: "story.status",
    label: "Estado de la Historia",
    type: "enum",
    options: ["READY", "IN_PROGRESS", "DONE"]
  }
];

module.exports = {
  RULE_FIELDS
};
