(function () {
  "use strict";

  // Lista soportada por automation.engine (y UI).
  var EVENT_TYPES = [
    { value: "WORK_ORDER_CREATED", label: "WORK_ORDER_CREATED" },
    { value: "WORK_ORDER_UPDATED", label: "WORK_ORDER_UPDATED" },
    { value: "WORK_ORDER_STATUS_CHANGED", label: "WORK_ORDER_STATUS_CHANGED" },
    { value: "WORK_ORDER_ASSIGNED", label: "WORK_ORDER_ASSIGNED" },
    { value: "DELIVERY_LINKED", label: "DELIVERY_LINKED" },
    { value: "DELIVERY_DELETED", label: "DELIVERY_DELETED" }
  ];

  var CONDITION_FIELDS = [
    { value: "priority", label: "priority" },
    { value: "status", label: "status" },
    { value: "assigned_to_user_id", label: "assigned_to_user_id" }
  ];

  var CONDITION_OPERATORS = [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "not_equals" },
    { value: "contains", label: "contains" },
    { value: "greater_than", label: "greater_than" },
    { value: "less_than", label: "less_than" }
  ];

  var PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH"];
  var STATUS_VALUES = ["PENDING", "IN_PROGRESS", "IN_REVIEW", "DONE"];

  function esc(s) {
    if (s == null) return "";
    var div = document.createElement("div");
    div.textContent = String(s);
    return div.innerHTML;
  }

  function safeJsonStringify(obj) {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (_) {
      return "{}";
    }
  }

  function computePreviewConfidence(state) {
    var score = 0.15;
    if (state.rule.event_type) score += 0.35;
    if (state.rule.conditions && state.rule.conditions.length) score += 0.2;
    if (state.rule.actions && state.rule.actions.length) score += 0.2;
    score -= state.validation.errors.length ? 0.5 : 0;
    score -= state.validation.warnings.length && !state.validation.errors.length ? 0.05 : 0;
    return Math.max(0, Math.min(1, score));
  }

  function getBlockValidationTone(level) {
    if (level === "success") return { cls: "text-success", badge: "bg-success" };
    if (level === "warning") return { cls: "text-warning", badge: "bg-warning text-dark" };
    if (level === "error") return { cls: "text-danger", badge: "bg-danger" };
    return { cls: "text-muted", badge: "bg-secondary" };
  }

  function validateState(state) {
    var errors = [];
    var warnings = [];

    if (!state.rule.event_type) errors.push("event_type es obligatorio");

    if ((!state.rule.conditions || state.rule.conditions.length === 0) && (!state.rule.actions || state.rule.actions.length === 0)) {
      errors.push("Debe existir al menos 1 condición o 1 acción");
    }

    if (!Number.isInteger(state.rule.priority) || state.rule.priority < 0) warnings.push("priority no es válido (usa un entero >= 0)");

    // Validación superficial condiciones.
    if (Array.isArray(state.rule.conditions)) {
      state.rule.conditions.forEach(function (c, idx) {
        if (!c || !c.field) errors.push("condición #" + (idx + 1) + " sin field");
        if (c && (!c.operator || !CONDITION_OPERATORS.some(function (o) { return o.value === c.operator; }))) errors.push("condición #" + (idx + 1) + " operador inválido");
        if (c && (c.value == null || String(c.value).trim() === "")) errors.push("condición #" + (idx + 1) + " value requerido");
      });
    }

    // Validación superficial acciones.
    if (Array.isArray(state.rule.actions)) {
      state.rule.actions.forEach(function (a, idx) {
        if (!a || !a.type) errors.push("acción #" + (idx + 1) + " sin type");
        if (a && a.type === "assign_user") {
          if (!a.payload || !a.payload.user_id) errors.push("acción #" + (idx + 1) + " assign_user sin user_id");
        }
        if (a && a.type === "change_status") {
          if (!a.payload || !a.payload.status) errors.push("acción #" + (idx + 1) + " change_status sin status");
          if (a.payload && a.payload.status && STATUS_VALUES.indexOf(String(a.payload.status).toUpperCase()) === -1) warnings.push("acción #" + (idx + 1) + " status no reconocido");
        }
        if (a && a.type === "link_delivery") {
          if (!a.payload || !a.payload.delivery_id) warnings.push("acción #" + (idx + 1) + " link_delivery sin delivery_id (posible vacío)");
        }
        if (a && (a.type === "send_notification" || a.type === "add_comment")) {
          if (a.type === "send_notification" && (!a.payload || !a.payload.user_id)) warnings.push("acción #" + (idx + 1) + " send_notification sin user_id");
        }
      });
    }

    var level = errors.length ? "error" : warnings.length ? "warning" : "success";
    return { errors: errors, warnings: warnings, level: level };
  }

  function buildRuleJson(state) {
    return {
      tenant_id: state.tenantId || null,
      name: state.rule.name || "",
      description: state.rule.description || "",
      event_type: state.rule.event_type || "",
      conditions: Array.isArray(state.rule.conditions) ? state.rule.conditions : [],
      actions: Array.isArray(state.rule.actions) ? state.rule.actions : [],
      is_active: state.rule.is_active !== false,
      priority: Number.isInteger(state.rule.priority) ? state.rule.priority : 10
    };
  }

  function renderExecutionPreview(state) {
    var parts = [];
    var cond = (state.rule.conditions || [])[0];
    if (cond) {
      var left = cond.field || "field";
      var op = cond.operator || "equals";
      var val = cond.value;
      parts.push("IF " + left + " " + op + " " + (val == null ? "" : String(val)));
    } else {
      parts.push("IF (sin condiciones)");
    }

    var action = (state.rule.actions || [])[0];
    if (action) {
      if (action.type === "assign_user") {
        parts.push("THEN assign_user(" + (action.payload && action.payload.user_id ? action.payload.user_id : "") + ")");
      } else if (action.type === "change_status") {
        parts.push("THEN change_status(" + (action.payload && action.payload.status ? action.payload.status : "") + ")");
      } else if (action.type === "send_notification") {
        parts.push("THEN send_notification(" + (action.payload && action.payload.user_id ? action.payload.user_id : "") + ")");
      } else if (action.type === "link_delivery") {
        parts.push("THEN link_delivery(" + (action.payload && action.payload.delivery_id ? action.payload.delivery_id : "") + ")");
      } else {
        parts.push("THEN " + esc(action.type));
      }
    } else {
      parts.push("THEN (sin acciones)");
    }

    return parts.join("\n");
  }

  function renderConditionValueControl(state, cond, idx) {
    var field = cond.field || "priority";
    var operator = cond.operator || "equals";
    var value = cond.value == null ? "" : String(cond.value);

    if (field === "priority") {
      var opts = PRIORITY_VALUES.map(function (p) {
        return '<option value="' + esc(p) + '"' + (value === p ? " selected" : "") + ">" + esc(p) + "</option>";
      }).join("");
      return '<select id="cond-value-' + idx + '" class="form-select form-select-sm automation-cond-value">' + opts + "</select>";
    }

    if (field === "status") {
      var sopts = STATUS_VALUES.map(function (s) {
        return '<option value="' + esc(s) + '"' + (value === s ? " selected" : "") + ">" + esc(s) + "</option>";
      }).join("");
      return '<select id="cond-value-' + idx + '" class="form-select form-select-sm automation-cond-value">' + sopts + "</select>";
    }

    if (field === "assigned_to_user_id") {
      var selectedStr = value == null ? "" : String(value);
      var foundUser = (state.users || []).some(function (u) { return String(u.id) === selectedStr; });
      var extraUserOpt = "";
      if (selectedStr && !foundUser) {
        extraUserOpt = '<option value="' + esc(selectedStr) + '" selected>' + esc(selectedStr) + "</option>";
      }

      var userOpts = (state.users || []).map(function (u) {
        var label = (u.name || u.email || u.id).slice(0, 50);
        var role = u.role ? (" (" + u.role + ")") : "";
        return '<option value="' + esc(u.id) + '"' + (value === u.id ? " selected" : "") + ">" + esc(label + role) + "</option>";
      }).join("");
      return '<select id="cond-value-' + idx + '" class="form-select form-select-sm automation-cond-value"><option value="">(seleccionar)</option>' + extraUserOpt + userOpts + "</select>";
    }

    return '<input id="cond-value-' + idx + '" type="text" class="form-control form-control-sm automation-cond-value" value="' + esc(value) + '" placeholder="Valor">';
  }

  function renderConditionBlock(state, cond, idx) {
    var fieldOptions = CONDITION_FIELDS.map(function (f) {
      return '<option value="' + esc(f.value) + '"' + (cond.field === f.value ? " selected" : "") + ">" + esc(f.label) + "</option>";
    }).join("");

    var opOptions = CONDITION_OPERATORS.map(function (o) {
      return '<option value="' + esc(o.value) + '"' + (cond.operator === o.value ? " selected" : "") + ">" + esc(o.label) + "</option>";
    }).join("");

    var valueControl = renderConditionValueControl(state, cond, idx);

    return [
      '<div class="automation-block d-flex gap-2 align-items-center p-2 border rounded mb-2 automation-dnd-item" draggable="true" data-dnd-kind="condition" data-dnd-index="' + idx + '">',
      '<span class="text-muted" style="cursor:grab">↕</span>',
      '<select id="cond-field-' + idx + '" class="form-select form-select-sm automation-cond-field">' + fieldOptions + "</select>",
      '<select id="cond-operator-' + idx + '" class="form-select form-select-sm automation-cond-operator">' + opOptions + "</select>",
      valueControl,
      '<button type="button" class="btn btn-outline-danger btn-sm ms-auto automation-remove-cond" id="cond-remove-' + idx + '">Quitar</button>',
      "</div>"
    ].join("");
  }

  function renderActionTargetUserOptions(users, selectedValue) {
    var selectedStr = selectedValue == null ? "" : String(selectedValue);
    var tokenOpts = [
      { value: "CREATOR", label: "CREATOR" },
      { value: "ASSIGNED_TO", label: "ASSIGNED_TO" },
      { value: "ACTOR", label: "ACTOR" }
    ];
    var tokensHtml = tokenOpts.map(function (t) {
      return '<option value="' + esc(t.value) + '"' + (selectedValue === t.value ? " selected" : "") + ">" + esc(t.label) + "</option>";
    }).join("");

    var tokenValues = ["CREATOR", "ASSIGNED_TO", "ACTOR"];
    var foundUser = (users || []).some(function (u) { return String(u.id) === selectedStr; });
    var extraUserOpt = "";
    if (selectedStr && tokenValues.indexOf(selectedStr) === -1 && !foundUser) {
      extraUserOpt = '<option value="' + esc(selectedStr) + '" selected>' + esc(selectedStr) + "</option>";
    }

    var userOpts = (users || []).map(function (u) {
      var label = (u.name || u.email || u.id).slice(0, 50);
      var role = u.role ? (" (" + u.role + ")") : "";
      return '<option value="' + esc(u.id) + '"' + (selectedValue === u.id ? " selected" : "") + ">" + esc(label + role) + "</option>";
    }).join("");
    return tokensHtml + extraUserOpt + userOpts;
  }

  function renderActionBlock(state, action, idx) {
    var type = action.type || "assign_user";
    var payload = action.payload || {};

    var typeOptions = [
      { value: "assign_user", label: "assign_user" },
      { value: "change_status", label: "change_status" },
      { value: "send_notification", label: "send_notification" },
      { value: "link_delivery", label: "link_delivery" }
    ].map(function (t) {
      return '<option value="' + esc(t.value) + '"' + (type === t.value ? " selected" : "") + ">" + esc(t.label) + "</option>";
    }).join("");

    var targetControl = "";
    if (type === "assign_user") {
      var v = payload.user_id == null ? "" : String(payload.user_id);
      targetControl = '<select id="action-payload-user-' + idx + '" class="form-select form-select-sm automation-action-user">' + renderActionTargetUserOptions(state.users, v) + "</select>";
    } else if (type === "send_notification") {
      var n = payload.user_id == null ? "" : String(payload.user_id);
      targetControl = '<select id="action-payload-user-' + idx + '" class="form-select form-select-sm automation-action-user">' + renderActionTargetUserOptions(state.users, n) + "</select>";
    } else if (type === "change_status") {
      var st = payload.status == null ? "PENDING" : String(payload.status);
      var stOpts = STATUS_VALUES.map(function (s) {
        return '<option value="' + esc(s) + '"' + (st === s ? " selected" : "") + ">" + esc(s) + "</option>";
      }).join("");
      targetControl = '<select id="action-payload-status-' + idx + '" class="form-select form-select-sm automation-action-status">' + stOpts + "</select>";
    } else if (type === "link_delivery") {
      var did = payload.delivery_id == null ? "" : String(payload.delivery_id);
      targetControl = '<input id="action-payload-delivery-' + idx + '" class="form-control form-control-sm automation-action-delivery" value="' + esc(did) + '" placeholder="delivery_id (UUID)">';
    }

    return [
      '<div class="automation-block d-flex gap-2 align-items-center p-2 border rounded mb-2 automation-dnd-item" draggable="true" data-dnd-kind="action" data-dnd-index="' + idx + '">',
      '<span class="text-muted" style="cursor:grab">↕</span>',
      '<select id="action-type-' + idx + '" class="form-select form-select-sm automation-action-type">' + typeOptions + "</select>",
      targetControl,
      '<button type="button" class="btn btn-outline-danger btn-sm ms-auto automation-remove-action" id="action-remove-' + idx + '">Quitar</button>',
      "</div>"
    ].join("");
  }

  function getEventTypeLabel(val) {
    var found = EVENT_TYPES.find(function (e) { return e.value === val; });
    return found ? found.label : val;
  }

  window.registerView("automation-builder", async function () {
    await window.showNav();

    var me = await window.getMe();
    if (!me || (me.role !== "MASTER" && me.role !== "EMPLOYEE")) {
      window.setContent('<div class="nui-card"><div class="nui-card-body"><p class="text-warning mb-2">No tienes permisos para acceder.</p><a href="#/dashboard" class="btn btn-outline-secondary btn-sm">Volver</a></div></div>');
      return;
    }

    if (!(window.NEXUS_FEATURES && window.NEXUS_FEATURES.AUTOMATION_BUILDER === true)) {
      window.setContent('<div class="nui-card"><div class="nui-card-body"><p class="text-warning mb-2">Módulo no disponible</p><p class="text-muted mb-3">Automation Builder no disponible en este entorno.</p><a href="#/dashboard" class="btn btn-nexus-primary btn-sm">Volver</a></div></div>');
      return;
    }

    var state = {
      tenantId: null,
      org: null,
      users: [],
      rule: {
        event_type: "",
        name: "",
        description: "",
        conditions: [],
        actions: [],
        is_active: true,
        priority: 10
      },
      validation: { errors: [], warnings: [], level: "success" },
      drag: null,
      lastAiWarnings: []
    };

    function updateValidationAndPreview() {
      state.validation = validateState(state);
      state.ruleConfidence = computePreviewConfidence(state);
    }

    function buildPreviewHtml() {
      updateValidationAndPreview();
      var tone = getBlockValidationTone(state.validation.level);
      var json = buildRuleJson(state);
      var previewText = renderExecutionPreview(state);

      var warningsHtml = state.validation.warnings.length
        ? '<div class="alert alert-warning mb-2"><strong>Warning:</strong><ul class="mb-0">' + state.validation.warnings.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></div>"
        : "";

      var errorsHtml = state.validation.errors.length
        ? '<div class="alert alert-danger mb-2"><strong>Error:</strong><ul class="mb-0">' + state.validation.errors.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></div>"
        : "";

      return [
        '<div class="nui-panel-right">',
        '<div class="nexus-panel">',
        '<div class="d-flex align-items-center justify-content-between mb-2">',
        '<div>',
        '<div class="nexus-font-semibold nexus-text-primary">Preview</div>',
        '<div class="nexus-text-sm text-muted">JSON compatible con automation engine</div>',
        "</div>",
        '<span class="badge ' + tone.badge + '">Estado: ' + esc(state.validation.level) + "</span>",
        "</div>",
        errorsHtml,
        warningsHtml,
        '<div class="mb-2"><div class="nexus-text-sm text-muted">Confidence (simulada)</div><div class="nexus-font-semibold">' + Math.round((state.ruleConfidence || 0) * 100) + "%</div></div>",
        '<div class="mb-2">',
        '<div class="nexus-text-sm text-muted mb-1">Ejecución (aprox.)</div>',
        '<pre class="bg-light border rounded p-2" style="white-space:pre-wrap">' + esc(previewText) + "</pre>",
        "</div>",
        '<div>',
        '<div class="nexus-text-sm text-muted mb-1">JSON final</div>',
        '<pre id="automation-preview-json" class="bg-light border rounded p-2" style="max-height:300px; overflow:auto; white-space:pre-wrap">' + esc(safeJsonStringify(json)) + "</pre>",
        "</div>",
        "</div>",
        "</div>"
      ].join("");
    }

    function loadOrgAndUsers() {
      var usersLoaded = window.fetchApi("/users?page=1&limit=200").then(function (body) {
        if (body && body.success && body.data && Array.isArray(body.data.items)) {
          state.users = body.data.items.map(function (u) {
            return { id: u.id, name: u.name, email: u.email, role: u.role && u.role.name ? u.role.name : null };
          });
        }
      });
      var orgLoaded = window.fetchApi("/organizations/current").then(function (body) {
        if (body && body.success && body.data && body.data.id) {
          state.org = body.data;
          state.tenantId = body.data.id;
        }
      });
      return Promise.all([usersLoaded, orgLoaded]);
    }

    function initDefaultBlocks() {
      if (!state.rule.conditions.length) {
        state.rule.conditions = [
          { field: "priority", operator: "equals", value: "HIGH" }
        ];
      }
    }

    function render() {
      updateValidationAndPreview();
      var tone = getBlockValidationTone(state.validation.level);
      var jsonPreview = buildRuleJson(state);
      var hasAi = false;

      var html = [];
      html.push('<div class="nui-view-header mb-3">');
      html.push('<div class="nui-view-header-left">');
      html.push('<h1 class="nui-view-header-title">Automation Builder</h1>');
      html.push('<p class="nui-view-header-subtitle">Crea reglas visuales y guárdalas en `automation_rules`</p>');
      html.push("</div>");
      html.push('<div class="nui-view-header-actions d-flex gap-2 align-items-center">');
      html.push('<button type="button" class="btn btn-nexus-secondary btn-sm" id="ai-generate-btn"><i data-lucide="sparkles" class="me-1"></i>Generate with AI</button>');
      html.push('<button type="button" class="btn btn-nexus-primary btn-sm" id="rules-save-btn">Guardar regla</button>');
      html.push("</div>");
      html.push("</div>");

      html.push('<div class="row g-3">');
      // Left builder
      html.push('<div class="col-12 col-lg-7">');
      html.push('<div class="nexus-panel h-100">');
      html.push('<div class="nexus-panel-body">');

      html.push('<div class="mb-3">');
      html.push('<label class="form-label">Nombre de la regla</label>');
      html.push('<input type="text" id="rule-name-input" class="form-control form-control-sm" value="' + esc(state.rule.name || "") + '" placeholder="Ej: Alta prioridad -> asignar senior">');
      html.push('</div>');

      html.push('<div class="row g-2 mb-3">');
      html.push('<div class="col-12 col-md-6">');
      html.push('<label class="form-label">Event</label>');
      html.push('<select id="rule-event-select" class="form-select form-select-sm">');
      html.push('<option value="">Seleccionar event</option>');
      EVENT_TYPES.forEach(function (e) {
        html.push('<option value="' + esc(e.value) + '"' + (state.rule.event_type === e.value ? " selected" : "") + ">" + esc(e.label) + "</option>");
      });
      html.push("</select>");
      html.push("</div>");
      html.push('<div class="col-12 col-md-6">');
      html.push('<label class="form-label">Priority (engine)</label>');
      html.push('<input type="number" id="rule-priority-input" class="form-control form-control-sm" value="' + esc(state.rule.priority) + '" min="0" step="1">');
      html.push("</div>");
      html.push("</div>");

      html.push('<div class="mb-3">');
      html.push('<label class="form-check-label me-2"><input type="checkbox" id="rule-active-checkbox" class="form-check-input" ' + (state.rule.is_active ? "checked" : "") + '> is_active</label>');
      html.push("</div>");

      html.push('<hr class="my-3">');

      // Conditions (WHEN)
      html.push('<div class="mb-3">');
      html.push('<div class="d-flex align-items-center justify-content-between">');
      html.push('<h3 class="h6 mb-2 nexus-font-semibold">WHEN (Conditions)</h3>');
      html.push('<button type="button" class="btn btn-outline-secondary btn-sm" id="cond-add-btn"><i data-lucide="plus" class="me-1"></i>Agregar condición</button>');
      html.push("</div>");
      html.push('<div id="conditions-list">');
      if (!state.rule.conditions.length) html.push('<div class="text-muted small">Sin condiciones. (La regla se evaluará como true para condiciones vacías)</div>');
      state.rule.conditions.forEach(function (c, i) { html.push(renderConditionBlock(state, c, i)); });
      html.push("</div>");
      html.push("</div>");

      // Actions (THEN)
      html.push('<div class="mb-3">');
      html.push('<div class="d-flex align-items-center justify-content-between">');
      html.push('<h3 class="h6 mb-2 nexus-font-semibold">THEN (Actions)</h3>');
      html.push('<button type="button" class="btn btn-outline-secondary btn-sm" id="action-add-btn"><i data-lucide="plus" class="me-1"></i>Agregar acción</button>');
      html.push("</div>");
      html.push('<div id="actions-list">');
      if (!state.rule.actions.length) html.push('<div class="text-muted small">Sin acciones. (La regla no ejecutará nada)</div>');
      state.rule.actions.forEach(function (a, i) { html.push(renderActionBlock(state, a, i)); });
      html.push("</div>");
      html.push("</div>");

      html.push("</div>"); // nexus-panel-body
      html.push("</div>"); // nexus-panel
      html.push("</div>"); // col left

      // Right preview
      html.push('<div class="col-12 col-lg-5">');
      html.push(buildPreviewHtml());
      html.push("</div>");
      html.push("</div>");

      html.push('<div class="mt-3">' + (state.lastAiWarnings && state.lastAiWarnings.length ? '<div class="alert alert-info mb-0"><strong>AI warnings:</strong><ul class="mb-0">' + state.lastAiWarnings.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></div>" : "") + "</div>");

      window.setContent(html.join(""));

      // Bind event handlers
      var evSel = document.getElementById("rule-event-select");
      if (evSel) evSel.onchange = function () { state.rule.event_type = evSel.value || ""; render(); };

      var nm = document.getElementById("rule-name-input");
      if (nm) nm.oninput = function () { state.rule.name = nm.value || ""; render(); };

      var pr = document.getElementById("rule-priority-input");
      if (pr) pr.oninput = function () { state.rule.priority = parseInt(pr.value, 10) || 0; render(); };

      var actChk = document.getElementById("rule-active-checkbox");
      if (actChk) actChk.onchange = function () { state.rule.is_active = !!actChk.checked; render(); };

      var saveBtn = document.getElementById("rules-save-btn");
      if (saveBtn) {
        saveBtn.disabled = state.validation.level === "error";
        saveBtn.onclick = async function () {
          updateValidationAndPreview();
          if (state.validation.level === "error") return;
          if (!state.tenantId) {
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Tenant no resuelto", message: "No se pudo resolver tenant_id desde el frontend." });
            return;
          }
          var payload = buildRuleJson(state);
          var res = await window.fetchApi("/automation/rules", { method: "POST", body: JSON.stringify(payload) });
          if (res && res.success) {
            if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Regla guardada correctamente.");
            else if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Guardado", message: "Regla guardada correctamente." });
          } else {
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error al guardar", message: (res && res.error && res.error.message) || "No se pudo guardar la regla." });
          }
        };
      }

      var aiBtn = document.getElementById("ai-generate-btn");
      if (aiBtn) {
        aiBtn.onclick = function () {
          var modalId = "aiAutomationParseModal";
          var bodyHtml = '<label class="form-label">Describe tu regla</label><textarea id="' + modalId + '-text" class="form-control" rows="4" placeholder="Ej: Cuando se cree una Work Order con prioridad alta, asígnala a un usuario senior"></textarea>';
          bodyHtml += '<div class="nexus-text-sm text-muted mt-2">El parser heurístico convertirá el texto a event/conditions/actions compatibles con automation engine.</div>';
          var modalHtml = window.buildNexusFormCardModal({
            id: modalId,
            title: "Generate with AI",
            bodyHtml: bodyHtml,
            primaryButtonId: modalId + "-submit",
            primaryLabel: "Generar",
            cancelButtonId: modalId + "-cancel",
            mode: "edit"
          });
          var wrap = document.createElement("div");
          wrap.innerHTML = modalHtml;
          document.body.appendChild(wrap.firstElementChild);
          var modalEl = document.getElementById(modalId);
          var bsModal = new bootstrap.Modal(modalEl);
          bsModal.show();

          var onCleanup = function () {
            try { bsModal.dispose(); } catch (_) {}
            if (modalEl && modalEl.parentNode) modalEl.parentNode.removeChild(modalEl);
          };

          var cancelBtn = document.getElementById(modalId + "-cancel");
          if (cancelBtn) cancelBtn.onclick = function () { onCleanup(); };

          var submitBtn = document.getElementById(modalId + "-submit");
          if (submitBtn) submitBtn.onclick = async function () {
            submitBtn.disabled = true;
            var textEl = document.getElementById(modalId + "-text");
            var text = textEl && textEl.value ? textEl.value.trim() : "";
            state.lastAiWarnings = [];
            if (!text) {
              submitBtn.disabled = false;
              if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Campo requerido", message: "Introduce una descripción de regla." });
              return;
            }
            var res = await window.fetchApi("/automation/ai/parse-rule", { method: "POST", body: JSON.stringify({ text: text }) });
            if (!res || !res.success) {
              submitBtn.disabled = false;
              if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error AI", message: (res && res.error && res.error.message) || "No se pudo parsear la regla." });
              return;
            }
            var parsed = res.data || {};
            if (parsed && parsed.event_type) state.rule.event_type = parsed.event_type;
            if (Array.isArray(parsed.conditions)) state.rule.conditions = parsed.conditions;
            if (Array.isArray(parsed.actions)) state.rule.actions = parsed.actions;
            if (typeof state.rule.name === "string" && !state.rule.name.trim()) state.rule.name = "AI Rule";
            state.lastAiWarnings = parsed.warnings || [];
            bsModal.hide();
            onCleanup();
            render();
          };
        };
      }

      var addCond = document.getElementById("cond-add-btn");
      if (addCond) {
        addCond.onclick = function () {
          state.rule.conditions = state.rule.conditions || [];
          state.rule.conditions.push({ field: "priority", operator: "equals", value: "HIGH" });
          render();
        };
      }

      var addAction = document.getElementById("action-add-btn");
      if (addAction) {
        addAction.onclick = function () {
          state.rule.actions = state.rule.actions || [];
          state.rule.actions.push({ type: "assign_user", payload: { user_id: "CREATOR" } });
          render();
        };
      }

      // Bind condition inputs & remove
      (state.rule.conditions || []).forEach(function (_, i) {
        var f = document.getElementById("cond-field-" + i);
        if (f) f.onchange = function () {
          state.rule.conditions[i].field = f.value;
          // Reset value default based on field
          if (f.value === "priority") state.rule.conditions[i].value = "HIGH";
          if (f.value === "status") state.rule.conditions[i].value = "IN_REVIEW";
          if (f.value === "assigned_to_user_id") state.rule.conditions[i].value = (state.users[0] && state.users[0].id) || "";
          render();
        };
        var op = document.getElementById("cond-operator-" + i);
        if (op) op.onchange = function () { state.rule.conditions[i].operator = op.value; render(); };
        var val = document.getElementById("cond-value-" + i);
        if (val) val.onchange = function () { state.rule.conditions[i].value = val.value; render(); };
        var rm = document.getElementById("cond-remove-" + i);
        if (rm) rm.onclick = function () { state.rule.conditions.splice(i, 1); render(); };
      });

      // Bind action inputs & remove
      (state.rule.actions || []).forEach(function (_, i) {
        var t = document.getElementById("action-type-" + i);
        if (t) t.onchange = function () {
          state.rule.actions[i].type = t.value;
          // Reset payload defaults
          if (t.value === "assign_user") state.rule.actions[i].payload = { user_id: "CREATOR" };
          if (t.value === "send_notification") state.rule.actions[i].payload = { user_id: "CREATOR" };
          if (t.value === "change_status") state.rule.actions[i].payload = { status: "IN_REVIEW" };
          if (t.value === "link_delivery") state.rule.actions[i].payload = { delivery_id: "" };
          render();
        };

        if (t && state.rule.actions[i].type === "assign_user" && document.getElementById("action-payload-user-" + i)) {
          var userSel = document.getElementById("action-payload-user-" + i);
          if (userSel) userSel.onchange = function () { state.rule.actions[i].payload.user_id = userSel.value; render(); };
        } else if (t && state.rule.actions[i].type === "send_notification" && document.getElementById("action-payload-user-" + i)) {
          var userSel2 = document.getElementById("action-payload-user-" + i);
          if (userSel2) userSel2.onchange = function () { state.rule.actions[i].payload.user_id = userSel2.value; render(); };
        }

        var statusSel = document.getElementById("action-payload-status-" + i);
        if (statusSel) statusSel.onchange = function () { state.rule.actions[i].payload.status = statusSel.value; render(); };

        var deliverySel = document.getElementById("action-payload-delivery-" + i);
        if (deliverySel) deliverySel.onchange = function () { state.rule.actions[i].payload.delivery_id = deliverySel.value; render(); };

        var rmA = document.getElementById("action-remove-" + i);
        if (rmA) rmA.onclick = function () { state.rule.actions.splice(i, 1); render(); };
      });

      // DnD reorder
      function bindDnD(kind) {
        var items = document.querySelectorAll('[data-dnd-kind="' + kind + '"]');
        items.forEach(function (el) {
          el.addEventListener("dragstart", function (e) {
            state.drag = { kind: kind, fromIndex: parseInt(el.getAttribute("data-dnd-index"), 10) };
            try { e.dataTransfer.setData("text/plain", String(state.drag.fromIndex)); } catch (_) {}
            e.dataTransfer.effectAllowed = "move";
            el.classList.add("opacity-50");
          });
          el.addEventListener("dragend", function () {
            el.classList.remove("opacity-50");
            state.drag = null;
          });
          el.addEventListener("dragover", function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          });
          el.addEventListener("drop", function (e) {
            e.preventDefault();
            if (!state.drag || state.drag.kind !== kind) return;
            var from = state.drag.fromIndex;
            var to = parseInt(el.getAttribute("data-dnd-index"), 10);
            if (from === to) return;
            if (kind === "condition") {
              var list = state.rule.conditions;
              var moved = list.splice(from, 1)[0];
              list.splice(to, 0, moved);
            } else {
              var listA = state.rule.actions;
              var movedA = listA.splice(from, 1)[0];
              listA.splice(to, 0, movedA);
            }
            state.drag = null;
            render();
          });
        });
      }

      bindDnD("condition");
      bindDnD("action");
    }

    window.setContent(window.showLoading());
    await loadOrgAndUsers();
    initDefaultBlocks();
    render();
  });
})();

