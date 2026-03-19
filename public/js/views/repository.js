/**
 * Repository + Deliveries — Exposición de funcionalidades existentes.
 * Rutas:
 * - #/repository
 * - #/projects/:projectId/repository
 * - #/projects/:projectId/deliveries
 */
(function () {
  "use strict";

  function esc(s) {
    if (window.RepositoryUI && typeof window.RepositoryUI.esc === "function") return window.RepositoryUI.esc(s);
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function parseProjectIdFromHash() {
    var segs = window.getHashSegments ? window.getHashSegments() : [];
    if (segs[0] === "projects" && segs[1]) return segs[1];
    return "";
  }

  function getProjectLabel(project) {
    if (!project) return "—";
    var number = project.number != null ? ("P" + String(project.number)) : ((project.id || "").slice(0, 8) || "—");
    var name = project.name || project.id || "—";
    return number + " - " + name;
  }

  function renderProjectSelector(projects, selectedProjectId, targetView) {
    var html = '<div class="nexus-panel nexus-section-spacing">';
    html += '<div class="d-flex flex-wrap gap-2 align-items-end">';
    html += '<label class="mb-0 nexus-text-sm">Proyecto</label>';
    html += '<select id="repo-project-selector" class="form-select form-select-sm" style="max-width:360px">';
    html += '<option value="">Seleccionar proyecto</option>';
    (projects || []).forEach(function (p) {
      html += '<option value="' + esc(p.id) + '"' + (p.id === selectedProjectId ? " selected" : "") + ">" + esc(getProjectLabel(p)) + "</option>";
    });
    html += "</select>";
    html += "</div>";
    html += "</div>";
    setTimeout(function () {
      var sel = document.getElementById("repo-project-selector");
      if (!sel) return;
      sel.onchange = function () {
        if (!sel.value) return;
        window.location.hash = "#/projects/" + encodeURIComponent(sel.value) + "/" + targetView;
      };
    }, 0);
    return html;
  }

  window.registerView("repository", async function () {
    await window.showNav();
    window.setContent(window.showLoading ? window.showLoading() : "<p>Cargando...</p>");

    var projectId = parseProjectIdFromHash();
    var projectsRes = await window.fetchApi("/projects?page=1&limit=100");
    var projects = (projectsRes && projectsRes.success && projectsRes.data && projectsRes.data.items) ? projectsRes.data.items : [];

    if (!projectId) {
      var listHtml = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Repositorio", href: "" }]);
      listHtml += '<h1 class="nexus-page-title">Repositorio</h1>';
      listHtml += renderProjectSelector(projects, "", "repository");
      listHtml += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Seleccione un proyecto para abrir el repositorio</p></div>';
      window.setContent(listHtml);
      return;
    }

    var ff = window.NEXUS_FEATURES || {};
    var githubEnabled = ff.GITHUB_INTEGRATION === true;

    var data = await Promise.all([
      window.fetchApi("/projects/" + projectId),
      githubEnabled ? window.RepositoryService.getBranches(projectId) : Promise.resolve({ branches: [] }),
      githubEnabled ? window.RepositoryService.getPullRequests(projectId, "open") : Promise.resolve({ pull_requests: [] }),
      window.RepositoryService.listDeliveries(projectId)
    ]);
    var projectRes = data[0];
    var branchesRes = data[1] || { branches: [] };
    var prsRes = data[2] || { pull_requests: [] };
    var deliveriesRes = data[3] || { data: [] };
    var projectName = (projectRes && projectRes.success && projectRes.data && projectRes.data.name) ? projectRes.data.name : projectId;

    var html = window.renderBreadcrumbs([
      { label: "Panel", href: "#/dashboard" },
      { label: "Proyectos", href: "#/projects" },
      { label: projectName, href: "#/projects/" + encodeURIComponent(projectId) },
      { label: "Repositorio", href: "" }
    ]);
    html += '<h1 class="nexus-page-title">Repositorio</h1>';
    html += renderProjectSelector(projects, projectId, "repository");
    html += '<div class="d-flex flex-wrap gap-2 mb-3">';
    html += '<a href="#/projects/' + esc(projectId) + '/deliveries" class="btn btn-nexus-primary btn-sm">Deliveries</a>';
    if (ff.WORK_ORDERS === true) {
      html += '<a href="#/projects/' + esc(projectId) + '/work-orders" class="btn btn-outline-secondary btn-sm">Work Orders</a>';
    }
    html += "</div>";

    html += '<div class="nexus-panel nexus-section-spacing"><h3 class="mb-3">Code Deliveries</h3><div class="table-responsive"><table class="table table-hover nexus-table">';
    html += window.RepositoryUI.deliveriesTableHeader();
    html += "<tbody>" + window.RepositoryUI.deliveriesTableRows(deliveriesRes.data || [], projectId) + "</tbody></table></div></div>";

    html += '<div class="nexus-panel nexus-section-spacing"><h3 class="mb-3">Ramas</h3><div class="table-responsive"><table class="table table-hover nexus-table">';
    html += window.RepositoryUI.branchesTableHeader();
    html += "<tbody>" + window.RepositoryUI.branchesTableRows(branchesRes.branches || []) + "</tbody></table></div></div>";

    html += '<div class="nexus-panel nexus-section-spacing"><h3 class="mb-3">Pull Requests (open)</h3><div class="table-responsive"><table class="table table-hover nexus-table">';
    html += window.RepositoryUI.prTableHeader();
    html += "<tbody>" + window.RepositoryUI.pullRequestsTableRows(prsRes.pull_requests || []) + "</tbody></table></div></div>";

    window.setContent(html);
  });

  window.registerView("deliveries", async function () {
    await window.showNav();
    window.setContent(window.showLoading ? window.showLoading() : "<p>Cargando...</p>");

    var projectId = parseProjectIdFromHash();
    if (!projectId) {
      window.setContent('<div class="nexus-empty-state"><p class="nexus-empty-state-title">Proyecto no especificado</p><a href="#/projects" class="btn btn-nexus-primary btn-sm">Ir a Proyectos</a></div>');
      return;
    }

    var responses = await Promise.all([
      window.fetchApi("/projects/" + projectId),
      window.fetchApi("/projects/" + projectId + "/code-deliveries?page=1&limit=100")
    ]);
    var projectRes = responses[0];
    var deliveriesRes = responses[1];
    var projectName = (projectRes && projectRes.success && projectRes.data && projectRes.data.name) ? projectRes.data.name : projectId;
    var raw = (deliveriesRes && deliveriesRes.success && deliveriesRes.data)
      ? (deliveriesRes.data.data != null ? deliveriesRes.data.data : (deliveriesRes.data.items || []))
      : [];
    var items = Array.isArray(raw) ? raw : [];

    var html = window.renderBreadcrumbs([
      { label: "Panel", href: "#/dashboard" },
      { label: "Proyectos", href: "#/projects" },
      { label: projectName, href: "#/projects/" + encodeURIComponent(projectId) },
      { label: "Deliveries", href: "" }
    ]);
    html += '<h1 class="nexus-page-title">Code Deliveries</h1>';
    html += '<div class="d-flex flex-wrap gap-2 mb-3">';
    html += '<a href="#/projects/' + esc(projectId) + '/repository" class="btn btn-outline-secondary btn-sm">Repositorio</a>';
    if (window.NEXUS_FEATURES && window.NEXUS_FEATURES.WORK_ORDERS === true) {
      html += '<a href="#/projects/' + esc(projectId) + '/work-orders" class="btn btn-outline-secondary btn-sm">Work Orders</a>';
    }
    html += "</div>";
    html += '<div class="nexus-panel nexus-section-spacing"><div class="table-responsive"><table class="table table-hover nexus-table">';
    html += "<thead><tr><th>Delivery</th><th>Tipo</th><th>Rama</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>";
    if (!items.length) {
      html += '<tr><td colspan="5" class="text-muted text-center">No hay deliveries para este proyecto.</td></tr>';
    } else {
      items.forEach(function (d) {
        var label = "Delivery " + (d.delivery_number != null ? d.delivery_number : "") + " " + ((d.title || "").slice(0, 40));
        var workspaceHref = "#/projects/" + encodeURIComponent(projectId) + "/deliveries/" + encodeURIComponent(d.id) + "/workspace";
        var badge = (window.RepositoryUI && window.RepositoryUI.badgeStatus) ? window.RepositoryUI.badgeStatus(d.status) : "badge bg-secondary";
        html += "<tr>";
        html += "<td>" + esc(label) + "</td>";
        html += "<td>" + esc(d.delivery_type || "—") + "</td>";
        html += "<td><code>" + esc(d.branch_name || "—") + "</code></td>";
        html += '<td><span class="' + badge + '">' + esc(d.status || "") + "</span></td>";
        html += '<td><a href="' + workspaceHref + '" class="btn btn-nexus-primary btn-sm">Abrir Workspace</a></td>';
        html += "</tr>";
      });
    }
    html += "</tbody></table></div></div>";

    window.setContent(html);
  });
})();
