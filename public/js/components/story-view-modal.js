/**
 * Modal reutilizable de visualizacion/edicion de User Story.
 * API:
 *   window.openStoryViewModal(storyId, {
 *     projectIdHint?: string,
 *     includeStoriesLink?: boolean,
 *     onStoryUpdated?: Function
 *   })
 */
(function () {
  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function displayId(s) {
    return "US-" + (s.number != null ? s.number : (s.id ? String(s.id).slice(0, 8) : ""));
  }

  function storyEvidenceStorageKey(storyId) {
    return "nexus.story.evidence." + String(storyId || "");
  }

  function normalizeEvidencePayload(payload) {
    var p = payload && typeof payload === "object" ? payload : {};
    return {
      notes: p.notes != null ? String(p.notes) : "",
      files: Array.isArray(p.files) ? p.files.filter(function (f) { return f && f.data_url; }).map(function (f) {
        return {
          name: f.name ? String(f.name) : "archivo",
          type: f.type ? String(f.type) : "application/octet-stream",
          data_url: String(f.data_url)
        };
      }) : []
    };
  }

  function loadStoryEvidence(storyId) {
    try {
      var raw = localStorage.getItem(storyEvidenceStorageKey(storyId));
      if (!raw) return { notes: "", files: [] };
      return normalizeEvidencePayload(JSON.parse(raw));
    } catch (e) {
      return { notes: "", files: [] };
    }
  }

  function saveStoryEvidence(storyId, evidence) {
    localStorage.setItem(storyEvidenceStorageKey(storyId), JSON.stringify(normalizeEvidencePayload(evidence)));
  }

  window.openStoryViewModal = function (storyId, opts) {
    opts = opts || {};
    if (!storyId || typeof window.openNexusFormModal !== "function") return;

    var onStoryUpdated = typeof opts.onStoryUpdated === "function" ? opts.onStoryUpdated : null;
    var includeStoriesLink = opts.includeStoriesLink === true;

    function notifyUpdated() {
      if (onStoryUpdated) onStoryUpdated();
    }

    window.fetchApi("/stories/" + storyId).then(async function (res) {
      if (!res || !res.success || !res.data) {
        if (typeof window.openNexusAlertModal === "function") {
          window.openNexusAlertModal({ title: "Error", message: (res && res.error && res.error.message) || "No se pudo cargar la story." });
        }
        return;
      }

      var s = res.data;
      var projectIdForSprints = opts.projectIdHint || null;
      if (s.feature_id) {
        try {
          var featRes = await window.fetchApi("/features/" + s.feature_id);
          if (featRes && featRes.success && featRes.data && featRes.data.project_id) projectIdForSprints = featRes.data.project_id;
        } catch (err) {}
      }

      var did = displayId(s);
      var assigneeText = s.assignee ? ((s.assignee.name && String(s.assignee.name).trim()) ? String(s.assignee.name).trim() : (s.assignee.email || "")) || "—" : "No asignado";
      if (s.assignee && !assigneeText) assigneeText = s.assignee.email || "No name";

      var criteriaLines = [];
      if (s.acceptance_criteria && typeof s.acceptance_criteria === "object") {
        var items = Array.isArray(s.acceptance_criteria) ? s.acceptance_criteria : (s.acceptance_criteria.items || Object.keys(s.acceptance_criteria).map(function (k) { return s.acceptance_criteria[k]; }));
        if (items && items.length) criteriaLines = items.map(function (c) { return typeof c === "string" ? c : (c && c.text) ? c.text : JSON.stringify(c); });
      }

      var implCriteriaLines = [];
      if (s.implementation_criteria && typeof s.implementation_criteria === "object") {
        var implItems = Array.isArray(s.implementation_criteria) ? s.implementation_criteria : (s.implementation_criteria.items || Object.keys(s.implementation_criteria).map(function (k) { return s.implementation_criteria[k]; }));
        if (implItems && implItems.length) implCriteriaLines = implItems.map(function (c) { return typeof c === "string" ? c : (c && c.text) ? c.text : JSON.stringify(c); });
      }

      var sprintNameView = (s.sprint && s.sprint.name) ? esc(s.sprint.name) : (s.sprint_id ? "—" : "Ninguno");
      var storyStatuses = ["DRAFT", "READY", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "ARCHIVED"];
      var usersPromise = window.fetchApi("/users?limit=50").then(function (body) {
        var raw = (body && body.success && body.data) ? body.data : null;
        return Array.isArray(raw) ? raw : (raw && raw.data) ? raw.data : (raw && raw.items) ? raw.items : [];
      });
      var sprintsPromise = projectIdForSprints ? window.fetchApi("/projects/" + projectIdForSprints + "/sprints?limit=50") : Promise.resolve(null);

      Promise.all([usersPromise, sprintsPromise]).then(function (results) {
        var usersForEdit = results[0];
        var evidenceState = loadStoryEvidence(storyId);
        var evidenceBaselineJson = JSON.stringify(evidenceState);

        var assigneeSelectHtml = '<span class="nexus-text-sm text-muted">Asignado a</span><select id="story-detail-edit-assigned" class="form-select form-select-sm mt-1" style="max-width:100%"><option value="">Nadie (sin asignar)</option>';
        usersForEdit.forEach(function (u) {
          var uid = (u.id || "").replace(/"/g, "&quot;");
          var label = (u.name && String(u.name).trim()) ? esc(u.name) : (u.email ? esc(u.email) : "Sin nombre");
          var sel = (s.assigned_to && u.id === s.assigned_to) ? " selected" : "";
          assigneeSelectHtml += "<option value=\"" + uid + "\"" + sel + ">" + label + "</option>";
        });
        assigneeSelectHtml += "</select>";

        var priorityOpts = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
        var prioritySelectHtml = '<span class="nexus-text-sm text-muted">Prioridad</span><select id="story-detail-edit-priority" class="form-select form-select-sm mt-1" style="max-width:100%">';
        priorityOpts.forEach(function (pr) {
          var sel = (s.priority || "MEDIUM") === pr ? " selected" : "";
          prioritySelectHtml += "<option value=\"" + esc(pr) + "\"" + sel + ">" + esc(pr) + "</option>";
        });
        prioritySelectHtml += "</select>";

        var statusVistaHtml = '<span class="nexus-text-sm text-muted">Estado</span><p class="mb-0" id="story-detail-status-vista">' + esc(s.status || "—") + "</p>";
        var statusSelectEditHtml = '<span class="nexus-text-sm text-muted">Estado</span><select id="story-detail-status-edicion" class="form-select form-select-sm mt-1" style="max-width:100%" aria-label="Estado"><option value="">—</option>';
        storyStatuses.forEach(function (st) {
          statusSelectEditHtml += '<option value="' + esc(st) + '"' + (s.status === st ? " selected" : "") + ">" + esc(st) + "</option>";
        });
        statusSelectEditHtml += "</select>";

        var sprintSelectHtml = '<span class="nexus-text-sm text-muted">Sprint</span><div class="d-flex align-items-center gap-2 mt-1"><select id="story-detail-sprint" class="form-select form-select-sm" style="max-width:100%"><option value="">Ninguno</option></select><span id="story-detail-sprint-msg" class="nexus-text-sm text-muted"></span></div>';

        var storyBreadcrumbs = window.renderBreadcrumbs([
          { label: "Panel", href: "#/dashboard" },
          { label: "Stories", href: "#/stories" }
        ]);
        var bodyHtml = storyBreadcrumbs;
        bodyHtml += '<h1 class="nexus-page-title">' + esc(s.title || "Story") + "</h1>";
        bodyHtml += '<div class="nexus-card p-4" style="max-width:100%">';
        bodyHtml += '<ul class="nav nav-tabs mb-3" role="tablist"><li class="nav-item"><button type="button" class="nav-link active" id="story-detail-tab-vista" data-bs-toggle="tab" data-bs-target="#story-detail-panel-vista" aria-selected="true">Vista</button></li><li class="nav-item"><button type="button" class="nav-link" id="story-detail-tab-edicion" data-bs-toggle="tab" data-bs-target="#story-detail-panel-edicion" aria-selected="false">Edición</button></li><li class="nav-item"><button type="button" class="nav-link" id="story-detail-tab-evidencia" data-bs-toggle="tab" data-bs-target="#story-detail-panel-evidencia" aria-selected="false">Evidencia</button></li></ul>';
        bodyHtml += '<div class="tab-content">';
        bodyHtml += '<div class="tab-pane fade show active" id="story-detail-panel-vista" role="tabpanel"><div class="row g-3">';
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">ID</span><p class="nexus-font-semibold mb-0">' + esc(did) + "</p></div>";
        bodyHtml += '<div class="col-md-4">' + statusVistaHtml + "</div>";
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Creado</span><p class="mb-0 nexus-text-sm">' + esc(s.created_at || "—") + "</p></div>";
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Título</span><p class="mb-0" id="story-detail-title-vista">' + esc(s.title || "—") + "</p></div>";
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Prioridad</span><p class="mb-0" id="story-detail-priority-vista">' + esc(s.priority || "—") + "</p></div>";
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Actualizado</span><p class="mb-0 nexus-text-sm">' + esc(s.updated_at || "—") + "</p></div>";
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Asignado a</span><p class="mb-0" id="story-detail-assignee-vista">' + esc(assigneeText) + "</p></div>";
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Sprint</span><p class="mb-0" id="story-detail-sprint-view">' + esc(sprintNameView) + "</p></div>";
        bodyHtml += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Descripción</span>';
        bodyHtml += '<div id="story-detail-description-vista">' + ((s.description && String(s.description).trim()) ? '<p class="mb-0" style="white-space:pre-wrap">' + esc(s.description) + "</p>" : '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>') + "</div>";
        bodyHtml += "</div>";
        bodyHtml += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Criterios de aceptación</span><div id="story-detail-criteria-vista">';
        if (criteriaLines.length === 0) bodyHtml += '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
        else {
          bodyHtml += '<ul class="list-unstyled mb-0">';
          criteriaLines.forEach(function (line, idx) { bodyHtml += '<li class="py-1">' + (idx + 1) + ". " + esc(line || "—") + "</li>"; });
          bodyHtml += "</ul>";
        }
        bodyHtml += "</div></div>";
        bodyHtml += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Criterios de implementación</span><div id="story-detail-impl-criteria-vista">';
        if (implCriteriaLines.length === 0) bodyHtml += '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
        else {
          bodyHtml += '<ul class="list-unstyled mb-0">';
          implCriteriaLines.forEach(function (line, idx) { bodyHtml += '<li class="py-1">' + (idx + 1) + ". " + esc(line || "—") + "</li>"; });
          bodyHtml += "</ul>";
        }
        bodyHtml += "</div></div></div></div>";

        bodyHtml += '<div class="tab-pane fade" id="story-detail-panel-edicion" role="tabpanel"><div class="row g-3">';
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">ID</span><p class="nexus-font-semibold mb-0">' + esc(did) + "</p></div>";
        bodyHtml += '<div class="col-md-4">' + statusSelectEditHtml + "</div>";
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Creado</span><p class="mb-0 nexus-text-sm">' + esc(s.created_at || "—") + "</p></div>";
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Título</span><input type="text" id="story-detail-edit-title" class="form-control form-control-sm mt-1" value="' + esc(s.title || "") + '" placeholder="Título" aria-label="Título"></div>';
        bodyHtml += '<div class="col-md-4">' + prioritySelectHtml + "</div>";
        bodyHtml += '<div class="col-md-4"><span class="nexus-text-sm text-muted">Actualizado</span><p class="mb-0 nexus-text-sm">' + esc(s.updated_at || "—") + "</p></div>";
        bodyHtml += '<div class="col-md-4">' + assigneeSelectHtml + "</div>";
        bodyHtml += '<div class="col-md-4">' + sprintSelectHtml + "</div>";
        bodyHtml += '<div class="col-12"><span class="nexus-text-sm text-muted">Descripción</span><textarea id="story-detail-edit-desc" class="form-control form-control-sm mt-1" rows="3" placeholder="Descripción" aria-label="Descripción">' + esc(s.description || "") + "</textarea></div>";
        bodyHtml += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Criterios de aceptación</span>';
        bodyHtml += '<div id="story-detail-criteria-list">';
        var numCriteria = criteriaLines.length || 1;
        for (var i = 0; i < numCriteria; i++) {
          bodyHtml += '<div class="story-criterion-row d-flex gap-2 align-items-center mb-2"><input type="text" class="form-control form-control-sm story-detail-criteria-input" placeholder="Criterio ' + (i + 1) + '" value="' + esc(criteriaLines[i] || "") + '" aria-label="Criterio ' + (i + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm story-criterion-remove" aria-label="Quitar criterio">&times;</button></div>';
        }
        bodyHtml += '</div><div class="d-flex flex-wrap align-items-center gap-2 mt-2"><button type="button" id="story-detail-criteria-add" class="btn btn-outline-secondary btn-sm">+ Añadir criterio</button><button type="button" id="story-detail-criteria-save" class="btn btn-nexus-primary btn-sm">Guardar criterios</button><span id="story-detail-criteria-msg" class="nexus-text-sm text-muted"></span></div></div>';
        bodyHtml += '<div class="col-12 border-top pt-3 mt-2"><span class="nexus-text-sm text-muted d-block mb-2">Criterios de implementación</span>';
        bodyHtml += '<div id="story-detail-impl-criteria-list">';
        var numImplCriteria = implCriteriaLines.length || 1;
        for (var j = 0; j < numImplCriteria; j++) {
          bodyHtml += '<div class="story-impl-criterion-row d-flex gap-2 align-items-center mb-2"><input type="text" class="form-control form-control-sm story-detail-impl-criteria-input" placeholder="Criterio ' + (j + 1) + '" value="' + esc(implCriteriaLines[j] || "") + '" aria-label="Criterio ' + (j + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm story-impl-criterion-remove" aria-label="Quitar criterio">&times;</button></div>';
        }
        bodyHtml += '</div><div class="d-flex flex-wrap align-items-center gap-2 mt-2"><button type="button" id="story-detail-impl-criteria-add" class="btn btn-outline-secondary btn-sm">+ Añadir criterio</button><button type="button" id="story-detail-impl-criteria-save" class="btn btn-nexus-primary btn-sm">Guardar criterios</button><span id="story-detail-impl-criteria-msg" class="nexus-text-sm text-muted"></span></div></div>';
        bodyHtml += "</div></div>";
        bodyHtml += '<div class="tab-pane fade" id="story-detail-panel-evidencia" role="tabpanel"><div class="row g-3">';
        bodyHtml += '<div class="col-md-6"><span class="nexus-text-sm text-muted d-block mb-2">Edición</span><textarea id="story-detail-evidence-notes" class="form-control form-control-sm mb-2" rows="5" placeholder="Notas de evidencia...">' + esc(evidenceState.notes || "") + '</textarea><input type="file" id="story-detail-evidence-files" class="form-control form-control-sm mb-2" accept="image/*,video/*,.pdf,.doc,.docx,.txt" multiple><div id="story-detail-evidence-list"></div></div>';
        bodyHtml += '<div class="col-md-6"><span class="nexus-text-sm text-muted d-block mb-2">Previsualización</span><div id="story-detail-evidence-preview"></div></div>';
        bodyHtml += "</div></div>";
        bodyHtml += "</div>";
        bodyHtml += '<div class="mt-3 d-flex flex-wrap justify-content-start align-items-center gap-2">';
        bodyHtml += '<button type="button" id="story-detail-export" class="btn btn-outline-secondary btn-sm">Exportar</button>';
        bodyHtml += '<input type="file" id="story-detail-import-input" class="d-none" accept=".json,application/json">';
        bodyHtml += '<button type="button" id="story-detail-import" class="btn btn-outline-secondary btn-sm">Importar</button>';
        bodyHtml += "</div></div>";

        var initialTitle = (s.title || "").trim();
        var initialDesc = (s.description || "").trim();
        var initialPriority = s.priority || "MEDIUM";
        var initialAssigned = s.assigned_to || "";
        var baseCriteriaLines = criteriaLines.slice();
        var baseImplCriteriaLines = implCriteriaLines.slice();

        function getStoryCriteriaLines() {
          var inputs = document.querySelectorAll("#storyDetailModal .story-detail-criteria-input");
          var lines = [];
          if (inputs) for (var i = 0; i < inputs.length; i++) { var v = (inputs[i].value || "").trim(); if (v) lines.push(v); }
          return lines;
        }

        function getStoryImplementationCriteriaLines() {
          var inputs = document.querySelectorAll("#storyDetailModal .story-detail-impl-criteria-input");
          var lines = [];
          if (inputs) for (var i = 0; i < inputs.length; i++) { var v = (inputs[i].value || "").trim(); if (v) lines.push(v); }
          return lines;
        }

        function syncBaselineFromCurrent(currCrit, currImpl) {
          var titleEl = document.getElementById("story-detail-edit-title");
          var descEl = document.getElementById("story-detail-edit-desc");
          var prioritySel = document.getElementById("story-detail-edit-priority");
          var assignedSel = document.getElementById("story-detail-edit-assigned");
          initialTitle = (titleEl && titleEl.value || "").trim();
          initialDesc = (descEl && descEl.value || "").trim();
          initialPriority = prioritySel ? prioritySel.value : "MEDIUM";
          initialAssigned = assignedSel && assignedSel.value ? assignedSel.value : "";
          baseCriteriaLines = (currCrit || []).slice();
          baseImplCriteriaLines = (currImpl || []).slice();
          evidenceBaselineJson = JSON.stringify(getCurrentStoryEvidence());
        }

        function renderCriteriaListHtml(lines) {
          if (!lines || !lines.length) return '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
          var html = '<ul class="list-unstyled mb-0">';
          lines.forEach(function (line, idx) { html += '<li class="py-1">' + (idx + 1) + ". " + esc(line || "—") + "</li>"; });
          html += "</ul>";
          return html;
        }

        function refreshViewFromEdit() {
          var titleEl = document.getElementById("story-detail-edit-title");
          var descEl = document.getElementById("story-detail-edit-desc");
          var statusSel = document.getElementById("story-detail-status-edicion");
          var prioritySel = document.getElementById("story-detail-edit-priority");
          var assignedSel = document.getElementById("story-detail-edit-assigned");
          var sprintSel = document.getElementById("story-detail-sprint");

          var viewTitle = document.getElementById("story-detail-title-vista");
          var viewDesc = document.getElementById("story-detail-description-vista");
          var viewStatus = document.getElementById("story-detail-status-vista");
          var viewPriority = document.getElementById("story-detail-priority-vista");
          var viewAssignee = document.getElementById("story-detail-assignee-vista");
          var viewSprint = document.getElementById("story-detail-sprint-view");
          var viewCriteria = document.getElementById("story-detail-criteria-vista");
          var viewImplCriteria = document.getElementById("story-detail-impl-criteria-vista");

          if (viewTitle) viewTitle.textContent = (titleEl && titleEl.value || "").trim() || "—";
          if (viewStatus) viewStatus.textContent = (statusSel && statusSel.value || "").trim() || "—";
          if (viewPriority) viewPriority.textContent = (prioritySel && prioritySel.value || "").trim() || "—";
          if (viewAssignee) {
            var assignedText = "No asignado";
            if (assignedSel && assignedSel.value) {
              var selOpt = assignedSel.options[assignedSel.selectedIndex];
              assignedText = selOpt ? selOpt.textContent : assignedSel.value;
            }
            viewAssignee.textContent = assignedText;
          }
          if (viewSprint) {
            var sprintText = "Ninguno";
            if (sprintSel && sprintSel.value) {
              var sprintOpt = sprintSel.options[sprintSel.selectedIndex];
              sprintText = sprintOpt ? sprintOpt.textContent : "—";
            }
            viewSprint.textContent = sprintText;
          }
          if (viewDesc) {
            var desc = (descEl && descEl.value || "").trim();
            viewDesc.innerHTML = desc ? ('<p class="mb-0" style="white-space:pre-wrap">' + esc(desc) + "</p>") : '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
          }
          if (viewCriteria) viewCriteria.innerHTML = renderCriteriaListHtml(getStoryCriteriaLines());
          if (viewImplCriteria) viewImplCriteria.innerHTML = renderCriteriaListHtml(getStoryImplementationCriteriaLines());
        }

        function readFilesAsDataUrl(fileList) {
          var files = Array.prototype.slice.call(fileList || []);
          return Promise.all(files.map(function (file) {
            return new Promise(function (resolve) {
              var reader = new FileReader();
              reader.onload = function () { resolve({ name: file.name || "archivo", type: file.type || "application/octet-stream", data_url: reader.result }); };
              reader.onerror = function () { resolve(null); };
              reader.readAsDataURL(file);
            });
          })).then(function (rows) { return rows.filter(Boolean); });
        }

        function getCurrentStoryEvidence() {
          var notesEl = document.getElementById("story-detail-evidence-notes");
          return normalizeEvidencePayload({ notes: notesEl ? notesEl.value : "", files: evidenceState.files });
        }

        function renderStoryEvidencePane() {
          var listEl = document.getElementById("story-detail-evidence-list");
          var previewEl = document.getElementById("story-detail-evidence-preview");
          if (listEl) {
            if (!evidenceState.files.length) listEl.innerHTML = '<p class="mb-0 nexus-text-sm text-muted">Sin archivos adjuntos.</p>';
            else {
              var listHtml = '<ul class="list-unstyled mb-0">';
              evidenceState.files.forEach(function (file, idx) {
                listHtml += '<li class="d-flex justify-content-between align-items-center border rounded px-2 py-1 mb-2"><span class="nexus-text-sm text-truncate me-2">' + esc(file.name || ("Archivo " + (idx + 1))) + '</span><button type="button" class="btn btn-outline-danger btn-sm story-evidence-remove" data-evidence-index="' + idx + '">Quitar</button></li>';
              });
              listHtml += "</ul>";
              listEl.innerHTML = listHtml;
              listEl.querySelectorAll(".story-evidence-remove").forEach(function (btn) {
                btn.onclick = function () {
                  var index = parseInt(btn.getAttribute("data-evidence-index"), 10);
                  if (!isNaN(index)) evidenceState.files.splice(index, 1);
                  renderStoryEvidencePane();
                };
              });
            }
          }
          if (previewEl) {
            var preview = "";
            var notesText = (document.getElementById("story-detail-evidence-notes") && document.getElementById("story-detail-evidence-notes").value || "").trim();
            preview += '<div class="border rounded p-2 mb-2"><div class="nexus-text-sm text-muted mb-1">Notas</div>' + (notesText ? ('<div style="white-space:pre-wrap">' + esc(notesText) + '</div>') : '<div class="nexus-text-sm text-muted">Sin notas.</div>') + "</div>";
            if (!evidenceState.files.length) preview += '<p class="mb-0 nexus-text-sm text-muted">Sin previsualizaciones.</p>';
            else {
              evidenceState.files.forEach(function (file) {
                if (String(file.type || "").indexOf("image/") === 0) preview += '<img src="' + file.data_url + '" alt="' + esc(file.name || "evidencia") + '" class="img-fluid rounded border mb-2">';
                else if (String(file.type || "").indexOf("video/") === 0) preview += '<video src="' + file.data_url + '" controls class="w-100 rounded border mb-2" style="max-height:240px"></video>';
                else preview += '<div class="border rounded p-2 mb-2"><span class="nexus-text-sm">' + esc(file.name || "Archivo") + "</span></div>";
              });
            }
            previewEl.innerHTML = preview;
          }
        }

        function bindStoryEvidenceEvents() {
          var notesEl = document.getElementById("story-detail-evidence-notes");
          var filesEl = document.getElementById("story-detail-evidence-files");
          if (notesEl) notesEl.oninput = function () { renderStoryEvidencePane(); };
          if (filesEl) filesEl.onchange = function () {
            if (!(filesEl.files && filesEl.files.length)) return;
            readFilesAsDataUrl(filesEl.files).then(function (rows) {
              evidenceState.files = evidenceState.files.concat(rows);
              filesEl.value = "";
              renderStoryEvidencePane();
            });
          };
        }

        function doSaveStoryAll() {
          var title = (document.getElementById("story-detail-edit-title") && document.getElementById("story-detail-edit-title").value || "").trim();
          var desc = (document.getElementById("story-detail-edit-desc") && document.getElementById("story-detail-edit-desc").value || "").trim();
          var prioritySel = document.getElementById("story-detail-edit-priority");
          var assignedSel = document.getElementById("story-detail-edit-assigned");
          var priority = prioritySel ? prioritySel.value : "MEDIUM";
          var assignedTo = assignedSel && assignedSel.value ? assignedSel.value : null;
          if (!title) return Promise.resolve(false);
          var mainPromise = window.fetchApi("/stories/" + storyId, {
            method: "PATCH",
            body: JSON.stringify({ title: title, description: desc, priority: priority, assigned_to: assignedTo })
          }).then(function (r) {
            if (r && r.success) {
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Cambios guardados correctamente.");
              notifyUpdated();
            }
            return !!(r && r.success);
          });
          var currCrit = getStoryCriteriaLines();
          var critChanged = currCrit.length !== baseCriteriaLines.length;
          for (var i = 0; !critChanged && i < baseCriteriaLines.length; i++) if (currCrit[i] !== (baseCriteriaLines[i] || "").trim()) critChanged = true;
          var critPromise = critChanged
            ? window.fetchApi("/stories/" + storyId, { method: "PATCH", body: JSON.stringify({ acceptance_criteria: currCrit }) }).then(function (r) { return !!(r && r.success); })
            : Promise.resolve(true);
          var currImpl = getStoryImplementationCriteriaLines();
          var implChanged = currImpl.length !== baseImplCriteriaLines.length;
          for (var k = 0; !implChanged && k < baseImplCriteriaLines.length; k++) if (currImpl[k] !== (baseImplCriteriaLines[k] || "").trim()) implChanged = true;
          var implPromise = implChanged
            ? window.fetchApi("/stories/" + storyId, { method: "PATCH", body: JSON.stringify({ implementation_criteria: currImpl }) }).then(function (r) { return !!(r && r.success); })
            : Promise.resolve(true);
          return Promise.all([mainPromise, critPromise, implPromise]).then(function (x) {
            var ok = x[0] && x[1] && x[2];
            if (ok) {
              saveStoryEvidence(storyId, getCurrentStoryEvidence());
              syncBaselineFromCurrent(currCrit, currImpl);
              refreshViewFromEdit();
            }
            return ok;
          });
        }

        function getStoryDirtyState() {
          var titleEl = document.getElementById("story-detail-edit-title");
          var descEl = document.getElementById("story-detail-edit-desc");
          var prioritySel = document.getElementById("story-detail-edit-priority");
          var assignedSel = document.getElementById("story-detail-edit-assigned");
          if (!titleEl) return false;
          var t = (titleEl.value || "").trim();
          var d = (descEl && descEl.value || "").trim();
          var p = prioritySel ? prioritySel.value : "MEDIUM";
          var a = assignedSel && assignedSel.value ? assignedSel.value : "";
          if (t !== initialTitle || d !== initialDesc || p !== initialPriority || a !== initialAssigned) return true;
          var curr = getStoryCriteriaLines();
          if (curr.length !== baseCriteriaLines.length) return true;
          for (var i = 0; i < baseCriteriaLines.length; i++) if (curr[i] !== (baseCriteriaLines[i] || "").trim()) return true;
          var currImpl = getStoryImplementationCriteriaLines();
          if (currImpl.length !== baseImplCriteriaLines.length) return true;
          for (var k = 0; k < baseImplCriteriaLines.length; k++) if (currImpl[k] !== (baseImplCriteriaLines[k] || "").trim()) return true;
          if (JSON.stringify(getCurrentStoryEvidence()) !== evidenceBaselineJson) return true;
          return false;
        }

        window.openNexusFormModal({
          id: "storyDetailModal",
          title: "Detalle de la story",
          bodyHtml: bodyHtml,
          mode: "edit",
          primaryButtonId: "story-detail-close",
          primaryLabel: "Guardar",
          cancelButtonId: "story-detail-cancel",
          modalDialogClass: "nexus-modal-story-detail",
          getDirtyState: getStoryDirtyState,
          onSaveBeforeClose: doSaveStoryAll
        }, function () { doSaveStoryAll(); });

        var storyModal = document.getElementById("storyDetailModal");
        var storyFooter = storyModal ? storyModal.querySelector(".modal-footer") : null;
        var storyCancelBtn = document.getElementById("story-detail-cancel");
        var storyPrimaryBtn = document.getElementById("story-detail-close");
        var storyCloseXBtn = storyModal ? storyModal.querySelector(".nexus-form-modal-close-btn") : null;
        var storyBsModalInst = storyModal && typeof bootstrap !== "undefined" ? bootstrap.Modal.getInstance(storyModal) : null;

        function storyDoClose() { if (storyBsModalInst) storyBsModalInst.hide(); }
        function storySwitchToViewMode() {
          if (storyCancelBtn) storyCancelBtn.style.display = "none";
          if (storyPrimaryBtn) { storyPrimaryBtn.textContent = "Cerrar"; storyPrimaryBtn.onclick = function () { storyDoClose(); }; }
          if (storyCloseXBtn) storyCloseXBtn.onclick = function () { storyDoClose(); };
        }
        function storySwitchToEditMode() {
          if (storyCancelBtn) storyCancelBtn.style.display = "";
          if (storyPrimaryBtn) { storyPrimaryBtn.textContent = "Guardar"; storyPrimaryBtn.onclick = function () { doSaveStoryAll(); }; }
          if (storyCloseXBtn) storyCloseXBtn.onclick = function () {
            window.nexusFormModalCloseAttempt({ modalEl: storyModal, getDirtyState: getStoryDirtyState, onSaveBeforeClose: doSaveStoryAll }, storyDoClose);
          };
        }

        if (storyModal) {
          storyModal.addEventListener("shown.bs.modal", function () { storySwitchToViewMode(); });
          var storyTabVista = document.getElementById("story-detail-tab-vista");
          var storyTabEdicion = document.getElementById("story-detail-tab-edicion");
          var storyTabEvidencia = document.getElementById("story-detail-tab-evidencia");
          if (storyTabVista) storyTabVista.addEventListener("shown.bs.tab", storySwitchToViewMode);
          if (storyTabEdicion) storyTabEdicion.addEventListener("shown.bs.tab", storySwitchToEditMode);
          if (storyTabEvidencia) storyTabEvidencia.addEventListener("shown.bs.tab", storySwitchToEditMode);
          setTimeout(function () { storySwitchToViewMode(); }, 0);
        }

        var criteriaList = document.getElementById("story-detail-criteria-list");
        var addCriteriaBtn = document.getElementById("story-detail-criteria-add");
        if (addCriteriaBtn && criteriaList) {
          addCriteriaBtn.onclick = function () {
            var rows = criteriaList.querySelectorAll(".story-criterion-row");
            var n = rows.length + 1;
            var row = document.createElement("div");
            row.className = "story-criterion-row d-flex gap-2 align-items-center mb-2";
            row.innerHTML = '<input type="text" class="form-control form-control-sm story-detail-criteria-input" placeholder="Criterio ' + n + '" aria-label="Criterio ' + n + '"><button type="button" class="btn btn-outline-secondary btn-sm story-criterion-remove" aria-label="Quitar criterio">&times;</button>';
            criteriaList.appendChild(row);
            row.querySelector(".story-criterion-remove").onclick = function () { if (criteriaList.querySelectorAll(".story-criterion-row").length > 1) row.remove(); };
          };
        }
        document.querySelectorAll("#storyDetailModal .story-criterion-remove").forEach(function (btn) {
          btn.onclick = function () {
            var row = btn.closest(".story-criterion-row");
            if (row && criteriaList && criteriaList.querySelectorAll(".story-criterion-row").length > 1) row.remove();
          };
        });
        var criteriaSaveBtn = document.getElementById("story-detail-criteria-save");
        if (criteriaSaveBtn) criteriaSaveBtn.onclick = function () {
          var inputs = document.querySelectorAll("#storyDetailModal .story-detail-criteria-input");
          var msgEl = document.getElementById("story-detail-criteria-msg");
          var lines = [];
          if (inputs && inputs.length) for (var i = 0; i < inputs.length; i++) { var v = (inputs[i].value || "").trim(); if (v) lines.push(v); }
          if (msgEl) msgEl.textContent = "Guardando...";
          window.fetchApi("/stories/" + storyId, { method: "PATCH", body: JSON.stringify({ acceptance_criteria: lines }) }).then(function (r) {
            if (msgEl) msgEl.textContent = (r && r.success) ? "Guardado" : ((r && r.error && r.error.message) || "Error");
            if (r && r.success && typeof window.showSuccessMessage === "function") window.showSuccessMessage("Criterios guardados correctamente.");
            if (r && r.success) {
              baseCriteriaLines = lines.slice();
              refreshViewFromEdit();
              notifyUpdated();
            }
          });
        };

        var implCriteriaList = document.getElementById("story-detail-impl-criteria-list");
        var addImplCriteriaBtn = document.getElementById("story-detail-impl-criteria-add");
        if (addImplCriteriaBtn && implCriteriaList) {
          addImplCriteriaBtn.onclick = function () {
            var rows = implCriteriaList.querySelectorAll(".story-impl-criterion-row");
            var n = rows.length + 1;
            var row = document.createElement("div");
            row.className = "story-impl-criterion-row d-flex gap-2 align-items-center mb-2";
            row.innerHTML = '<input type="text" class="form-control form-control-sm story-detail-impl-criteria-input" placeholder="Criterio ' + n + '" aria-label="Criterio ' + n + '"><button type="button" class="btn btn-outline-secondary btn-sm story-impl-criterion-remove" aria-label="Quitar criterio">&times;</button>';
            implCriteriaList.appendChild(row);
            row.querySelector(".story-impl-criterion-remove").onclick = function () { if (implCriteriaList.querySelectorAll(".story-impl-criterion-row").length > 1) row.remove(); };
          };
        }
        document.querySelectorAll("#storyDetailModal .story-impl-criterion-remove").forEach(function (btn) {
          btn.onclick = function () {
            var row = btn.closest(".story-impl-criterion-row");
            if (row && implCriteriaList && implCriteriaList.querySelectorAll(".story-impl-criterion-row").length > 1) row.remove();
          };
        });
        var implCriteriaSaveBtn = document.getElementById("story-detail-impl-criteria-save");
        if (implCriteriaSaveBtn) implCriteriaSaveBtn.onclick = function () {
          var inputs = document.querySelectorAll("#storyDetailModal .story-detail-impl-criteria-input");
          var msgEl = document.getElementById("story-detail-impl-criteria-msg");
          var lines = [];
          if (inputs && inputs.length) for (var i = 0; i < inputs.length; i++) { var v = (inputs[i].value || "").trim(); if (v) lines.push(v); }
          if (msgEl) msgEl.textContent = "Guardando...";
          window.fetchApi("/stories/" + storyId, { method: "PATCH", body: JSON.stringify({ implementation_criteria: lines }) }).then(function (r) {
            if (msgEl) msgEl.textContent = (r && r.success) ? "Guardado" : ((r && r.error && r.error.message) || "Error");
            if (r && r.success && typeof window.showSuccessMessage === "function") window.showSuccessMessage("Criterios de implementación guardados correctamente.");
            if (r && r.success) {
              baseImplCriteriaLines = lines.slice();
              refreshViewFromEdit();
              notifyUpdated();
            }
          });
        };

        var storyExportBtn = document.getElementById("story-detail-export");
        if (storyExportBtn) storyExportBtn.onclick = function () {
          function getAllStoryCriteriaLines(selector) {
            var inputs = document.querySelectorAll("#storyDetailModal " + selector);
            var lines = [];
            if (inputs) for (var i = 0; i < inputs.length; i++) lines.push((inputs[i].value || "").trim());
            return lines.length ? lines : [""];
          }
          var data = {
            title: (document.getElementById("story-detail-edit-title") && document.getElementById("story-detail-edit-title").value) || "",
            description: (document.getElementById("story-detail-edit-desc") && document.getElementById("story-detail-edit-desc").value) || "",
            status: (document.getElementById("story-detail-status-edicion") && document.getElementById("story-detail-status-edicion").value) || "DRAFT",
            priority: (document.getElementById("story-detail-edit-priority") && document.getElementById("story-detail-edit-priority").value) || "MEDIUM",
            assigned_to: (document.getElementById("story-detail-edit-assigned") && document.getElementById("story-detail-edit-assigned").value) || null,
            sprint_id: (document.getElementById("story-detail-sprint") && document.getElementById("story-detail-sprint").value) || null,
            acceptance_criteria: getAllStoryCriteriaLines(".story-detail-criteria-input"),
            implementation_criteria: getAllStoryCriteriaLines(".story-detail-impl-criteria-input"),
            evidence: getCurrentStoryEvidence()
          };
          var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "story-us-" + (did || storyId) + "-config.json";
          a.click();
          URL.revokeObjectURL(a.href);
        };
        var storyImportInput = document.getElementById("story-detail-import-input");
        var storyImportBtn = document.getElementById("story-detail-import");
        if (storyImportBtn && storyImportInput) storyImportBtn.onclick = function () { storyImportInput.click(); };
        if (storyImportInput) storyImportInput.onchange = function () {
          var file = storyImportInput.files && storyImportInput.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function () {
            try {
              var data = JSON.parse(reader.result);
              var titleEl = document.getElementById("story-detail-edit-title");
              var descEl = document.getElementById("story-detail-edit-desc");
              var statusSel = document.getElementById("story-detail-status-edicion");
              var prioritySel = document.getElementById("story-detail-edit-priority");
              var assignedSel = document.getElementById("story-detail-edit-assigned");
              var sprintSel = document.getElementById("story-detail-sprint");
              var notesEl = document.getElementById("story-detail-evidence-notes");
              if (titleEl && data.title !== undefined) titleEl.value = data.title || "";
              if (descEl && data.description !== undefined) descEl.value = data.description || "";
              if (statusSel && data.status) statusSel.value = data.status;
              if (prioritySel && data.priority) prioritySel.value = data.priority;
              if (assignedSel && data.assigned_to !== undefined) assignedSel.value = data.assigned_to || "";
              if (sprintSel && data.sprint_id !== undefined) sprintSel.value = data.sprint_id || "";
              if (data.evidence) evidenceState = normalizeEvidencePayload(data.evidence);
              if (notesEl) notesEl.value = evidenceState.notes || "";
              if (data.acceptance_criteria && Array.isArray(data.acceptance_criteria)) {
                var list = document.getElementById("story-detail-criteria-list");
                if (list) {
                  list.innerHTML = "";
                  var items = data.acceptance_criteria.length ? data.acceptance_criteria : [""];
                  items.forEach(function (val, idx) {
                    var row = document.createElement("div");
                    row.className = "story-criterion-row d-flex gap-2 align-items-center mb-2";
                    row.innerHTML = '<input type="text" class="form-control form-control-sm story-detail-criteria-input" placeholder="Criterio ' + (idx + 1) + '" value="' + esc(String(val || "")) + '" aria-label="Criterio ' + (idx + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm story-criterion-remove" aria-label="Quitar criterio">&times;</button>';
                    list.appendChild(row);
                  });
                  list.querySelectorAll(".story-criterion-remove").forEach(function (btn) {
                    btn.onclick = function () {
                      var row = btn.closest(".story-criterion-row");
                      if (row && list.querySelectorAll(".story-criterion-row").length > 1) row.remove();
                    };
                  });
                }
              }
              if (data.implementation_criteria && Array.isArray(data.implementation_criteria)) {
                var implList = document.getElementById("story-detail-impl-criteria-list");
                if (implList) {
                  implList.innerHTML = "";
                  var implItems = data.implementation_criteria.length ? data.implementation_criteria : [""];
                  implItems.forEach(function (val, idx) {
                    var row = document.createElement("div");
                    row.className = "story-impl-criterion-row d-flex gap-2 align-items-center mb-2";
                    row.innerHTML = '<input type="text" class="form-control form-control-sm story-detail-impl-criteria-input" placeholder="Criterio ' + (idx + 1) + '" value="' + esc(String(val || "")) + '" aria-label="Criterio ' + (idx + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm story-impl-criterion-remove" aria-label="Quitar criterio">&times;</button>';
                    implList.appendChild(row);
                  });
                  implList.querySelectorAll(".story-impl-criterion-remove").forEach(function (btn) {
                    btn.onclick = function () {
                      var row = btn.closest(".story-impl-criterion-row");
                      if (row && implList.querySelectorAll(".story-impl-criterion-row").length > 1) row.remove();
                    };
                  });
                }
              }
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Configuración importada correctamente.");
              refreshViewFromEdit();
              bindStoryEvidenceEvents();
              renderStoryEvidencePane();
              document.getElementById("story-detail-tab-edicion").click();
            } catch (e) {
              if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "El archivo no es un JSON válido." });
            }
            storyImportInput.value = "";
          };
          reader.readAsText(file);
        };

        if (storyFooter) {
          storyFooter.querySelectorAll(".nexus-story-modal-stories-link").forEach(function (el) { el.remove(); });
          if (includeStoriesLink) {
            var storiesLinkEl = document.createElement("a");
            storiesLinkEl.href = "#/stories?feature=" + encodeURIComponent(s.feature_id || "");
            storiesLinkEl.className = "btn btn-nexus-secondary btn-sm me-2 nexus-story-modal-stories-link";
            storiesLinkEl.textContent = "Ir al módulo Stories";
            storiesLinkEl.onclick = function (e) {
              e.preventDefault();
              storyDoClose();
              setTimeout(function () {
                window.location.hash = "#/stories?feature=" + encodeURIComponent(s.feature_id || "");
              }, 150);
            };
            storyFooter.insertBefore(storiesLinkEl, storyCancelBtn || storyFooter.firstChild);
          }
        }

        var sprintsRes = results[1];
        var rawSprints = (sprintsRes && sprintsRes.success && sprintsRes.data) ? sprintsRes.data : null;
        var sprintsList = Array.isArray(rawSprints) ? rawSprints : (rawSprints && rawSprints.items) ? rawSprints.items : (rawSprints && rawSprints.data) ? rawSprints.data : [];
        var sel = document.getElementById("story-detail-sprint");
        var msgEl = document.getElementById("story-detail-sprint-msg");
        if (sel) {
          sel.innerHTML = '<option value="">Ninguno</option>';
          sprintsList.forEach(function (sp) {
            var opt = document.createElement("option");
            opt.value = sp.id || "";
            opt.textContent = sp.name || sp.id || "";
            if ((s.sprint_id && sp.id === s.sprint_id) || (s.sprint && sp.id === s.sprint.id)) opt.selected = true;
            sel.appendChild(opt);
          });
          sel.onchange = function () {
            var val = sel.value || null;
            if (msgEl) msgEl.textContent = "Guardando…";
            window.fetchApi("/stories/" + storyId + "/sprint", { method: "PATCH", body: JSON.stringify({ sprint_id: val }) }).then(function (r) {
              if (msgEl) msgEl.textContent = (r && r.success) ? "Guardado" : ((r && r.error && r.error.message) || "Error");
              if (r && r.success) {
                refreshViewFromEdit();
                notifyUpdated();
              }
            });
          };
        }

        var statusEdicion = document.getElementById("story-detail-status-edicion");
        if (statusEdicion) {
          statusEdicion.onchange = function () {
            var val = (statusEdicion.value || "").trim();
            if (!val) return;
            window.fetchApi("/stories/" + storyId + "/status", { method: "PATCH", body: JSON.stringify({ status: val }) }).then(function (r) {
              if (r && r.success) {
                if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Estado actualizado correctamente.");
                refreshViewFromEdit();
                notifyUpdated();
              } else if (typeof window.openNexusAlertModal === "function") {
                window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "Error al cambiar estado." });
              }
            });
          };
        }

        var assignedSel = document.getElementById("story-detail-edit-assigned");
        if (assignedSel) {
          assignedSel.onchange = function () {
            var userId = assignedSel.value || null;
            window.fetchApi("/stories/" + storyId + "/assign", { method: "PATCH", body: JSON.stringify({ assigned_to: userId }) }).then(function (r) {
              if (r && r.success) {
                refreshViewFromEdit();
                notifyUpdated();
              }
            });
          };
        }
        bindStoryEvidenceEvents();
        renderStoryEvidencePane();
      });
    });
  };
})();
