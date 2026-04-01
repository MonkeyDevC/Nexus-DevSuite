/**
 * Contenido de documentación embebido (paridad con el contenido legacy histórico ya retirado).
 * Fuente: static/*.json — no depende del runtime legacy.
 */
import functionalHtml from "./static/functional.json";
import technicalHtml from "./static/technical.json";

export const DOCUMENTATION_SECTION_IDS = ["functional", "technical", "documents"];

/** @type {readonly { id: string; label: string }[]} */
export const DOCUMENTATION_NAV_ITEMS = [
  { id: "functional", label: "Documentación funcional" },
  { id: "technical", label: "Documentación técnica" },
  { id: "documents", label: "Documentos" },
];

function asHtmlString(value) {
  return typeof value === "string" ? value : String(value ?? "");
}

export const DOCUMENTATION_FUNCTIONAL_HTML = asHtmlString(functionalHtml);
export const DOCUMENTATION_TECHNICAL_HTML = asHtmlString(technicalHtml);
