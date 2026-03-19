(function () {
  "use strict";

  function normalizeMode(mode) {
    return mode === "left" || mode === "right" || mode === "split" ? mode : "split";
  }

  function getContainer(target) {
    if (!target) return null;
    if (typeof target === "string") return document.getElementById(target);
    return target;
  }

  function syncBodyFullscreenClass() {
    var anyFullscreen = !!document.querySelector(".evidence-container.evidence-fullscreen");
    document.body.classList.toggle("nexus-evidence-fullscreen-open", anyFullscreen);
  }

  function syncFullscreenControls(container, isFullscreen) {
    if (!container) return;
    container.querySelectorAll(".btn-evidence-fullscreen-global").forEach(function (btn) {
      var icon = isFullscreen ? "minimize" : "maximize";
      var text = isFullscreen ? "Salir pantalla completa" : "Pantalla completa";
      var tooltip = isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa";
      btn.innerHTML = '<i data-lucide="' + icon + '"></i> ' + text;
      btn.setAttribute("aria-pressed", isFullscreen ? "true" : "false");
      btn.setAttribute("title", tooltip);
      btn.setAttribute("data-tooltip", tooltip);
      if (typeof window.nexusCreateIcons === "function") window.nexusCreateIcons();
    });
  }

  function applyButtonsState(container, mode) {
    if (!container) return;
    container.querySelectorAll("[data-evidence-layout]").forEach(function (btn) {
      var isActive = btn.getAttribute("data-evidence-layout") === mode;
      btn.classList.remove("btn-nexus-primary", "btn-outline-secondary");
      btn.classList.add(isActive ? "btn-nexus-primary" : "btn-outline-secondary");
    });
  }

  window.getEvidenceLayout = function (target) {
    var container = getContainer(target);
    if (!container) return "split";
    return normalizeMode(container.getAttribute("data-evidence-mode"));
  };

  window.setEvidenceLayout = function (target, mode) {
    var container = getContainer(target);
    if (!container) return "split";
    var nextMode = normalizeMode(mode);
    container.setAttribute("data-evidence-mode", nextMode);
    applyButtonsState(container, nextMode);
    return nextMode;
  };

  window.toggleEvidenceFullscreen = function (target, forceState) {
    var container = getContainer(target);
    if (!container) return false;
    var nextState = typeof forceState === "boolean" ? forceState : !container.classList.contains("evidence-fullscreen");
    container.classList.toggle("evidence-fullscreen", nextState);
    syncFullscreenControls(container, nextState);
    syncBodyFullscreenClass();
    return nextState;
  };

  window.bindEvidenceLayout = function (rootEl) {
    var root = rootEl || document;
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll(".evidence-container").forEach(function (container) {
      if (!container || container.getAttribute("data-evidence-layout-bound") === "1") return;
      container.setAttribute("data-evidence-layout-bound", "1");

      container.querySelectorAll("[data-evidence-layout]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          window.setEvidenceLayout(container, btn.getAttribute("data-evidence-layout"));
        });
      });

      container.querySelectorAll(".btn-evidence-fullscreen-global").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          window.toggleEvidenceFullscreen(container);
        });
      });

      window.setEvidenceLayout(container, container.getAttribute("data-evidence-mode") || "split");
      window.toggleEvidenceFullscreen(container, false);
    });
  };

  if (!window.__nexusEvidenceLayoutEscBound) {
    window.__nexusEvidenceLayoutEscBound = true;
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      document.querySelectorAll(".evidence-container.evidence-fullscreen").forEach(function (container) {
        window.toggleEvidenceFullscreen(container, false);
      });
    });
  }
})();
