/**
 * Nexus UI Kit — API de UI reutilizable (frontend).
 * No toca lógica de negocio ni endpoints; solo helpers de render/estilo.
 *
 * Se expone como `window.NexusUI`.
 */
(function () {
  "use strict";

  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = String(s);
    return d.innerHTML;
  }

  function joinHtml(parts) {
    return (parts || []).filter(Boolean).join("");
  }

  /**
   * Header estándar de vista (título + acciones).
   * opts: { title, subtitle?, actionsHtml? }
   */
  function viewHeader(opts) {
    opts = opts || {};
    var title = opts.title || "";
    var subtitle = opts.subtitle || "";
    var actionsHtml = opts.actionsHtml || "";
    var html = '<div class="nui-view-header">';
    html += '<div class="nui-view-header-left">';
    html += '<h1 class="nui-view-header-title">' + esc(title) + "</h1>";
    if (subtitle) html += '<p class="nui-view-header-subtitle">' + esc(subtitle) + "</p>";
    html += "</div>";
    if (actionsHtml) html += '<div class="nui-view-header-actions">' + actionsHtml + "</div>";
    html += "</div>";
    return html;
  }

  /**
   * Card estándar.
   * opts: { title?, rightHtml?, bodyHtml }
   */
  function card(opts) {
    opts = opts || {};
    var title = opts.title || "";
    var rightHtml = opts.rightHtml || "";
    var bodyHtml = opts.bodyHtml || "";
    var html = '<section class="nui-card">';
    if (title || rightHtml) {
      html += '<div class="nui-card-header">';
      html += title ? ('<h2 class="nui-card-title">' + esc(title) + "</h2>") : "<div></div>";
      html += rightHtml ? ('<div class="nui-card-header-right">' + rightHtml + "</div>") : "";
      html += "</div>";
    }
    html += '<div class="nui-card-body">' + bodyHtml + "</div>";
    html += "</section>";
    return html;
  }

  window.NexusUI = {
    esc: esc,
    joinHtml: joinHtml,
    viewHeader: viewHeader,
    card: card
  };
})();

