/**
 * Vista previa de cuerpo documental (paridad mínima con documents.js: markdown seguro + HTML filtrado).
 */

function esc(s) {
  if (s == null) return "";
  const d = document.createElement("div");
  d.textContent = String(s);
  return d.innerHTML;
}

export function sanitizePreviewHtml(html) {
  let s = String(html || "");
  s = s.replace(/<\/(?:script|iframe|object|embed|style)\b[^>]*>/gi, "");
  s = s.replace(/<(?:script|iframe|object|embed|style)\b[^>]*>[\s\S]*?<\/(?:script|iframe|object|embed|style)>/gi, "");
  s = s.replace(/<(?:script|iframe|object|embed|style)\b[^>]*\/?>/gi, "");
  s = s.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/\s(?:href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, ' href="#"');
  s = s.replace(/\s(?:href|src)\s*=\s*(?:"data:text\/html[^"]*"|'data:text\/html[^']*')/gi, ' href="#"');
  const wrap = document.createElement("div");
  wrap.innerHTML = s;
  wrap.querySelectorAll("script").forEach((n) => n.remove());
  wrap.querySelectorAll("style").forEach((n) => n.remove());
  wrap.querySelectorAll("[href]").forEach((el) => {
    const h = (el.getAttribute("href") || "").trim().toLowerCase();
    if (h.startsWith("javascript:") || h.startsWith("data:")) el.removeAttribute("href");
  });
  wrap.querySelectorAll("[src]").forEach((el) => {
    const u = (el.getAttribute("src") || "").trim().toLowerCase();
    if (u.startsWith("javascript:") || u.startsWith("data:text/html")) el.removeAttribute("src");
  });
  return wrap.innerHTML;
}

function parseInlineMd(t) {
  return String(t || "")
    .split(/\*\*/)
    .map((part, i) => (i % 2 === 1 ? `<strong>${esc(part)}</strong>` : esc(part)))
    .join("");
}

export function markdownToSafeHtml(md) {
  if (!md || !String(md).trim()) return '<p class="text-muted mb-0">(sin contenido)</p>';
  const blocks = String(md).split(/\n{2,}/);
  const out = [];
  blocks.forEach((block) => {
    const b = block.trim();
    if (!b) return;
    const lines = b.split("\n");
    if (lines.length === 1 && /^#{1,6}\s/.test(lines[0])) {
      const m = lines[0].match(/^(#{1,6})\s+(.*)$/);
      const level = m ? m[1].length : 1;
      const tag = `h${Math.min(6, Math.max(1, level))}`;
      out.push(`<${tag}>${parseInlineMd(m[2])}</${tag}>`);
      return;
    }
    out.push(`<p>${lines.map(parseInlineMd).join("<br>")}</p>`);
  });
  return out.join("");
}

/**
 * @param {{ format?: string, content?: string | null }} doc
 */
export function renderDocBodyHtml(doc) {
  const fmt = (doc.format || "html").toLowerCase();
  const c = doc.content != null ? String(doc.content) : "";
  if (fmt === "markdown") {
    return `<div class="nexus-doc-viewer-md">${markdownToSafeHtml(c)}</div>`;
  }
  return `<div class="nexus-doc-viewer-html border rounded p-3 bg-white">${sanitizePreviewHtml(c) || "<p class='text-muted'>(vacío)</p>"}</div>`;
}
