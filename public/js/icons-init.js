/**
 * Inicialización de iconos Lucide.
 * Debe cargarse después de lucide.min.js.
 * Definido en archivo externo para cumplir CSP (script-src 'self' sin unsafe-inline).
 */
(function () {
  "use strict";

  window.nexusCreateIcons = function () {
    try {
      var lib = typeof lucide !== "undefined" ? lucide : (typeof window.lucide !== "undefined" ? window.lucide : null);
      if (lib && typeof lib.createIcons === "function") lib.createIcons();
    } catch (e) {
      console.warn("[Nexus] Lucide icons:", e);
    }
  };

  function initLucide() {
    window.nexusCreateIcons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(initLucide, 50);
    });
  } else {
    setTimeout(initLucide, 50);
  }
})();
