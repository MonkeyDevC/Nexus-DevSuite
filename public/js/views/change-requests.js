/**
 * Change Requests — POST /change-requests, PATCH /:id/submit, /:id/approve, /:id/reject, /:id/implement.
 * La API no expone GET list; la vista permite crear y ejecutar transiciones por ID.
 */
(function () {
  var CR_TYPES = ["FEATURE", "BUGFIX", "HOTFIX", "IMPROVEMENT", "STRUCTURAL"];
  var CR_IMPACT = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  var ENTITY_TYPES = ["FEATURE", "RELEASE"];
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
    html += '<p class="nexus-text-secondary mb-4">Crear solicitudes de cambio y ejecutar transiciones (Enviar, Aprobar, Rechazar, Marcar implementado). La API no expone listado; use el ID devuelto al crear para las acciones.</p>';

    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Nuevo Change Request</h2>';
    html += '<div class="row g-3 mb-4">';
    html += '<div class="col-md-4"><label class="form-label">Entidad (obligatorio)</label><select id="cr-entity-type" class="form-select form-select-sm" aria-label="Tipo de entidad"><option value="">Seleccionar</option>';
    ENTITY_TYPES.forEach(function (e) { html += '<option value="' + esc(e) + '">' + esc(e) + '</option>'; });
    html += '</select></div>';
    html += '<div class="col-md-4"><label class="form-label">ID de entidad (UUID, obligatorio)</label><input type="text" id="cr-entity-id" class="form-control form-control-sm" placeholder="UUID de feature o release" aria-label="ID entidad"></div>';
    html += '<div class="col-md-4"><label class="form-label">Título (opcional)</label><input type="text" id="cr-title" class="form-control form-control-sm" placeholder="Título" aria-label="Título"></div>';
    html += '<div class="col-md-6"><label class="form-label">Descripción (opcional)</label><textarea id="cr-description" class="form-control form-control-sm" rows="2" placeholder="Descripción" aria-label="Descripción"></textarea></div>';
    html += '<div class="col-md-3"><label class="form-label">Tipo (opcional)</label><select id="cr-type" class="form-select form-select-sm"><option value="">—</option>';
    CR_TYPES.forEach(function (t) { html += '<option value="' + esc(t) + '">' + esc(t) + '</option>'; });
    html += '</select></div>';
    html += '<div class="col-md-3"><label class="form-label">Impacto (opcional)</label><select id="cr-impact" class="form-select form-select-sm"><option value="">—</option>';
    CR_IMPACT.forEach(function (i) { html += '<option value="' + esc(i) + '">' + esc(i) + '</option>'; });
    html += '</select></div>';
    html += '<div class="col-12"><button type="button" class="btn btn-nexus-primary btn-sm" id="cr-btn-create">Crear Change Request</button> <span id="cr-create-msg" class="nexus-text-sm text-muted ms-2"></span></div>';
    html += '</div>';

    html += '<h2 class="nexus-font-semibold nexus-text-primary mb-3">Acciones por ID</h2>';
    html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-2">';
    html += '<label class="mb-0"><span class="nexus-text-sm">ID del Change Request (UUID)</span> <input type="text" id="cr-action-id" class="form-control form-control-sm d-inline-block ms-1" style="width:280px" placeholder="UUID" aria-label="ID CR"></label>';
    html += '<button type="button" class="btn btn-nexus-secondary btn-sm" id="cr-btn-submit">Enviar</button>';
    if (isMaster) {
      html += '<button type="button" class="btn btn-nexus-primary btn-sm" id="cr-btn-approve">Aprobar</button>';
      html += '<button type="button" class="btn btn-outline-danger btn-sm" id="cr-btn-reject">Rechazar</button>';
      html += '<button type="button" class="btn btn-nexus-secondary btn-sm" id="cr-btn-implement">Marcar implementado</button>';
    }
    html += '</div>';
    html += '<p id="cr-action-msg" class="nexus-text-sm text-muted mb-0"></p>';
    html += '</div>';

    window.setContent(html);

    var msgCreate = document.getElementById("cr-create-msg");
    var msgAction = document.getElementById("cr-action-msg");

    function doTransition(id, path, label) {
      if (!id) { if (msgAction) msgAction.textContent = "Indique el ID del Change Request."; return; }
      if (msgAction) msgAction.textContent = "Enviando…";
      window.fetchApi("/change-requests/" + id + path, { method: "PATCH", body: JSON.stringify({}) }).then(function (r) {
        if (r && r.success) {
          if (typeof window.showSuccessMessage === "function") window.showSuccessMessage(label + " correctamente.");
          if (msgAction) msgAction.textContent = label + " correcto.";
        } else {
          if (typeof window.showApiError === "function") window.showApiError(r);
          if (msgAction) msgAction.textContent = (r && r.error && r.error.message) || "Error.";
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
          var actionIdEl = document.getElementById("cr-action-id");
          if (actionIdEl && r.data && r.data.id) actionIdEl.value = r.data.id;
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

    document.getElementById("cr-btn-submit").onclick = function () {
      var id = (document.getElementById("cr-action-id") && document.getElementById("cr-action-id").value || "").trim();
      doTransition(id, "/submit", "Enviado");
    };
    if (isMaster) {
      document.getElementById("cr-btn-approve").onclick = function () {
        var id = (document.getElementById("cr-action-id") && document.getElementById("cr-action-id").value || "").trim();
        doTransition(id, "/approve", "Aprobado");
      };
      document.getElementById("cr-btn-reject").onclick = function () {
        var id = (document.getElementById("cr-action-id") && document.getElementById("cr-action-id").value || "").trim();
        doTransition(id, "/reject", "Rechazado");
      };
      document.getElementById("cr-btn-implement").onclick = function () {
        var id = (document.getElementById("cr-action-id") && document.getElementById("cr-action-id").value || "").trim();
        doTransition(id, "/implement", "Marcado implementado");
      };
    }
  });
})();
