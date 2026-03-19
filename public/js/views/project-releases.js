/**
 * Release Planning — Vista #/projects/:projectId/releases y #/projects/:projectId/releases/:releaseId
 */
(function () {
  "use strict";

  var NexusUI = window.NexusUI;
  var ReleasesAPI = window.ReleasesAPI;
  var ReleasesService = window.ReleasesService;
  var ReleasesUI = window.ReleasesUI;

  function esc(s) {
    return ReleasesUI && ReleasesUI.esc ? ReleasesUI.esc(s) : (s == null ? "" : String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));
  }

  window.registerView("project-releases", async function () {
    await window.showNav();
    var segs = window.getHashSegments();
    var projectId = segs[0] === "projects" && segs[1] ? segs[1] : "";
    var releaseId = segs[2] === "releases" && segs[3] ? segs[3] : "";

    if (!projectId) {
      window.setContent('<div class="nui-card"><div class="nui-card-body"><p class="text-danger">Proyecto no especificado.</p><a href="#/projects" class="btn btn-nexus-primary btn-sm">Ir a Proyectos</a></div></div>');
      return;
    }

    var state = { projectId: projectId, projectName: "", releases: [], releaseDetail: null, allFeatures: [] };

    function breadcrumbs() {
      var parts = [
        { label: "Panel", href: "#/dashboard" },
        { label: "Proyectos", href: "#/projects" },
        { label: state.projectName || projectId.slice(0, 8), href: "#/projects/" + encodeURIComponent(projectId) }
      ];
      if (releaseId) {
        parts.push({ label: "Release Planning", href: "#/projects/" + encodeURIComponent(projectId) + "/releases" });
        parts.push({ label: state.releaseDetail && state.releaseDetail.release ? state.releaseDetail.release.version : releaseId.slice(0, 8), href: "" });
      } else {
        parts.push({ label: "Release Planning", href: "" });
      }
      return window.renderBreadcrumbs ? window.renderBreadcrumbs(parts) : "";
    }

    if (releaseId) {
      window.setContent(window.showLoading ? window.showLoading() : "<p>Cargando…</p>");
      window.fetchApi("/projects/" + projectId).then(function (pr) {
        if (pr && pr.success && pr.data) state.projectName = pr.data.name || pr.data.title;
      });
      ReleasesService.getRelease(projectId, releaseId).then(function (data) {
        if (!data) {
          window.setContent('<div class="nui-card"><div class="nui-card-body"><p class="text-danger">Release no encontrada.</p><a href="#/projects/' + encodeURIComponent(projectId) + '/releases" class="btn btn-nexus-primary btn-sm">Volver</a></div></div>');
          return;
        }
        state.releaseDetail = data;
        window.fetchApi("/projects/" + projectId + "/features?limit=200").then(function (fr) {
          var items = (fr && fr.success && fr.data && fr.data.items) ? fr.data.items : (fr && fr.data ? (fr.data.items || fr.data) : []);
          state.allFeatures = Array.isArray(items) ? items : [];
          renderDetail();
        });
      });
      return;
    }

    function renderList() {
      var html = breadcrumbs();
      html += NexusUI && NexusUI.viewHeader ? NexusUI.viewHeader({
        title: "Release Planning",
        subtitle: "Proyecto: " + esc(state.projectName || state.projectId),
        actionsHtml: '<button type="button" class="btn btn-outline-secondary btn-sm me-1" id="release-planning-sync-github">Sync from GitHub</button><button type="button" class="btn btn-nexus-primary btn-sm" id="release-planning-create">Create Release</button>'
      }) : '<div class="nui-view-header"><h1 class="nui-view-header-title">Release Planning</h1><button type="button" class="btn btn-outline-secondary btn-sm me-1" id="release-planning-sync-github">Sync from GitHub</button><button type="button" class="btn btn-nexus-primary btn-sm" id="release-planning-create">Create Release</button></div>';

      var rows = state.releases.length ? ReleasesUI.releaseListRows(state.releases) : "<tr><td colspan=\"6\" class=\"text-center text-muted\">No hay releases. Sync from GitHub o cree una release.</td></tr>";
      html += '<section class="nui-card"><div class="nui-card-header"><h2 class="nui-card-title">Releases</h2></div><div class="nui-card-body table-responsive">';
      html += '<table class="table table-hover nexus-table"><thead><tr><th>Versión</th><th>Estado</th><th>Features</th><th>PRs</th><th>Commits</th><th>GitHub</th></tr></thead><tbody>' + rows + "</tbody></table></div></section>";

      window.setContent(html);
      var syncBtn = document.getElementById("release-planning-sync-github");
      if (syncBtn) syncBtn.onclick = function () {
        syncBtn.disabled = true;
        ReleasesService.syncGithubReleases(state.projectId).then(function (data) {
          syncBtn.disabled = false;
          if (data && data.items) {
            state.releases = data.items;
            renderList();
          }
          if (data && data.github_configured === false) {
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "GitHub no configurado", message: data.message || "Configure OAuth del proyecto o GITHUB_TOKEN en el servidor para sincronizar versiones desde GitHub." });
          } else if (data && data.created > 0 && typeof window.showSuccessMessage === "function") {
            window.showSuccessMessage("Sincronizado: " + data.created + " creadas.");
          } else if (data && data.synced !== undefined && data.created === 0 && typeof window.showSuccessMessage === "function") {
            window.showSuccessMessage("Sincronizado. No hay versiones nuevas que importar.");
          } else if (!data && typeof window.openNexusAlertModal === "function") {
            window.openNexusAlertModal({ title: "Error", message: "No se pudo sincronizar con GitHub." });
          }
        }).catch(function () { syncBtn.disabled = false; });
      };
      var btn = document.getElementById("release-planning-create");
      if (btn) btn.onclick = function () {
        ReleasesService.getNextVersion(state.projectId).then(function (next) {
          var hintHtml = "";
          if (next && next.current) {
            var suggestions = (next.suggestions || []).map(function (s) { return s.version + " (" + s.type + ")"; }).join(", ");
            hintHtml = '<p class="nexus-text-sm text-muted mb-2">Última versión: <strong>' + esc(next.current) + '</strong>. Sugerencias: ' + esc(suggestions) + '</p>';
          }
          var bodyHtml = hintHtml;
          bodyHtml += '<div class="mb-3"><label class="form-label" for="release-create-version">Versión <span class="text-danger">*</span></label>';
          bodyHtml += '<input type="text" id="release-create-version" class="form-control" placeholder="v0.1.0" required></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label" for="release-create-name">Nombre</label>';
          bodyHtml += '<input type="text" id="release-create-name" class="form-control" placeholder="Opcional"></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label" for="release-create-desc">Descripción</label>';
          bodyHtml += '<textarea id="release-create-desc" class="form-control" rows="2" placeholder="Opcional"></textarea></div>';
          bodyHtml += '<div class="mb-3"><label class="form-label" for="release-create-planned">Fecha planificada</label>';
          bodyHtml += '<input type="date" id="release-create-planned" class="form-control"></div>';
          bodyHtml += '<div id="release-create-error" class="alert alert-danger d-none"></div>';
          function doCreate() {
            var versionEl = document.getElementById("release-create-version");
            var version = versionEl ? (versionEl.value || "").trim() : "";
            var nameEl = document.getElementById("release-create-name");
            var name = nameEl ? (nameEl.value || "").trim() : "";
            var descEl = document.getElementById("release-create-desc");
            var desc = descEl ? (descEl.value || "").trim() : "";
            var plannedEl = document.getElementById("release-create-planned");
            var planned = plannedEl && plannedEl.value ? plannedEl.value.trim() : null;
            var errEl = document.getElementById("release-create-error");
            if (errEl) { errEl.classList.add("d-none"); errEl.textContent = ""; }
            if (!version) {
              if (errEl) { errEl.textContent = "La versión es obligatoria."; errEl.classList.remove("d-none"); }
              return Promise.resolve(false);
            }
            return ReleasesService.createRelease(state.projectId, { version: version, name: name || null, description: desc || null, planned_date: planned }).then(function (r) {
              if (r && r.id) {
                if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Release creada.");
                window.location.hash = "#/projects/" + encodeURIComponent(state.projectId) + "/releases/" + encodeURIComponent(r.id);
                window.dispatchEvent(new HashChangeEvent("hashchange"));
                return true;
              }
              if (errEl && typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo crear la release." });
              return false;
            }).catch(function () {
              if (errEl) { errEl.textContent = "Error de conexión."; errEl.classList.remove("d-none"); }
              return false;
            });
          }
          if (typeof window.openNexusFormModal !== "function") {
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Crear release", message: "El modal de formulario no está disponible." });
            return;
          }
          window.openNexusFormModal({
            id: "releaseCreateModal",
            title: "Create Release",
            bodyHtml: bodyHtml,
            mode: "create",
            primaryButtonId: "release-create-submit",
            primaryLabel: "Crear",
            getDirtyState: function () {
              var v = (document.getElementById("release-create-version") || {}).value || "";
              var n = (document.getElementById("release-create-name") || {}).value || "";
              var d = (document.getElementById("release-create-desc") || {}).value || "";
              var p = (document.getElementById("release-create-planned") || {}).value || "";
              return (v + n + d + p).trim().length > 0;
            },
            onSaveBeforeClose: doCreate
          }, function (bsModal) { doCreate().then(function (ok) { if (ok && bsModal) bsModal.hide(); }); });
        });
      };
      if (typeof window.nexusCreateIcons === "function") setTimeout(window.nexusCreateIcons, 0);
    }

    function renderDetail() {
      var d = state.releaseDetail;
      var r = d.release || {};
      var features = d.features || [];
      var summary = d.summary || {};
      var inReleaseIds = features.map(function (f) { return f.id; });

      var html = breadcrumbs();
      html += '<section class="nui-card"><div class="nui-card-body">';
      html += '<h2 class="nui-card-title">' + esc(r.version) + '</h2>';
      html += '<p class="mb-1"><strong>Nombre:</strong> ' + esc(r.name || "—") + '</p>';
      html += '<p class="mb-1"><strong>Estado:</strong> <span class="badge ' + (ReleasesUI.statusBadgeClass ? ReleasesUI.statusBadgeClass(r.status) : "bg-secondary") + '">' + esc(r.status) + '</span></p>';
      html += '<p class="mb-1"><strong>Fecha planificada:</strong> ' + (r.planned_date ? esc(r.planned_date) : "—") + '</p>';
      if (r.description) html += '<p class="mb-0 text-muted">' + esc(r.description) + '</p>';
      html += '<div class="mt-2">';
      html += '<button type="button" class="btn btn-outline-primary btn-sm me-2" id="release-detail-edit">Editar</button>';
      if (r.status === "READY" && !r.github_tag) {
        html += '<button type="button" class="btn btn-nexus-primary btn-sm me-2" id="release-detail-publish">Publish Release</button>';
      }
      if (r.status === "PLANNING") {
        var statusOpts = ["PLANNING", "READY", "RELEASED", "ARCHIVED"];
        html += '<label class="nexus-text-sm me-2">Cambiar estado</label><select id="release-detail-status" class="form-select form-select-sm d-inline-block" style="width:auto">';
        statusOpts.forEach(function (st) { html += '<option value="' + esc(st) + '"' + (r.status === st ? " selected" : "") + ">" + esc(st) + "</option>"; });
        html += "</select>";
      }
      var canDeletePlanning = (r.status === "PLANNING" || (r.status === "READY" && !r.github_tag));
      if (canDeletePlanning) {
        html += ' <button type="button" class="btn btn-outline-danger btn-sm ms-2" id="release-detail-delete">Eliminar planeación</button>';
      }
      html += ' <a href="#/projects/' + encodeURIComponent(state.projectId) + '/releases" class="btn btn-outline-secondary btn-sm ms-2">Volver al listado</a></div></div></section>';

      if (r.github_tag || r.github_release_id || r.released_at) {
        html += '<section class="nui-card"><div class="nui-card-header"><h3 class="nui-card-title">GitHub Integration</h3></div><div class="nui-card-body">';
        html += '<p class="mb-1"><strong>GitHub Tag:</strong> ' + (r.github_tag ? esc(r.github_tag) : "—") + '</p>';
        html += '<p class="mb-1"><strong>GitHub Release ID:</strong> ' + (r.github_release_id ? esc(r.github_release_id) : "—") + '</p>';
        html += '<p class="mb-0"><strong>Published Date:</strong> ' + (r.released_at ? esc(r.released_at) : "—") + '</p>';
        html += "</div></section>";
      }

      html += '<section class="nui-card"><div class="nui-card-header"><h3 class="nui-card-title">Resumen técnico</h3></div><div class="nui-card-body">';
      html += ReleasesUI.summaryCards ? ReleasesUI.summaryCards(summary) : "";
      html += "</div></section>";

      html += '<section class="nui-card"><div class="nui-card-header"><h3 class="nui-card-title">Planned Features</h3></div><div class="nui-card-body">';
      if (features.length === 0) html += '<p class="text-muted mb-0">No hay features en esta release.</p>';
      else {
        html += '<ul class="list-unstyled mb-0">';
        features.forEach(function (f) {
          html += '<li class="d-flex justify-content-between align-items-center py-1"><span>' + esc(f.title || f.name || f.id) + ' <small class="text-muted">(' + (f.stories_count || 0) + ' stories, ' + (f.work_orders_count || 0) + ' WO)</small></span>';
          if (r.status === "PLANNING") html += '<button type="button" class="btn btn-outline-danger btn-sm" data-remove-feature="' + esc(f.id) + '">Remove</button>';
          html += "</li>";
        });
        html += "</ul>";
      }
      html += "</div></section>";

      var available = state.allFeatures.filter(function (f) { return inReleaseIds.indexOf(f.id) === -1; });
      html += '<section class="nui-card"><div class="nui-card-header"><h3 class="nui-card-title">Available Features</h3></div><div class="nui-card-body">';
      if (available.length === 0) html += '<p class="text-muted mb-0">Todas las features del proyecto ya están en la release o no hay features.</p>';
      else {
        html += '<ul class="list-unstyled mb-0">';
        available.forEach(function (f) {
          html += '<li class="d-flex justify-content-between align-items-center py-1"><span>' + esc(f.title || f.name || f.id) + '</span>';
          if (r.status === "PLANNING") html += '<button type="button" class="btn btn-nexus-primary btn-sm" data-add-feature="' + esc(f.id) + '">Add</button>';
          html += "</li>";
        });
        html += "</ul>";
      }
      html += "</div></section>";

      window.setContent(html);

      var editBtn = document.getElementById("release-detail-edit");
      if (editBtn) editBtn.onclick = function () {
        var rel = state.releaseDetail && state.releaseDetail.release ? state.releaseDetail.release : {};
        var bodyHtml = '<div class="mb-3"><label class="form-label" for="release-edit-name">Nombre</label>';
        bodyHtml += '<input type="text" id="release-edit-name" class="form-control" value="' + esc(rel.name || "") + '" placeholder="Opcional"></div>';
        bodyHtml += '<div class="mb-3"><label class="form-label" for="release-edit-desc">Descripción</label>';
        bodyHtml += '<textarea id="release-edit-desc" class="form-control" rows="3" placeholder="Opcional">' + esc(rel.description || "") + '</textarea></div>';
        bodyHtml += '<div class="mb-3"><label class="form-label" for="release-edit-planned">Fecha planificada</label>';
        bodyHtml += '<input type="date" id="release-edit-planned" class="form-control" value="' + esc(rel.planned_date || "") + '"></div>';
        bodyHtml += '<div id="release-edit-error" class="alert alert-danger d-none"></div>';
        function doSave() {
          var nameEl = document.getElementById("release-edit-name");
          var name = nameEl ? (nameEl.value || "").trim() : "";
          var descEl = document.getElementById("release-edit-desc");
          var desc = descEl ? (descEl.value || "").trim() : "";
          var plannedEl = document.getElementById("release-edit-planned");
          var planned = plannedEl && plannedEl.value ? plannedEl.value.trim() : null;
          var errEl = document.getElementById("release-edit-error");
          if (errEl) { errEl.classList.add("d-none"); errEl.textContent = ""; }
          return ReleasesService.updateRelease(state.projectId, releaseId, { name: name || null, description: desc || null, planned_date: planned }).then(function (updated) {
            if (updated) {
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Planificación actualizada.");
              return ReleasesService.getRelease(state.projectId, releaseId).then(function (data) {
                if (data) { state.releaseDetail = data; renderDetail(); }
                return true;
              });
            }
            if (errEl && typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo actualizar." });
            return false;
          }).catch(function () {
            if (errEl) { errEl.textContent = "Error de conexión."; errEl.classList.remove("d-none"); }
            return false;
          });
        }
        if (typeof window.openNexusFormModal !== "function") {
          if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Editar", message: "El modal de formulario no está disponible." });
          return;
        }
        window.openNexusFormModal({
          id: "releaseEditModal",
          title: "Editar planificación del release",
          bodyHtml: bodyHtml,
          mode: "edit",
          primaryButtonId: "release-edit-submit",
          primaryLabel: "Guardar",
          getDirtyState: function () { return true; },
          onSaveBeforeClose: doSave
        }, function (bsModal) { doSave().then(function (ok) { if (ok && bsModal) bsModal.hide(); }); });
      };

      var statusEl = document.getElementById("release-detail-status");
      if (statusEl) statusEl.onchange = function () {
        var val = statusEl.value;
        ReleasesService.updateReleaseStatus(state.projectId, releaseId, val).then(function (updated) {
          if (updated) { r.status = val; if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Estado actualizado."); window.dispatchEvent(new HashChangeEvent("hashchange")); }
          else if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo actualizar el estado." });
        });
      };

      document.querySelectorAll("[data-remove-feature]").forEach(function (btn) {
        btn.onclick = function () {
          var fid = btn.getAttribute("data-remove-feature");
          ReleasesService.removeFeature(state.projectId, releaseId, fid).then(function (data) {
            if (data) { state.releaseDetail = data; renderDetail(); }
          });
        };
      });
      document.querySelectorAll("[data-add-feature]").forEach(function (btn) {
        btn.onclick = function () {
          var fid = btn.getAttribute("data-add-feature");
          ReleasesService.addFeature(state.projectId, releaseId, fid).then(function (data) {
            if (data) { state.releaseDetail = data; renderDetail(); }
          });
        };
      });
      var publishBtn = document.getElementById("release-detail-publish");
      if (publishBtn) publishBtn.onclick = function () {
        publishBtn.disabled = true;
        ReleasesService.publishRelease(state.projectId, releaseId).then(function (data) {
          if (data) {
            state.releaseDetail = data;
            renderDetail();
            if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Release publicada en GitHub.");
          } else {
            publishBtn.disabled = false;
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo publicar. Verifique la conexión GitHub y que la release esté en READY." });
          }
        }).catch(function () { publishBtn.disabled = false; });
      };
      var deleteBtn = document.getElementById("release-detail-delete");
      if (deleteBtn) deleteBtn.onclick = function () {
        if (typeof window.openNexusConfirmModal !== "function") {
          if (confirm("¿Eliminar esta planeación? Se quitará la release y sus features asociadas.")) {
            ReleasesService.deleteRelease(state.projectId, releaseId).then(function (ok) {
              if (ok !== null && ok !== false) {
                if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Planeación eliminada.");
                window.location.hash = "#/projects/" + encodeURIComponent(state.projectId) + "/releases";
                window.dispatchEvent(new HashChangeEvent("hashchange"));
              } else if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo eliminar. Solo se pueden eliminar releases en PLANNING o READY no publicadas en GitHub." });
            });
          }
          return;
        }
        window.openNexusConfirmModal({
          title: "Eliminar planeación",
          message: "¿Eliminar esta planeación? La release y la asociación con features se eliminarán. No se puede deshacer.",
          primaryLabel: "Eliminar",
          primaryDanger: true
        }, function (closeModal, showError) {
          ReleasesService.deleteRelease(state.projectId, releaseId).then(function (ok) {
            if (ok !== null && ok !== false) {
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Planeación eliminada.");
              closeModal();
              window.location.hash = "#/projects/" + encodeURIComponent(state.projectId) + "/releases";
              window.dispatchEvent(new HashChangeEvent("hashchange"));
            } else {
              showError("No se pudo eliminar. Solo se pueden eliminar releases en PLANNING o READY no publicadas en GitHub.");
            }
          }).catch(function () { showError("Error de conexión."); });
        });
      };
      if (typeof window.nexusCreateIcons === "function") setTimeout(window.nexusCreateIcons, 0);
    }

    window.setContent(window.showLoading ? window.showLoading() : "<p>Cargando…</p>");
    Promise.all([
      window.fetchApi("/projects/" + projectId).then(function (pr) {
        if (pr && pr.success && pr.data) state.projectName = pr.data.name || pr.data.title;
      }),
      ReleasesService.getReleases(projectId).then(function (list) {
        state.releases = list || [];
      })
    ]).then(renderList);
  });
})();
