/**
 * Work Orders — Vista lista y detalle (ejecución técnica).
 * Rutas: #/projects/:projectId/work-orders  |  #/projects/:projectId/work-orders/:workOrderId
 * Consume WorkOrdersService, StepsAPI, DeliveriesAPI. Nexus UI Kit.
 */
(function () {
  "use strict";

  var NexusUI = window.NexusUI;
  var WorkOrdersService = window.WorkOrdersService;
  var WorkOrdersAPI = window.WorkOrdersAPI;
  var WorkOrdersUI = window.WorkOrdersUI;
  var StepsAPI = window.StepsAPI;
  var DeliveriesAPI = window.DeliveriesAPI;

  function esc(s) {
    return NexusUI && NexusUI.esc ? NexusUI.esc(s) : (s == null ? "" : String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));
  }

  function getStoryTitle(storyId, storiesMap) {
    if (!storiesMap || !storyId) return "—";
    var s = storiesMap[storyId];
    return s ? ((s.number != null ? "US-" + s.number + " " : "") + (s.title || "")).slice(0, 50) || "—" : "—";
  }

  window.registerView("work-orders", async function () {
    await window.showNav();
    var segs = window.getHashSegments();
    var hashRaw = (window.location.hash || "").slice(1);
    var queryPart = hashRaw.indexOf("?") !== -1 ? hashRaw.slice(hashRaw.indexOf("?") + 1) : "";
    var filterUserStoryId = "";
    if (queryPart) {
      queryPart.split("&").forEach(function (pair) {
        var eq = pair.indexOf("=");
        if (eq !== -1 && pair.slice(0, eq) === "user_story_id") filterUserStoryId = decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, " "));
      });
    }
    var projectId = "";
    var workOrderId = "";
    if (segs[0] === "projects" && segs[1] && segs[2] === "work-orders") {
      projectId = segs[1];
      workOrderId = segs[3] || "";
    }
    if (!projectId) {
      window.setContent('<div class="nui-card"><div class="nui-card-body"><p class="text-danger">Proyecto no especificado. Use la ruta #/projects/:projectId/work-orders</p><a href="#/projects" class="btn btn-nexus-primary btn-sm">Ir a Proyectos</a></div></div>');
      return;
    }

    // Feature gating: Work Orders no está disponible en este entorno.
    if (!(window.NEXUS_FEATURES && window.NEXUS_FEATURES.WORK_ORDERS === true)) {
      window.setContent('<div class="nui-card"><div class="nui-card-body"><p class="text-warning mb-2">Módulo no disponible</p><p class="text-muted mb-3">Work Orders no está disponible en este entorno.</p><a href="#/projects/' + esc(projectId) + '" class="btn btn-nexus-primary btn-sm">Volver al proyecto</a></div></div>');
      return;
    }

    var state = {
      projectId: projectId,
      workOrderId: workOrderId,
      filterUserStoryId: filterUserStoryId,
      projectName: "",
      apiUnavailable: false,
      apiUnavailableErrorCode: null,
      workOrder: null,
      tasks: [],
      storiesMap: {},
      deliveries: [],
      expandedTaskId: null,
      stepsByTask: {}
    };

    console.log("WORK_ORDER_UI_LOADED", { projectId: state.projectId, workOrderId: state.workOrderId });

    function renderBreadcrumbs() {
      var parts = [
        { label: "Panel", href: "#/dashboard" },
        { label: "Proyectos", href: "#/projects" },
        { label: state.projectName || state.projectId.slice(0, 8), href: "#/projects/" + encodeURIComponent(state.projectId) + "/work-orders" }
      ];
      if (state.workOrderId && state.workOrder) {
        parts.push({
          label: "OT-" + (state.workOrder.ot_number != null ? state.workOrder.ot_number : "") + " " + (state.workOrder.title || "").slice(0, 30),
          href: "#/projects/" + encodeURIComponent(state.projectId) + "/work-orders/" + encodeURIComponent(state.workOrderId)
        });
      }
      return window.renderBreadcrumbs ? window.renderBreadcrumbs(parts) : "";
    }

    function renderList() {
      var html = renderBreadcrumbs();
      var subtitle = "Proyecto: " + esc(state.projectName || state.projectId);
      if (state.filterUserStoryId) {
        var storyTitle = getStoryTitle(state.filterUserStoryId, state.storiesMap);
        subtitle += " · Filtrado por historia: " + esc(storyTitle);
      }
      html += NexusUI && NexusUI.viewHeader ? NexusUI.viewHeader({
        title: "Órdenes de trabajo",
        subtitle: subtitle,
        actionsHtml: (state.filterUserStoryId ? '<a href="#/projects/' + encodeURIComponent(state.projectId) + '/work-orders" class="btn btn-outline-secondary btn-sm me-2">Quitar filtro</a>' : '') + (state.apiUnavailable ? "" : '<button type="button" class="btn btn-nexus-primary" id="wo-create-btn">Crear orden de trabajo</button>')
      }) : '<div class="nui-view-header"><h1 class="nui-view-header-title">Órdenes de trabajo</h1>' + (state.filterUserStoryId ? '<a href="#/projects/' + encodeURIComponent(state.projectId) + '/work-orders" class="btn btn-outline-secondary btn-sm me-2">Quitar filtro</a>' : '') + (state.apiUnavailable ? "" : '<button type="button" class="btn btn-nexus-primary" id="wo-create-btn">Crear orden de trabajo</button>') + '</div>';

      if (state.apiUnavailable) {
        var code = state.apiUnavailableErrorCode;
        if (code === "AUTH_UNAUTHORIZED") {
          html += '<div class="alert alert-warning mb-3">Sesión expirada. Inicia sesión para acceder a Work Orders.</div>';
        } else if (code === "AUTH_FORBIDDEN") {
          html += '<div class="alert alert-warning mb-3">No tienes permisos para acceder a Work Orders.</div>';
        } else {
          html += '<div class="alert alert-warning mb-3">Work Orders no está disponible en este backend (rutas API no expuestas).</div>';
        }
      }

      var tableBody = state.workOrdersList && state.workOrdersList.length
        ? WorkOrdersUI.workOrdersTableRows(state.workOrdersList, state.projectId, function (storyId) { return getStoryTitle(storyId, state.storiesMap); })
        : "<tr><td colspan=\"7\" class=\"text-center text-muted\">No hay work orders. Cree una para comenzar.</td></tr>";
      html += '<section class="nui-card"><div class="nui-card-body table-responsive"><table class="table table-hover nexus-table">';
      html += "<thead><tr><th>OT</th><th>Título</th><th>Historia de usuario</th><th>Estado</th><th>Tareas</th><th>Creado</th><th>Acciones</th></tr></thead><tbody>" + tableBody + "</tbody></table></div></section>";

      html += WorkOrdersUI.modalCreateWorkOrderHtml(state.projectId, state.userStoriesForProject || [], state.selectedStoryIdForCreate || "");

      window.setContent(html);

      var woCreateBtn = document.getElementById("wo-create-btn");
      if (woCreateBtn) {
        woCreateBtn.onclick = function () {
          loadStoriesForModal();
          var modal = new bootstrap.Modal(document.getElementById("workOrderCreateModal"));
          modal.show();
        };
      }

      document.getElementById("wo-create-submit").onclick = function () {
        var titleEl = document.getElementById("wo-create-title");
        var descEl = document.getElementById("wo-create-description");
        var storyEl = document.getElementById("wo-create-user-story");
        var errEl = document.getElementById("wo-create-error");
        var title = (titleEl && titleEl.value || "").trim();
        var userStoryId = storyEl && storyEl.value ? storyEl.value.trim() : "";
        if (!title) {
          if (errEl) { errEl.textContent = "El título es obligatorio."; errEl.classList.remove("d-none"); }
          return;
        }
        if (!userStoryId) {
          if (errEl) { errEl.textContent = "Seleccione una historia de usuario."; errEl.classList.remove("d-none"); }
          return;
        }
        if (errEl) errEl.classList.add("d-none");
        WorkOrdersService.createWorkOrder(state.projectId, {
          title: title,
          description: (descEl && descEl.value || "").trim() || undefined,
          user_story_id: userStoryId || undefined
        }).then(function (res) {
          if (res && res.success && res.data && res.data.id) {
            bootstrap.Modal.getInstance(document.getElementById("workOrderCreateModal")).hide();
            state.workOrdersList = [res.data].concat(state.workOrdersList || []);
            renderList();
          } else {
            if (errEl) { errEl.textContent = (res && res.error && res.error.message) || "Error al crear la work order."; errEl.classList.remove("d-none"); }
          }
        }).catch(function () {
          if (errEl) { errEl.textContent = "Error de red."; errEl.classList.remove("d-none"); }
        });
      };

      if (typeof window.nexusCreateIcons === "function") setTimeout(window.nexusCreateIcons, 0);
    }

    function loadStoriesForModal() {
      window.fetchApi("/projects/" + state.projectId + "/backlog?page=1&limit=200").then(function (res) {
        if (!res || !res.success || !res.data) return;
        var stories = (res.data.stories || []).slice(0, 100);
        state.userStoriesForProject = stories;
        state.storiesMap = {};
        stories.forEach(function (s) { state.storiesMap[s.id] = s; });
        var sel = document.getElementById("wo-create-user-story");
        if (sel) {
          sel.innerHTML = stories.map(function (s) {
            return "<option value=\"" + esc(s.id) + "\">" + esc((s.number != null ? "US-" + s.number + " " : "") + (s.title || s.id).slice(0, 50)) + "</option>";
          }).join("");
        }
      });
    }

    function renderDetail() {
      if (state.apiUnavailable) {
        var code = state.apiUnavailableErrorCode;
        var text = "Work Orders no está disponible en este backend (rutas API no expuestas).";
        if (code === "AUTH_UNAUTHORIZED") text = "Sesión expirada. Inicia sesión para continuar.";
        else if (code === "AUTH_FORBIDDEN") text = "No tienes permisos para acceder a Work Orders.";
        window.setContent(renderBreadcrumbs() + '<div class="nui-card"><div class="nui-card-body"><p class="text-warning mb-2">' + esc(text) + '</p><a href="#/projects/' + encodeURIComponent(state.projectId) + '/work-orders" class="btn btn-outline-secondary btn-sm">Volver</a></div></div>');
        return;
      }
      var wo = state.workOrder;
      if (!wo) {
        window.setContent(renderBreadcrumbs() + '<div class="nui-card"><div class="nui-card-body"><p class="text-danger">Orden de trabajo no encontrada.</p><a href="#/projects/' + encodeURIComponent(state.projectId) + '/work-orders" class="btn btn-nexus-primary btn-sm">Volver a órdenes de trabajo</a></div></div>');
        return;
      }

      var html = renderBreadcrumbs();
      html += '<div class="nui-view-header"><div class="nui-view-header-left">';
      html += '<h1 class="nui-view-header-title">OT-' + (wo.ot_number != null ? wo.ot_number : "") + " " + esc(wo.title || "") + "</h1>";
      html += '<p class="nui-view-header-subtitle">Estado: <span class="' + (WorkOrdersUI.badgeClassStatus(wo.status)) + '">' + esc(wo.status || "") + "</span></p>";
      html += "</div><div class=\"nui-view-header-actions\"><a href=\"#/projects/" + encodeURIComponent(state.projectId) + "/work-orders\" class=\"btn btn-outline-secondary btn-sm\">Volver al listado</a></div></div>";

      html += '<section class="nui-card"><div class="nui-card-header"><h2 class="nui-card-title">Tareas</h2><div class="nui-card-header-right"><button type="button" class="btn btn-nexus-primary btn-sm" id="wo-add-task">Añadir tarea</button></div></div><div class="nui-card-body table-responsive">';
      var taskRows = state.tasks.length
        ? WorkOrdersUI.tasksTableRows(state.tasks, state.projectId, state.workOrderId, function (taskId) {
            var arr = state.stepsByTask[taskId];
            return arr ? arr.length : null;
          })
        : "<tr><td colspan=\"4\" class=\"text-center text-muted\">No hay tareas. Añada una para comenzar.</td></tr>";
      html += '<table class="table table-hover nexus-table"><thead><tr><th>Tarea</th><th>Estado</th><th>Pasos</th><th>Acciones</th></tr></thead><tbody id="wo-tasks-tbody">' + taskRows + "</tbody></table></div></section>";

      html += '<section class="nui-card" id="wo-steps-section"><div class="nui-card-header"><h2 class="nui-card-title">Pasos de implementación</h2></div><div class="nui-card-body" id="wo-steps-body">';
      if (state.expandedTaskId) {
        var steps = state.stepsByTask[state.expandedTaskId] || [];
        var expandedTask = (state.tasks || []).find(function (t) { return t.id === state.expandedTaskId; });
        var taskLabel = expandedTask ? ("TASK-" + (expandedTask.task_number != null ? expandedTask.task_number : "") + " " + (expandedTask.title || "")).trim() || state.expandedTaskId : state.expandedTaskId;
        html += '<p class="nexus-text-sm text-muted mb-2">Tarea: ' + esc(taskLabel) + '</p>';
        html += WorkOrdersUI.stepsListHtml(steps, state.projectId, state.workOrderId);
        if (steps.length === 0) html += '<p class="nexus-text-sm text-muted mb-0">No hay pasos. Use &quot;Añadir paso&quot; en la tarea.</p>';
      } else {
        html += '<p class="nexus-text-sm text-muted mb-0">Seleccione &quot;Ver pasos&quot; en una tarea para ver y ejecutar los pasos.</p>';
      }
      html += "</div></section>";

      html += '<section class="nui-card"><div class="nui-card-header"><h2 class="nui-card-title">Entregas de código</h2><div class="nui-card-header-right">' + (state.tasks.length ? '<button type="button" class="btn btn-nexus-primary btn-sm" id="wo-add-delivery">Crear entrega</button>' : '') + '</div></div><div class="nui-card-body table-responsive">';
      var delRows = state.deliveries.length
        ? WorkOrdersUI.deliveriesTableRows(state.deliveries, state.projectId)
        : "<tr><td colspan=\"4\" class=\"text-center text-muted\">No hay entregas de código para esta orden.</td></tr>";
      html += '<table class="table table-hover nexus-table"><thead><tr><th>Entrega</th><th>Tipo</th><th>Rama</th><th>Estado</th></tr></thead><tbody>' + delRows + "</tbody></table></div></section>";

      html += WorkOrdersUI.modalAddTaskHtml();
      html += WorkOrdersUI.modalAddStepHtml();
      html += WorkOrdersUI.modalCreateDeliveryHtml(state.tasks);

      window.setContent(html);

      var tbody = document.getElementById("wo-tasks-tbody");
      if (tbody) {
        tbody.querySelectorAll("[id^=\"wo-task-steps-\"]").forEach(function (btn) {
          var taskId = btn.id.replace("wo-task-steps-", "");
          btn.onclick = function () {
            state.expandedTaskId = state.expandedTaskId === taskId ? null : taskId;
            if (state.expandedTaskId) loadStepsForTask(state.expandedTaskId);
            renderDetail();
          };
        });
        tbody.querySelectorAll("[id^=\"wo-task-addstep-\"]").forEach(function (btn) {
          var taskId = btn.id.replace("wo-task-addstep-", "");
          btn.onclick = function () {
            state.addStepTaskId = taskId;
            var modal = new bootstrap.Modal(document.getElementById("stepAddModal"));
            modal.show();
          };
        });
      }

      var woAddTask = document.getElementById("wo-add-task");
      if (woAddTask) woAddTask.onclick = function () {
        var taskTitleEl = document.getElementById("task-add-title");
        var taskDescEl = document.getElementById("task-add-description");
        var taskErrEl = document.getElementById("task-add-error");
        if (taskTitleEl) taskTitleEl.value = "";
        if (taskDescEl) taskDescEl.value = "";
        if (taskErrEl) { taskErrEl.classList.add("d-none"); taskErrEl.textContent = ""; }
        var modal = new bootstrap.Modal(document.getElementById("taskAddModal"));
        modal.show();
      };

      var taskAddSubmit = document.getElementById("task-add-submit");
      if (taskAddSubmit) taskAddSubmit.onclick = function () {
        var titleEl = document.getElementById("task-add-title");
        var descEl = document.getElementById("task-add-description");
        var errEl = document.getElementById("task-add-error");
        var title = (titleEl && titleEl.value || "").trim();
        if (!title) {
          if (errEl) { errEl.textContent = "El título es obligatorio."; errEl.classList.remove("d-none"); }
          return;
        }
        if (errEl) errEl.classList.add("d-none");
        WorkOrdersService.createTask(state.projectId, {
          work_order_id: state.workOrderId,
          title: title,
          description: (descEl && descEl.value || "").trim() || undefined,
          user_story_id: wo.user_story_id || undefined
        }).then(function (res) {
          if (res && res.success && res.data) {
            console.log("TASK_CREATED_UI", { taskId: res.data.id, workOrderId: state.workOrderId });
            var taskModal = document.getElementById("taskAddModal");
            if (taskModal && bootstrap.Modal.getInstance(taskModal)) bootstrap.Modal.getInstance(taskModal).hide();
            state.tasks = (state.tasks || []).concat([res.data]);
            renderDetail();
          } else {
            if (errEl) { errEl.textContent = (res && res.error && res.error.message) || "Error al crear la tarea."; errEl.classList.remove("d-none"); }
          }
        }).catch(function () {
          if (errEl) { errEl.textContent = "Error de red."; errEl.classList.remove("d-none"); }
        });
      };

      var woAddDelivery = document.getElementById("wo-add-delivery");
      if (woAddDelivery) woAddDelivery.onclick = function () {
        var modal = new bootstrap.Modal(document.getElementById("deliveryCreateModal"));
        modal.show();
      };

      var deliverySubmit = document.getElementById("delivery-create-submit");
      if (deliverySubmit) deliverySubmit.onclick = function () {
        var taskEl = document.getElementById("delivery-create-task");
        var titleEl = document.getElementById("delivery-create-title");
        var typeEl = document.getElementById("delivery-create-type");
        var errEl = document.getElementById("delivery-create-error");
        var taskId = taskEl && taskEl.value ? taskEl.value.trim() : "";
        var title = (titleEl && titleEl.value || "").trim();
        if (!taskId || !title) {
          if (errEl) { errEl.textContent = "Seleccione tarea e ingrese título."; errEl.classList.remove("d-none"); }
          return;
        }
        if (errEl) errEl.classList.add("d-none");
        DeliveriesAPI.createDelivery(state.projectId, {
          task_id: taskId,
          work_order_id: state.workOrderId,
          title: title,
          delivery_type: (typeEl && typeEl.value) || "FEATURE"
        }).then(function (res) {
          if (res && res.success && res.data) {
            console.log("DELIVERY_CREATED_UI", { deliveryId: res.data.id, workOrderId: state.workOrderId });
            bootstrap.Modal.getInstance(document.getElementById("deliveryCreateModal")).hide();
            state.deliveries = (state.deliveries || []).concat([res.data]);
            renderDetail();
          } else {
            if (errEl) { errEl.textContent = (res && res.error && res.error.message) || "Error al crear la entrega."; errEl.classList.remove("d-none"); }
          }
        }).catch(function () {
          if (errEl) { errEl.textContent = "Error de red."; errEl.classList.remove("d-none"); }
        });
      };

      var stepAddSubmit = document.getElementById("step-add-submit");
      if (stepAddSubmit) stepAddSubmit.onclick = function () {
        var titleEl = document.getElementById("step-add-title");
        var descEl = document.getElementById("step-add-description");
        var taskId = state.addStepTaskId;
        if (!taskId || !titleEl || !titleEl.value.trim()) return;
        StepsAPI.createStep(state.projectId, state.workOrderId, taskId, {
          title: titleEl.value.trim(),
          description: (descEl && descEl.value || "").trim() || undefined
        }).then(function (res) {
          if (res && res.success && res.data) {
            var stepModal = document.getElementById("stepAddModal");
            if (stepModal && bootstrap.Modal.getInstance(stepModal)) bootstrap.Modal.getInstance(stepModal).hide();
            if (!state.stepsByTask[taskId]) state.stepsByTask[taskId] = [];
            state.stepsByTask[taskId].push(res.data);
            state.expandedTaskId = taskId;
            renderDetail();
          }
        });
      };

      document.querySelectorAll("[id^=\"step-start-\"]").forEach(function (btn) {
        var stepId = btn.id.replace("step-start-", "");
        btn.onclick = function () {
          StepsAPI.startStep(state.projectId, state.workOrderId, stepId).then(function (res) {
            if (res && res.success && res.data) {
              console.log("STEP_STARTED_UI", { stepId: stepId });
              updateStepInState(stepId, res.data);
              renderDetail();
            }
          });
        };
      });
      document.querySelectorAll("[id^=\"step-complete-\"]").forEach(function (btn) {
        var stepId = btn.id.replace("step-complete-", "");
        btn.onclick = function () {
          StepsAPI.completeStep(state.projectId, state.workOrderId, stepId).then(function (res) {
            if (res && res.success && res.data) {
              console.log("STEP_COMPLETED_UI", { stepId: stepId });
              updateStepInState(stepId, res.data);
              renderDetail();
            }
          });
        };
      });
      document.querySelectorAll("[id^=\"step-fail-\"]").forEach(function (btn) {
        var stepId = btn.id.replace("step-fail-", "");
        btn.onclick = function () {
          StepsAPI.failStep(state.projectId, state.workOrderId, stepId).then(function (res) {
            if (res && res.success && res.data) {
              updateStepInState(stepId, res.data);
              renderDetail();
            }
          });
        };
      });

      if (typeof window.nexusCreateIcons === "function") setTimeout(window.nexusCreateIcons, 0);
    }

    function updateStepInState(stepId, stepData) {
      for (var taskId in state.stepsByTask) {
        var arr = state.stepsByTask[taskId];
        for (var i = 0; i < arr.length; i++) {
          if (arr[i].id === stepId) { arr[i] = stepData; return; }
        }
      }
    }

    function loadStepsForTask(taskId) {
      StepsAPI.listByTask(state.projectId, state.workOrderId, taskId, { page: 1, limit: 50 }).then(function (res) {
        if (!res || !res.success) return;
        var data = res.data && res.data.data ? res.data.data : (res.data && Array.isArray(res.data) ? res.data : []);
        state.stepsByTask[taskId] = data;
        renderDetail();
      });
    }

    if (!state.workOrderId) {
      window.setContent(window.showLoading ? window.showLoading() : "<p>Cargando…</p>");
      window.fetchApi("/projects/" + state.projectId + "/work-orders?page=1&limit=1")
        .then(function (probe) {
          state.apiUnavailable = !(probe && probe.success);
          state.apiUnavailableErrorCode = probe && probe.error && probe.error.code ? probe.error.code : null;
        })
        .catch(function () {
          state.apiUnavailable = true;
          state.apiUnavailableErrorCode = null;
        })
        .then(function () {
          if (state.apiUnavailable) {
            window.fetchApi("/projects/" + state.projectId).then(function (r) {
              if (r && r.success && r.data) state.projectName = r.data.name || r.data.title || state.projectId;
              state.workOrdersList = [];
              renderList();
            }).catch(function () {
              state.workOrdersList = [];
              renderList();
            });
            return;
          }
          var listParams = { page: 1, limit: 50 };
          if (state.filterUserStoryId) listParams.user_story_id = state.filterUserStoryId;
          window.fetchApi("/projects/" + state.projectId).then(function (r) {
            if (r && r.success && r.data) state.projectName = r.data.name || r.data.title || state.projectId;
            return WorkOrdersService.listWorkOrders(state.projectId, listParams);
          }).then(function (listResult) {
            state.workOrdersList = (listResult && listResult.data) ? listResult.data : [];
            return window.fetchApi("/projects/" + state.projectId + "/backlog?page=1&limit=200");
          }).then(function (backlogRes) {
            if (backlogRes && backlogRes.success && backlogRes.data && backlogRes.data.stories) {
              backlogRes.data.stories.forEach(function (s) { state.storiesMap[s.id] = s; });
            }
            renderList();
          }).catch(function () {
            state.workOrdersList = [];
            renderList();
          });
        });
      return;
    }

    window.fetchApi("/projects/" + state.projectId + "/work-orders?page=1&limit=1")
      .then(function (probe) {
        state.apiUnavailable = !(probe && probe.success);
        state.apiUnavailableErrorCode = probe && probe.error && probe.error.code ? probe.error.code : null;
      })
      .catch(function () {
        state.apiUnavailable = true;
        state.apiUnavailableErrorCode = null;
      })
      .then(function () {
        if (state.apiUnavailable) {
          renderDetail();
          return;
        }
        Promise.allSettled([
          window.fetchApi("/projects/" + state.projectId).then(function (r) { if (r && r.success && r.data) state.projectName = r.data.name || r.data.title; }),
          WorkOrdersAPI.getWorkOrder(state.projectId, state.workOrderId).then(function (res) {
            if (res && res.success && res.data) state.workOrder = res.data;
            else state.workOrderError = (res && res.error && res.error.message) ? res.error.message : "Orden de trabajo no encontrada.";
          }),
          WorkOrdersService.listTasks(state.projectId, state.workOrderId, { page: 1, limit: 50 }).then(function (r) { state.tasks = (r && r.data) ? r.data : []; }),
          DeliveriesAPI.listDeliveries(state.projectId, { page: 1, limit: 50 }).then(function (res) {
            if (!res || !res.success || !res.data) return;
            var raw = res.data.data != null ? res.data.data : (res.data.items != null ? res.data.items : (Array.isArray(res.data) ? res.data : []));
            state.deliveries = Array.isArray(raw) ? raw.filter(function (d) { return d && d.work_order_id === state.workOrderId; }) : [];
          })
        ]).then(function (results) {
      var errMsg = state.workOrderError || null;
      if (!errMsg && results[1] && results[1].status === "rejected") {
        errMsg = (results[1].reason && results[1].reason.message) || "Error al cargar la orden de trabajo.";
      }
      if (!errMsg && !state.workOrder) errMsg = "Orden de trabajo no encontrada.";
      if (errMsg) {
        window.setContent(renderBreadcrumbs() + '<div class="nui-card"><div class="nui-card-body"><p class="text-danger">' + esc(errMsg) + '</p><a href="#/projects/' + encodeURIComponent(state.projectId) + '/work-orders" class="btn btn-nexus-primary btn-sm">Volver</a></div></div>');
        return;
      }
      renderDetail();
        }).catch(function (err) {
          var msg = (err && err.message) || (err && err.error && err.error.message) || "Error al cargar la orden de trabajo.";
          if (err && err.error && err.error.message) msg = err.error.message;
          window.setContent(renderBreadcrumbs() + '<div class="nui-card"><div class="nui-card-body"><p class="text-danger">' + esc(msg) + '</p><a href="#/projects/' + encodeURIComponent(state.projectId) + '/work-orders" class="btn btn-nexus-primary btn-sm">Volver</a></div></div>');
        });
      });
  });
})();
