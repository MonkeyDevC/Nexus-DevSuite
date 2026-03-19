/**
 * Change Requests — GET /change-requests?project_id=..., POST /change-requests,
 * PATCH /:id/submit, /:id/approve, /:id/reject, /:id/implement.
 */
(function () {
  var CR_TYPES = ["FEATURE", "BUGFIX", "HOTFIX", "IMPROVEMENT", "STRUCTURAL"];
  var CR_IMPACT = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  var ENTITY_TYPES = ["FEATURE", "RELEASE"];
  var CR_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "IMPLEMENTED"];
  var UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  function isValidUuid(s) { return typeof s === "string" && UUID_REGEX.test(s.trim()); }

  window.registerView("change-requests", async function () {
    await window.showNav();
    var user = await window.getMe();
    var isMaster = typeof window.nexusCanAccessMasterActions === "function" ? window.nexusCanAccessMasterActions(user) : (user && user.role === "MASTER");
    function esc(x) { if (x == null) return ""; var d = document.createElement("div"); d.textContent = x; return d.innerHTML; }

    var html = window.renderBreadcrumbs([{ label: "Panel", href: "#/dashboard" }, { label: "Change Requests", href: "" }]);
    html += '<h1 class="nexus-page-title">Change Requests</h1>';
    html += '<div class="nexus-panel nexus-section-spacing">';
    html += '<p class="nexus-text-secondary mb-4">Crear solicitudes de cambio y gestionarlas directamente desde la consulta por proyecto.</p>';
    html += '<div class="row g-3">';
    // Bloque 1: Nuevo Change Request
    html += '<div class="col-12">';
    html += '<section class="nexus-card p-3">';
    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Nuevo Change Request</h2>';
    html += '<div class="row g-2">';
    html += '<div class="col-12"><label class="form-label">Entidad (obligatorio)</label><select id="cr-entity-type" class="form-select form-select-sm" aria-label="Tipo de entidad"><option value="">Seleccionar</option>';
    ENTITY_TYPES.forEach(function (e) { html += '<option value="' + esc(e) + '">' + esc(e) + '</option>'; });
    html += '</select></div>';
    html += '<div class="col-12 d-none" id="cr-feature-project-wrap"><label class="form-label">Proyecto (para Feature)</label><select id="cr-feature-project-id" class="form-select form-select-sm" aria-label="Proyecto para feature"><option value="">Seleccionar proyecto</option></select></div>';
    html += '<div class="col-12 d-none" id="cr-feature-wrap"><label class="form-label">Feature</label><select id="cr-feature-id" class="form-select form-select-sm" aria-label="Feature"><option value="">Seleccionar feature</option></select></div>';
    html += '<div class="col-12 d-none" id="cr-release-wrap"><label class="form-label">Release</label><select id="cr-release-id" class="form-select form-select-sm" aria-label="Release"><option value="">Seleccionar release</option></select></div>';
    html += '<div class="col-12"><label class="form-label">ID de entidad (UUID, obligatorio)</label><input type="text" id="cr-entity-id" class="form-control form-control-sm" placeholder="Se completa automáticamente al seleccionar feature/release" aria-label="ID entidad" readonly></div>';
    html += '<div class="col-12"><label class="form-label">Título (opcional)</label><input type="text" id="cr-title" class="form-control form-control-sm" placeholder="Título" aria-label="Título"></div>';
    html += '<div class="col-12"><label class="form-label">Descripción (opcional)</label><textarea id="cr-description" class="form-control form-control-sm" rows="2" placeholder="Descripción" aria-label="Descripción"></textarea></div>';
    html += '<div class="col-6"><label class="form-label">Tipo (opcional)</label><select id="cr-type" class="form-select form-select-sm"><option value="">—</option>';
    CR_TYPES.forEach(function (t) { html += '<option value="' + esc(t) + '">' + esc(t) + '</option>'; });
    html += '</select></div>';
    html += '<div class="col-6"><label class="form-label">Impacto (opcional)</label><select id="cr-impact" class="form-select form-select-sm"><option value="">—</option>';
    CR_IMPACT.forEach(function (i) { html += '<option value="' + esc(i) + '">' + esc(i) + '</option>'; });
    html += '</select></div>';
    html += '<div class="col-12"><button type="button" class="btn btn-nexus-primary btn-sm" id="cr-btn-create">Crear Change Request</button> <span id="cr-create-msg" class="nexus-text-sm text-muted ms-2"></span></div>';
    html += "</div></section></div>";

    // Bloque 2: Consulta por proyecto
    html += '<div class="col-12">';
    html += '<section class="nexus-card p-3">';
    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Consulta por proyecto</h2>';
    html += '<div class="row g-2">';
    html += '<div class="col-12"><label class="form-label">Proyecto</label><select id="cr-query-project-id" class="form-select form-select-sm" aria-label="Proyecto"><option value="">Seleccionar proyecto</option></select></div>';
    html += '<div class="col-6"><label class="form-label">Estado</label><select id="cr-query-status" class="form-select form-select-sm"><option value="">Todos</option>';
    CR_STATUSES.forEach(function (s) { html += '<option value="' + esc(s) + '">' + esc(s) + '</option>'; });
    html += '</select></div>';
    html += '<div class="col-6"><label class="form-label">Entidad</label><select id="cr-query-entity-type" class="form-select form-select-sm"><option value="">Todas</option>';
    ENTITY_TYPES.forEach(function (e) { html += '<option value="' + esc(e) + '">' + esc(e) + '</option>'; });
    html += '</select></div>';
    html += '<div class="col-12"><button type="button" class="btn btn-nexus-secondary btn-sm" id="cr-btn-query">Consultar</button> <span id="cr-query-msg" class="nexus-text-sm text-muted ms-2"></span></div>';
    html += '<div class="col-12"><div id="cr-query-results" class="mt-1"></div></div>';
    html += "</div></section></div>";

    html += "</div>";
    html += '</div>';

    window.setContent(html);

    var msgCreate = document.getElementById("cr-create-msg");
    var msgQuery = document.getElementById("cr-query-msg");
    var queryResults = document.getElementById("cr-query-results");
    var featureRefById = {};
    var crById = {};
    var currentEditId = null;
    var editModalId = "cr-edit-modal";
    var createProjectsCache = [];
    var createReleasesCache = [];

    function getSuggestedAction(status) {
      var s = String(status || "").toUpperCase();
      if (s === "DRAFT") return "Enviar";
      if (s === "SUBMITTED") return isMaster ? "Aprobar/Rechazar" : "Esperar aprobación";
      if (s === "APPROVED") return isMaster ? "Implementar" : "Esperar implementación";
      if (s === "REJECTED") return isMaster ? "Restaurar" : "Crear nuevo";
      if (s === "IMPLEMENTED") return "Sin acción";
      return "Revisar estado";
    }

    function renderQueryResults(items, pagination) {
      if (!queryResults) return;
      if (!items || items.length === 0) {
        queryResults.innerHTML = '<p class="nexus-text-sm text-muted mb-0">Sin resultados para este proyecto.</p>';
        return;
      }
      crById = {};
      var out = '<div class="table-responsive"><table class="table table-sm align-middle mb-2" style="width:100%"><thead><tr><th>Código</th><th>Estado</th><th>Entidad</th><th>Entity ID</th><th>Referencia</th><th style="width:150px;min-width:150px">Próxima acción sugerida</th><th>Creado</th><th style="width:320px;min-width:320px">Acciones</th></tr></thead><tbody>';
      items.forEach(function (it) {
        crById[it.id] = it;
        var reference = "—";
        if (String(it.entity_type || "").toUpperCase() === "FEATURE") {
          reference = featureRefById[it.entity_id] || "—";
        }
        out += "<tr>";
        if (String(it.status || "").toUpperCase() === "DRAFT") {
          out += '<td><a href="#" data-cr-edit-id="' + esc(it.id || "") + '">' + esc(it.code || "—") + "</a></td>";
        } else {
          out += "<td>" + esc(it.code || "—") + "</td>";
        }
        out += "<td>" + esc(it.status || "—") + "</td>";
        out += "<td>" + esc(it.entity_type || "—") + "</td>";
        out += '<td><code>' + esc(it.entity_id || "—") + "</code></td>";
        out += "<td>" + esc(reference) + "</td>";
        out += '<td style="width:150px;min-width:150px">' + esc(getSuggestedAction(it.status)) + "</td>";
        out += "<td>" + esc((it.created_at && String(it.created_at).slice(0, 10)) || "—") + "</td>";
        out += '<td style="width:320px;min-width:320px"><div class="d-flex flex-nowrap gap-1" style="white-space:nowrap">';
        out += '<button type="button" class="btn btn-nexus-secondary btn-sm" data-cr-action="submit" data-cr-id="' + esc(it.id || "") + '">Enviar</button>';
        if (isMaster) {
          out += '<button type="button" class="btn btn-nexus-primary btn-sm" data-cr-action="approve" data-cr-id="' + esc(it.id || "") + '">Aprobar</button>';
          out += '<button type="button" class="btn btn-outline-danger btn-sm" data-cr-action="reject" data-cr-id="' + esc(it.id || "") + '">Rechazar</button>';
          out += '<button type="button" class="btn btn-nexus-secondary btn-sm" data-cr-action="implement" data-cr-id="' + esc(it.id || "") + '">Implementar</button>';
        }
        out += '<button type="button" class="btn btn-outline-secondary btn-sm tooltip" data-action="restore" data-no-auto-icon="1" data-tooltip="' + (isMaster ? "Restaurar a DRAFT" : "Solo MASTER puede restaurar a DRAFT") + '" title="' + (isMaster ? "Restaurar a DRAFT" : "Solo MASTER puede restaurar a DRAFT") + '" aria-label="Restaurar a DRAFT" data-cr-action="restore-draft" data-cr-id="' + esc(it.id || "") + '"' + (isMaster ? "" : " disabled") + '><i data-lucide="rotate-ccw" class="nexus-btn-icon" aria-hidden="true"></i><span class="nexus-action-label">Restaurar</span></button>';
        out += "</div></td>";
        out += "</tr>";
      });
      out += "</tbody></table></div>";
      if (pagination) out += '<p class="nexus-text-xs text-muted mb-0">Total: ' + esc(pagination.total) + ' | Página: ' + esc(pagination.page) + "/" + esc(pagination.totalPages) + "</p>";
      queryResults.innerHTML = out;
      if (typeof window.nexusCreateIcons === "function") setTimeout(window.nexusCreateIcons, 0);
    }

    function clearEditModal() {
      currentEditId = null;
      var modalEl = document.getElementById(editModalId);
      if (!modalEl) return;
      var instance = (typeof bootstrap !== "undefined" && bootstrap.Modal) ? bootstrap.Modal.getInstance(modalEl) : null;
      if (instance) instance.hide();
      else if (modalEl.parentNode) modalEl.parentNode.removeChild(modalEl);
    }

    function openEditPanel(id) {
      var cr = crById[id];
      if (!cr) return;
      if (String(cr.status || "").toUpperCase() !== "DRAFT") {
        if (msgQuery) msgQuery.textContent = "Solo se puede editar un Change Request en estado DRAFT.";
        return;
      }
      currentEditId = id;

      var existing = document.getElementById(editModalId);
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

      var out = '';
      out += '<div class="modal fade" id="' + editModalId + '" tabindex="-1" aria-hidden="true">';
      out += '<div class="modal-dialog modal-dialog-centered"><div class="modal-content">';
      out += '<div class="modal-header"><h5 class="modal-title">Editar Change Request: ' + esc(cr.code || id) + '</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>';
      out += '<div class="modal-body"><div class="row g-2">';
      out += '<div class="col-12"><label class="form-label">Entidad</label><select id="cr-edit-entity-type" class="form-select form-select-sm"><option value="">Seleccionar</option>';
      ENTITY_TYPES.forEach(function (e) { out += '<option value="' + esc(e) + '"' + ((cr.entity_type === e) ? ' selected' : '') + '>' + esc(e) + '</option>'; });
      out += '</select></div>';
      out += '<div class="col-12"><label class="form-label">ID de entidad</label><input type="text" id="cr-edit-entity-id" class="form-control form-control-sm" value="' + esc(cr.entity_id || "") + '"></div>';
      out += '<div class="col-12"><label class="form-label">Título</label><input type="text" id="cr-edit-title" class="form-control form-control-sm" value="' + esc(cr.title || "") + '"></div>';
      out += '<div class="col-12"><label class="form-label">Descripción</label><textarea id="cr-edit-description" rows="2" class="form-control form-control-sm">' + esc(cr.description || "") + '</textarea></div>';
      out += '<div class="col-6"><label class="form-label">Tipo</label><select id="cr-edit-type" class="form-select form-select-sm"><option value="">—</option>';
      CR_TYPES.forEach(function (t) { out += '<option value="' + esc(t) + '"' + ((cr.type === t) ? ' selected' : '') + '>' + esc(t) + '</option>'; });
      out += '</select></div>';
      out += '<div class="col-6"><label class="form-label">Impacto</label><select id="cr-edit-impact" class="form-select form-select-sm"><option value="">—</option>';
      CR_IMPACT.forEach(function (i) { out += '<option value="' + esc(i) + '"' + ((cr.impact_level === i) ? ' selected' : '') + '>' + esc(i) + '</option>'; });
      out += '</select></div>';
      out += '<div class="col-12"><span id="cr-edit-msg" class="nexus-text-sm text-muted"></span></div>';
      out += '</div></div>';
      out += '<div class="modal-footer"><button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn btn-nexus-primary btn-sm" id="cr-edit-save">Guardar cambios</button></div>';
      out += '</div></div></div>';

      document.body.insertAdjacentHTML("beforeend", out);
      var modalEl = document.getElementById(editModalId);
      if (!modalEl) return;
      modalEl.addEventListener("hidden.bs.modal", function () {
        if (modalEl && modalEl.parentNode) modalEl.parentNode.removeChild(modalEl);
        currentEditId = null;
      });
      var modal = (typeof bootstrap !== "undefined" && bootstrap.Modal) ? new bootstrap.Modal(modalEl) : null;
      if (modal) modal.show();

      document.getElementById("cr-edit-save").onclick = function () {
        var msg = document.getElementById("cr-edit-msg");
        var entityId = (document.getElementById("cr-edit-entity-id").value || "").trim();
        if (!entityId || !isValidUuid(entityId)) {
          if (msg) msg.textContent = "El ID de entidad debe ser un UUID válido.";
          return;
        }
        var payload = {
          entity_type: (document.getElementById("cr-edit-entity-type").value || "").trim(),
          entity_id: entityId,
          title: (document.getElementById("cr-edit-title").value || "").trim(),
          description: (document.getElementById("cr-edit-description").value || "").trim(),
          type: (document.getElementById("cr-edit-type").value || "").trim() || null,
          impact_level: (document.getElementById("cr-edit-impact").value || "").trim() || null
        };
        if (!payload.entity_type) {
          if (msg) msg.textContent = "Entidad es obligatoria.";
          return;
        }
        if (msg) msg.textContent = "Guardando…";
        window.fetchApi("/change-requests/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify(payload) }).then(function (r) {
          if (r && r.success) {
            if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Change Request actualizado.");
            if (msg) msg.textContent = "Guardado.";
            doQueryByProject();
            clearEditModal();
          } else {
            if (typeof window.showApiError === "function") window.showApiError(r);
            if (msg) msg.textContent = (r && r.error && r.error.message) || "Error al actualizar.";
          }
        });
      };
    }

    function appendProjectOptions(projects) {
      var sel = document.getElementById("cr-query-project-id");
      if (!sel || !Array.isArray(projects)) return;
      projects.forEach(function (p) {
        var opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = (p.number != null ? ("PRJ-" + p.number + " ") : "") + (p.name || p.id);
        sel.appendChild(opt);
      });
    }

    function loadProjectsForQuery() {
      var page = 1;
      var limit = 100;
      var totalPages = 1;
      function loadNext() {
        return window.fetchApi("/projects?page=" + page + "&limit=" + limit).then(function (r) {
          if (!(r && r.success && r.data && Array.isArray(r.data.items))) return;
          appendProjectOptions(r.data.items);
          totalPages = r.data.totalPages || 1;
          page += 1;
          if (page <= totalPages) return loadNext();
        });
      }
      return loadNext();
    }

    function appendCreateProjectOptions(projects) {
      var sel = document.getElementById("cr-feature-project-id");
      if (!sel || !Array.isArray(projects)) return;
      projects.forEach(function (p) {
        var opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = (p.number != null ? ("PRJ-" + p.number + " ") : "") + (p.name || p.id);
        sel.appendChild(opt);
      });
    }

    function loadProjectsForCreate() {
      var page = 1;
      var limit = 100;
      var totalPages = 1;
      createProjectsCache = [];
      function loadNext() {
        return window.fetchApi("/projects?page=" + page + "&limit=" + limit).then(function (r) {
          if (!(r && r.success && r.data && Array.isArray(r.data.items))) return;
          createProjectsCache = createProjectsCache.concat(r.data.items);
          totalPages = r.data.totalPages || 1;
          page += 1;
          if (page <= totalPages) return loadNext();
        });
      }
      return loadNext().then(function () {
        appendCreateProjectOptions(createProjectsCache);
      });
    }

    function loadFeaturesForCreate(projectId) {
      var sel = document.getElementById("cr-feature-id");
      if (!sel) return Promise.resolve();
      sel.innerHTML = '<option value="">Seleccionar feature</option>';
      if (!projectId) return Promise.resolve();
      var page = 1;
      var limit = 100;
      var totalPages = 1;
      function loadNext() {
        return window.fetchApi("/projects/" + encodeURIComponent(projectId) + "/features?page=" + page + "&limit=" + limit).then(function (r) {
          if (!(r && r.success && r.data && Array.isArray(r.data.items))) return;
          r.data.items.forEach(function (f) {
            var opt = document.createElement("option");
            opt.value = f.id;
            var ref = f.number != null ? ("FT-" + f.number + " ") : "";
            opt.textContent = ref + (f.title || f.id);
            sel.appendChild(opt);
          });
          totalPages = r.data.totalPages || 1;
          page += 1;
          if (page <= totalPages) return loadNext();
        });
      }
      return loadNext();
    }

    function loadReleasesForCreate() {
      var sel = document.getElementById("cr-release-id");
      if (!sel) return Promise.resolve();
      sel.innerHTML = '<option value="">Seleccionar release</option>';
      var page = 1;
      var limit = 100;
      var totalPages = 1;
      createReleasesCache = [];
      function loadNext() {
        return window.fetchApi("/releases?page=" + page + "&limit=" + limit).then(function (r) {
          if (!(r && r.success && r.data && Array.isArray(r.data.items))) return;
          createReleasesCache = createReleasesCache.concat(r.data.items);
          r.data.items.forEach(function (rel) {
            var opt = document.createElement("option");
            opt.value = rel.id;
            opt.textContent = (rel.version || rel.id) + " (" + (rel.status || "—") + ")";
            sel.appendChild(opt);
          });
          totalPages = r.data.totalPages || 1;
          page += 1;
          if (page <= totalPages) return loadNext();
        });
      }
      return loadNext();
    }

    function configureCreateEntitySelector() {
      var entityTypeEl = document.getElementById("cr-entity-type");
      var entityIdEl = document.getElementById("cr-entity-id");
      var featureProjectWrap = document.getElementById("cr-feature-project-wrap");
      var featureWrap = document.getElementById("cr-feature-wrap");
      var releaseWrap = document.getElementById("cr-release-wrap");
      var featureProjectEl = document.getElementById("cr-feature-project-id");
      var featureEl = document.getElementById("cr-feature-id");
      var releaseEl = document.getElementById("cr-release-id");
      if (!entityTypeEl || !entityIdEl) return;

      function resetEntitySelection() {
        entityIdEl.value = "";
        if (featureProjectEl) featureProjectEl.value = "";
        if (featureEl) featureEl.innerHTML = '<option value="">Seleccionar feature</option>';
        if (releaseEl) releaseEl.value = "";
      }

      function refreshVisibility() {
        var type = (entityTypeEl.value || "").trim().toUpperCase();
        resetEntitySelection();
        if (featureProjectWrap) featureProjectWrap.classList.toggle("d-none", type !== "FEATURE");
        if (featureWrap) featureWrap.classList.toggle("d-none", type !== "FEATURE");
        if (releaseWrap) releaseWrap.classList.toggle("d-none", type !== "RELEASE");
        if (type === "FEATURE" && featureProjectEl && featureProjectEl.options.length <= 1) {
          loadProjectsForCreate();
        }
        if (type === "RELEASE" && releaseEl && releaseEl.options.length <= 1) {
          loadReleasesForCreate();
        }
      }

      entityTypeEl.addEventListener("change", refreshVisibility);
      if (featureProjectEl) {
        featureProjectEl.addEventListener("change", function () {
          var projectId = (featureProjectEl.value || "").trim();
          entityIdEl.value = "";
          loadFeaturesForCreate(projectId);
        });
      }
      if (featureEl) {
        featureEl.addEventListener("change", function () {
          entityIdEl.value = (featureEl.value || "").trim();
        });
      }
      if (releaseEl) {
        releaseEl.addEventListener("change", function () {
          entityIdEl.value = (releaseEl.value || "").trim();
        });
      }

      refreshVisibility();
    }

    function doTransition(id, path, label, onDone) {
      if (!id) {
        if (msgQuery) msgQuery.textContent = "ID de Change Request inválido.";
        return;
      }
      if (msgQuery) msgQuery.textContent = "Ejecutando acción…";
      window.fetchApi("/change-requests/" + id + path, { method: "PATCH", body: JSON.stringify({}) }).then(function (r) {
        if (r && r.success) {
          if (typeof window.showSuccessMessage === "function") window.showSuccessMessage(label + " correctamente.");
          if (msgQuery) msgQuery.textContent = label + " correcto.";
          if (typeof onDone === "function") onDone();
        } else {
          if (typeof window.showApiError === "function") window.showApiError(r);
          if (msgQuery) msgQuery.textContent = (r && r.error && r.error.message) || "Error.";
        }
      });
    }

    function doQueryByProject() {
      var projectId = (document.getElementById("cr-query-project-id") && document.getElementById("cr-query-project-id").value || "").trim();
      var status = (document.getElementById("cr-query-status") && document.getElementById("cr-query-status").value || "").trim();
      var entityType = (document.getElementById("cr-query-entity-type") && document.getElementById("cr-query-entity-type").value || "").trim();
      if (!projectId) {
        if (msgQuery) msgQuery.textContent = "Seleccione un proyecto.";
        if (queryResults) queryResults.innerHTML = "";
        return;
      }
      if (msgQuery) msgQuery.textContent = "Consultando…";
      if (queryResults) queryResults.innerHTML = "";
      var q = ["project_id=" + encodeURIComponent(projectId), "page=1", "limit=20"];
      if (status) q.push("status=" + encodeURIComponent(status));
      if (entityType) q.push("entity_type=" + encodeURIComponent(entityType));

      function loadFeatureReferences() {
        featureRefById = {};
        var pageF = 1;
        var limitF = 100;
        var totalPagesF = 1;
        function nextFeaturesPage() {
          return window.fetchApi("/projects/" + encodeURIComponent(projectId) + "/features?page=" + pageF + "&limit=" + limitF).then(function (rf) {
            if (!(rf && rf.success && rf.data && Array.isArray(rf.data.items))) return;
            rf.data.items.forEach(function (f) {
              if (f && f.id) {
                var num = f.number != null ? String(f.number) : "";
                featureRefById[f.id] = num ? ("FT-" + num) : "—";
              }
            });
            totalPagesF = rf.data.totalPages || 1;
            pageF += 1;
            if (pageF <= totalPagesF) return nextFeaturesPage();
          });
        }
        return nextFeaturesPage();
      }

      Promise.all([
        loadFeatureReferences(),
        window.fetchApi("/change-requests?" + q.join("&"))
      ]).then(function (results) {
        var r = results[1];
        if (r && r.success && r.data) {
          if (msgQuery) msgQuery.textContent = "Consulta completada.";
          renderQueryResults(r.data.items || [], r.data.pagination || null);
        } else {
          if (typeof window.showApiError === "function") window.showApiError(r);
          if (msgQuery) msgQuery.textContent = (r && r.error && r.error.message) || "Error al consultar.";
          if (queryResults) queryResults.innerHTML = "";
        }
      });
    }

    document.getElementById("cr-btn-create").onclick = function () {
      var entityType = (document.getElementById("cr-entity-type") && document.getElementById("cr-entity-type").value || "").trim();
      var entityId = (document.getElementById("cr-entity-id") && document.getElementById("cr-entity-id").value || "").trim();
      if (!entityType || !entityId) { if (msgCreate) msgCreate.textContent = "Entidad e ID de entidad son obligatorios."; return; }
      if (!isValidUuid(entityId)) {
        if (msgCreate) msgCreate.textContent = "El ID de entidad debe ser un UUID válido (ej: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).";
        return;
      }
      if (msgCreate) { msgCreate.textContent = "Creando…"; msgCreate.innerHTML = ""; }
      var payload = { entity_type: entityType, entity_id: entityId };
      var title = (document.getElementById("cr-title") && document.getElementById("cr-title").value || "").trim();
      var desc = (document.getElementById("cr-description") && document.getElementById("cr-description").value || "").trim();
      var type = (document.getElementById("cr-type") && document.getElementById("cr-type").value || "").trim();
      var impact = (document.getElementById("cr-impact") && document.getElementById("cr-impact").value || "").trim();
      if (title) payload.title = title;
      if (desc) payload.description = desc;
      if (type) payload.type = type;
      if (impact) payload.impact_level = impact;
      window.fetchApi("/change-requests", { method: "POST", body: JSON.stringify(payload) }).then(function (r) {
        if (r && r.success) {
          if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Change Request creado correctamente.");
          var crId = (r.data && r.data.id) ? r.data.id : "—";
          var linkHtml = "";
          if (entityType === "FEATURE") linkHtml = '<a href="#/features/' + esc(entityId) + '">Ver feature</a>';
          else if (entityType === "RELEASE") linkHtml = '<a href="#/releases/' + esc(entityId) + '">Ver release</a>';
          if (msgCreate) msgCreate.innerHTML = "Creado. ID: " + esc(crId) + (linkHtml ? ". " + linkHtml : "");
        } else {
          if (typeof window.showApiError === "function") window.showApiError(r);
          if (msgCreate) msgCreate.textContent = (r && r.error && r.error.message) || "Error al crear.";
        }
      });
    };

    queryResults.addEventListener("click", function (ev) {
      var editLink = ev.target && ev.target.closest ? ev.target.closest("[data-cr-edit-id]") : null;
      if (editLink) {
        ev.preventDefault();
        var editId = editLink.getAttribute("data-cr-edit-id");
        if (editId) openEditPanel(editId);
        return;
      }
      var btn = ev.target && ev.target.closest ? ev.target.closest("[data-cr-action]") : null;
      if (!btn) return;
      var action = btn.getAttribute("data-cr-action");
      var id = btn.getAttribute("data-cr-id");
      if (!action || !id) return;
      var map = {
        submit: { path: "/submit", label: "Enviado" },
        approve: { path: "/approve", label: "Aprobado" },
        reject: { path: "/reject", label: "Rechazado" },
        implement: { path: "/implement", label: "Marcado implementado" },
        "restore-draft": { path: "/restore-draft", label: "Restaurado a DRAFT" }
      };
      var cfg = map[action];
      if (!cfg) return;
      doTransition(id, cfg.path, cfg.label, doQueryByProject);
    });
    document.getElementById("cr-btn-query").onclick = doQueryByProject;
    loadProjectsForQuery();
    configureCreateEntitySelector();
  });
})();
