/**
 * Work Orders — Helpers de UI (badges, tabla, modal Create Work Order).
 * Usa Nexus UI Kit (nui-card, nui-view-header, NexusUI.esc, NexusUI.card).
 */
(function () {
  "use strict";

  var NexusUI = window.NexusUI;

  function esc(s) {
    return NexusUI && NexusUI.esc ? NexusUI.esc(s) : (s == null ? "" : String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));
  }

  function badgeClassStatus(status) {
    if (!status) return "badge bg-secondary";
    var s = String(status).toUpperCase();
    if (s === "COMPLETED" || s === "DONE" || s === "MERGED") return "badge bg-success";
    if (s === "FAILED" || s === "BLOCKED") return "badge bg-danger";
    if (s === "IN_PROGRESS" || s === "RUNNING" || s === "COMMITTED" || s === "PR_CREATED") return "badge bg-primary";
    if (s === "PAUSED" || s === "IN_REVIEW" || s === "PREPARING") return "badge bg-warning text-dark";
    return "badge bg-secondary";
  }

  function workOrdersTableRows(items, projectId, getStoryTitle) {
    getStoryTitle = getStoryTitle || function () { return "—"; };
    return (items || []).map(function (wo) {
      var viewHref = "#/projects/" + encodeURIComponent(projectId) + "/work-orders/" + encodeURIComponent(wo.id);
      return "<tr>" +
        "<td>" + esc("OT-" + (wo.ot_number != null ? wo.ot_number : "")) + "</td>" +
        "<td>" + esc(wo.title || "—") + "</td>" +
        "<td>" + esc(getStoryTitle(wo.user_story_id)) + "</td>" +
        "<td><span class=\"" + badgeClassStatus(wo.status) + "\">" + esc(wo.status || "") + "</span></td>" +
        "<td data-wo-tasks=\"" + esc(wo.id) + "\">—</td>" +
        "<td>" + (wo.created_at ? esc(wo.created_at.slice(0, 10)) : "—") + "</td>" +
        "<td><a href=\"" + viewHref + "\" class=\"btn btn-nexus-primary btn-sm\">Ver</a></td>" +
        "</tr>";
    }).join("");
  }

  function tasksTableRows(items, projectId, workOrderId, getStepCount) {
    getStepCount = getStepCount || function () { return null; };
    return (items || []).map(function (t) {
      var viewStepsId = "wo-task-steps-" + t.id;
      var addStepId = "wo-task-addstep-" + t.id;
      var count = getStepCount(t.id);
      var stepsLabel = count != null ? String(count) : "—";
      return "<tr>" +
        "<td>" + esc("TASK-" + (t.task_number != null ? t.task_number : "")) + " " + esc((t.title || "").slice(0, 40)) + "</td>" +
        "<td><span class=\"" + badgeClassStatus(t.status) + "\">" + esc(t.status || "") + "</span></td>" +
        "<td data-task-steps-count=\"" + esc(t.id) + "\">" + esc(stepsLabel) + "</td>" +
        "<td>" +
        "<button type=\"button\" class=\"btn btn-outline-secondary btn-sm me-1\" id=\"" + viewStepsId + "\">Ver pasos</button>" +
        "<button type=\"button\" class=\"btn btn-nexus-primary btn-sm\" id=\"" + addStepId + "\">Añadir paso</button>" +
        "</td>" +
        "</tr>";
    }).join("");
  }

  function stepsListHtml(items, projectId, workOrderId, onStart, onComplete, onFail) {
    return (items || []).map(function (s) {
      var startId = "step-start-" + s.id;
      var completeId = "step-complete-" + s.id;
      var failId = "step-fail-" + s.id;
      var duration = s.duration_seconds != null ? s.duration_seconds + "s" : "—";
      return "<div class=\"d-flex align-items-center justify-content-between border-bottom py-2\" data-step-id=\"" + esc(s.id) + "\">" +
        "<div>" +
        "<span class=\"me-2\">Paso " + (s.step_number != null ? s.step_number : "") + "</span>" +
        "<strong>" + esc(s.title || "—") + "</strong>" +
        "<span class=\"ms-2 " + badgeClassStatus(s.status) + "\">" + esc(s.status || "") + "</span>" +
        (s.duration_seconds != null ? " <span class=\"nexus-text-sm text-muted\">" + esc(duration) + "</span>" : "") +
        "</div>" +
        "<div>" +
        (s.status === "PENDING" ? "<button type=\"button\" class=\"btn btn-sm btn-primary me-1\" id=\"" + startId + "\">Iniciar paso</button>" : "") +
        (s.status === "RUNNING" ? "<button type=\"button\" class=\"btn btn-sm btn-success me-1\" id=\"" + completeId + "\">Completar paso</button><button type=\"button\" class=\"btn btn-sm btn-danger\" id=\"" + failId + "\">Marcar fallido</button>" : "") +
        "</div>" +
        "</div>";
    }).join("");
  }

  function deliveriesTableRows(items, projectId) {
    return (items || []).map(function (d) {
      var label = "Entrega " + (d.delivery_number != null ? d.delivery_number : "") + " " + (d.title || "").slice(0, 30);
      var cellContent = projectId && d.id
        ? '<a href="#/projects/' + esc(projectId) + '/repository" class="text-decoration-none">' + esc(label) + '</a>'
        : esc(label);
      return "<tr>" +
        "<td>" + cellContent + "</td>" +
        "<td>" + esc(d.delivery_type || "—") + "</td>" +
        "<td><code class=\"nexus-text-sm\">" + esc(d.branch_name || "—") + "</code></td>" +
        "<td><span class=\"" + badgeClassStatus(d.status) + "\">" + esc(d.status || "") + "</span></td>" +
        "</tr>";
    }).join("");
  }

  function modalCreateWorkOrderHtml(projectId, userStories, selectedStoryId) {
    var options = (userStories || []).map(function (s) {
      return "<option value=\"" + esc(s.id) + "\"" + (selectedStoryId === s.id ? " selected" : "") + ">" + esc((s.number != null ? "US-" + s.number + " " : "") + (s.title || s.id).slice(0, 50)) + "</option>";
    }).join("");
    return "<div class=\"modal fade\" id=\"workOrderCreateModal\" tabindex=\"-1\">" +
      "<div class=\"modal-dialog\"><div class=\"modal-content\">" +
      "<div class=\"modal-header\"><h5 class=\"modal-title\">Crear orden de trabajo</h5><button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\"></button></div>" +
      "<div class=\"modal-body\">" +
      "<div class=\"mb-3\"><label class=\"form-label\">Título</label><input type=\"text\" id=\"wo-create-title\" class=\"form-control\" placeholder=\"Título de la orden\"></div>" +
      "<div class=\"mb-3\"><label class=\"form-label\">Descripción</label><textarea id=\"wo-create-description\" class=\"form-control\" rows=\"2\" placeholder=\"Opcional\"></textarea></div>" +
      "<div class=\"mb-3\"><label class=\"form-label\">Historia de usuario</label><select id=\"wo-create-user-story\" class=\"form-select\">" + options + "</select></div>" +
      "<div id=\"wo-create-error\" class=\"alert alert-danger d-none\"></div>" +
      "</div>" +
      "<div class=\"modal-footer\"><button type=\"button\" class=\"btn btn-secondary\" data-bs-dismiss=\"modal\">Cancelar</button><button type=\"button\" class=\"btn btn-nexus-primary\" id=\"wo-create-submit\">Crear</button></div>" +
      "</div></div></div>";
  }

  function modalCreateDeliveryHtml(taskOptions) {
    var opts = (taskOptions || []).map(function (t) {
      return "<option value=\"" + esc(t.id) + "\">" + esc("TASK-" + (t.task_number != null ? t.task_number : "") + " " + (t.title || "").slice(0, 40)) + "</option>";
    }).join("");
    return "<div class=\"modal fade\" id=\"deliveryCreateModal\" tabindex=\"-1\">" +
      "<div class=\"modal-dialog\"><div class=\"modal-content\">" +
      "<div class=\"modal-header\"><h5 class=\"modal-title\">Crear entrega de código</h5><button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\"></button></div>" +
      "<div class=\"modal-body\">" +
      "<div class=\"mb-3\"><label class=\"form-label\">Tarea</label><select id=\"delivery-create-task\" class=\"form-select\">" + opts + "</select></div>" +
      "<div class=\"mb-3\"><label class=\"form-label\">Título</label><input type=\"text\" id=\"delivery-create-title\" class=\"form-control\" placeholder=\"Título de la entrega\"></div>" +
      "<div class=\"mb-3\"><label class=\"form-label\">Tipo</label><select id=\"delivery-create-type\" class=\"form-select\"><option value=\"FEATURE\">FEATURE</option><option value=\"BUGFIX\">BUGFIX</option><option value=\"REFACTOR\">REFACTOR</option><option value=\"HOTFIX\">HOTFIX</option></select></div>" +
      "<div id=\"delivery-create-error\" class=\"alert alert-danger d-none\"></div>" +
      "</div>" +
      "<div class=\"modal-footer\"><button type=\"button\" class=\"btn btn-secondary\" data-bs-dismiss=\"modal\">Cancelar</button><button type=\"button\" class=\"btn btn-nexus-primary\" id=\"delivery-create-submit\">Crear</button></div>" +
      "</div></div></div>";
  }

  function modalAddTaskHtml() {
    return "<div class=\"modal fade\" id=\"taskAddModal\" tabindex=\"-1\">" +
      "<div class=\"modal-dialog\"><div class=\"modal-content\">" +
      "<div class=\"modal-header\"><h5 class=\"modal-title\">Añadir tarea</h5><button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\"></button></div>" +
      "<div class=\"modal-body\">" +
      "<div class=\"mb-3\"><label class=\"form-label\">Título</label><input type=\"text\" id=\"task-add-title\" class=\"form-control\" placeholder=\"Título de la tarea\"></div>" +
      "<div class=\"mb-3\"><label class=\"form-label\">Descripción</label><textarea id=\"task-add-description\" class=\"form-control\" rows=\"2\" placeholder=\"Opcional\"></textarea></div>" +
      "<div id=\"task-add-error\" class=\"alert alert-danger d-none\"></div>" +
      "</div>" +
      "<div class=\"modal-footer\"><button type=\"button\" class=\"btn btn-secondary\" data-bs-dismiss=\"modal\">Cancelar</button><button type=\"button\" class=\"btn btn-nexus-primary\" id=\"task-add-submit\">Crear tarea</button></div>" +
      "</div></div></div>";
  }

  function modalAddStepHtml() {
    return "<div class=\"modal fade\" id=\"stepAddModal\" tabindex=\"-1\">" +
      "<div class=\"modal-dialog\"><div class=\"modal-content\">" +
      "<div class=\"modal-header\"><h5 class=\"modal-title\">Añadir paso de implementación</h5><button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\"></button></div>" +
      "<div class=\"modal-body\">" +
      "<div class=\"mb-3\"><label class=\"form-label\">Título</label><input type=\"text\" id=\"step-add-title\" class=\"form-control\" placeholder=\"Título del paso\"></div>" +
      "<div class=\"mb-3\"><label class=\"form-label\">Descripción</label><textarea id=\"step-add-description\" class=\"form-control\" rows=\"2\" placeholder=\"Opcional\"></textarea></div>" +
      "<div id=\"step-add-error\" class=\"alert alert-danger d-none\"></div>" +
      "</div>" +
      "<div class=\"modal-footer\"><button type=\"button\" class=\"btn btn-secondary\" data-bs-dismiss=\"modal\">Cancelar</button><button type=\"button\" class=\"btn btn-nexus-primary\" id=\"step-add-submit\">Añadir paso</button></div>" +
      "</div></div></div>";
  }

  window.WorkOrdersUI = {
    esc: esc,
    badgeClassStatus: badgeClassStatus,
    workOrdersTableRows: workOrdersTableRows,
    tasksTableRows: tasksTableRows,
    stepsListHtml: stepsListHtml,
    deliveriesTableRows: deliveriesTableRows,
    modalCreateWorkOrderHtml: modalCreateWorkOrderHtml,
    modalAddTaskHtml: modalAddTaskHtml,
    modalAddStepHtml: modalAddStepHtml,
    modalCreateDeliveryHtml: modalCreateDeliveryHtml
  };
})();
