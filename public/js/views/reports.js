/**
 * Reports — ETAPA 16: GET /reports/projects/:id/summary, GET /reports/sprints/:id/summary,
 * GET /reports/users/:id/activity, GET /reports/audit (MASTER). Design system.
 */
(function () {
  window.registerView("reports", async function () {
    await window.showNav();
    const user = await window.getMe();
    const isMaster = user && user.role === "MASTER";

    var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Reportes", href: "" }]);
    html += '<h1 class="nexus-page-title">Reportes</h1>';
    html += '<div class="nexus-panel nexus-section-spacing">';
    html += '<div class="mb-3"><label class="form-label nexus-text-sm">Proyecto</label> <select id="rep-sel-project" class="form-select form-select-sm d-inline-block nexus-input" style="width:auto; max-width:280px" aria-label="Proyecto"><option value="">Seleccionar proyecto</option></select> <button type="button" class="btn btn-nexus-primary btn-sm ms-2" id="rep-btn-project">Resumen del proyecto</button></div>';
    html += '<div id="rep-result" class="nexus-card p-3 mb-4"><p class="nexus-text-muted mb-0">Seleccione un proyecto y pulse en Resumen del proyecto.</p></div>';
    html += '<div class="mb-3"><label class="form-label nexus-text-sm">Sprint</label> <select id="rep-sel-sprint" class="form-select form-select-sm d-inline-block nexus-input" style="width:auto; max-width:280px" aria-label="Sprint"><option value="">Seleccione primero un proyecto</option></select> <button type="button" class="btn btn-nexus-secondary btn-sm ms-2" id="rep-btn-sprint">Resumen del sprint</button></div>';
    html += '<div id="rep-sprint-result" class="nexus-card p-3 mb-4" style="display:none"><p class="nexus-text-muted mb-0">—</p></div>';
    if (isMaster) {
      html += '<h3 class="nexus-font-semibold nexus-text-primary mt-4 mb-2">Auditoría</h3>';
      html += '<button type="button" class="btn btn-nexus-secondary btn-sm mb-2" id="rep-btn-audit">Cargar registro de auditoría</button>';
      html += '<div id="rep-audit"></div>';
    }
    html += "</div>";
    window.setContent(html);

    var projectsRes = await window.fetchApi("/projects");
    var projects = (projectsRes && projectsRes.success && projectsRes.data && projectsRes.data.items) ? projectsRes.data.items : [];
    var selProject = document.getElementById("rep-sel-project");
    projects.forEach(function (p) {
      selProject.innerHTML += "<option value=\"" + p.id + "\">" + (p.name || p.id) + "</option>";
    });

    document.getElementById("rep-btn-project").onclick = function () {
      var pid = selProject.value;
      if (!pid) { document.getElementById("rep-result").innerHTML = "<p class=\"nexus-text-muted mb-0\">Seleccione un proyecto</p>"; return; }
      document.getElementById("rep-result").innerHTML = window.showLoading();
      window.fetchApi("/reports/projects/" + pid + "/summary").then(function (body) {
        if (body && body.success && body.data) {
          var c = body.data.counts || body.data || {};
          document.getElementById("rep-result").innerHTML = "<p class=\"mb-0\"><strong>Conteos:</strong> Features: " + (c.features || 0) + ", Stories: " + (c.userStories || c.user_stories || 0) + ", Sprints: " + (c.sprints || 0) + ", Incidentes: " + (c.incidents || 0) + ", Mejoras: " + (c.improvements || 0) + ", Documentos: " + (c.documents || 0) + "</p>";
        } else {
          document.getElementById("rep-result").innerHTML = window.showError(body && body.error && body.error.message);
        }
      });
    };

    var selSprint = document.getElementById("rep-sel-sprint");
    selProject.onchange = function () {
      var pid = selProject.value;
      selSprint.innerHTML = "<option value=\"\">Seleccionar sprint</option>";
      if (!pid) return;
      window.fetchApi("/projects/" + pid + "/sprints?limit=50").then(function (body) {
        if (body && body.success && body.data && body.data.items) {
          body.data.items.forEach(function (s) {
            selSprint.innerHTML += "<option value=\"" + s.id + "\">" + (s.name || s.id) + "</option>";
          });
        }
      });
    };

    document.getElementById("rep-btn-sprint").onclick = function () {
      var sid = selSprint.value;
      if (!sid) return;
      var resEl = document.getElementById("rep-sprint-result");
      resEl.style.display = "block";
      resEl.innerHTML = window.showLoading();
      window.fetchApi("/reports/sprints/" + sid + "/summary").then(function (body) {
        if (body && body.success && body.data) {
          var d = body.data;
          resEl.innerHTML = "<pre class=\"mb-0 nexus-text-sm\" style=\"white-space:pre-wrap\">" + (typeof d === "object" ? JSON.stringify(d, null, 2) : d) + "</pre>";
        } else {
          resEl.innerHTML = window.showError(body && body.error && body.error.message);
        }
      });
    };

    if (isMaster) {
      var auditPage = 1;
      var auditLimit = 20;
      document.getElementById("rep-btn-audit").onclick = function () {
        var cont = document.getElementById("rep-audit");
        cont.innerHTML = window.showLoading();
        window.fetchApi("/reports/audit?page=" + auditPage + "&limit=" + auditLimit).then(function (body) {
          if (body && body.success && body.data && body.data.auditLogs) {
            var list = body.data.auditLogs;
            var pag = body.data.pagination || {};
            var total = pag.total != null ? pag.total : list.length;
            var totalPages = pag.totalPages != null ? pag.totalPages : (total === 0 ? 0 : Math.ceil(total / auditLimit));
            var pagMeta = { page: pag.page || auditPage, limit: pag.limit || auditLimit, total: total, totalPages: totalPages };
            if (list.length === 0) {
              cont.innerHTML = '<div class="nexus-empty-state"><p class="nexus-empty-state-title">No hay registros de auditoría</p></div>';
            } else {
              var tableHtml = '<div class="table-responsive"><table class="table table-sm nexus-table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Entidad</th><th>Acción</th><th>IP</th></tr></thead><tbody>';
              list.forEach(function (a) {
                tableHtml += "<tr><td>" + (a.created_at || "") + "</td><td>" + (a.user_id || "") + "</td><td>" + (a.entity || "") + "</td><td>" + (a.action || "") + "</td><td>" + (a.ip_address || "") + "</td></tr>";
              });
              tableHtml += "</tbody></table></div>";
              if (totalPages > 1) {
                tableHtml += '<div id="rep-audit-pagination" class="mt-2"></div>';
              }
              cont.innerHTML = tableHtml;
              var pagEl = document.getElementById("rep-audit-pagination");
              if (pagEl && totalPages > 1) {
                pagEl.innerHTML = window.renderPagination(pagMeta, function (p) { auditPage = p; document.getElementById("rep-btn-audit").click(); });
                pagEl.querySelectorAll(".page-link").forEach(function (a) {
                  if (a.getAttribute("data-page")) a.onclick = function (e) {
                    e.preventDefault();
                    var p = parseInt(a.getAttribute("data-page"), 10);
                    if (p >= 1 && p <= totalPages) { auditPage = p; document.getElementById("rep-btn-audit").click(); }
                  };
                });
              }
            }
          } else {
            cont.innerHTML = window.showError(body && body.error && body.error.message);
          }
        });
      };
    }
  });
})();
