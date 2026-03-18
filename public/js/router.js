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
    const segments = path.split("/").filter(Boolean);
    const first = segments[0] || "dashboard";
    if (first === "login") return "login";
    if (first === "projects" && segments[1] && segments[2] === "backlog") return "backlog";
    if (first === "projects" && segments[1] && segments[2] === "work-orders") return "work-orders";
    if (first === "projects" && segments[1] && segments[2] === "repository") return "repository";
    if (first === "projects" && segments[1] && segments[2] === "releases") return "project-releases";
    if (first === "projects" && segments[1] && segments[2] === "deliveries" && segments[3] && segments[4] === "workspace") return "delivery-workspace";
    if (first === "documentation") return "documentation";
    return first;
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
    if (name === "admin" || name === "settings") {
      var user = await window.getMe();
      if (!user || user.role !== "MASTER") {
        window.location.hash = "#/dashboard";
        return;
      }
    }
    const fn = views[name];
    if (fn) fn();
    else if (views.dashboard) views.dashboard();
  }

  window.addEventListener("hashchange", showView);
  window.addEventListener("load", showView);
})();
