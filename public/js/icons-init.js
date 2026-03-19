/**
 * Inicialización de iconos Lucide.
 * Debe cargarse después de lucide.min.js.
 * Definido en archivo externo para cumplir CSP (script-src 'self' sin unsafe-inline).
 */
(function () {
  "use strict";

  window.nexusCreateIcons = function () {
    try {
      if (typeof window.nexusEnhanceButtons === "function") {
        window.nexusEnhanceButtons(document);
      }
      var lib = typeof lucide !== "undefined" ? lucide : (typeof window.lucide !== "undefined" ? window.lucide : null);
      if (lib && typeof lib.createIcons === "function") lib.createIcons();
    } catch (e) {
      console.warn("[Nexus] Lucide icons:", e);
    }
  };

  var pending = false;
  function scheduleRefresh() {
    if (pending) return;
    pending = true;
    setTimeout(function () {
      pending = false;
      window.nexusCreateIcons();
    }, 0);
  }

  function observeDynamicDom() {
    try {
      if (!window.MutationObserver || !document.body) return;
      var observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i += 1) {
          if (mutations[i].addedNodes && mutations[i].addedNodes.length) {
            scheduleRefresh();
            return;
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) {
      console.warn("[Nexus] Icon observer:", e);
    }
  }

  function initLucide() {
    window.nexusCreateIcons();
    observeDynamicDom();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(initLucide, 50);
    });
  } else {
    setTimeout(initLucide, 50);
  }
})();
