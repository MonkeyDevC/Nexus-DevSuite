/**
 * Product Backlog — Vista profesional del backlog del proyecto.
 * Rutas: #/backlog?project=:id  |  #/projects/:projectId/backlog
 * GET /projects/:projectId/backlog (features + stories, filtros: feature, status, sprint, labels).
 * Nexus UI Kit: NexusUI.viewHeader(), NexusUI.card().
 */
(function () {
  var NexusUI = window.NexusUI;
  function esc(s) {
    return NexusUI && NexusUI.esc ? NexusUI.esc(s) : (s == null ? "" : String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));
  }
  function joinHtml(parts) {
    return NexusUI && NexusUI.joinHtml ? NexusUI.joinHtml(parts) : (parts || []).filter(Boolean).join("");
  }

  window.registerView("backlog", async function () {
    await window.showNav();
    var segs = window.getHashSegments();
    var state = {
      projectId: "",
      page: 1,
      limit: 50,
      status: "",
      feature_id: "",
      sprint_id: "",
      assigned_to: "",
      labels: ""
    };
    if (segs[0] === "projects" && segs[1] && segs[2] === "backlog") {
      state.projectId = segs[1];
    } else {
      state.projectId = (window.location.href.match(/[?&]project=([^&]+)/) || [])[1] || "";
    }
    if (state.projectId) state.projectId = decodeURIComponent(state.projectId);

    var projectsRes = await window.fetchApi("/projects");
    var projects = (projectsRes && projectsRes.success && projectsRes.data && projectsRes.data.items) ? projectsRes.data.items : (projectsRes && projectsRes.data && projectsRes.data.data ? projectsRes.data.data : []);
    function getProjectName(id) {
      var p = projects.find(function (x) { return x.id === id; });
      return (p && p.name) || id;
    }
    function setHash() {
      var path = state.projectId && segs[0] === "projects" && segs[1] && segs[2] === "backlog"
        ? "#/projects/" + encodeURIComponent(state.projectId) + "/backlog"
        : "#/backlog";
      var q = [];
      if (state.projectId && path === "#/backlog") q.push("project=" + encodeURIComponent(state.projectId));
      if (state.status) q.push("status=" + encodeURIComponent(state.status));
      if (state.feature_id) q.push("feature_id=" + encodeURIComponent(state.feature_id));
      if (state.sprint_id) q.push("sprint_id=" + encodeURIComponent(state.sprint_id));
      if (state.assigned_to) q.push("assigned_to=" + encodeURIComponent(state.assigned_to));
      if (state.labels) q.push("labels=" + encodeURIComponent(state.labels));
      var h = path + (q.length ? "?" + q.join("&") : "");
      if (window.location.hash !== h) window.history.replaceState(null, "", h);
    }

    function render() {
      var breadcrumbs = [
        { label: "Panel", href: "#/dashboard" },
        { label: "Product Backlog", href: "#/backlog" }
      ];
      if (state.projectId) {
        breadcrumbs.push({ label: getProjectName(state.projectId), href: "#/projects/" + encodeURIComponent(state.projectId) + "/backlog" });
      }
      var html = window.renderBreadcrumbs ? window.renderBreadcrumbs(breadcrumbs) : "";
      html += NexusUI && NexusUI.viewHeader ? NexusUI.viewHeader({
        title: "Product Backlog",
        subtitle: state.projectId ? "Proyecto: " + getProjectName(state.projectId) : "Seleccione un proyecto para ver el backlog priorizado.",
        actionsHtml: state.projectId ? '<a href="#/projects" class="btn btn-outline-secondary btn-sm">Ver proyectos</a>' : ""
      }) : '<div class="nui-view-header"><h1 class="nui-view-header-title">Product Backlog</h1></div>';

      var selectorHtml = '<div class="d-flex flex-wrap gap-2 align-items-end mb-4">';
      selectorHtml += '<label class="nexus-text-sm mb-0">Proyecto</label>';
      selectorHtml += '<select id="backlog-project" class="form-select form-select-sm" style="width:auto;min-width:220px" aria-label="Proyecto">';
      selectorHtml += '<option value="">— Seleccionar proyecto —</option>';
      projects.forEach(function (p) {
        var name = (p.number != null ? "P" + p.number + " - " : "") + (p.name || p.id);
        selectorHtml += '<option value="' + esc(p.id) + '"' + (state.projectId === p.id ? " selected" : "") + ">" + esc(name) + "</option>";
      });
      selectorHtml += "</select>";
      if (state.projectId) {
        selectorHtml += ' <a href="#/projects/' + esc(state.projectId) + '/backlog" class="btn btn-outline-secondary btn-sm">Ver backlog de este proyecto</a>';
        if (window.NEXUS_FEATURES && window.NEXUS_FEATURES.WORK_ORDERS === true) {
          selectorHtml += ' <a href="#/projects/' + esc(state.projectId) + '/work-orders" class="btn btn-outline-secondary btn-sm">Órdenes de trabajo</a>';
        }
        selectorHtml += ' <a href="#/projects/' + esc(state.projectId) + '/repository" class="btn btn-outline-secondary btn-sm">Repository</a>';
        selectorHtml += ' <a href="#/projects/' + esc(state.projectId) + '/releases" class="btn btn-outline-secondary btn-sm">Release Planning</a>';
      }
      selectorHtml += "</div>";
      html += NexusUI && NexusUI.card ? NexusUI.card({ bodyHtml: selectorHtml }) : '<section class="nui-card"><div class="nui-card-body">' + selectorHtml + "</div></section>";

      if (!state.projectId) {
        html += '<div class="nui-card"><div class="nui-card-body">';
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">Seleccione un proyecto</p><p class="nexus-text-secondary">Elija un proyecto para ver su Product Backlog (features y user stories priorizados).</p></div>';
        html += "</div></div>";
        window.setContent(html);
        var sel = document.getElementById("backlog-project");
        if (sel) sel.onchange = function () {
          state.projectId = sel.value || "";
          if (state.projectId) {
            window.location.hash = "#/projects/" + encodeURIComponent(state.projectId) + "/backlog";
          } else {
            setHash();
          }
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
      html += "</div>";

      html += '<div id="backlog-content">Cargando...</div>';
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
        var badgeClass = typeof window.nexusBadgeClass === "function" ? window.nexusBadgeClass : function () { return "badge bg-secondary"; };

        var byFeature = {};
        features.forEach(function (f) { byFeature[f.id] = []; });
        stories.forEach(function (st) {
          var fid = st.feature_id || (st.feature && st.feature.id);
          if (fid && byFeature[fid]) byFeature[fid].push(st);
        });

        var content = "";
        if (features.length === 0) {
          content += NexusUI && NexusUI.card ? NexusUI.card({
            title: "Features",
            bodyHtml: '<p class="nexus-text-sm text-muted mb-0">No hay features o no coinciden con los filtros.</p>'
          }) : '<section class="nui-card"><div class="nui-card-body"><p class="nexus-text-sm text-muted">No hay features.</p></div></section>';
        } else {
          features.forEach(function (f) {
            var featureStories = byFeature[f.id] || [];
            var pct = f.progress_pct != null ? f.progress_pct : 0;
            var featureHref = "#/features?feature=" + encodeURIComponent(f.id) + "&project=" + encodeURIComponent(state.projectId);
            var rightHtml = '<div class="d-flex align-items-center gap-2"><div class="progress flex-grow-1" style="height:8px;min-width:60px"><div class="progress-bar" role="progressbar" style="width:' + pct + '%" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"></div></div><span class="nexus-text-sm">' + (f.stories_done || 0) + "/" + (f.stories_total || 0) + " (" + pct + "%)</span></div>";
            rightHtml += ' <span class="' + badgeClass(f.status) + '">' + esc(f.status || "") + "</span>";
            rightHtml += ' <a href="' + featureHref + '" class="btn btn-outline-secondary btn-sm">Ver feature</a>';
            var bodyParts = [];
            if (featureStories.length === 0) {
              bodyParts.push('<p class="nexus-text-sm text-muted mb-0">Sin stories en esta feature.</p>');
            } else {
              bodyParts.push('<ul class="list-group list-group-flush">');
              featureStories.forEach(function (st) {
                var displayId = "US-" + (st.number != null ? st.number : (st.id ? String(st.id).slice(0, 8) : ""));
                var pointsStr = st.story_points != null ? st.story_points : "—";
                var labelsArr = Array.isArray(st.labels) ? st.labels : (st.labels ? [st.labels] : []);
                var labelsStr = labelsArr.length ? labelsArr.slice(0, 3).join(", ") + (labelsArr.length > 3 ? "…" : "") : "";
                var storyHref = "#/stories?story=" + encodeURIComponent(st.id) + "&project=" + encodeURIComponent(state.projectId);
                bodyParts.push('<li class="list-group-item d-flex justify-content-between align-items-start flex-wrap gap-2">');
                bodyParts.push('<div class="flex-grow-1 min-w-0">');
                bodyParts.push('<a href="' + storyHref + '" class="backlog-story-link">' + esc((st.title || "").slice(0, 80)) + (st.title && st.title.length > 80 ? "…" : "") + "</a>");
                bodyParts.push(' <span class="nexus-text-sm text-muted">' + esc(displayId) + "</span>");
                bodyParts.push("</div>");
                bodyParts.push('<div class="d-flex align-items-center gap-2 flex-shrink-0">');
                bodyParts.push('<span class="' + badgeClass(st.status) + '">' + esc(st.status || "") + "</span>");
                bodyParts.push("<span class=\"nexus-text-sm\" title=\"Story points\">" + esc(pointsStr) + " pts</span>");
                if (labelsStr) bodyParts.push("<span class=\"nexus-text-sm text-muted\">" + esc(labelsStr) + "</span>");
                bodyParts.push('<a href="' + storyHref + '" class="btn btn-outline-secondary btn-sm">Ver</a>');
                bodyParts.push("</div></li>");
              });
              bodyParts.push("</ul>");
            }
            var bodyHtml = joinHtml(bodyParts);
            content += NexusUI && NexusUI.card ? NexusUI.card({
              title: esc(f.title || "Feature sin título"),
              rightHtml: rightHtml,
              bodyHtml: bodyHtml
            }) : '<section class="nui-card"><div class="nui-card-header"><h2 class="nui-card-title">' + esc(f.title || "") + "</div><div class=\"nui-card-body\">" + bodyHtml + "</div></section>";
          });
        }

        container.innerHTML = content;

        container.addEventListener("click", function (e) {
          var storyLink = e.target && e.target.closest ? e.target.closest("a.backlog-story-link, a[href*='story=']") : null;
          if (storyLink) {
            var href = storyLink.getAttribute("href") || "";
            if (href.indexOf("#/stories") === -1 && href.indexOf("story=") === -1) return;
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
          var featLink = e.target && e.target.closest ? e.target.closest("a[href*='feature=']") : null;
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

        var selProject = document.getElementById("backlog-project");
        var selFeature = document.getElementById("backlog-filter-feature");
        var selStatus = document.getElementById("backlog-filter-status");
        var selSprint = document.getElementById("backlog-filter-sprint");
        var selAssigned = document.getElementById("backlog-filter-assigned");
        var inputLabels = document.getElementById("backlog-filter-labels");
        var btnApply = document.getElementById("backlog-apply");

        if (selProject) selProject.onchange = function () {
          state.projectId = selProject.value || "";
          if (state.projectId) window.location.hash = "#/projects/" + encodeURIComponent(state.projectId) + "/backlog";
          else { setHash(); }
          render();
        };
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
              var list = r.data.data || r.data.items || r.data || [];
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

      var selProject2 = document.getElementById("backlog-project");
      if (selProject2) selProject2.onchange = function () {
        state.projectId = selProject2.value || "";
        if (state.projectId) window.location.hash = "#/projects/" + encodeURIComponent(state.projectId) + "/backlog";
        else setHash();
        render();
      };
    }

    render();
  });
})();
