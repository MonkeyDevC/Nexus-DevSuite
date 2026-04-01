/**
 * ----
 * Módulo: Documentation Sanitize
 * Descripción: Reduce superficie XSS en contenido persistido sin dependencias externas;
 *              no sustituye CSP ni escape en el cliente al renderizar.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-23
 * ----
 */

/**
 * Mitigación determinista frente a HTML peligroso incrustado (también en Markdown con HTML crudo).
 * @param {string} raw Texto de entrada
 * @returns {string} Texto filtrado
 */
function sanitizeDocumentationContent(raw) {
  let s = String(raw == null ? "" : raw);
  // Etiquetas típicas de ejecución / embedding
  s = s.replace(/<\/(?:script|iframe|object|embed|svg)\b[^>]*>/gi, "");
  s = s.replace(/<(?:script|iframe|object|embed)[^>]*>[\s\S]*?<\/(?:script|iframe|object|embed)>/gi, "");
  s = s.replace(/<(?:script|iframe|object|embed)\b[^>]*\/?>/gi, "");
  // Manejadores de evento inline
  s = s.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // URLs javascript/data peligrosas en atributos comunes
  s = s.replace(/\s(?:href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, ' href="#"');
  s = s.replace(/\s(?:href|src)\s*=\s*(?:"data:text\/html[^"]*"|'data:text\/html[^']*')/gi, ' href="#"');
  return s;
}

module.exports = {
  sanitizeDocumentationContent
};
