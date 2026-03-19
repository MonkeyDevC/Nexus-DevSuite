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

  function createEvidenceRef() {
    return "img-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function buildEvidenceRefTag(ref) {
    return "<evidence://" + String(ref || "") + ">";
  }

  function insertTextAtCursor(el, text) {
    if (!el) return;
    var start = typeof el.selectionStart === "number" ? el.selectionStart : el.value.length;
    var end = typeof el.selectionEnd === "number" ? el.selectionEnd : el.value.length;
    var before = el.value.slice(0, start);
    var after = el.value.slice(end);
    el.value = before + text + after;
    var nextPos = start + text.length;
    if (typeof el.setSelectionRange === "function") el.setSelectionRange(nextPos, nextPos);
  }

  function normalizeEvidencePayload(payload) {
    var p = payload && typeof payload === "object" ? payload : {};
    return {
      notes: p.notes != null ? String(p.notes) : "",
      files: Array.isArray(p.files) ? p.files.filter(function (f) { return f && f.data_url; }).map(function (f) {
        return {
          ref: f.ref ? String(f.ref) : createEvidenceRef(),
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

    if (window.targetStackManager) {
      window.targetStackManager.openTarget("story", storyId, {
        projectId: opts.projectIdHint || null
      });
    }

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

        var assigneeSelectHtml = '<label class="editor-label" for="story-detail-edit-assigned">Asignado a</label><select id="story-detail-edit-assigned" class="form-select form-select-sm form-modern-input" style="max-width:100%"><option value="">Nadie (sin asignar)</option>';
        usersForEdit.forEach(function (u) {
          var uid = (u.id || "").replace(/"/g, "&quot;");
          var label = (u.name && String(u.name).trim()) ? esc(u.name) : (u.email ? esc(u.email) : "Sin nombre");
          var sel = (s.assigned_to && u.id === s.assigned_to) ? " selected" : "";
          assigneeSelectHtml += "<option value=\"" + uid + "\"" + sel + ">" + label + "</option>";
        });
        assigneeSelectHtml += "</select>";

        var priorityOpts = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
        var prioritySelectHtml = '<label class="editor-label" for="story-detail-edit-priority">Prioridad</label><select id="story-detail-edit-priority" class="form-select form-select-sm form-modern-input" style="max-width:100%">';
        priorityOpts.forEach(function (pr) {
          var sel = (s.priority || "MEDIUM") === pr ? " selected" : "";
          prioritySelectHtml += "<option value=\"" + esc(pr) + "\"" + sel + ">" + esc(pr) + "</option>";
        });
        prioritySelectHtml += "</select>";

        var statusSelectEditHtml = '<label class="editor-label" for="story-detail-status-edicion">Estado</label><select id="story-detail-status-edicion" class="form-select form-select-sm form-modern-input" style="max-width:100%" aria-label="Estado"><option value="">—</option>';
        storyStatuses.forEach(function (st) {
          statusSelectEditHtml += '<option value="' + esc(st) + '"' + (s.status === st ? " selected" : "") + ">" + esc(st) + "</option>";
        });
        statusSelectEditHtml += "</select>";

        var sprintSelectHtml = '<label class="editor-label" for="story-detail-sprint">Sprint</label><div class="d-flex align-items-center gap-2"><select id="story-detail-sprint" class="form-select form-select-sm form-modern-input" style="max-width:100%"><option value="">Ninguno</option></select><span id="story-detail-sprint-msg" class="nexus-text-sm text-muted"></span></div>';

        var storyBreadcrumbs = window.renderBreadcrumbs([
          { label: "Panel", href: "#/dashboard" },
          { label: "Stories", href: "#/stories" }
        ]);
        var bodyHtml = storyBreadcrumbs;
        bodyHtml += '<h1 class="nexus-page-title">' + esc(s.title || "Story") + "</h1>";
        bodyHtml += '<div class="nexus-card p-4" style="max-width:100%">';
        bodyHtml += '<div class="view-mode-switch mb-3" role="tablist" aria-label="Modo de vista"><button type="button" class="mode-btn nav-link active tooltip" id="story-detail-tab-vista" data-bs-toggle="tab" data-bs-target="#story-detail-panel-vista" aria-selected="true" data-tooltip="Modo vista"><i data-lucide="eye"></i> Vista</button><button type="button" class="mode-btn nav-link tooltip" id="story-detail-tab-edicion" data-bs-toggle="tab" data-bs-target="#story-detail-panel-edicion" aria-selected="false" data-tooltip="Modo edición"><i data-lucide="pencil"></i> Edición</button><button type="button" class="mode-btn nav-link tooltip" id="story-detail-tab-evidencia" data-bs-toggle="tab" data-bs-target="#story-detail-panel-evidencia" aria-selected="false" data-tooltip="Modo evidencia"><i data-lucide="paperclip"></i> Evidencia</button></div>';
        bodyHtml += '<div class="tab-content">';
        bodyHtml += '<div class="tab-pane fade show active" id="story-detail-panel-vista" role="tabpanel"><div class="entity-viewer">';
        bodyHtml += '<section class="viewer-header"><h2 class="viewer-title" id="story-detail-title-vista">' + esc(s.title || "—") + "</h2></section>";
        bodyHtml += '<section class="viewer-metadata">';
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">ID</div><div class="metadata-value">' + esc(did) + "</div></div>";
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">Estado</div><div class="metadata-value" id="story-detail-status-vista">' + esc(s.status || "—") + "</div></div>";
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">Creado</div><div class="metadata-value">' + esc(s.created_at || "—") + "</div></div>";
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">Prioridad</div><div class="metadata-value" id="story-detail-priority-vista">' + esc(s.priority || "—") + "</div></div>";
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">Actualizado</div><div class="metadata-value">' + esc(s.updated_at || "—") + "</div></div>";
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">Asignado a</div><div class="metadata-value" id="story-detail-assignee-vista">' + esc(assigneeText) + "</div></div>";
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">Sprint</div><div class="metadata-value" id="story-detail-sprint-view">' + esc(sprintNameView) + "</div></div>";
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">Story points</div><div class="metadata-value" id="story-detail-points-vista">' + (s.story_points != null ? s.story_points : "—") + "</div></div>";
        var labelsArr = Array.isArray(s.labels) ? s.labels : (s.labels ? [s.labels] : []);
        bodyHtml += '<div class="metadata-card"><div class="metadata-label">Etiquetas</div><div class="metadata-value" id="story-detail-labels-vista">' + (labelsArr.length ? esc(labelsArr.join(", ")) : "—") + "</div></div>";
        bodyHtml += "</section>";
        bodyHtml += '<section class="viewer-section"><div class="viewer-section-title">Descripción</div><div id="story-detail-description-vista">' + ((s.description && String(s.description).trim()) ? '<p class="viewer-description-text">' + esc(s.description) + "</p>" : '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>') + "</div></section>";
        bodyHtml += '<section class="viewer-section"><div class="viewer-section-title">Criterios de aceptación</div><div id="story-detail-criteria-vista">' + renderCriteriaListHtml(criteriaLines) + "</div></section>";
        bodyHtml += '<section class="viewer-section"><div class="viewer-section-title">Criterios de implementación</div><div id="story-detail-impl-criteria-vista">' + renderCriteriaListHtml(implCriteriaLines) + "</div></section>";
        bodyHtml += "</div></div>";

        bodyHtml += '<div class="tab-pane fade" id="story-detail-panel-edicion" role="tabpanel"><div class="entity-editor">';
        bodyHtml += '<section class="editor-section"><div class="editor-section-title">General</div><label class="editor-label" for="story-detail-edit-title">Título</label><input type="text" id="story-detail-edit-title" class="form-control form-control-sm form-modern-input editor-title-input" value="' + esc(s.title || "") + '" placeholder="Título" aria-label="Título"></section>';
        bodyHtml += '<section class="editor-section"><div class="editor-section-title">Metadata</div><div class="metadata-grid">';
        bodyHtml += '<div><span class="editor-label">ID</span><div class="editor-meta-value">' + esc(did) + "</div></div>";
        bodyHtml += '<div>' + statusSelectEditHtml + "</div>";
        bodyHtml += '<div><span class="editor-label">Creado</span><div class="editor-meta-value">' + esc(s.created_at || "—") + "</div></div>";
        bodyHtml += '<div>' + prioritySelectHtml + "</div>";
        bodyHtml += '<div><span class="editor-label">Actualizado</span><div class="editor-meta-value">' + esc(s.updated_at || "—") + "</div></div>";
        bodyHtml += '<div>' + assigneeSelectHtml + "</div>";
        bodyHtml += '<div>' + sprintSelectHtml + "</div>";
        var storyPointsOpts = [1, 2, 3, 5, 8, 13, 21];
        var storyPointsSelectHtml = '<label class="editor-label" for="story-detail-edit-points">Story points</label><select id="story-detail-edit-points" class="form-select form-select-sm form-modern-input" style="max-width:100%"><option value="">—</option>';
        storyPointsOpts.forEach(function (pt) {
          var sel = (s.story_points != null && Number(s.story_points) === pt) ? " selected" : "";
          storyPointsSelectHtml += "<option value=\"" + pt + "\"" + sel + ">" + pt + "</option>";
        });
        storyPointsSelectHtml += "</select>";
        var labelsVal = Array.isArray(s.labels) ? (s.labels || []).join(", ") : (s.labels ? String(s.labels) : "");
        bodyHtml += '<div>' + storyPointsSelectHtml + "</div>";
        bodyHtml += '<div class="mt-2"><label class="editor-label" for="story-detail-edit-labels">Etiquetas</label><input type="text" id="story-detail-edit-labels" class="form-control form-control-sm form-modern-input" value="' + esc(labelsVal) + '" placeholder="ej: api, frontend (separadas por coma)" aria-label="Etiquetas"></div>';
        bodyHtml += "</div></section>";
        bodyHtml += '<section class="editor-section"><div class="editor-section-title">Descripción</div><textarea id="story-detail-edit-desc" class="form-control form-control-sm form-modern-input description-editor" rows="3" placeholder="Descripción" aria-label="Descripción">' + esc(s.description || "") + "</textarea></section>";
        bodyHtml += '<section class="editor-section"><div class="editor-section-title">Criterios de aceptación</div>';
        bodyHtml += '<div id="story-detail-criteria-list">';
        var numCriteria = criteriaLines.length || 1;
        for (var i = 0; i < numCriteria; i++) {
          bodyHtml += '<div class="story-criterion-row criteria-item"><input type="text" class="form-control form-control-sm form-modern-input story-detail-criteria-input" placeholder="Criterio ' + (i + 1) + '" value="' + esc(criteriaLines[i] || "") + '" aria-label="Criterio ' + (i + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm story-criterion-remove criteria-remove-btn tooltip" aria-label="Quitar criterio" data-tooltip="Quitar criterio"><i data-lucide="x"></i></button></div>';
        }
        bodyHtml += '</div><div class="d-flex flex-wrap align-items-center gap-2 mt-2"><button type="button" id="story-detail-criteria-add" class="btn btn-outline-secondary btn-sm btn-add tooltip" data-tooltip="Añadir criterio"><i data-lucide="plus"></i> Añadir criterio</button><button type="button" id="story-detail-criteria-save" class="btn btn-nexus-primary btn-sm tooltip" data-tooltip="Guardar criterios"><i data-lucide="save"></i> Guardar criterios</button><span id="story-detail-criteria-msg" class="nexus-text-sm text-muted"></span></div></section>';
        bodyHtml += '<section class="editor-section"><div class="editor-section-title">Criterios de implementación</div>';
        bodyHtml += '<div id="story-detail-impl-criteria-list">';
        var numImplCriteria = implCriteriaLines.length || 1;
        for (var j = 0; j < numImplCriteria; j++) {
          bodyHtml += '<div class="story-impl-criterion-row criteria-item"><input type="text" class="form-control form-control-sm form-modern-input story-detail-impl-criteria-input" placeholder="Criterio ' + (j + 1) + '" value="' + esc(implCriteriaLines[j] || "") + '" aria-label="Criterio ' + (j + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm story-impl-criterion-remove criteria-remove-btn tooltip" aria-label="Quitar criterio" data-tooltip="Quitar criterio"><i data-lucide="x"></i></button></div>';
        }
        bodyHtml += '</div><div class="d-flex flex-wrap align-items-center gap-2 mt-2"><button type="button" id="story-detail-impl-criteria-add" class="btn btn-outline-secondary btn-sm btn-add tooltip" data-tooltip="Añadir criterio"><i data-lucide="plus"></i> Añadir criterio</button><button type="button" id="story-detail-impl-criteria-save" class="btn btn-nexus-primary btn-sm tooltip" data-tooltip="Guardar criterios"><i data-lucide="save"></i> Guardar criterios</button><span id="story-detail-impl-criteria-msg" class="nexus-text-sm text-muted"></span></div></section>';
        bodyHtml += "</div></div>";
        bodyHtml += '<div class="tab-pane fade" id="story-detail-panel-evidencia" role="tabpanel">';
        bodyHtml += '<div class="evidence-container" id="story-detail-evidence-container" data-evidence-mode="split">';
        bodyHtml += '<div class="evidence-fullscreen-layout-controls mb-2">';
        bodyHtml += '<button type="button" data-evidence-layout="left" class="btn btn-outline-secondary btn-sm tooltip" data-tooltip="Solo editor"><i data-lucide="pencil"></i> Editor</button>';
        bodyHtml += '<button type="button" data-evidence-layout="right" class="btn btn-outline-secondary btn-sm tooltip" data-tooltip="Solo vista previa"><i data-lucide="eye"></i> Preview</button>';
        bodyHtml += '<button type="button" data-evidence-layout="split" class="btn btn-outline-secondary btn-sm tooltip" data-tooltip="Vista dividida"><i data-lucide="columns"></i> Split</button>';
        bodyHtml += '<button type="button" class="btn btn-outline-secondary btn-sm btn-evidence-fullscreen-global ms-auto tooltip" aria-label="Ver en pantalla completa" data-tooltip="Pantalla completa"><i data-lucide="maximize"></i> Pantalla completa</button>';
        bodyHtml += "</div>";
        bodyHtml += '<div class="evidence-body evidence-split-layout" style="height:320px;">';
        bodyHtml += '<div class="evidence-col" id="story-detail-evidence-left-col" data-evidence-role="left-col"><div class="evidence-panel"><div class="evidence-panel-header">Edición</div><div class="evidence-panel-body evidence-content"><textarea id="story-detail-evidence-notes" class="form-control form-control-sm border-0 shadow-none p-0 m-0 bg-transparent" rows="6" placeholder="Notas de evidencia..." style="min-height:100%; height:100%; resize:none; overflow-y:auto;">' + esc(evidenceState.notes || "") + '</textarea></div></div></div>';
        bodyHtml += '<div class="split-resizer" data-evidence-role="resizer" aria-hidden="true"></div>';
        bodyHtml += '<div class="evidence-col" id="story-detail-evidence-right-col" data-evidence-role="right-col"><div class="evidence-panel"><div class="evidence-panel-header">Visualización</div><div class="evidence-panel-body evidence-content"><div id="story-detail-evidence-preview"></div></div></div></div>';
        bodyHtml += "</div></div></div>";
        bodyHtml += "</div>";
        bodyHtml += '<div class="mt-3 d-flex flex-wrap justify-content-start align-items-center gap-2" id="story-detail-transfer-actions">';
        bodyHtml += '<button type="button" id="story-detail-export" class="btn btn-outline-secondary btn-sm tooltip" data-tooltip="Exportar evidencia"><i data-lucide="download"></i> Exportar</button>';
        bodyHtml += '<input type="file" id="story-detail-import-input" class="d-none" accept=".json,application/json">';
        bodyHtml += '<button type="button" id="story-detail-import" class="btn btn-outline-secondary btn-sm tooltip" data-tooltip="Importar evidencia"><i data-lucide="upload"></i> Importar</button>';
        bodyHtml += "</div></div>";

        var initialTitle = (s.title || "").trim();
        var initialDesc = (s.description || "").trim();
        var initialPriority = s.priority || "MEDIUM";
        var initialAssigned = s.assigned_to || "";
        var initialStoryPoints = s.story_points != null ? s.story_points : null;
        var initialLabelsArr = Array.isArray(s.labels) ? s.labels : (s.labels ? [s.labels] : []);
        var initialLabelsStr = initialLabelsArr.join(", ");
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
          var ptsEl = document.getElementById("story-detail-edit-points");
          var lblEl = document.getElementById("story-detail-edit-labels");
          initialStoryPoints = (ptsEl && ptsEl.value) ? parseInt(ptsEl.value, 10) : null;
          initialLabelsStr = (lblEl && lblEl.value) ? lblEl.value.trim() : "";
          baseCriteriaLines = (currCrit || []).slice();
          baseImplCriteriaLines = (currImpl || []).slice();
          evidenceBaselineJson = JSON.stringify(getCurrentStoryEvidence());
        }

        function renderCriteriaListHtml(lines) {
          if (!lines || !lines.length) return '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
          var html = '<ol class="criteria-list criteria-list-numbered">';
          lines.forEach(function (line) { html += "<li>" + esc(line || "—") + "</li>"; });
          html += "</ol>";
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
          var pointsEl = document.getElementById("story-detail-edit-points");
          var labelsEl = document.getElementById("story-detail-edit-labels");
          var viewPoints = document.getElementById("story-detail-points-vista");
          var viewLabels = document.getElementById("story-detail-labels-vista");
          if (viewPoints) viewPoints.textContent = (pointsEl && pointsEl.value) ? pointsEl.value : "—";
          if (viewLabels) viewLabels.textContent = (labelsEl && labelsEl.value && labelsEl.value.trim()) ? labelsEl.value.trim() : "—";
          if (viewDesc) {
            var desc = (descEl && descEl.value || "").trim();
            viewDesc.innerHTML = desc ? ('<p class="viewer-description-text">' + esc(desc) + "</p>") : '<p class="mb-0 nexus-text-sm text-muted">Ninguno</p>';
          }
          if (viewCriteria) viewCriteria.innerHTML = renderCriteriaListHtml(getStoryCriteriaLines());
          if (viewImplCriteria) viewImplCriteria.innerHTML = renderCriteriaListHtml(getStoryImplementationCriteriaLines());
        }

        function readFilesAsDataUrl(fileList) {
          var files = Array.prototype.slice.call(fileList || []);
          return Promise.all(files.map(function (file) {
            return new Promise(function (resolve) {
              var reader = new FileReader();
              reader.onload = function () {
                resolve({
                  ref: createEvidenceRef(),
                  name: file.name || "archivo",
                  type: file.type || "application/octet-stream",
                  data_url: reader.result
                });
              };
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
          var previewEl = document.getElementById("story-detail-evidence-preview");
          if (previewEl) {
            var preview = "";
            var notesText = (document.getElementById("story-detail-evidence-notes") && document.getElementById("story-detail-evidence-notes").value || "").trim();
            var filesByRef = {};
            var filesByName = {};
            evidenceState.files.forEach(function (file) {
              if (file && file.ref) filesByRef[String(file.ref)] = file;
              if (file && file.name) filesByName[String(file.name)] = file;
            });
            function renderNotesWithInlineImages(text) {
              if (!text) return '<div class="nexus-text-sm text-muted">Sin notas.</div>';
              var pattern = /<([^>\n]+)>/g;
              var html = "";
              var last = 0;
              var m;
              while ((m = pattern.exec(text)) !== null) {
                var segment = text.slice(last, m.index);
                if (segment) html += esc(segment).replace(/\n/g, "<br>");
                var token = (m[1] || "").trim();
                var ref = token.indexOf("evidence://") === 0 ? token.slice("evidence://".length) : token;
                var file = filesByRef[ref] || filesByName[ref];
                if (file && String(file.type || "").indexOf("image/") === 0) {
                  html += '<div class="my-2"><img src="' + file.data_url + '" alt="' + esc(file.name || "evidencia") + '" class="img-fluid rounded border"></div>';
                } else {
                  html += esc(m[0]);
                }
                last = pattern.lastIndex;
              }
              var tail = text.slice(last);
              if (tail) html += esc(tail).replace(/\n/g, "<br>");
              return html || '<div class="nexus-text-sm text-muted">Sin notas.</div>';
            }
            preview += '<div style="white-space:normal">' + renderNotesWithInlineImages(notesText) + "</div>";
            previewEl.innerHTML = preview;
          }
        }

        function bindStoryEvidenceEvents() {
          var notesEl = document.getElementById("story-detail-evidence-notes");
          if (notesEl) notesEl.oninput = function () { renderStoryEvidencePane(); };
          if (notesEl) notesEl.onpaste = function (ev) {
            var items = (ev.clipboardData && ev.clipboardData.items) ? Array.prototype.slice.call(ev.clipboardData.items) : [];
            var imageFiles = items
              .filter(function (it) { return it && it.kind === "file" && String(it.type || "").indexOf("image/") === 0; })
              .map(function (it) { return it.getAsFile(); })
              .filter(Boolean);
            if (!imageFiles.length) return;
            ev.preventDefault();
            readFilesAsDataUrl(imageFiles).then(function (rows) {
              if (!rows.length) return;
              evidenceState.files = evidenceState.files.concat(rows);
              var tags = rows.map(function (row) { return buildEvidenceRefTag(row.ref); }).join("\n");
              var prefix = notesEl.value && !/\n$/.test(notesEl.value) ? "\n" : "";
              insertTextAtCursor(notesEl, prefix + tags);
              renderStoryEvidencePane();
            });
          };
          bindStoryEvidenceLayoutControls();
        }

        function bindStoryEvidenceLayoutControls() {
          var modalRoot = document.getElementById("storyDetailModal");
          if (typeof window.bindEvidenceLayout === "function") window.bindEvidenceLayout(modalRoot || document);
        }

        function doSaveStoryAll() {
          var title = (document.getElementById("story-detail-edit-title") && document.getElementById("story-detail-edit-title").value || "").trim();
          var desc = (document.getElementById("story-detail-edit-desc") && document.getElementById("story-detail-edit-desc").value || "").trim();
          var prioritySel = document.getElementById("story-detail-edit-priority");
          var assignedSel = document.getElementById("story-detail-edit-assigned");
          var pointsEl = document.getElementById("story-detail-edit-points");
          var labelsEl = document.getElementById("story-detail-edit-labels");
          var priority = prioritySel ? prioritySel.value : "MEDIUM";
          var assignedTo = assignedSel && assignedSel.value ? assignedSel.value : null;
          var storyPoints = pointsEl && pointsEl.value ? parseInt(pointsEl.value, 10) : null;
          var labelsRaw = labelsEl && labelsEl.value ? labelsEl.value.trim() : "";
          var labels = labelsRaw ? labelsRaw.split(",").map(function (x) { return x.trim(); }).filter(Boolean) : [];
          if (!title) return Promise.resolve(false);
          var mainPayload = { title: title, description: desc, priority: priority, assigned_to: assignedTo };
          if (storyPoints != null) mainPayload.story_points = storyPoints;
          if (labels) mainPayload.labels = labels;
          var mainPromise = window.fetchApi("/stories/" + storyId, {
            method: "PATCH",
            body: JSON.stringify(mainPayload)
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
          var pointsEl = document.getElementById("story-detail-edit-points");
          var labelsEl = document.getElementById("story-detail-edit-labels");
          var pts = (pointsEl && pointsEl.value) ? pointsEl.value : "";
          var lbls = (labelsEl && labelsEl.value) ? labelsEl.value.trim() : "";
          if (t !== initialTitle || d !== initialDesc || p !== initialPriority || a !== initialAssigned) return true;
          if (pts !== (initialStoryPoints != null ? String(initialStoryPoints) : "")) return true;
          if (lbls !== initialLabelsStr) return true;
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
        if (storyModal && typeof window.bindEvidenceLayout === "function") window.bindEvidenceLayout(storyModal);
        var storyFooter = storyModal ? storyModal.querySelector(".modal-footer") : null;
        var storyCancelBtn = document.getElementById("story-detail-cancel");
        var storyPrimaryBtn = document.getElementById("story-detail-close");
        var storyCloseXBtn = storyModal ? storyModal.querySelector(".nexus-form-modal-close-btn") : null;
        var storyBsModalInst = storyModal && typeof bootstrap !== "undefined" ? bootstrap.Modal.getInstance(storyModal) : null;

        function storyDoClose() { if (storyBsModalInst) storyBsModalInst.hide(); }
        function syncStoryTransferActionsVisibility() {
          var transferGroup = document.getElementById("story-detail-transfer-actions");
          var storyTabEdicion = document.getElementById("story-detail-tab-edicion");
          if (!transferGroup || !storyTabEdicion) return;
          transferGroup.classList.toggle("d-none", !storyTabEdicion.classList.contains("active"));
        }
        function storySwitchToViewMode() {
          if (storyCancelBtn) storyCancelBtn.style.display = "none";
          var transferGroup = document.getElementById("story-detail-transfer-actions");
          if (transferGroup) transferGroup.classList.add("d-none");
          if (storyPrimaryBtn) { storyPrimaryBtn.textContent = "Cerrar"; storyPrimaryBtn.onclick = function () { storyDoClose(); }; }
          if (storyCloseXBtn) storyCloseXBtn.onclick = function () { storyDoClose(); };
        }
        function storySwitchToEditMode() {
          if (storyCancelBtn) storyCancelBtn.style.display = "";
          syncStoryTransferActionsVisibility();
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
            row.className = "story-criterion-row criteria-item";
            row.innerHTML = '<input type="text" class="form-control form-control-sm form-modern-input story-detail-criteria-input" placeholder="Criterio ' + n + '" aria-label="Criterio ' + n + '"><button type="button" class="btn btn-outline-secondary btn-sm story-criterion-remove criteria-remove-btn tooltip" aria-label="Quitar criterio" data-tooltip="Quitar criterio"><i data-lucide="x"></i></button>';
            criteriaList.appendChild(row);
            if (typeof window.nexusCreateIcons === "function") window.nexusCreateIcons();
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
            row.className = "story-impl-criterion-row criteria-item";
            row.innerHTML = '<input type="text" class="form-control form-control-sm form-modern-input story-detail-impl-criteria-input" placeholder="Criterio ' + n + '" aria-label="Criterio ' + n + '"><button type="button" class="btn btn-outline-secondary btn-sm story-impl-criterion-remove criteria-remove-btn tooltip" aria-label="Quitar criterio" data-tooltip="Quitar criterio"><i data-lucide="x"></i></button>';
            implCriteriaList.appendChild(row);
            if (typeof window.nexusCreateIcons === "function") window.nexusCreateIcons();
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
          var pointsEl = document.getElementById("story-detail-edit-points");
            var labelsEl = document.getElementById("story-detail-edit-labels");
            var labelsVal = (labelsEl && labelsEl.value && labelsEl.value.trim()) ? labelsEl.value.trim().split(",").map(function (x) { return x.trim(); }).filter(Boolean) : [];
            var data = {
            title: (document.getElementById("story-detail-edit-title") && document.getElementById("story-detail-edit-title").value) || "",
            description: (document.getElementById("story-detail-edit-desc") && document.getElementById("story-detail-edit-desc").value) || "",
            status: (document.getElementById("story-detail-status-edicion") && document.getElementById("story-detail-status-edicion").value) || "DRAFT",
            priority: (document.getElementById("story-detail-edit-priority") && document.getElementById("story-detail-edit-priority").value) || "MEDIUM",
            assigned_to: (document.getElementById("story-detail-edit-assigned") && document.getElementById("story-detail-edit-assigned").value) || null,
            sprint_id: (document.getElementById("story-detail-sprint") && document.getElementById("story-detail-sprint").value) || null,
            story_points: (pointsEl && pointsEl.value) ? parseInt(pointsEl.value, 10) : null,
            labels: labelsVal,
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
              var pointsInput = document.getElementById("story-detail-edit-points");
              var labelsInput = document.getElementById("story-detail-edit-labels");
              if (pointsInput && data.story_points != null) pointsInput.value = data.story_points;
              if (labelsInput && data.labels) labelsInput.value = Array.isArray(data.labels) ? data.labels.join(", ") : String(data.labels);
              if (data.evidence) evidenceState = normalizeEvidencePayload(data.evidence);
              if (notesEl) notesEl.value = evidenceState.notes || "";
              if (data.acceptance_criteria && Array.isArray(data.acceptance_criteria)) {
                var list = document.getElementById("story-detail-criteria-list");
                if (list) {
                  list.innerHTML = "";
                  var items = data.acceptance_criteria.length ? data.acceptance_criteria : [""];
                  items.forEach(function (val, idx) {
                    var row = document.createElement("div");
                    row.className = "story-criterion-row criteria-item";
                    row.innerHTML = '<input type="text" class="form-control form-control-sm form-modern-input story-detail-criteria-input" placeholder="Criterio ' + (idx + 1) + '" value="' + esc(String(val || "")) + '" aria-label="Criterio ' + (idx + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm story-criterion-remove criteria-remove-btn tooltip" aria-label="Quitar criterio" data-tooltip="Quitar criterio"><i data-lucide="x"></i></button>';
                    list.appendChild(row);
                  });
                  if (typeof window.nexusCreateIcons === "function") window.nexusCreateIcons();
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
                    row.className = "story-impl-criterion-row criteria-item";
                    row.innerHTML = '<input type="text" class="form-control form-control-sm form-modern-input story-detail-impl-criteria-input" placeholder="Criterio ' + (idx + 1) + '" value="' + esc(String(val || "")) + '" aria-label="Criterio ' + (idx + 1) + '"><button type="button" class="btn btn-outline-secondary btn-sm story-impl-criterion-remove criteria-remove-btn tooltip" aria-label="Quitar criterio" data-tooltip="Quitar criterio"><i data-lucide="x"></i></button>';
                    implList.appendChild(row);
                  });
                  if (typeof window.nexusCreateIcons === "function") window.nexusCreateIcons();
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
                // Nuevo modelo: usar hash suave + Target Stack sin navegación dura.
                var featureId = s.feature_id || "";
                if (window.targetStackManager) {
                  var base = [{ entity_type: "view", entity_id: "stories", meta: { projectId: null, featureId: featureId || null } }];
                  window.targetStackManager.reset(base);
                }
                var baseHash = featureId ? "#/stories?feature=" + encodeURIComponent(featureId) : "#/stories";
                if (window.location.hash !== baseHash) {
                  window.history.replaceState(null, "", baseHash);
                }
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
