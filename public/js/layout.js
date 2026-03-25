/**
 * Layout común — ETAPA 13: barra superior + sidebar; mostrar/ocultar según login y rol
 */
(function () {
  window.showNav = async function () {
    document.body.classList.remove("layout-login");
    if (typeof window.nexusCreateIcons === "function") setTimeout(window.nexusCreateIcons, 0);
    const user = await window.getMe();
    const displayName = user ? ((user.name || "").trim() || (user.email || "").trim() || "Usuario") : "Usuario";
    const initial = (displayName.charAt(0) || "U").toUpperCase();
    const elUser = document.getElementById("nav-user");
    if (elUser) elUser.textContent = displayName;
    const elDisplay = document.getElementById("nav-user-display");
    if (elDisplay) elDisplay.textContent = displayName;
    const elAvatarWrap = document.getElementById("nav-user-avatar");
    if (elAvatarWrap) {
      if (user && user.profile_photo_url) {
        var img = elAvatarWrap.querySelector("img.nexus-topbar-avatar-img");
        var spanFallback = elAvatarWrap.querySelector("#nav-user-initial");
        if (!img) {
          elAvatarWrap.innerHTML = "";
          img = document.createElement("img");
          img.className = "nexus-topbar-avatar-img";
          img.alt = "";
          img.setAttribute("aria-hidden", "true");
          elAvatarWrap.appendChild(img);
          spanFallback = document.createElement("span");
          spanFallback.id = "nav-user-initial";
          spanFallback.style.display = "none";
          elAvatarWrap.appendChild(spanFallback);
        }
        spanFallback.textContent = initial;
        img.src = user.profile_photo_url;
        img.style.display = "";
        spanFallback.style.display = "none";
        img.onerror = function () { img.style.display = "none"; spanFallback.style.display = ""; };
      } else {
        var spanInitial = document.getElementById("nav-user-initial");
        if (!spanInitial) {
          spanInitial = document.createElement("span");
          spanInitial.id = "nav-user-initial";
          elAvatarWrap.innerHTML = "";
          elAvatarWrap.appendChild(spanInitial);
        } else {
          elAvatarWrap.querySelectorAll("img.nexus-topbar-avatar-img").forEach(function (i) { i.remove(); });
          spanInitial.style.display = "";
        }
        spanInitial.textContent = initial;
      }
    }
    const isMaster = typeof window.nexusCanAccessMasterActions === "function" ? window.nexusCanAccessMasterActions(user) : (user && user.role === "MASTER");
    // NEXUS-AUD-031: El enlace "Reportes" en el sidebar se muestra solo para rol MASTER. Si el PO decide que Reportes (resumen proyecto/sprint, actividad por usuario) sea visible para todos, cambiar a mostrar siempre; la sección "Auditoría" dentro de Reportes sigue restringida a MASTER.
    const navReports = document.getElementById("nav-reports");
    if (navReports) navReports.style.display = isMaster ? "" : "none";
    ["nav-apps-users", "nav-apps-audit", "nav-apps-metrics", "nav-apps-organization"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.style.display = isMaster ? "" : "none";
    });
    var helpBtn = document.getElementById("nav-help");
    if (helpBtn) helpBtn.style.display = isMaster ? "" : "none";
    if (isMaster && typeof window.initNexusHelpSystem === "function") {
      window.initNexusHelpSystem();
    }
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout && !btnLogout.onclick) btnLogout.onclick = function () { window.logout(); };
    const btnEditUser = document.getElementById("btn-edit-current-user");
    if (btnEditUser && !btnEditUser._bound) {
      btnEditUser._bound = true;
      btnEditUser.addEventListener("click", function () {
        window.getMe().then(function (u) {
          if (u && u.id && typeof window.openManageUserModal === "function") {
            window.openManageUserModal(u.id, function () {
              window.clearUser();
              window.showNav();
            });
          }
        });
      });
    }
    const btnSettings = document.getElementById("btn-settings");
    if (btnSettings && !btnSettings._navBound) {
      btnSettings._navBound = true;
      btnSettings.addEventListener("click", function (e) { e.preventDefault(); window.location.hash = "#/settings"; });
    }
    var name = window.getViewName && window.getViewName();
    if (name) {
      document.querySelectorAll(".nexus-sidebar-link").forEach(function (a) {
        var view = a.getAttribute("data-view");
        a.classList.toggle("nexus-nav-item-active", view === name);
      });
    }
    var footer = document.getElementById("app-footer");
    var healthEl = document.getElementById("app-health-status");
    if (footer) footer.style.display = "";
    if (healthEl) {
      healthEl.textContent = "API: …";
      healthEl.classList.remove("text-success", "text-danger");
      healthEl.classList.add("text-muted");
      var base = window.APP_CONFIG && window.APP_CONFIG.API_BASE ? window.APP_CONFIG.API_BASE : "/api/v1";
      var healthUrl = base + "/health";
      fetch(healthUrl).then(function (r) {
        if (healthEl) {
          if (r.ok) { healthEl.textContent = "API: OK"; healthEl.classList.remove("text-muted", "text-danger"); healthEl.classList.add("text-success"); }
          else { healthEl.textContent = "API: Error"; healthEl.classList.remove("text-muted", "text-success"); healthEl.classList.add("text-danger"); }
        }
      }).catch(function () {
        if (healthEl) { healthEl.textContent = "API: Error"; healthEl.classList.remove("text-muted", "text-success"); healthEl.classList.add("text-danger"); }
      });
    }
  };

  window.hideNav = function () {
    document.body.classList.add("layout-login");
  };

  (function initSidebarToggle() {
    function toggleSidebar(open) {
      var layout = document.getElementById("app-layout");
      var sidebar = document.getElementById("app-sidebar");
      var btn = document.getElementById("sidebar-toggle");
      if (!sidebar || !layout) return;
      if (open == null) open = !sidebar.classList.contains("nexus-sidebar-open");
      sidebar.classList.toggle("nexus-sidebar-open", open);
      layout.classList.toggle("nexus-sidebar-open", open);
      if (btn) { btn.setAttribute("aria-expanded", open ? "true" : "false"); btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú"); }
    }
    function bind() {
      var btn = document.getElementById("sidebar-toggle");
      var overlay = document.getElementById("sidebar-overlay");
      if (btn && !btn._bound) { btn._bound = true; btn.addEventListener("click", function () { toggleSidebar(); }); }
      if (overlay && !overlay._bound) { overlay._bound = true; overlay.addEventListener("click", function () { toggleSidebar(false); }); }
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
    else bind();
  })();

  window.setContent = function (html) {
    const el = document.getElementById("content");
    if (el) el.innerHTML = html;
    // Asegurar contenedor global para el stack de targets (cards apiladas).
    var stackRoot = document.getElementById("target-stack-root");
    if (!stackRoot) {
      stackRoot = document.createElement("div");
      stackRoot.id = "target-stack-root";
      stackRoot.className = "nexus-target-stack-root";
      var main = document.querySelector(".nexus-main-content") || document.getElementById("app-main") || document.body;
      main.appendChild(stackRoot);
    }
    if (window.targetStackManager && !stackRoot._nexusStackBound) {
      stackRoot._nexusStackBound = true;
      window.targetStackManager.subscribe(function (stack) {
        // Por ahora solo dejamos el contenedor limpio; el render detallado se hará en las vistas que abren targets.
        stackRoot.innerHTML = "";
      });
    }
    if (typeof window.nexusCreateIcons === "function") setTimeout(window.nexusCreateIcons, 0);
  };

  window.showError = function (msg) {
    return '<div class="alert alert-danger">' + (msg || "Error.") + "</div>";
  };

  window.showLoading = function () {
    return '<div class="text-center py-5"><div class="spinner-border"></div><p class="mt-2">Cargando...</p></div>';
  };

  // NEXUS-AUD-CP-001: Gating de navegación basado en feature flags.
  // Esto reemplaza un <script> inline en index.html que rompía la CSP.
  (function initFeatureGating() {
    try {
      var f = window.NEXUS_FEATURES || {};
      var navRepo = document.getElementById("nav-repository");
      if (navRepo) navRepo.style.display = f.REPOSITORY === false ? "none" : "";
    } catch (_) {}
  })();

  (function initTopbarSearch() {
    function bind() {
      var wrap = document.getElementById("nexus-topbar-search-wrap");
      var input = document.getElementById("nexus-topbar-search-input");
      var dropdown = document.getElementById("nexus-topbar-search-dropdown");
      if (!wrap || !input || !dropdown || input._topbarSearchBound) return;
      input._topbarSearchBound = true;

      function show() {
        dropdown.style.display = "block";
        input.setAttribute("aria-expanded", "true");
      }
      function hide() {
        dropdown.style.display = "none";
        input.setAttribute("aria-expanded", "false");
      }

      input.addEventListener("focus", function () { show(); });
      input.addEventListener("click", function () { show(); });
      input.addEventListener("input", function () { show(); });
      input.addEventListener("blur", function () {
        setTimeout(function () {
          if (dropdown && !dropdown.contains(document.activeElement) && document.activeElement !== input) hide();
        }, 150);
      });
      dropdown.querySelectorAll("a.dropdown-item").forEach(function (a) {
        a.addEventListener("mousedown", function (e) { e.preventDefault(); });
        a.addEventListener("click", function (e) {
          e.preventDefault();
          if (this.getAttribute("href")) {
            window.location.hash = this.getAttribute("href");
            hide();
          }
        });
      });
      document.addEventListener("click", function (e) {
        if (wrap && !wrap.contains(e.target)) hide();
      });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
    else bind();
  })();
})();
