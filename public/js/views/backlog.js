/**
 * Product Backlog — Vista profesional del backlog del proyecto.
 * GET /projects/:projectId/backlog (features + stories, filtros: feature, status, sprint, labels).
 */
(function () {
  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  window.registerView("backlog", async function () {
    await window.showNav();
    var segs = window.getHashSegments();
    var state = {
      projectId: (window.location.href.match(/[?&]project=([^&]+)/) || [])[1] || "",
      page: 1,
      limit: 50,
      status: "",
      feature_id: "",
      sprint_id: "",
      assigned_to: "",
      labels: ""
    };
    if (state.projectId) state.projectId = decodeURIComponent(state.projectId);

    var projectsRes = await window.fetchApi("/projects");
    var projects = (projectsRes && projectsRes.success && projectsRes.data && projectsRes.data.items) ? projectsRes.data.items : [];
    function getProjectName(id) {
      var p = projects.find(function (x) { return x.id === id; });
      return (p && p.name) || id;
    }
    function setHash() {
      var q = [];
      if (state.projectId) q.push("project=" + encodeURIComponent(state.projectId));
      if (state.status) q.push("status=" + encodeURIComponent(state.status));
      if (state.feature_id) q.push("feature_id=" + encodeURIComponent(state.feature_id));
      if (state.sprint_id) q.push("sprint_id=" + encodeURIComponent(state.sprint_id));
      if (state.assigned_to) q.push("assigned_to=" + encodeURIComponent(state.assigned_to));
      if (state.labels) q.push("labels=" + encodeURIComponent(state.labels));
      var h = "#/backlog" + (q.length ? "?" + q.join("&") : "");
      if (window.location.hash !== h) window.history.replaceState(null, "", h);
    }

    function render() {
      var html = window.renderBreadcrumbs([
        { label: "Panel", href: "#/dashboard" },
        { label: "Product Backlog", href: "#/backlog" }
      ]);
      html += '<h1 class="nexus-page-title">Product Backlog</h1>';
      html += '<div class="nexus-panel nexus-section-spacing">';
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-4">';
      html += '<label class="nexus-text-sm mb-0">Proyecto</label>';
      html += '<select id="backlog-project" class="form-select form-select-sm" style="width:auto;min-width:220px" aria-label="Proyecto">';
      html += '<option value="">— Seleccionar proyecto —</option>';
      projects.forEach(function (p) {
        var name = (p.number != null ? "P" + p.number + " - " : "") + (p.name || p.id);
        html += '<option value="' + esc(p.id) + '"' + (state.projectId === p.id ? " selected" : "") + '>' + esc(name) + '</option>';
      });
      html += '</select>';
      html += '<a href="#/projects" class="btn btn-outline-secondary btn-sm">Ver proyectos</a>';
      html += '</div>';

      if (!state.projectId) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Seleccione un proyecto</p><p class="nexus-text-secondary">Elija un proyecto para ver su Product Backlog (features y user stories).</p></div>';
        html += "</div>";
        window.setContent(html);
        var sel = document.getElementById("backlog-project");
        if (sel) sel.onchange = function () {
          state.projectId = sel.value || "";
          setHash();
          render();
        };
        if (typeof window.nexusCreateIcons === "function") setTimeout(window.nexusCreateIcons, 0);
        return;
      }

      html += '<div class="d-flex flex-wrap gap-2 align-items-center mb-3">';
      html += '<label class="nexus-text-sm mb-0">Feature</label>';
      html += '<select id="backlog-filter-feature" class="form-select form-select-sm" style="width:auto;min-width:180px"><option value="">Todas</option></select>';
      html += '<label class="nexus-text-sm mb-0 ms-2">Estado</label>';
      html += '<select id="backlog-filter-status" class="form-select form-select-sm" style="width:auto"><option value="">Todos</option><option value="DRAFT">DRAFT</option><option value="READY">READY</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="BLOCKED">BLOCKED</option><option value="IN_REVIEW">IN_REVIEW</option><option value="DONE">DONE</option><option value="ARCHIVED">ARCHIVED</option></select>';
      html += '<label class="nexus-text-sm mb-0 ms-2">En sprint</label>';
      html += '<select id="backlog-filter-sprint" class="form-select form-select-sm" style="width:auto;min-width:140px"><option value="">Todos</option><option value="unassigned">Sin asignar</option></select>';
      html += '<label class="nexus-text-sm mb-0 ms-2">Asignado</label>';
      html += '<select id="backlog-filter-assigned" class="form-select form-select-sm" style="width:auto;min-width:160px"><option value="">Todos</option><option value="unassigned">Sin asignar</option></select>';
      html += '<label class="nexus-text-sm mb-0 ms-2">Etiquetas</label>';
      html += '<input type="text" id="backlog-filter-labels" class="form-control form-control-sm" style="width:160px" placeholder="ej: api, frontend" value="' + esc(state.labels) + '">';
      html += '<button type="button" class="btn btn-nexus-primary btn-sm" id="backlog-apply">Filtrar</button>';
      html += '</div>';

      html += '<div id="backlog-content">Cargando...</div>';
      html += "</div>";
      window.setContent(html);

      var q = "?page=" + state.page + "&limit=" + state.limit;
      if (state.status) q += "&status=" + encodeURIComponent(state.status);
      if (state.feature_id) q += "&feature_id=" + encodeURIComponent(state.feature_id);
      if (state.sprint_id) q += "&sprint_id=" + encodeURIComponent(state.sprint_id);
      if (state.assigned_to) q += "&assigned_to=" + encodeURIComponent(state.assigned_to);
      if (state.labels) q += "&labels=" + encodeURIComponent(state.labels.trim());

      window.fetchApi("/projects/" + state.projectId + "/backlog" + q).then(function (res) {
        var container = document.getElementById("backlog-content");
        if (!container) return;
        if (!res || !res.success || !res.data) {
          container.innerHTML = '<p class="nexus-text-sm text-danger">Error al cargar el backlog.</p>';
          return;
        }
        var data = res.data;
        var features = data.features || [];
        var stories = data.stories || [];
        var meta = data.meta || {};

        var content = "";

        content += '<section class="mb-4"><h2 class="nexus-font-semibold nexus-text-primary mb-3">Features <span class="badge bg-secondary">' + (meta.totalFeatures || features.length) + '</span></h2>';
        if (features.length === 0) {
          content += '<p class="nexus-text-sm text-muted">No hay features o no coinciden con los filtros.</p>';
        } else {
          content += '<div class="table-responsive"><table class="table table-sm nexus-table" id="backlog-features-table"><thead><tr><th style="width:28px" aria-label="Ordenar"></th><th>Título</th><th>Estado</th><th>Prioridad</th><th>Progreso</th><th></th></tr></thead><tbody>';
          features.forEach(function (f) {
            var pct = f.progress_pct != null ? f.progress_pct : 0;
            var featureHref = "#/features?feature=" + encodeURIComponent(f.id) + "&project=" + encodeURIComponent(state.projectId);
            content += '<tr draggable="true" data-feature-id="' + esc(f.id) + '" class="backlog-drag-row" role="button" tabindex="0"><td class="text-muted"><i data-lucide="grip-vertical" style="width:14px;height:14px"></i></td><td>' + (f.id ? '<a href="' + featureHref + '" class="backlog-feature-link">' + esc(f.title || "") + "</a>" : esc(f.title || "")) + '</td><td><span class="' + (typeof window.nexusBadgeClass === "function" ? window.nexusBadgeClass(f.status) : "") + '">' + esc(f.status || "") + '</span></td><td>' + esc(f.priority || "") + '</td><td><div class="d-flex align-items-center gap-2"><div class="progress flex-grow-1" style="height:8px;min-width:60px"><div class="progress-bar" role="progressbar" style="width:' + pct + '%" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"></div></div><span class="nexus-text-sm">' + (f.stories_done || 0) + '/' + (f.stories_total || 0) + ' (' + pct + '%)</span></div></td><td><a href="' + featureHref + '" class="btn btn-outline-secondary btn-sm backlog-feature-link">Ver</a></td></tr>';
          });
          content += "</tbody></table></div>";
        }
        content += "</section>";

        content += '<section><h2 class="nexus-font-semibold nexus-text-primary mb-3">User Stories <span class="badge bg-secondary">' + (meta.totalStories != null ? meta.totalStories : stories.length) + '</span></h2>';
        if (stories.length === 0) {
          content += '<p class="nexus-text-sm text-muted">No hay user stories o no coinciden con los filtros.</p>';
        } else {
          content += '<div class="table-responsive"><table class="table table-sm nexus-table" id="backlog-stories-table"><thead><tr><th style="width:28px" aria-label="Ordenar"></th><th>ID</th><th>Título</th><th>Feature</th><th>Estado</th><th>Puntos</th><th>Sprint</th><th>Etiquetas</th><th></th></tr></thead><tbody>';
          stories.forEach(function (st) {
            var displayId = "US-" + (st.number != null ? st.number : (st.id ? String(st.id).slice(0, 8) : ""));
            var featureTitle = (st.feature && st.feature.title) ? st.feature.title : "—";
            var sprintName = (st.sprint && st.sprint.name) ? st.sprint.name : (st.sprint_id ? "—" : "Sin asignar");
            var labelsArr = Array.isArray(st.labels) ? st.labels : (st.labels ? [st.labels] : []);
            var labelsStr = labelsArr.slice(0, 3).join(", ") + (labelsArr.length > 3 ? "…" : "");
            content += '<tr draggable="true" data-story-id="' + esc(st.id) + '" class="backlog-drag-row" role="button" tabindex="0"><td class="text-muted"><i data-lucide="grip-vertical" style="width:14px;height:14px"></i></td><td>' + esc(displayId) + '</td><td>' + (st.id ? '<a href="#/stories?story=' + encodeURIComponent(st.id) + '&project=' + encodeURIComponent(state.projectId) + '">' + esc((st.title || "").slice(0, 50)) + '</a>' : esc(st.title || "")) + '</td><td>' + esc(featureTitle) + '</td><td><span class="' + (typeof window.nexusBadgeClass === "function" ? window.nexusBadgeClass(st.status) : "") + '">' + esc(st.status || "") + '</span></td><td>' + (st.story_points != null ? st.story_points : "—") + '</td><td>' + esc(sprintName) + '</td><td class="nexus-text-sm">' + esc(labelsStr || "—") + '</td><td><a href="#/stories?story=' + encodeURIComponent(st.id) + '" class="btn btn-outline-secondary btn-sm">Ver</a></td></tr>';
          });
          content += "</tbody></table></div>";
        }
        content += "</section>";

        container.innerHTML = content;

        container.addEventListener("click", function (e) {
          var storyLink = e.target && e.target.closest ? e.target.closest("a[href*='story=']") : null;
          if (storyLink) {
            var href = storyLink.getAttribute("href") || "";
            if (href.indexOf("#/stories") === -1) return;
            var match = href.match(/story=([^&]+)/);
            if (!match) return;
            e.preventDefault();
            var storyId = decodeURIComponent(match[1].replace(/\+/g, " "));
            if (window.targetStackManager && storyId) {
              window.targetStackManager.openTarget("story", storyId, { projectId: state.projectId || null });
            }
            if (typeof window.openStoryViewModal === "function") {
              window.openStoryViewModal(storyId, { projectIdHint: state.projectId, onStoryUpdated: render, includeStoriesLink: false });
            } else {
              window.location.hash = href;
            }
            return;
          }
          var featLink = e.target && e.target.closest ? e.target.closest("a.backlog-feature-link") : null;
          if (!featLink) return;
          var fhref = featLink.getAttribute("href") || "";
          if (fhref.indexOf("feature=") === -1) return;
          e.preventDefault();
          var fmatch = fhref.match(/feature=([^&]+)/);
          var featureId = fmatch ? decodeURIComponent(fmatch[1]) : "";
          if (!featureId) return;
          if (window.targetStackManager) {
            window.targetStackManager.openTarget("feature", featureId, { projectId: state.projectId || null });
          }
          if (typeof window.openFeatureDetailTarget === "function") {
            window.openFeatureDetailTarget(featureId, { projectId: state.projectId || null });
          } else {
            window.location.hash = fhref;
          }
        });

        function setupDragDrop(tableId, idAttr, orderKey, currentOrder) {
          var table = document.getElementById(tableId);
          if (!table || !currentOrder || currentOrder.length === 0) return;
          var rows = table.querySelectorAll("tbody tr[data-" + idAttr + "]");
          var draggedEl = null;
          rows.forEach(function (row) {
            row.setAttribute("draggable", "true");
            row.addEventListener("dragstart", function (e) {
              draggedEl = row;
              e.dataTransfer.setData("text/plain", row.getAttribute("data-" + idAttr));
              e.dataTransfer.effectAllowed = "move";
              row.classList.add("opacity-50");
            });
            row.addEventListener("dragend", function () {
              row.classList.remove("opacity-50");
              draggedEl = null;
            });
            row.addEventListener("dragover", function (e) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (draggedEl && draggedEl !== row) row.classList.add("table-primary");
            });
            row.addEventListener("dragleave", function () { row.classList.remove("table-primary"); });
            row.addEventListener("drop", function (e) {
              e.preventDefault();
              row.classList.remove("table-primary");
              if (!draggedEl || draggedEl === row) return;
              var fromId = draggedEl.getAttribute("data-" + idAttr);
              var toId = row.getAttribute("data-" + idAttr);
              if (!fromId || !toId) return;
              var ids = currentOrder.map(function (x) { return x.id; });
              var fromIdx = ids.indexOf(fromId);
              var toIdx = ids.indexOf(toId);
              if (fromIdx === -1 || toIdx === -1) return;
              var newOrder = ids.slice();
              newOrder.splice(fromIdx, 1);
              var insertAt = fromIdx < toIdx ? toIdx - 1 : toIdx;
              newOrder.splice(insertAt, 0, fromId);
              var payload = {};
              payload[orderKey] = newOrder;
              window.fetchApi("/projects/" + state.projectId + "/backlog/order", { method: "POST", body: JSON.stringify(payload) }).then(function (r) {
                if (r && r.success) render();
                else window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "Error al reordenar." });
              });
            });
          });
        }
        setupDragDrop("backlog-features-table", "feature-id", "feature_ids", features);
        setupDragDrop("backlog-stories-table", "story-id", "story_ids", stories);

        var selProject = document.getElementById("backlog-project");
        var selFeature = document.getElementById("backlog-filter-feature");
        var selStatus = document.getElementById("backlog-filter-status");
        var selSprint = document.getElementById("backlog-filter-sprint");
        var selAssigned = document.getElementById("backlog-filter-assigned");
        var inputLabels = document.getElementById("backlog-filter-labels");
        var btnApply = document.getElementById("backlog-apply");

        if (selProject) selProject.onchange = function () { state.projectId = selProject.value || ""; setHash(); render(); };
        if (selStatus) selStatus.value = state.status || "";
        if (selAssigned) selAssigned.value = state.assigned_to || "";
        if (inputLabels) inputLabels.value = state.labels || "";

        if (selFeature) {
          selFeature.innerHTML = '<option value="">Todas</option>';
          function fillFeatureOptions(list) {
            (list || []).forEach(function (f) {
              if (selFeature.querySelector('option[value="' + f.id + '"]')) return;
              selFeature.appendChild(new Option((f.title || f.id).slice(0, 60), f.id));
            });
          }
          fillFeatureOptions(features);
          window.fetchApi("/projects/" + state.projectId + "/features?limit=100").then(function (r) {
            if (r && r.success && r.data) {
              var list = r.data.items || r.data.data || r.data || [];
              fillFeatureOptions(list);
            }
            selFeature.value = state.feature_id || "";
          });
        }
        if (selSprint) {
          selSprint.innerHTML = '<option value="">Todos</option><option value="unassigned">Sin asignar</option>';
          window.fetchApi("/projects/" + state.projectId + "/sprints?limit=50").then(function (r) {
            if (r && r.success && r.data) {
              var list = r.data.data || r.data.items || r.data || [];
              (list || []).forEach(function (sp) {
                selSprint.appendChild(new Option((sp.name || sp.id).slice(0, 50), sp.id));
              });
            }
            selSprint.value = state.sprint_id || "";
          });
        }
        if (selAssigned) {
          selAssigned.innerHTML = '<option value="">Todos</option><option value="unassigned">Sin asignar</option>';
          window.fetchApi("/users").then(function (r) {
            if (r && r.success && r.data) {
              var list = r.data.items || r.data.data || r.data || [];
              (list || []).forEach(function (u) {
                if (!u.id) return;
                var label = (u.name && u.name.trim()) ? u.name.trim() : (u.email || u.id);
                selAssigned.appendChild(new Option(label.slice(0, 40), u.id));
              });
            }
            selAssigned.value = state.assigned_to || "";
          });
        }

        if (btnApply) btnApply.onclick = function () {
          state.feature_id = selFeature ? selFeature.value : "";
          state.status = selStatus ? selStatus.value : "";
          state.sprint_id = selSprint ? selSprint.value : "";
          state.assigned_to = selAssigned ? selAssigned.value : "";
          state.labels = inputLabels ? inputLabels.value.trim() : "";
          state.page = 1;
          setHash();
          render();
        };
        if (typeof window.nexusCreateIcons === "function") setTimeout(window.nexusCreateIcons, 0);
      }).catch(function () {
        var container = document.getElementById("backlog-content");
        if (container) container.innerHTML = '<p class="nexus-text-sm text-danger">Error al cargar el backlog.</p>';
      });

      var selProject = document.getElementById("backlog-project");
      if (selProject) selProject.onchange = function () { state.projectId = selProject.value || ""; setHash(); render(); };
    }

    render();
  });
})();
