/**
 * Router — Hash-based (#/dashboard, #/projects, ...)
 */
(function () {
  const views = {};

  window.registerView = function (name, renderFn) {
    views[name] = renderFn;
  };

  function getViewName() {
    const hash = window.location.hash.slice(1) || "/";
    const pathOnly = hash.split("?")[0];
    const path = pathOnly.startsWith("/") ? pathOnly : "/" + pathOnly;
    if (path === "/rules" || path === "/workflow-builder") return "under-construction";
    const projectScoped = path.match(/^\/projects\/[^/]+\/(.+)$/);
    if (projectScoped) {
      const tail = projectScoped[1] || "";
      if (tail === "releases" || /^releases\/[^/]+$/.test(tail)) return "project-releases";
      if (tail === "repository") return "repository";
      if (tail === "deliveries") return "deliveries";
      if (/^deliveries\/[^/]+\/workspace$/.test(tail)) return "delivery-workspace";
      if (tail === "work-orders" || /^work-orders\/[^/]+$/.test(tail)) return "work-orders";
    }
    const segment = path.split("/")[1] || "dashboard";
    return segment === "login" ? "login" : segment;
  }
  window.getViewName = getViewName;

  window.getHashPath = function () {
    const hash = window.location.hash.slice(1) || "/";
    return hash.startsWith("/") ? hash : "/" + hash;
  };
  window.getHashSegments = function () {
    const pathOnly = (window.location.hash.slice(1) || "/").split("?")[0];
    const path = pathOnly.startsWith("/") ? pathOnly : "/" + pathOnly;
    return path.split("/").filter(Boolean);
  };

  async function showView() {
    const name = getViewName();
    if (name === "login") {
      if (views.login) views.login();
      return;
    }
    if (!window.requireAuth()) return;
    if (name === "under-construction" && window.location.hash.indexOf("#/under-construction") !== 0) {
      window.location.hash = "#/under-construction";
      return;
    }
    if (name === "admin" || name === "settings" || name === "workflow-builder") {
      var user = await window.getMe();
      if (!user || user.role !== "MASTER") {
        window.location.hash = "#/dashboard";
        return;
      }
    }

    // Feature availability guards (product stability).
    var ff = window.NEXUS_FEATURES || {};
    if (name === "repository" && ff.REPOSITORY === false) {
      if (typeof window.openNexusAlertModal === "function") {
        window.openNexusAlertModal({ title: "Módulo no disponible", message: "Repositorio no disponible en este entorno." });
      }
      window.location.hash = "#/dashboard";
      return;
    }
    if (name === "work-orders" && ff.WORK_ORDERS === false) {
      if (typeof window.openNexusAlertModal === "function") {
        window.openNexusAlertModal({ title: "Módulo no disponible", message: "Work Orders no está disponible en este entorno." });
      }
      window.location.hash = "#/dashboard";
      return;
    }

    const fn = views[name];
    if (fn) fn();
    else if (views.dashboard) views.dashboard();
  }

  window.addEventListener("hashchange", showView);
  window.addEventListener("load", showView);
})();
