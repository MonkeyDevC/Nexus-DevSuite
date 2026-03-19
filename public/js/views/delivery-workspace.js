/**
 * Delivery Workspace — Vista #/projects/:projectId/deliveries/:deliveryId/workspace
 * Subir archivos, editar y Commit & Push sin Git local.
 */
(function () {
  "use strict";

  var NexusUI = window.NexusUI;
  var DeliveryWorkspaceAPI = window.DeliveryWorkspaceAPI;

  function esc(s) {
    return NexusUI && NexusUI.esc ? NexusUI.esc(s) : (s == null ? "" : String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));
  }

  window.registerView("delivery-workspace", async function () {
    await window.showNav();
    if (!window.DeliveryWorkspaceAPI) {
      console.warn("DeliveryWorkspace API no integrada aún (backend pendiente)");
      return;
    }
    var segs = window.getHashSegments();
    var projectId = "";
    var deliveryId = "";
    if (segs[0] === "projects" && segs[1] && segs[2] === "deliveries" && segs[3] && segs[4] === "workspace") {
      projectId = segs[1];
      deliveryId = segs[3];
    }
    if (!projectId || !deliveryId) {
      window.setContent('<div class="nui-card"><div class="nui-card-body"><p class="text-danger">Ruta inválida. Use #/projects/:projectId/deliveries/:deliveryId/workspace</p><a href="#/projects" class="btn btn-nexus-primary btn-sm">Ir a Proyectos</a></div></div>');
      return;
    }

    var state = {
      projectId: projectId,
      deliveryId: deliveryId,
      delivery: null,
      files: [],
      commits: [],
      review: null,
      selectedFileId: null,
      selectedFileContent: "",
      commitMessage: "feat: delivery from Nexus DevSuite",
      gitStatusRaw: "",
      gitStatusPaths: [],
      folderMatchStats: null,
      folderFiles: [],
      pathPrefixToStrip: "",
      folderFileName: "",
      gitDetectedFiles: [],
      gitStagedOnly: false,
      gitAvailable: false,
      gitExpectedHead: "",
      gitSyncWarning: false,
      gitHeadHash: "",
      gitBranch: "",
      otherDeliveries: [],
      reviewComments: [],
      deliveryReviews: [],
      myDeliveryReview: null,
      canMerge: null
    };

    /**
     * Parsea la salida de 'git status' o 'git status --short' y devuelve array de rutas (normalizadas con /).
     */
    function parseGitStatusOutput(text) {
      var paths = [];
      var seen = {};
      function add(p) {
        p = (p || "").replace(/\\/g, "/").trim();
        // Normaliza "./foo" -> "foo"
        if (p.indexOf("./") === 0) p = p.slice(2);
        if (!p || seen[p]) return;
        seen[p] = true;
        paths.push(p);
      }
      var lines = (text || "").split(/\r?\n/);
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var t = line.trim();
        if (!t) continue;
        if (t.indexOf("modified:") === 0 || t.indexOf("new file:") === 0 || t.indexOf("deleted:") === 0 || t.indexOf("renamed:") === 0) {
          var colon = line.indexOf(":");
          if (colon !== -1) {
            var rest = line.slice(colon + 1).trim();
            var arrow = rest.indexOf("->");
            if (arrow !== -1) {
              add(rest.slice(arrow + 2).trim());
              add(rest.slice(0, arrow).trim());
            } else {
              add(rest);
            }
          }
          continue;
        }
        if (t.length >= 3 && /^.[\sMARCUD?!?]./.test(t)) {
          // Soporta 'git status --short' incluso si el usuario pegó líneas sin espacios iniciales.
          // Ejemplos: " M file.js", "M file.js" (trim), "?? file.js", "R  old -> new"
          var m = t.match(/^(\S{1,2})\s+(.*)$/);
          var rest = m ? m[2].trim() : t.replace(/^..?\s+/, "").trim();
          var arrow = rest.indexOf("->");
          if (arrow !== -1) {
            add(rest.slice(arrow + 2).trim());
            add(rest.slice(0, arrow).trim());
          } else {
            add(rest);
          }
        }
      }
      return paths;
    }

    function getApiBase() {
      return (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ? window.APP_CONFIG.API_BASE : "/api/v1";
    }

    function loadDelivery() {
      return DeliveryWorkspaceAPI.getDelivery(projectId, deliveryId).then(function (r) {
        if (r && r.success && r.data) state.delivery = r.data;
        return state.delivery;
      });
    }

    function loadFiles() {
      return DeliveryWorkspaceAPI.listFiles(projectId, deliveryId).then(function (r) {
        state.files = (r && r.success && r.data) ? r.data : [];
        return state.files;
      });
    }

    function loadCommits() {
      return DeliveryWorkspaceAPI.listCommits(projectId, deliveryId).then(function (r) {
        state.commits = (r && r.success && r.data) ? r.data : [];
        return state.commits;
      });
    }

    function loadReview() {
      return DeliveryWorkspaceAPI.getAIReview(projectId, deliveryId).then(function (r) {
        state.review = (r && r.success && r.data && r.data.review_id) ? r.data : null;
        return state.review;
      }).catch(function () { state.review = null; return null; });
    }

    function loadOtherDeliveries() {
      return window.fetchApi("/projects/" + projectId + "/code-deliveries?page=1&limit=100").then(function (r) {
        if (r && r.success && r.data) state.otherDeliveries = r.data.data || r.data.items || [];
        return state.otherDeliveries;
      }).catch(function () { state.otherDeliveries = []; return []; });
    }

    function loadReviewComments() {
      return DeliveryWorkspaceAPI.listReviewComments(projectId, deliveryId).then(function (r) {
        state.reviewComments = (r && r.success && r.data) ? r.data : [];
        return state.reviewComments;
      }).catch(function () { state.reviewComments = []; return []; });
    }

    function loadDeliveryReviews() {
      return DeliveryWorkspaceAPI.listDeliveryReviews(projectId, deliveryId).then(function (r) {
        state.deliveryReviews = (r && r.success && r.data) ? r.data : [];
        return state.deliveryReviews;
      }).catch(function () { state.deliveryReviews = []; return []; });
    }

    function loadMyDeliveryReview() {
      return DeliveryWorkspaceAPI.getMyDeliveryReview(projectId, deliveryId).then(function (r) {
        state.myDeliveryReview = (r && r.success && r.data && r.data.review) ? r.data.review : null;
        return state.myDeliveryReview;
      }).catch(function () { state.myDeliveryReview = null; return null; });
    }

    function loadCanMerge() {
      return DeliveryWorkspaceAPI.canMergeDelivery(projectId, deliveryId).then(function (r) {
        state.canMerge = (r && r.success && r.data) ? r.data : null;
        return state.canMerge;
      }).catch(function () { state.canMerge = null; return null; });
    }

    function render() {
      var d = state.delivery;
      var html = "";
      html += '<nav aria-label="Breadcrumb" class="mb-3"><ol class="breadcrumb">';
      html += '<li class="breadcrumb-item"><a href="#/projects">Proyectos</a></li>';
      html += '<li class="breadcrumb-item"><a href="#/projects/' + esc(projectId) + '/repository">Repository</a></li>';
      html += '<li class="breadcrumb-item active">Delivery Workspace</li></ol></nav>';

      // HEADER (tipo GitHub/GitLab) — FASE 1: badge de estado (READY/LOCKED/DRAFT/COMMITTED…)
      var deliveryStatus = (d && d.status) ? String(d.status).toUpperCase() : "";
      var statusBadgeClass = deliveryStatus === "READY" ? "bg-success" : deliveryStatus === "LOCKED" ? "bg-secondary" : deliveryStatus === "COMMITTED" || deliveryStatus === "PR_CREATED" || deliveryStatus === "MERGED" ? "bg-info" : "bg-warning text-dark";
      html += '<div class="nui-view-header" style="position:sticky;top:0;z-index:10;background:var(--nui-bg-page, #fff);padding:0.5rem 0;">';
      html += '<div>';
      html += '<h1 class="nui-view-header-title">Delivery Workspace</h1>';
      html += '<p class="nui-view-header-subtitle mb-0">' + esc(d ? d.title : "—") + ' · <code>' + esc(d && d.branch_name ? d.branch_name : "—") + '</code>';
      if (deliveryStatus) html += ' <span class="badge ' + statusBadgeClass + ' ms-1">' + esc(deliveryStatus) + '</span>';
      html += '</p>';
      html += "</div>";
      var filesChanged = (state.files && state.files.length) ? state.files.length : 0;
      html += '<div class="nui-view-header-actions">';
      html += '<span class="badge bg-light text-dark border">Files: ' + esc(filesChanged) + "</span>";
      html += '<button type="button" class="btn btn-outline-secondary btn-sm" id="dw-btn-analyze">Analyze Changes</button>';
      html += '<button type="button" class="btn btn-outline-secondary btn-sm" id="dw-btn-commitmsg">Generate Commit</button>';
      html += '<button type="button" class="btn btn-nexus-primary btn-sm" id="dw-btn-push">Push to GitHub</button>';
      html += "</div></div>";

      // LAYOUT 2-PANE: Sidebar | Details (ocupa el espacio disponible)
      html += '<div class="d-flex gap-3" style="align-items:stretch;height:calc(100vh - 200px);min-height:620px;">';

      // SIDEBAR IZQUIERDO: scroll solo en el listado de archivos tras elegir carpeta; la sección Upload sin scroll
      html += '<div style="flex:1 1 55%;min-width:360px;display:flex;flex-direction:column;gap:0.75rem;overflow-y:auto;min-height:0;">';
      var isLocked = (d && String((d.status || "")).toUpperCase() === "LOCKED");
      var canEditFiles = !isLocked;

      html += '<div class="nui-card" style="flex:0 0 300px;display:flex;flex-direction:column;min-height:0;">';
      html += '<div class="nui-card-header d-flex align-items-center gap-2" style="flex-wrap:nowrap;">';
      html += '<h2 class="nui-card-title mb-0" style="flex:0 0 auto;">Files</h2>';
      if (state.files.length) {
        html +=
          '<div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0" style="flex:1 1 auto;">' +
          '<span class="small text-muted" style="white-space:nowrap;">Incluir en commit:</span>' +
          '<div class="d-flex align-items-center gap-1" style="white-space:nowrap;">' +
          '<button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2" id="dw-select-all-files">Todos</button>' +
          '<button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2" id="dw-deselect-all-files">Ninguno</button>' +
          "</div>" +
          "</div>";
      } else {
        html += '<div class="flex-grow-1" style="flex:1 1 auto;"></div>';
      }
      html += '<div class="d-flex align-items-center gap-2 ms-auto" style="flex:0 0 auto;">';
      html += '<button type="button" class="btn btn-outline-secondary btn-sm" id="dw-open-diff-from-files"' + (state.files && state.files.length && canEditFiles ? "" : " disabled") + '>Diff</button>';
      html += '<button type="button" class="btn btn-outline-danger btn-sm" id="dw-clear-files"' + (state.files && state.files.length && canEditFiles ? "" : " disabled") + '>Limpiar entrega</button>';
      html += "</div>";
      html += "</div>";
      if (isLocked) html += '<div class="nui-card-body py-1"><p class="small text-warning mb-0">Entrega bloqueada (LOCKED). No se pueden modificar archivos ni sincronizar desde Git.</p></div>';
      html += '<div class="nui-card-body" style="min-height:0;overflow:auto;">';
      html += '<ul class="list-group list-group-flush" id="dw-files-list">';
      state.files.forEach(function (f) {
        var filePath = (f.file_path || "").trim();
        // Grid fijo para alinear: [checkbox] [nombre] [badge estado] [botón]
        html +=
          '<li class="list-group-item list-group-item-action" data-file-id="' +
          esc(f.id) +
          '" style="display:grid;grid-template-columns: 28px minmax(0,1fr) auto auto;align-items:center;gap:12px;">';
        html += '<input type="checkbox" class="form-check-input dw-file-cb" data-file-path="' + esc(filePath) + '" id="dw-cb-file-' + esc(f.id) + '" checked>';
        html += '<div class="d-flex align-items-center gap-2" style="min-width:0;">';
        html +=
          '<label class="form-check-label mb-0 text-truncate" style="min-width:0;flex:1 1 auto;" for="dw-cb-file-' +
          esc(f.id) +
          '"><code class="nexus-text-sm">' +
          esc(filePath) +
          '</code></label>';
        if ((f.status === "RENAMED" || f.status === "COPIED") && f.old_file_path) html += '<span class="text-muted small" style="flex:0 0 auto">(desde ' + esc(f.old_file_path) + ')</span>';
        html += "</div>";
        var statusBadge = f.status === "ADDED" ? "bg-success" : f.status === "MODIFIED" ? "bg-warning text-dark" : f.status === "DELETED" ? "bg-danger" : f.status === "RENAMED" ? "bg-info" : f.status === "COPIED" ? "bg-info" : "bg-secondary";
        html += '<span class="badge ' + statusBadge + '" style="justify-self:end;">' + esc(f.status || "") + "</span>";
        html +=
          '<button type="button" class="btn btn-outline-danger btn-sm py-0 px-2" data-delete-file-id="' +
          esc(f.id) +
          '" title="Quitar de la entrega"' +
          (canEditFiles ? "" : " disabled") +
          ' style="justify-self:end;">Quitar</button>';
        html += "</li>";
      });
      if (!state.files.length) html += '<li class="list-group-item text-muted">Aún no hay archivos.</li>';
      html += "</ul></div></div>";

      html += '<div class="nui-card" style="flex:0 0 auto;">';
      html += '<div class="nui-card-header"><h2 class="nui-card-title mb-0">Subir entrega (Git como fuente de verdad)</h2></div>';
      html += '<div class="nui-card-body">';
      html += '<div class="mb-3 p-2 rounded border border-primary"><strong class="d-block mb-2">Detectar desde Git (servidor)</strong>';
      html += '<p class="text-muted small mb-2">El servidor usa <code>git diff HEAD --name-status</code> y <code>git diff --cached --name-status</code> (staged) más <code>git status --porcelain</code> para untracked. Coincide con Git (Cursor). Respeta .gitignore.</p>';
      html += '<div class="mb-2"><label class="form-check form-check-inline"><input type="radio" class="form-check-input" name="dw-git-scope" value="all"' + (state.gitStagedOnly ? "" : " checked") + '> Incluir working directory</label>';
      html += '<label class="form-check form-check-inline"><input type="radio" class="form-check-input" name="dw-git-scope" value="staged"' + (state.gitStagedOnly ? " checked" : "") + '> Solo staged</label></div>';
      html += '<div class="mb-2"><label class="form-label small">HEAD local (opcional)</label>';
      html += '<input type="text" id="dw-expected-head" class="form-control form-control-sm font-monospace" placeholder="ej. abc1234 (git rev-parse HEAD)" value="' + esc(state.gitExpectedHead) + '">';
      html += '<small class="text-muted">Si lo indicas, se validará que el servidor esté sincronizado con tu entorno.</small></div>';
      html += '<div class="d-flex flex-wrap gap-2 align-items-center mb-2">';
      html += '<button type="button" class="btn btn-nexus-primary btn-sm" id="dw-detect-git"' + (canEditFiles ? "" : " disabled") + '>Detectar archivos</button>';
      if (state.gitDetectedFiles.length) {
        html += '<span class="small text-success"><strong>' + state.gitDetectedFiles.length + ' archivos detectados</strong> (igual que Git)</span>';
        if (state.gitHeadHash) html += ' <span class="small text-muted">HEAD ' + esc(state.gitHeadHash.slice(0, 7)) + '</span>';
      }
      if (state.gitSyncWarning) {
        html += '<div class="w-100 alert alert-warning small mb-0 mt-1">El repositorio del servidor no está sincronizado con tu entorno local.</div>';
      }
      if (state.gitDetectedFiles.length === 0 && state.gitAvailable === false && state.gitStatusRaw === "" && !state.folderFiles.length) {
        html += '<span class="small text-warning">Si Git no está configurado en el servidor, usa el método manual abajo.</span>';
      }
      html += '</div>';
      if (state.gitDetectedFiles.length > 0 && canEditFiles) {
        html += '<button type="button" class="btn btn-success btn-sm" id="dw-sync-from-git">Subir entrega desde Git</button>';
      }
      html += '</div>';
      html += '<div class="accordion accordion-flush mt-2" id="dw-manual-accordion">';
      html += '<div class="accordion-item">';
      html += '<h3 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#dw-manual-collapse" aria-expanded="false" aria-controls="dw-manual-collapse">Método manual (solo si Git no está en el servidor)</button></h3>';
      html += '<div id="dw-manual-collapse" class="accordion-collapse collapse" data-bs-parent="#dw-manual-accordion"><div class="accordion-body">';
      html += '<p class="text-muted small mb-2">Pega la salida de <code>git status</code>, extrae archivos y selecciona la carpeta.</p>';
      html += '<div class="mb-2"><label class="form-label">Paso 1 — Salida de <code>git status</code> o <code>git status --short</code></label>';
      html += '<textarea id="dw-git-status-input" class="form-control form-control-sm font-monospace" rows="4" placeholder="Ejecuta en la consola (en la raíz del proyecto): git status o git status --short&#10;Luego pega aquí el resultado completo.">' + esc(state.gitStatusRaw) + '</textarea>';
      html += '<button type="button" class="btn btn-nexus-primary btn-sm mt-1" id="dw-extract-git-status">Extraer archivos modificados</button></div>';
      html += '<div id="dw-git-status-paths-wrap" class="mb-2">';
      if (state.gitStatusPaths.length) {
        var dirCount = 0;
        for (var di = 0; di < state.gitStatusPaths.length; di++) if (String(state.gitStatusPaths[di]).slice(-1) === "/") dirCount++;
        var fileCount = state.gitStatusPaths.length - dirCount;
        html += '<p class="small mb-1"><strong>Archivos a subir (' + state.gitStatusPaths.length + '):</strong> <span class="text-muted">(' + fileCount + ' archivo(s), ' + dirCount + ' carpeta(s))</span></p>';
        // Nota: no usar max-height fijo o el resize no podrá crecer.
        html += '<div id="dw-git-status-paths-list" class="list-group list-group-flush" style="height:140px;max-height:420px;overflow:auto;resize:vertical;min-height:80px;border:1px solid rgba(0,0,0,.075);border-radius:.25rem;">';
        state.gitStatusPaths.forEach(function (p) {
          html += '<div class="list-group-item py-1 px-2 small"><code class="nexus-text-sm">' + esc(p) + '</code></div>';
        });
        html += "</div>";
      } else {
        html += '<p class="text-muted small mb-0">Pega la salida de git status y pulsa &quot;Extraer archivos modificados&quot;.</p>';
      }
      html += "</div>";
      html += '<div class="mb-2"><label class="form-label">Paso 2 — Carpeta del proyecto</label>';
      html += '<input type="file" id="dw-folder-input" class="form-control form-control-sm" webkitdirectory directory multiple' + (state.gitStatusPaths.length ? "" : " disabled") + '></div>';
      if (!state.gitStatusPaths.length) {
        html += '<p class="text-muted small mb-2">Primero completa el Paso 1. El selector de carpeta se habilita cuando ya sabemos qué archivos subir.</p>';
      }
      if (state.folderFileName) {
        var st = state.folderMatchStats || null;
        if (st) {
          html += '<p class="small mb-2"><strong>Carpeta:</strong> ' + esc(state.folderFileName) +
            ' <span class="text-muted">(coinciden ' + st.totalMatched + ' archivo(s): ' + st.directFileMatches + ' directo(s), ' + st.folderExpandedMatches + ' dentro de carpeta(s))</span></p>';
        } else {
          html += '<p class="small mb-2"><strong>Carpeta:</strong> ' + esc(state.folderFileName) + ' <span class="text-muted">(' + state.folderFiles.length + ' archivos coinciden con git status)</span></p>';
        }
      }
      html += '<div class="mb-2"><label class="form-label">Prefijo a quitar de rutas (opcional)</label>';
      html += '<input type="text" id="dw-path-prefix" class="form-control form-control-sm" placeholder="ej. NEXUS DevSuite/" value="' + esc(state.pathPrefixToStrip) + '">';
      html += '<small class="text-muted">Si las rutas de la carpeta incluyen el nombre de la carpeta, indícalo aquí.</small></div>';
      html += '<div id="dw-folder-files-wrap" class="mb-2" style="max-height:320px;overflow-y:auto;min-height:100px;">';
      if (state.folderFiles.length) {
        html += '<div class="d-flex justify-content-between align-items-center mb-1"><span class="small">Archivos a subir (solo los del git status)</span><button type="button" class="btn btn-outline-secondary btn-sm" id="dw-select-all">Seleccionar todos</button></div>';
        html += '<ul class="list-group list-group-flush" id="dw-folder-files-list">';
        state.folderFiles.forEach(function (e, idx) {
          var shown = (function () {
            var p = e.path || "";
            var pre = state.pathPrefixToStrip || "";
            if (!pre) return p;
            p = p.replace(/\\/g, "/");
            pre = pre.replace(/\\/g, "/");
            if (p.indexOf(pre) === 0) return p.slice(pre.length).replace(/^\/+/, "");
            return p;
          })();
          html += '<li class="list-group-item py-1 px-2 d-flex align-items-center"><input type="checkbox" class="form-check-input me-2 dw-folder-cb" data-idx="' + idx + '" id="dw-cb-' + idx + '"><label class="form-check-label small text-break mb-0 flex-grow-1" for="dw-cb-' + idx + '"><code class="nexus-text-sm">' + esc(shown) + '</code></label></li>';
        });
        html += "</ul>";
      } else {
        html += '<p class="text-muted small mb-0">' + (state.gitStatusPaths.length ? "Selecciona la carpeta del proyecto para cargar solo los archivos del listado anterior." : "Primero extrae los archivos del git status (Paso 1) y luego seleccione la carpeta.") + '</p>';
      }
      html += "</div>";
      html += '<button type="button" class="btn btn-nexus-primary btn-sm" id="dw-upload-selected"' + (state.folderFiles.length ? "" : " disabled") + '>Subir seleccionados a la entrega</button>';
      html += '<div id="dw-upload-progress" class="mt-2 small" style="display:none;"></div>';
      html += "</div></div></div></div>"; // end accordion-body, accordion-collapse, accordion-item, accordion
      html += "</div></div>"; // end nui-card-body, nui-card
      html += "</div>"; // end sidebar

      // PANEL DERECHO: scroll vertical para ver todo el contenido sin cortes; cards con altura suficiente
      html += '<div style="flex:1 1 45%;min-width:360px;display:flex;flex-direction:column;gap:0.75rem;overflow-y:auto;overflow-x:hidden;min-height:0;">';
      html += '<div class="nui-card" style="flex:0 0 auto;"><div class="nui-card-header"><h2 class="nui-card-title mb-0">Details</h2></div><div class="nui-card-body">';
      var statusBadgeClass = "bg-secondary";
      if (deliveryStatus === "READY") statusBadgeClass = "bg-success";
      else if (deliveryStatus === "LOCKED") statusBadgeClass = "bg-warning text-dark";
      else if (deliveryStatus === "COMMITTED" || deliveryStatus === "PR_CREATED" || deliveryStatus === "MERGED") statusBadgeClass = "bg-info";
      else if (deliveryStatus === "DRAFT") statusBadgeClass = "bg-light text-dark border";
      html += '<div class="row g-2 mb-2"><div class="col-4 text-muted">Estado</div><div class="col-8"><span class="badge ' + statusBadgeClass + '">' + esc(deliveryStatus || "—") + '</span></div></div>';
      html += '<div class="row g-2 mb-2"><div class="col-4 text-muted">Task</div><div class="col-8">' + esc(d && d.task && (d.task.task_number || d.task.title) ? ("TASK-" + (d.task.task_number || "") + (d.task.title ? " · " + d.task.title : "")) : (d && d.task_id ? d.task_id.slice(0, 8) + "…" : "—")) + '</div></div>';
      html += '<div class="row g-2 mb-2"><div class="col-4 text-muted">Work Order</div><div class="col-8">' + esc(d && d.work_order && (d.work_order.ot_number || d.work_order.title) ? ("OT-" + (d.work_order.ot_number || "") + (d.work_order.title ? " · " + d.work_order.title : "")) : (d && d.work_order_id ? d.work_order_id.slice(0, 8) + "…" : "—")) + '</div></div>';
      html += '<div class="row g-2"><div class="col-4 text-muted">User Story</div><div class="col-8">' + esc(d && d.user_story && d.user_story.title ? d.user_story.title : (d && d.user_story_id ? d.user_story_id.slice(0, 8) + "…" : "—")) + '</div></div>';
      if (deliveryStatus && deliveryStatus !== "MERGED") {
        // Permite pasar la entrega a READY/LOCKED para habilitar "Vista previa" y "Commit & Push".
        // Nota: LOCKED congela edición/sync, pero READY permite preparar y commitear.
        html += '<div class="row g-2 mb-1 mt-1">';
        html += '<div class="col-4 text-muted">Cambiar estado</div>';
        html += '<div class="col-8 d-flex align-items-center gap-2 flex-wrap">';
        html += '<select id="dw-delivery-status-select" class="form-select form-select-sm" style="width:auto">';
        html += '<option value="READY"' + (deliveryStatus === "READY" ? " selected" : "") + '>READY</option>';
        html += '<option value="LOCKED"' + (deliveryStatus === "LOCKED" ? " selected" : "") + '>LOCKED</option>';
        html += '</select>';
        html += '<button type="button" class="btn btn-outline-primary btn-sm" id="dw-change-delivery-status">Actualizar</button>';
        html += '</div></div>';
      }
      html += "</div></div>";

      var deliveryStatus = (d && d.status) ? String(d.status).toUpperCase() : "";
      var canCommit = (deliveryStatus === "READY" || deliveryStatus === "LOCKED") && !!(d && d.branch_name);

      html += '<div class="nui-card" style="flex:0 0 auto;min-height:300px;"><div class="nui-card-header"><h2 class="nui-card-title mb-0">Commit & Push</h2></div><div class="nui-card-body">';
      if (deliveryStatus && deliveryStatus !== "READY" && deliveryStatus !== "LOCKED") {
        html += '<div class="alert alert-warning small mb-3">Solo puedes hacer commit cuando la entrega esté en estado <strong>READY</strong> o <strong>LOCKED</strong>. Estado actual: ' + esc(deliveryStatus) + '.</div>';
      }
      html += '<div class="mb-3"><label class="form-label">Mensaje de commit</label><textarea id="dw-commit-message" class="form-control" rows="3">' + esc(state.commitMessage) + '</textarea>';
      html += '<div class="mt-1"><button type="button" class="btn btn-outline-secondary btn-sm" id="dw-suggest-commit">Generar con IA</button></div></div>';
      html += '<div class="mb-2"><label class="form-check"><input type="checkbox" class="form-check-input" id="dw-create-pr" checked> <span class="form-check-label">Crear Pull Request después del push</span></label></div>';
      html += '<div class="mb-3 d-flex gap-2 flex-wrap"><button type="button" class="btn btn-outline-primary btn-sm" id="dw-commit-preview"' + (canCommit ? "" : " disabled") + '>Vista previa</button>';
      html += '<button type="button" class="btn btn-nexus-primary" id="dw-commit-push"' + (canCommit ? "" : " disabled") + '>Commit & Push</button></div>';
      if (!(d && d.branch_name)) {
        html += '<p class="text-warning small mt-2 mb-0">Crea la rama desde Repository (Crear rama) antes de hacer Commit & Push.</p>';
      }
      html += '<div class="mt-3"><h3 class="h6">Último commit</h3><ul class="list-group" id="dw-commits-list">';
      (state.commits.slice(0, 5)).forEach(function (c) {
        html += '<li class="list-group-item py-2"><code class="nexus-text-sm">' + esc((c.commit_sha || "").slice(0, 7)) + '</code> ' + esc((c.commit_message || "").slice(0, 60)) + ' <small class="text-muted">' + esc(c.author || "") + '</small></li>';
      });
      if (state.commits.length === 0) html += '<li class="list-group-item text-muted">Aún no hay commits.</li>';
      html += "</ul></div></div>";

      html += '<div class="nui-card" style="flex:0 0 auto;"><div class="nui-card-header"><h2 class="nui-card-title mb-0">Release notes (IA)</h2></div><div class="nui-card-body">';
      html += '<p class="small text-muted mb-2">Compara esta entrega con otra (base) y genera un resumen con IA.</p>';
      html += '<div class="mb-2"><label class="form-label small">Entrega base</label><select id="dw-release-notes-base-id" class="form-select form-select-sm"><option value="">— Selecciona entrega base —</option>';
      (state.otherDeliveries || []).forEach(function (od) {
        if (od.id === deliveryId) return;
        var version = od.delivery_number != null ? "v#" + od.delivery_number : "";
        var date = od.created_at ? String(od.created_at).slice(0, 10) : "";
        var desc = (od.description || od.title || od.branch_name || "").toString().trim().slice(0, 50);
        var label = [version, date, desc].filter(Boolean).join(" · ") || od.id;
        html += '<option value="' + esc(od.id) + '">' + esc(label) + '</option>';
      });
      html += '</select></div>';
      html += '<button type="button" class="btn btn-outline-primary btn-sm mb-2" id="dw-generate-release-notes">Generar release notes</button>';
      html += '<div id="dw-release-notes-output" class="small border rounded p-2 bg-light mt-2" style="max-height:200px;overflow:auto;white-space:pre-wrap;display:none;"></div></div></div>';

      html += '<div class="nui-card" style="flex:0 0 auto;"><div class="nui-card-header"><h2 class="nui-card-title mb-0">Code Review</h2></div><div class="nui-card-body">';
      var canMerge = state.canMerge;
      if (canMerge) {
        if (canMerge.can_merge) html += '<p class="small text-success mb-2"><strong>Listo para merge:</strong> hay al menos una aprobación y no hay cambios solicitados.</p>';
        else html += '<p class="small text-warning mb-2"><strong>No se puede mergear:</strong> ' + (canMerge.has_changes_requested ? 'Hay cambios solicitados.' : 'Se requiere al menos una aprobación.') + '</p>';
      }
      html += '<div class="mb-2"><strong class="small">Revisiones</strong><ul id="dw-delivery-reviews-list" class="list-group list-group-flush small mb-2">';
      (state.deliveryReviews || []).forEach(function (rv) {
        var st = (rv.status || "").toUpperCase();
        var badge = st === "APPROVED" ? "bg-success" : st === "CHANGES_REQUESTED" ? "bg-danger" : "bg-secondary";
        var name = (rv.reviewer && (rv.reviewer.name || rv.reviewer.email)) ? esc(rv.reviewer.name || rv.reviewer.email) : "Revisor";
        html += '<li class="list-group-item py-1 d-flex justify-content-between align-items-center"><span>' + name + '</span><span class="badge ' + badge + '">' + esc(rv.status || "") + '</span></li>';
      });
      if (!(state.deliveryReviews && state.deliveryReviews.length)) html += '<li class="list-group-item py-1 text-muted">Aún no hay revisiones.</li>';
      html += '</ul></div>';
      var myRev = state.myDeliveryReview;
      var myStatus = myRev && myRev.status ? String(myRev.status).toUpperCase() : "PENDING";
      html += '<div class="mb-2"><strong class="small">Mi revisión</strong><div class="d-flex gap-2 mt-1">';
      html += '<button type="button" class="btn btn-success btn-sm" id="dw-review-approve"' + (myStatus === "APPROVED" ? " disabled" : "") + '>Aprobar</button>';
      html += '<button type="button" class="btn btn-outline-danger btn-sm" id="dw-review-changes"' + (myStatus === "CHANGES_REQUESTED" ? " disabled" : "") + '>Solicitar cambios</button>';
      html += '</div><p class="small text-muted mt-1 mb-0">Estado: ' + esc(myStatus) + '</p></div></div></div>';

      html += '<div class="nui-card" style="flex:0 1 auto;display:flex;flex-direction:column;min-height:380px;"><div class="nui-card-header d-flex justify-content-between align-items-center"><h2 class="nui-card-title mb-0">AI Code Review</h2>';
      html += '<button type="button" class="btn btn-outline-primary btn-sm" id="dw-run-ai-review">' + (state.review ? "Nueva revisión" : "Run AI Review") + '</button>';
      html += "</div><div class=\"nui-card-body\" id=\"dw-ai-review-body\" style=\"flex:1 1 auto;min-height:0;overflow:auto;max-width:100%;\">";
      if (state.review) {
        var r = state.review;
        var riskLevel = (r.risk_level || "").toLowerCase();
        var riskBadge = riskLevel === "high" ? "bg-danger" : riskLevel === "medium" ? "bg-warning text-dark" : "bg-success";
        html += '<div class="mb-3"><strong>Risk Level:</strong> <span class="badge ' + riskBadge + '">' + esc(r.risk_level || "—") + '</span></div>';
        if (riskLevel === "high") {
          html += '<div class="alert alert-warning mb-3">High risk detected. Review recommended before creating Pull Request.</div>';
        }
        if (r.summary) html += '<div class="mb-3"><strong>Resumen:</strong><p class="mb-0 small">' + esc(r.summary) + '</p></div>';
        html += '<div class="mb-2"><strong>Issues</strong></div><ul class="list-group list-group-flush mb-3 nexus-checklist" style="max-width:100%;">';
        (r.issues || []).forEach(function (item) { html += '<li class="list-group-item py-1 small" style="overflow-wrap:anywhere;word-break:break-word;"><span class="nexus-checklist-item" aria-hidden="true"></span>' + esc(typeof item === "string" ? item : (item.title || item.message || JSON.stringify(item))) + '</li>'; });
        if (!(r.issues && r.issues.length)) html += '<li class="list-group-item text-muted small">Ninguno</li>';
        html += "</ul>";
        html += '<div class="mb-2"><strong>Security Warnings</strong></div><ul class="list-group list-group-flush mb-3 nexus-checklist" style="max-width:100%;">';
        (r.security_warnings || []).forEach(function (item) { html += '<li class="list-group-item py-1 small text-warning" style="overflow-wrap:anywhere;word-break:break-word;"><span class="nexus-checklist-item" aria-hidden="true"></span>' + esc(typeof item === "string" ? item : (item.title || item.message || JSON.stringify(item))) + '</li>'; });
        if (!(r.security_warnings && r.security_warnings.length)) html += '<li class="list-group-item text-muted small">Ninguna</li>';
        html += "</ul>";
        html += '<div class="mb-2"><strong>Improvements</strong></div><ul class="list-group list-group-flush nexus-checklist" style="max-width:100%;">';
        (r.improvements || []).forEach(function (item) { html += '<li class="list-group-item py-1 small" style="overflow-wrap:anywhere;word-break:break-word;"><span class="nexus-checklist-item" aria-hidden="true"></span>' + esc(typeof item === "string" ? item : (item.title || item.message || JSON.stringify(item))) + '</li>'; });
        if (!(r.improvements && r.improvements.length)) html += '<li class="list-group-item text-muted small">Ninguna</li>';
        html += "</ul>";
      } else {
        html += '<p class="text-muted small mb-0">Ejecuta la revisión de código con IA para obtener un resumen, posibles bugs, advertencias de seguridad y mejoras sugeridas.</p>';
      }
      html += "</div></div></div></div>";
      html += "</div>"; // end right

      html += "</div>"; // end 3-pane

      // Modal fullscreen — Diff estilo GitHub
      html += '<div class="modal fade" id="dw-diff-modal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">';
      html += '<div class="modal-dialog modal-fullscreen"><div class="modal-content">';
      html += '<div class="modal-header">';
      html += '<div><h5 class="modal-title mb-0">Diff Viewer</h5><div class="text-muted small" id="dw-diff-modal-meta">—</div></div>';
      html += '<button type="button" class="btn-close" id="dw-diff-close" aria-label="Cerrar"></button>';
      html += '</div>';
      html += '<div class="modal-body p-0" style="min-height:0;">';
      html += '<div class="d-flex" style="height:100%;min-height:0;">';
      // file nav
      html += '<div style="flex:0 0 340px;min-width:280px;max-width:420px;border-right:1px solid rgba(0,0,0,.08);display:flex;flex-direction:column;min-height:0;">';
      html += '<div class="p-2 border-bottom"><input type="search" class="form-control form-control-sm" id="dw-diff-file-filter" placeholder="Filtrar archivos..."></div>';
      html += '<div style="flex:1 1 auto;min-height:0;overflow:auto;"><ul class="list-group list-group-flush" id="dw-diff-file-list"></ul></div>';
      html += '</div>';
      // diff content
      html += '<div style="flex:1 1 auto;min-width:0;display:flex;flex-direction:column;min-height:0;">';
      html += '<div class="p-2 border-bottom d-flex justify-content-between align-items-center" style="gap:0.75rem;">';
      html += '<div class="dw-diff-filename-wrap"><strong class="dw-diff-filename-marquee" id="dw-diff-file-title">Selecciona un archivo</strong></div>';
      html += '<div class="text-muted small text-nowrap" id="dw-diff-stats">—</div>';
      html += '</div>';
      html += '<div id="dw-diff-code-container" style="flex:1 1 auto;min-height:0;overflow:auto;">';
      html += '<table class="table table-sm mb-0" style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; font-size:12px;">';
      html += '<thead><tr class="text-muted small"><th class="text-end pe-2" style="width:56px;min-width:56px;">Línea (base)</th><th class="text-end pe-2" style="width:56px;min-width:56px;">Línea (workspace)</th><th style="width:28px;"></th><th>Contenido</th></tr></thead>';
      html += '<tbody id="dw-diff-table"></tbody>';
      html += '</table>';
      html += '</div>';
      // Resizer: permite ajustar manualmente la altura de la sección de comentarios.
      html += '<div id="dw-diff-comments-resizer" style="height:8px;flex:0 0 auto;cursor:row-resize;background:rgba(0,0,0,.06);display:none;"></div>';
      html += '<div id="dw-diff-comments-panel" class="p-2 border-top bg-light" style="flex:0 0 auto;height:200px;min-height:140px;max-height:420px;overflow:hidden;display:none;flex-direction:column;">';
      html += '<p class="small mb-2"><strong>Comentarios en este archivo</strong></p>';
      html += '<div id="dw-diff-comments-list" class="small mb-2" style="flex:1 1 auto;min-height:80px;overflow:auto;"></div>';
      html += '<div class="mt-2"><label class="form-label small">Añadir comentario</label>';
      html += '<input type="hidden" id="dw-diff-comment-parent-id" value="">';
      html += '<input type="number" id="dw-diff-comment-line" class="form-control form-control-sm mb-1" placeholder="Línea (opcional)" min="0">';
      html += '<textarea id="dw-diff-comment-body" class="form-control form-control-sm mb-1" rows="2" placeholder="Comentario"></textarea>';
      html += '<button type="button" class="btn btn-primary btn-sm" id="dw-diff-comment-submit">Enviar</button> <span id="dw-diff-reply-hint" class="small text-muted" style="display:none;">(Respondiendo)</span></div>';
      html += '</div>';
      html += '</div></div>';
      html += '</div></div>';
      html += '</div></div></div>';

      html += '<div class="modal fade" id="dw-commit-confirm-modal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">';
      html += '<div class="modal-dialog modal-dialog-centered"><div class="modal-content">';
      html += '<div class="modal-header"><h5 class="modal-title">Vista previa de commit</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>';
      html += '<div class="modal-body">';
      html += '<div id="dw-commit-preview-drift" class="alert alert-danger small mb-2" style="display:none;"></div>';
      html += '<div id="dw-commit-preview-body" style="display:none;">';
      html += '<p class="mb-1"><strong>Archivos incluidos</strong></p><ul id="dw-commit-preview-files" class="small text-muted list-unstyled mb-2" style="max-height:120px;overflow:auto;"></ul>';
      html += '<p class="mb-1"><strong>Resumen de impacto</strong></p>';
      html += '<p id="dw-commit-preview-impact" class="small text-muted mb-2">—</p>';
      html += '<p class="mb-1"><strong>Mensaje</strong></p><p id="dw-commit-preview-message" class="small font-monospace mb-3">—</p>';
      html += '<p class="mb-0"><strong>¿Confirmas hacer commit y push?</strong></p></div>';
      html += '</div>';
      html += '<div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn btn-nexus-primary" id="dw-commit-confirm-btn">Confirmar commit y push</button></div>';
      html += '</div></div></div>';

      window.setContent(html);

      // Mover el modal a <body> para evitar problemas de z-index/stacking context
      // (evita "click-through" que puede disparar navegación del sidebar de fondo).
      try {
        var modalInDom = document.getElementById("dw-diff-modal");
        if (modalInDom) {
          var existing = document.body.querySelector("#dw-diff-modal");
          if (existing && existing !== modalInDom) existing.remove();
          if (modalInDom.parentElement !== document.body) document.body.appendChild(modalInDom);
        }
      } catch (_) {}

      // Header buttons wiring
      var btnAnalyze = document.getElementById("dw-btn-analyze");
      if (btnAnalyze) btnAnalyze.onclick = function () {
        var el = document.getElementById("dw-run-ai-review");
        if (el) el.click();
      };
      var btnPush = document.getElementById("dw-btn-push");
      if (btnPush) btnPush.onclick = function () {
        var el = document.getElementById("dw-commit-push");
        if (el) el.click();
      };
      var btnOpenDiffFromFiles = document.getElementById("dw-open-diff-from-files");

      // Diff modal (fullscreen) — navegación + diff rojo/verde + comentarios
      (function () {
        var modalEl = document.getElementById("dw-diff-modal");
        if (!modalEl || !window.bootstrap || !window.bootstrap.Modal) return;
        var modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
        var allowClose = false;
        var currentDiffFilePath = "";

        function updateDiffCommentsPanel() {
          var list = document.getElementById("dw-diff-comments-list");
          if (!list) return;
          var comments = (state.reviewComments || []).filter(function (c) { return (c.file_path || "") === currentDiffFilePath; });
          var roots = comments.filter(function (c) { return !c.parent_id; });
          var html = "";
          roots.forEach(function (r) {
            var author = (r.author && (r.author.name || r.author.email)) || "Anónimo";
            html += '<div class="border-start border-2 border-primary ps-2 mb-2">';
            html += '<span class="text-muted small">Línea ' + (r.line_number != null ? r.line_number : "—") + " · " + esc(author) + "</span>";
            html += "<p class=\"mb-1\">" + esc(r.body || "") + "</p>";
            html += '<button type="button" class="btn btn-outline-secondary btn-sm py-0 px-1 small dw-diff-reply-btn" data-parent-id="' + esc(r.id) + '">Responder</button>';
            var replies = comments.filter(function (c) { return c.parent_id === r.id; });
            replies.forEach(function (rr) {
              var ra = (rr.author && (rr.author.name || rr.author.email)) || "Anónimo";
              html += '<div class="ms-2 mt-1 small"><span class="text-muted">↳ ' + esc(ra) + "</span><p class=\"mb-0\">" + esc(rr.body || "") + "</p></div>";
            });
            html += "</div>";
          });
          if (!roots.length) html = "<p class=\"text-muted small mb-0\">Ningún comentario en este archivo.</p>";
          list.innerHTML = html;
        }

        // Resizer comentarios (drag vertical)
        var commentsPanelEl = document.getElementById("dw-diff-comments-panel");
        var commentsResizerEl = document.getElementById("dw-diff-comments-resizer");
        var diffCodeContainerEl = document.getElementById("dw-diff-code-container");
        var isResizing = false;
        var startY = 0;
        var startCommentsH = 0;
        var startCodeH = 0;
        var resizerH = 0;

        function clamp(n, min, max) {
          return Math.max(min, Math.min(max, n));
        }

        function onMouseMove(e) {
          if (!isResizing) return;
          var deltaY = e.clientY - startY;
          // Al arrastrar hacia arriba (deltaY negativo), aumentamos la altura de comentarios.
          var newCommentsH = startCommentsH - deltaY;
          var minCommentsH = 140;
          var minCodeH = 80;
          var maxCommentsH = startCodeH + startCommentsH - minCodeH; // basado en el total inicial
          newCommentsH = clamp(newCommentsH, minCommentsH, maxCommentsH);
          if (commentsPanelEl) commentsPanelEl.style.height = newCommentsH + "px";
        }

        function stopResize() {
          isResizing = false;
          try { document.body.style.cursor = ""; } catch (_) {}
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", stopResize);
        }

        if (commentsPanelEl && commentsResizerEl && diffCodeContainerEl) {
          commentsResizerEl.addEventListener("mousedown", function (e) {
            // Solo cuando el panel está visible.
            if (!commentsPanelEl || commentsPanelEl.style.display === "none") return;
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            startY = e.clientY;
            startCommentsH = commentsPanelEl.getBoundingClientRect().height;
            startCodeH = diffCodeContainerEl.getBoundingClientRect().height;
            resizerH = commentsResizerEl.getBoundingClientRect().height;
            try { document.body.style.cursor = "row-resize"; } catch (_) {}
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", stopResize);
          });
        }

        modalEl.addEventListener("shown.bs.modal", function () {
          try { document.body.classList.add("dw-diff-open"); } catch (_) {}
        });
        modalEl.addEventListener("hidden.bs.modal", function () {
          try { document.body.classList.remove("dw-diff-open"); } catch (_) {}
        });

        // Blindar clicks dentro del modal (evita que lleguen a handlers globales)
        modalEl.addEventListener("click", function (e) {
          e.stopPropagation();
        });
        modalEl.addEventListener("mousedown", function (e) {
          e.stopPropagation();
        });

        // No permitir que el modal se cierre por clicks/escape.
        // Solo se cierra con el botón "Cerrar" controlado por nosotros.
        modalEl.addEventListener("hide.bs.modal", function (e) {
          if (!allowClose) {
            e.preventDefault();
            e.stopPropagation();
          }
        });

        var closeBtn = document.getElementById("dw-diff-close");
        if (closeBtn) {
          closeBtn.onclick = function () {
            allowClose = true;
            modal.hide();
            // reset para siguientes aperturas
            setTimeout(function () { allowClose = false; }, 0);
          };
        }

        function computeDiffRows(aText, bText) {
          var a = String(aText || "").split("\n");
          var b = String(bText || "").split("\n");
          var n = a.length, m = b.length;
          var maxN = 900, maxM = 900;
          if (n > maxN || m > maxM) {
            return { rows: [{ t: "context", a: "", b: "", v: "Archivo grande: diff detallado omitido." }], added: 0, removed: 0 };
          }
          var dp = new Array(n + 1);
          for (var i = 0; i <= n; i++) {
            dp[i] = new Array(m + 1);
            for (var j = 0; j <= m; j++) dp[i][j] = 0;
          }
          for (i = n - 1; i >= 0; i--) {
            for (j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
          }
          i = 0; j = 0;
          var out = [];
          var aLine = 1, bLine = 1;
          var added = 0, removed = 0;
          while (i < n && j < m) {
            if (a[i] === b[j]) {
              out.push({ t: "context", a: aLine++, b: bLine++, v: a[i] });
              i++; j++;
            } else if (dp[i + 1][j] >= dp[i][j + 1]) {
              removed++; out.push({ t: "del", a: aLine++, b: "", v: a[i] }); i++;
            } else {
              added++; out.push({ t: "add", a: "", b: bLine++, v: b[j] }); j++;
            }
          }
          while (i < n) { removed++; out.push({ t: "del", a: aLine++, b: "", v: a[i++] }); }
          while (j < m) { added++; out.push({ t: "add", a: "", b: bLine++, v: b[j++] }); }
          return { rows: out, added: added, removed: removed };
        }

        function renderDiffTable(diff) {
          var tbody = document.getElementById("dw-diff-table");
          if (!tbody) return;
          var html = "";
          var rows = diff && diff.rows ? diff.rows : [];
          var limit = 2000;
          for (var i = 0; i < Math.min(limit, rows.length); i++) {
            var r = rows[i];
            // Colores más visibles: en algunos temas/contrastes los .15 se ven casi imperceptibles.
            // Añadimos borde lateral para que el usuario identifique "added/removed" incluso con poca saturación.
            var bg =
              r.t === "add"
                ? "background:rgba(25,135,84,.35);border-left:4px solid rgba(25,135,84,.85);"
                : r.t === "del"
                  ? "background:rgba(220,53,69,.35);border-left:4px solid rgba(220,53,69,.85);"
                  : "";
            var sign = r.t === "add" ? "+" : r.t === "del" ? "-" : " ";
            var numA = r.a !== undefined && r.a !== "" ? String(r.a) : "";
            var numB = r.b !== undefined && r.b !== "" ? String(r.b) : "";
            html += '<tr style="' + bg + '">';
            html += '<td class="text-muted text-end pe-2 font-monospace" style="width:56px;min-width:56px;user-select:none;">' + esc(numA) + "</td>";
            html += '<td class="text-muted text-end pe-2 font-monospace" style="width:56px;min-width:56px;user-select:none;">' + esc(numB) + "</td>";
            html += '<td class="font-monospace" style="width:28px;color:#6c757d;user-select:none;">' + esc(sign) + "</td>";
            html += '<td style="white-space:pre;overflow-wrap:anywhere;word-break:break-word;">' + esc(r.v) + "</td>";
            html += "</tr>";
          }
          if (rows.length > limit) {
            html += '<tr><td colspan="4" class="text-muted small">… diff truncado (' + (rows.length - limit) + " líneas más)</td></tr>";
          }
          tbody.innerHTML = html;
        }

        function setActiveFileInList(fileId) {
          var items = modalEl.querySelectorAll("#dw-diff-file-list [data-diff-file-id]");
          for (var i = 0; i < items.length; i++) items[i].classList.remove("active");
          var el = modalEl.querySelector('#dw-diff-file-list [data-diff-file-id="' + fileId + '"]');
          if (el) el.classList.add("active");
        }

        function openForFile(fileId) {
          modal.show();
          if (fileId) setTimeout(function () { selectFile(fileId); }, 0);
        }

        function fillFileList(filter) {
          var ul = document.getElementById("dw-diff-file-list");
          if (!ul) return;
          var q = (filter || "").trim().toLowerCase();
          var html = "";
          (state.files || []).forEach(function (f) {
            var p = f.file_path || "";
            if (q && p.toLowerCase().indexOf(q) === -1) return;
            html += '<li class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-diff-file-id="' + esc(f.id) + '">';
            html += '<span class="text-truncate dw-diff-filename-wrap" style="min-width:0;"><code class="dw-diff-filename-marquee">' + esc(p) + '</code></span>';
            var badge = f.status === "ADDED" ? "bg-success" : f.status === "DELETED" ? "bg-danger" : f.status === "MODIFIED" ? "bg-warning text-dark" : f.status === "RENAMED" || f.status === "COPIED" ? "bg-info" : "bg-secondary";
            html += '<span class="badge ' + badge + '">' + esc(f.status || "") + '</span>';
            html += "</li>";
          });
          if (!html) html = '<li class="list-group-item text-muted">Sin archivos</li>';
          ul.innerHTML = html;
        }

        function selectFile(fileId) {
          if (!fileId) return;
          var filePath = (state.files || []).filter(function (x) { return x.id === fileId; })[0];
          currentDiffFilePath = (filePath && filePath.file_path) ? String(filePath.file_path) : "";
          var panel = document.getElementById("dw-diff-comments-panel");
          var resizer = document.getElementById("dw-diff-comments-resizer");
          if (panel) {
            panel.style.display = currentDiffFilePath ? "flex" : "none";
            if (resizer) resizer.style.display = currentDiffFilePath ? "block" : "none";
            if (currentDiffFilePath) updateDiffCommentsPanel();
          }
          setActiveFileInList(fileId);
          var titleEl = document.getElementById("dw-diff-file-title");
          var statsEl = document.getElementById("dw-diff-stats");
          var tbody = document.getElementById("dw-diff-table");
          if (titleEl) titleEl.textContent = "Cargando…";
          if (statsEl) statsEl.textContent = "—";
          function showBinaryMessage(msg) {
            if (statsEl) statsEl.textContent = "—";
            renderDiffTable({ rows: [{ t: "context", a: "", b: "", v: msg || "Archivo binario modificado" }], added: 0, removed: 0 });
          }
          function showGitDiff(rawDiff) {
            if (statsEl) statsEl.textContent = "Diff real (unified)";
            if (!tbody) return;

            var diffText = rawDiff || "";
            if (!String(diffText).trim()) {
              tbody.innerHTML = '<tr><td colspan="4" class="text-muted small diff-line">No changes</td></tr>';
              if (statsEl) statsEl.textContent = "+ 0  - 0";
              return;
            }

            var parser = (window.DiffParser && window.DiffParser.parseUnifiedDiff) ? window.DiffParser.parseUnifiedDiff : window.parseUnifiedDiff;
            var parsed = null;
            try {
              parsed = typeof parser === "function" ? parser(diffText) : null;
            } catch (_) {
              parsed = null;
            }
            var parsedFiles = Array.isArray(parsed) ? parsed : ((parsed && Array.isArray(parsed.files)) ? parsed.files : []);

            // Fallback: si no se pudo parsear, mostramos texto.
            if (!parsedFiles || !parsedFiles.length) {
              var pre = document.createElement("pre");
              pre.className = "p-2 mb-0 font-monospace small";
              pre.style.whiteSpace = "pre-wrap";
              pre.style.wordBreak = "break-word";
              pre.textContent = diffText || "(sin cambios)";
              tbody.innerHTML = "";
              var tr0 = document.createElement("tr");
              tr0.innerHTML = '<td colspan="4" class="p-0">' + (pre.outerHTML) + "</td>";
              tbody.appendChild(tr0);
              return;
            }

            // Este endpoint (/files/:fileId/git-diff) normalmente devuelve un diff de UN solo archivo.
            var firstFile = parsedFiles[0];
            var hunks = (firstFile && firstFile.hunks) ? firstFile.hunks : [];

            var html = "";
            var addedCount = 0;
            var removedCount = 0;
            var MAX_RENDER_LINES = 1000;
            var renderedLines = 0;
            var truncatedLines = 0;
            var stop = false;
            for (var h = 0; h < hunks.length && !stop; h++) {
              var hk = hunks[h];
              var oldLine = hk && hk.oldStart != null ? hk.oldStart : 1;
              var newLine = hk && hk.newStart != null ? hk.newStart : 1;

              html +=
                '<tr class="diff-context"><td colspan="4" class="text-muted small diff-line" style="border-radius:4px;">' +
                esc(hk && hk.header ? hk.header : "@@") +
                "</td></tr>";

              var lines = (hk && hk.lines) ? hk.lines : [];
              for (var i = 0; i < lines.length; i++) {
                if (renderedLines >= MAX_RENDER_LINES) {
                  truncatedLines += (lines.length - i);
                  for (var hh = h + 1; hh < hunks.length; hh++) {
                    var extra = (hunks[hh] && hunks[hh].lines) ? hunks[hh].lines.length : 0;
                    truncatedLines += extra;
                  }
                  stop = true;
                  break;
                }
                var dl = lines[i];
                var t = dl && dl.type ? dl.type : "context";
                var content = dl && dl.content != null ? String(dl.content) : "";
                var isAdd = t === "add" || t === "added";
                var isRemove = t === "remove" || t === "deleted";
                var rowClass = isAdd ? "diff-added" : isRemove ? "diff-deleted" : "diff-context";
                var sign = isAdd ? "+" : isRemove ? "-" : " ";
                var baseTxt = "";
                var wsTxt = "";

                if (t === "context") {
                  baseTxt = String(oldLine);
                  wsTxt = String(newLine);
                  oldLine++;
                  newLine++;
                } else if (isRemove) {
                  baseTxt = String(oldLine);
                  wsTxt = "";
                  oldLine++;
                  removedCount++;
                } else if (isAdd) {
                  baseTxt = "";
                  wsTxt = String(newLine);
                  newLine++;
                  addedCount++;
                }

                html += "<tr class=\"" + rowClass + "\">";
                html +=
                  '<td class="text-muted text-end pe-2 font-monospace diff-line" style="width:56px;min-width:56px;user-select:none;">' +
                  esc(baseTxt) +
                  "</td>";
                html +=
                  '<td class="text-muted text-end pe-2 font-monospace diff-line" style="width:56px;min-width:56px;user-select:none;">' +
                  esc(wsTxt) +
                  "</td>";
                html +=
                  '<td class="font-monospace diff-line" style="width:28px;color:#6c757d;user-select:none;">' +
                  esc(sign) +
                  "</td>";
                html +=
                  '<td class="diff-line" style="white-space:pre;overflow-wrap:anywhere;word-break:break-word;">' +
                  esc(content) +
                  "</td>";
                html += "</tr>";
                renderedLines++;
              }
            }

            if (truncatedLines > 0) {
              html += '<tr><td colspan="4" class="text-muted small diff-line">... diff truncado (' + truncatedLines + " lineas mas)</td></tr>";
            }
            tbody.innerHTML = html;
            if (statsEl) statsEl.textContent = "+ " + addedCount + "  - " + removedCount;
          }
          function fallbackCompare() {
            DeliveryWorkspaceAPI.compareFile(projectId, deliveryId, fileId).then(function (r) {
              if (!(r && r.success && r.data)) throw new Error("compare failed");
              var dta = r.data;
              if (document.getElementById("dw-diff-modal-meta")) {
                document.getElementById("dw-diff-modal-meta").textContent = "workspace=" + (dta.branch || "") + " vs base=" + (dta.base_branch || "main");
              }
              if (titleEl) titleEl.textContent = dta.file_path || "—";
              if (dta.binary || dta.binary_message) {
                showBinaryMessage(dta.binary_message);
                return;
              }
              var ws = dta.workspace_content || "";
              var gh = dta.github_exists ? (dta.github_content || "") : "";
              var diff = computeDiffRows(gh, ws);
              if (statsEl) statsEl.textContent = "+ " + diff.added + "  - " + diff.removed;
              renderDiffTable(diff);
            }).catch(function () {
              if (titleEl) titleEl.textContent = "No se pudo cargar";
              renderDiffTable({ rows: [{ t: "context", a: "", b: "", v: "Error comparando con GitHub." }], added: 0, removed: 0 });
            });
          }
          DeliveryWorkspaceAPI.getFileGitDiff(projectId, deliveryId, fileId).then(function (r) {
            if (!(r && r.success && r.data)) { fallbackCompare(); return; }
            var dta = r.data;
            var filePath = (state.files || []).filter(function (x) { return x.id === fileId; })[0];
            if (titleEl) titleEl.textContent = (filePath && filePath.file_path) ? filePath.file_path : "—";
            if (document.getElementById("dw-diff-modal-meta")) {
              document.getElementById("dw-diff-modal-meta").textContent = "Diff real (git diff HEAD)";
            }
            if (dta.binary) {
              showBinaryMessage(dta.message);
              return;
            }
            if (dta.diff !== undefined) {
              showGitDiff(dta.diff);
              return;
            }
            fallbackCompare();
          }).catch(function () {
            fallbackCompare();
          });
        }

        // open buttons
        function wire(btn) { if (btn) btn.onclick = function () { fillFileList(""); openForFile(state.selectedFileId || (state.files[0] && state.files[0].id)); }; }
        wire(btnOpenDiffFromFiles);

        // list click + filter (listener SOLO en la lista para evitar efectos colaterales)
        var ul = document.getElementById("dw-diff-file-list");
        if (ul) {
          ul.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var li = e.target.closest("[data-diff-file-id]");
            if (!li) return;
            selectFile(li.getAttribute("data-diff-file-id"));
          });
        }
        var filterInput = document.getElementById("dw-diff-file-filter");
        if (filterInput) filterInput.oninput = function () { fillFileList(filterInput.value); };

        var commentsList = document.getElementById("dw-diff-comments-list");
        if (commentsList) {
          commentsList.addEventListener("click", function (e) {
            var btn = e.target.closest(".dw-diff-reply-btn");
            if (!btn) return;
            var parentId = btn.getAttribute("data-parent-id");
            var parentEl = document.getElementById("dw-diff-comment-parent-id");
            var hint = document.getElementById("dw-diff-reply-hint");
            if (parentEl) parentEl.value = parentId || "";
            if (hint) hint.style.display = parentId ? "inline" : "none";
            var ta = document.getElementById("dw-diff-comment-body");
            if (ta) ta.focus();
          });
        }
        var commentSubmit = document.getElementById("dw-diff-comment-submit");
        if (commentSubmit) {
          commentSubmit.onclick = function () {
            var bodyEl = document.getElementById("dw-diff-comment-body");
            var lineEl = document.getElementById("dw-diff-comment-line");
            var parentEl = document.getElementById("dw-diff-comment-parent-id");
            var body = (bodyEl && bodyEl.value || "").trim();
            if (!body) return;
            var lineNum = lineEl && lineEl.value ? parseInt(lineEl.value, 10) : null;
            if (lineNum !== null && isNaN(lineNum)) lineNum = null;
            var parentId = (parentEl && parentEl.value || "").trim() || null;
            var payload = { file_path: currentDiffFilePath, body: body };
            if (lineNum != null) payload.line_number = lineNum;
            if (parentId) payload.parent_id = parentId;
            commentSubmit.disabled = true;
            DeliveryWorkspaceAPI.addReviewComment(projectId, deliveryId, payload).then(function (r) {
              commentSubmit.disabled = false;
              if (r && r.success) {
                if (bodyEl) bodyEl.value = "";
                if (lineEl) lineEl.value = "";
                if (parentEl) parentEl.value = "";
                var hint = document.getElementById("dw-diff-reply-hint");
                if (hint) hint.style.display = "none";
                loadReviewComments().then(function () { updateDiffCommentsPanel(); });
                if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Comentario añadido.");
              }
            }).catch(function () {
              commentSubmit.disabled = false;
              if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo añadir el comentario." });
            });
          };
        }

        // initial
        fillFileList("");
      })();

      var clearBtn = document.getElementById("dw-clear-files");
      if (clearBtn) {
        clearBtn.onclick = function () {
          if (!(state.files && state.files.length)) return;
          var ok = true;
          if (typeof window.confirm === "function") {
            ok = window.confirm("¿Eliminar TODOS los archivos del workspace de esta entrega?");
          }
          if (!ok) return;
          clearBtn.disabled = true;
          DeliveryWorkspaceAPI.clearFiles(projectId, deliveryId).then(function (r) {
            var n = (r && r.success && r.data && r.data.deleted_count != null) ? r.data.deleted_count : (state.files ? state.files.length : 0);
            return loadFiles().then(function () {
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Entrega limpiada. Se eliminaron " + n + " archivo(s).");
              render();
            });
          }).catch(function () {
            clearBtn.disabled = false;
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo limpiar la entrega." });
          });
        };
      }

      function computeLineDiff(aText, bText) {
        var a = String(aText || "").split("\n");
        var b = String(bText || "").split("\n");
        var n = a.length, m = b.length;
        var maxN = 800, maxM = 800;
        // Evitar O(n*m) enorme: si es muy grande, solo muestra conteos básicos.
        if (n > maxN || m > maxM) {
          return { summaryHtml: "<div class=\"text-muted\">Archivo grande: mostrando solo vista lado a lado (diff detallado omitido).</div>" };
        }
        var dp = new Array(n + 1);
        for (var i = 0; i <= n; i++) {
          dp[i] = new Array(m + 1);
          for (var j = 0; j <= m; j++) dp[i][j] = 0;
        }
        for (i = n - 1; i >= 0; i--) {
          for (j = m - 1; j >= 0; j--) {
            dp[i][j] = a[i] === b[j] ? (dp[i + 1][j + 1] + 1) : Math.max(dp[i + 1][j], dp[i][j + 1]);
          }
        }
        i = 0; j = 0;
        var out = [];
        var added = 0, removed = 0;
        while (i < n && j < m) {
          if (a[i] === b[j]) {
            i++; j++;
          } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            removed++; out.push({ t: "-", v: a[i] }); i++;
          } else {
            added++; out.push({ t: "+", v: b[j] }); j++;
          }
        }
        while (i < n) { removed++; out.push({ t: "-", v: a[i] }); i++; }
        while (j < m) { added++; out.push({ t: "+", v: b[j] }); j++; }
        var html = "";
        html += "<div class=\"mb-1\"><strong>+ " + added + "</strong> <span class=\"text-muted\">/</span> <strong>- " + removed + "</strong></div>";
        html += "<div>";
        for (var k = 0; k < Math.min(200, out.length); k++) {
          var it = out[k];
          var cls = it.t === "+" ? "text-success" : "text-danger";
          html += "<div class=\"" + cls + "\">" + esc(it.t + " " + it.v) + "</div>";
        }
        if (out.length > 200) html += "<div class=\"text-muted\">… (" + (out.length - 200) + " líneas más)</div>";
        html += "</div>";
        return { summaryHtml: html };
      }

      var selectAllBtn = document.getElementById("dw-select-all-files");
      if (selectAllBtn) selectAllBtn.onclick = function () { document.querySelectorAll("#dw-files-list .dw-file-cb").forEach(function (cb) { cb.checked = true; }); };
      var deselectAllBtn = document.getElementById("dw-deselect-all-files");
      if (deselectAllBtn) deselectAllBtn.onclick = function () { document.querySelectorAll("#dw-files-list .dw-file-cb").forEach(function (cb) { cb.checked = false; }); };

      document.getElementById("dw-files-list").addEventListener("click", function (e) {
        if (e.target.classList.contains("dw-file-cb") || e.target.closest(".dw-file-cb")) { e.stopPropagation(); return; }
        var delBtn = e.target.closest("[data-delete-file-id]");
        if (delBtn) {
          e.preventDefault();
          e.stopPropagation();
          var delId = delBtn.getAttribute("data-delete-file-id");
          if (!delId) return;
          var ok = true;
          if (typeof window.confirm === "function") ok = window.confirm("¿Quitar este archivo de la entrega?");
          if (!ok) return;
          delBtn.disabled = true;
          DeliveryWorkspaceAPI.deleteFile(projectId, deliveryId, delId).then(function () {
            if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Archivo quitado de la entrega.");
            return loadFiles().then(render);
          }).catch(function () {
            delBtn.disabled = false;
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo quitar el archivo de la entrega." });
          });
          return;
        }
        var li = e.target.closest("[data-file-id]");
        if (!li) return;
        var fileId = li.getAttribute("data-file-id");
        state.selectedFileId = fileId;
        var left = document.getElementById("dw-compare-left");
        var right = document.getElementById("dw-compare-right");
        var meta = document.getElementById("dw-compare-meta");
        var diff = document.getElementById("dw-compare-diff");
        if (left) left.textContent = "Cargando…";
        if (right) right.textContent = "Cargando…";
        if (diff) diff.innerHTML = "<div class=\"text-muted\">Cargando…</div>";
        DeliveryWorkspaceAPI.compareFile(projectId, deliveryId, fileId).then(function (r) {
          if (!(r && r.success && r.data)) throw new Error("No se pudo cargar la comparación");
          var dta = r.data;
          if (dta.binary || dta.binary_message) {
            if (left) left.textContent = "";
            if (right) right.textContent = "";
            if (meta) meta.textContent = (dta.file_path || "") + " · Binario";
            if (diff) diff.innerHTML = "<div class=\"text-muted\">" + (dta.binary_message || "Archivo binario modificado") + "</div>";
            return;
          }
          var ws = dta.workspace_content || "";
          var gh = dta.github_exists ? (dta.github_content || "") : "";
          if (left) left.textContent = ws;
          if (right) right.textContent = dta.github_exists ? gh : "Archivo no existe en GitHub en la rama base.";
          if (meta) meta.textContent = (dta.file_path || "") + " · workspace=" + (dta.branch || "") + " vs base=" + (dta.base_branch || "main");
          if (diff) diff.innerHTML = computeLineDiff(ws, gh).summaryHtml;
        }).catch(function () {
          if (left) left.textContent = "";
          if (right) right.textContent = "";
          if (diff) diff.innerHTML = "<div class=\"text-danger\">No se pudo comparar con GitHub. Verifica conexión GitHub y que la rama exista.</div>";
        });
      });

      (function () {
        var gitStatusInput = document.getElementById("dw-git-status-input");
        var extractBtn = document.getElementById("dw-extract-git-status");
        var folderInput = document.getElementById("dw-folder-input");
        var pathPrefix = document.getElementById("dw-path-prefix");
        var uploadBtn = document.getElementById("dw-upload-selected");
        var progressEl = document.getElementById("dw-upload-progress");

        function normalizePath(p) {
          return (p || "").replace(/\\/g, "/").replace(/^\s+|\s+$/g, "");
        }

        function stripPrefix(path, prefix) {
          if (!prefix || !path) return path;
          var p = normalizePath(path);
          var pre = normalizePath(prefix);
          if (!pre) return p;
          if (p.indexOf(pre) === 0) return p.slice(pre.length).replace(/^\/+/, "");
          return p;
        }

        /** Incluir archivo solo si está en la lista exacta de git status (no incluir "todo lo de una carpeta"). */
        function pathMatchesGitStatus(filePath) {
          var exactSet = state.gitStatusExactSet || buildGitStatusExactSet();
          if (Object.keys(exactSet).length === 0) return false;
          var candidates = pathCandidatesForMatch(filePath);
          for (var c = 0; c < candidates.length; c++) {
            if (exactSet[candidates[c]]) return true;
          }
          return false;
        }

        /** Rutas a probar para emparejar con git status: path completo y path sin 1, 2 o 3 primeros segmentos (no más).
         *  No usar solo el nombre de archivo (ej. "foo.js") porque haría coincidir todos los archivos con ese nombre en el proyecto. */
        function pathCandidatesForMatch(filePath) {
          var n = normalizePath(filePath);
          var out = [n];
          var parts = n.split("/").filter(Boolean);
          for (var i = 1; i < parts.length; i++) {
            var candidate = parts.slice(i).join("/");
            if (i > 3) break;
            out.push(candidate);
          }
          return out;
        }

        /** Set de rutas exactas de git status (solo archivos, sin "incluir todo bajo carpeta") para no subir no modificados. */
        function buildGitStatusExactSet() {
          var set = {};
          for (var i = 0; i < state.gitStatusPaths.length; i++) {
            var g = normalizePath(state.gitStatusPaths[i]);
            if (!g) continue;
            if (String(g).slice(-1) === "/") continue;
            set[g] = true;
          }
          return set;
        }

        if (extractBtn && gitStatusInput) {
          extractBtn.onclick = function () {
            state.gitStatusRaw = gitStatusInput.value || "";
            state.gitStatusPaths = parseGitStatusOutput(state.gitStatusRaw);
            state.gitStatusExactSet = buildGitStatusExactSet();
            if (state.gitStatusPaths.length && typeof window.showSuccessMessage === "function") {
              window.showSuccessMessage("Se extrajeron " + state.gitStatusPaths.length + " archivo(s). Selecciona la carpeta del proyecto (Paso 2).");
            } else if (!state.gitStatusPaths.length && state.gitStatusRaw.trim()) {
              if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Sin archivos", message: "No se detectaron rutas en la salida. Usa 'git status' o 'git status --short' en la raíz del proyecto." });
            }
            state.folderFiles = [];
            state.folderFileName = "";
            render();
          };
        }

        if (pathPrefix) {
          pathPrefix.oninput = function () {
            state.pathPrefixToStrip = this.value || "";
            render();
          };
        }

        if (folderInput) {
          folderInput.onchange = function () {
            if (!state.gitStatusPaths.length) {
              if (typeof window.openNexusAlertModal === "function") {
                window.openNexusAlertModal({ title: "Paso 1 requerido", message: "Primero pega la salida de git status y pulsa \"Extraer archivos modificados\"." });
              }
              try { folderInput.value = ""; } catch (_) {}
              return;
            }
            var files = folderInput.files;
            if (!files || !files.length) return;
            var rawList = [];
            for (var i = 0; i < files.length; i++) {
              var f = files[i];
              if (f && f.webkitRelativePath) {
                rawList.push({ path: normalizePath(f.webkitRelativePath), file: f });
              }
            }
            // Incluir solo archivos que estén en la lista de git status. Probar varias variantes de ruta (sin 1er, 2do... segmento) para no omitir archivos en subcarpetas; no incluir "todo bajo carpeta".
            var exactSet = buildGitStatusExactSet();
            var matched = [];
            for (var ri = 0; ri < rawList.length; ri++) {
              var p = rawList[ri].path;
              var candidates = pathCandidatesForMatch(p);
              var included = false;
              for (var ci = 0; ci < candidates.length; ci++) {
                if (exactSet[candidates[ci]]) { included = true; break; }
              }
              if (included) matched.push(rawList[ri]);
            }
            state.folderFiles = matched;
            state.folderMatchStats = {
              totalMatched: matched.length,
              directFileMatches: matched.length,
              folderExpandedMatches: 0
            };
            state.folderFileName = rawList.length ? rawList[0].path.split("/")[0] : "";
            // Sugiere automáticamente el prefijo de la carpeta seleccionada si el usuario no definió uno
            var suggested = state.folderFileName ? (state.folderFileName + "/") : "";
            if (!state.pathPrefixToStrip && suggested) state.pathPrefixToStrip = suggested;
            if (pathPrefix) pathPrefix.value = state.pathPrefixToStrip || "";
            render();
          };
        }

        var selectAllBtn = document.getElementById("dw-select-all");
        if (selectAllBtn) {
          selectAllBtn.onclick = function () {
            var list = document.querySelectorAll("#dw-folder-files-list .dw-folder-cb");
            for (var i = 0; i < list.length; i++) list[i].checked = true;
          };
        }

        if (uploadBtn && progressEl) {
          uploadBtn.onclick = function () {
            var prefix = (pathPrefix && pathPrefix.value) ? pathPrefix.value : state.pathPrefixToStrip;
            var checkboxes = document.querySelectorAll("#dw-folder-files-list .dw-folder-cb:checked");
            if (!checkboxes.length) {
              if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Selección vacía", message: "Marca al menos un archivo para subir." });
              return;
            }
            var toUpload = [];
            for (var i = 0; i < checkboxes.length; i++) {
              var idx = parseInt(checkboxes[i].getAttribute("data-idx"), 10);
              if (!isNaN(idx) && state.folderFiles[idx]) toUpload.push(state.folderFiles[idx]);
            }
            uploadBtn.disabled = true;
            progressEl.style.display = "block";
            var total = toUpload.length;
            var done = 0;

            function next() {
              if (done >= total) {
                progressEl.textContent = "Subida completada. Actualizando lista…";
                progressEl.style.display = "block";
                loadFiles().then(function () {
                  uploadBtn.disabled = false;
                  progressEl.style.display = "none";
                  if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Se subieron " + total + " archivo(s) a la entrega.");
                  render();
                });
                return;
              }
              var item = toUpload[done];
              var pathToUse = stripPrefix(item.path, prefix);
              progressEl.textContent = "Subiendo " + (done + 1) + " / " + total + " — " + pathToUse;
              item.file.text().then(function (content) {
                return DeliveryWorkspaceAPI.addFile(projectId, deliveryId, { file_path: pathToUse, content: content, status: "ADDED" });
              }).then(function () {
                done++;
                next();
              }).catch(function (err) {
                progressEl.textContent = "Error en " + pathToUse + ": " + (err && err.message ? err.message : "Error");
                uploadBtn.disabled = false;
                if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error al subir", message: (err && err.message) ? err.message : "No se pudo subir " + pathToUse });
              });
            }
            next();
          };
        }
      })();

      // Git como fuente de verdad: Detectar archivos (getGitStatus) y Subir entrega desde Git (syncFromGit)
      var detectGitBtn = document.getElementById("dw-detect-git");
      if (detectGitBtn) {
        detectGitBtn.onclick = function () {
          var scopeEl = document.querySelector('input[name="dw-git-scope"]:checked');
          var stagedOnly = scopeEl && scopeEl.value === "staged";
          var expectedEl = document.getElementById("dw-expected-head");
          var expectedHead = expectedEl && expectedEl.value ? expectedEl.value.trim() : "";
          if (expectedHead) state.gitExpectedHead = expectedHead;
          detectGitBtn.disabled = true;
          DeliveryWorkspaceAPI.getGitStatus(projectId, deliveryId, stagedOnly, expectedHead || undefined).then(function (r) {
            if (r && r.success && r.data) {
              var d = r.data;
              state.gitDetectedFiles = d.files || [];
              state.gitAvailable = !!d.available;
              state.gitSyncWarning = !!d.syncWarning;
              state.gitHeadHash = d.headHash || "";
              state.gitBranch = d.branch || "";
              if (typeof window.showSuccessMessage === "function") {
                window.showSuccessMessage(state.gitDetectedFiles.length + " archivos detectados (igual que Git).");
              }
            } else {
              state.gitAvailable = false;
              state.gitDetectedFiles = [];
              state.gitSyncWarning = false;
            }
            detectGitBtn.disabled = false;
            render();
          }).catch(function (err) {
            state.gitAvailable = false;
            state.gitDetectedFiles = [];
            state.gitSyncWarning = false;
            detectGitBtn.disabled = false;
            render();
            if (typeof window.openNexusAlertModal === "function") {
              window.openNexusAlertModal({
                title: "Error",
                message: (err && err.message) || "Git no está configurado en el servidor o no se pudo leer el estado. Configure NEXUS_REPOS_BASE_PATH y clone el repositorio."
              });
            }
          });
        };
      }
      var expectedHeadInput = document.getElementById("dw-expected-head");
      if (expectedHeadInput) {
        expectedHeadInput.oninput = function () { state.gitExpectedHead = this.value || ""; };
      }
      var syncFromGitBtn = document.getElementById("dw-sync-from-git");
      if (syncFromGitBtn) {
        syncFromGitBtn.onclick = function () {
          var scopeEl = document.querySelector('input[name="dw-git-scope"]:checked');
          var stagedOnly = scopeEl && scopeEl.value === "staged";
          syncFromGitBtn.disabled = true;
          DeliveryWorkspaceAPI.syncFromGit(projectId, deliveryId, stagedOnly).then(function (r) {
            if (r && r.success && r.data) {
              var synced = (r.data && r.data.synced) !== undefined ? r.data.synced : 0;
              loadFiles().then(function () {
                syncFromGitBtn.disabled = false;
                render();
                if (typeof window.showSuccessMessage === "function") {
                  window.showSuccessMessage("Entrega actualizada desde Git: " + synced + " archivo(s).");
                }
              });
            } else {
              syncFromGitBtn.disabled = false;
              render();
              if (typeof window.openNexusAlertModal === "function") {
                window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "No se pudo sincronizar desde Git." });
              }
            }
          }).catch(function (err) {
            syncFromGitBtn.disabled = false;
            render();
            if (typeof window.openNexusAlertModal === "function") {
              window.openNexusAlertModal({ title: "Error", message: (err && err.message) || "No se pudo sincronizar desde Git." });
            }
          });
        };
      }

      var suggestCommitBtn = document.getElementById("dw-suggest-commit");
      if (suggestCommitBtn) {
        suggestCommitBtn.onclick = function () {
          suggestCommitBtn.disabled = true;
          suggestCommitBtn.textContent = "Generando…";
          DeliveryWorkspaceAPI.suggestCommitMessage(projectId, deliveryId).then(function (r) {
            if (r && r.success && r.data && r.data.commit_message) {
              var ta = document.getElementById("dw-commit-message");
              if (ta) ta.value = r.data.commit_message;
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Mensaje de commit generado.");
            }
            suggestCommitBtn.disabled = false;
            suggestCommitBtn.textContent = "Generar con IA";
          }).catch(function () {
            suggestCommitBtn.disabled = false;
            suggestCommitBtn.textContent = "Generar con IA";
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo generar el mensaje con IA." });
          });
        };
      }

      function openCommitPreviewModal(previewData, confirmMode) {
        var driftEl = document.getElementById("dw-commit-preview-drift");
        var bodyEl = document.getElementById("dw-commit-preview-body");
        var filesListEl = document.getElementById("dw-commit-preview-files");
        var impactEl = document.getElementById("dw-commit-preview-impact");
        var messageEl = document.getElementById("dw-commit-preview-message");
        var confirmBtn = document.getElementById("dw-commit-confirm-btn");
        if (previewData && !previewData.can_commit) {
          if (driftEl) { driftEl.textContent = "Tu código ha cambiado desde la creación de la entrega. Sincroniza de nuevo desde Git o revierte los cambios antes de hacer commit."; driftEl.style.display = "block"; }
          if (bodyEl) bodyEl.style.display = "none";
          if (confirmBtn) confirmBtn.style.display = "none";
        } else {
          if (driftEl) driftEl.style.display = "none";
          if (bodyEl) bodyEl.style.display = "block";
          var files = (previewData && previewData.files) || [];
          if (filesListEl) {
            filesListEl.innerHTML = "";
            files.slice(0, 50).forEach(function (f) {
              var li = document.createElement("li");
              li.className = "mb-0";
              li.appendChild(document.createTextNode((f.file_path || f.path || "").trim() || "—"));
              filesListEl.appendChild(li);
            });
            if (files.length > 50) {
              var li = document.createElement("li");
              li.className = "text-muted";
              li.appendChild(document.createTextNode("… y " + (files.length - 50) + " más"));
              filesListEl.appendChild(li);
            }
          }
          var imp = (previewData && previewData.impact) || {};
          var impactText = (imp.files_count || 0) + " archivo(s) modificados";
          if (impactEl) impactEl.textContent = impactText;
          var msgToShow = (confirmMode && document.getElementById("dw-commit-message")) ? (document.getElementById("dw-commit-message").value || "").trim() : (previewData && previewData.suggested_message);
          if (messageEl) messageEl.textContent = msgToShow || "(sin mensaje)";
          if (confirmBtn) confirmBtn.style.display = confirmMode ? "inline-block" : "none";
        }
        var modalEl = document.getElementById("dw-commit-confirm-modal");
        if (modalEl && window.bootstrap && window.bootstrap.Modal) { var m = new window.bootstrap.Modal(modalEl); m.show(); }
      }

      var previewBtn = document.getElementById("dw-commit-preview");
      if (previewBtn) {
        previewBtn.onclick = function () {
          var checkboxes = document.querySelectorAll("#dw-files-list .dw-file-cb:checked");
          var selectedPaths = []; checkboxes.forEach(function (cb) { var p = cb.getAttribute("data-file-path"); if (p) selectedPaths.push(p); });
          var payload = selectedPaths.length ? { selected_file_paths: selectedPaths } : {};
          previewBtn.disabled = true;
          DeliveryWorkspaceAPI.getCommitPreview(projectId, deliveryId, payload).then(function (r) {
            previewBtn.disabled = false;
            if (r && r.success && r.data) openCommitPreviewModal(r.data, false);
          }).catch(function () { previewBtn.disabled = false; if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo cargar la vista previa." }); });
        };
      }

      var commitPushBtn = document.getElementById("dw-commit-push");
      if (commitPushBtn) {
        commitPushBtn.onclick = function () {
          var msg = (document.getElementById("dw-commit-message").value || "").trim() || "chore: delivery from Nexus DevSuite";
          var checkboxes = document.querySelectorAll("#dw-files-list .dw-file-cb:checked");
          var selectedPaths = []; checkboxes.forEach(function (cb) { var p = cb.getAttribute("data-file-path"); if (p) selectedPaths.push(p); });
          var createPrEl = document.getElementById("dw-create-pr");
          var createPr = createPrEl ? createPrEl.checked : false;
          state.pendingCommitPayload = { commit_message: msg, create_pr: !!createPr };
          if (selectedPaths.length > 0) state.pendingCommitPayload.selected_file_paths = selectedPaths;
          commitPushBtn.disabled = true;
          DeliveryWorkspaceAPI.getCommitPreview(projectId, deliveryId, state.pendingCommitPayload).then(function (r) {
            commitPushBtn.disabled = false;
            if (r && r.success && r.data) {
              if (!r.data.can_commit) { openCommitPreviewModal(r.data, false); return; }
              openCommitPreviewModal(r.data, true);
            }
          }).catch(function () { commitPushBtn.disabled = false; if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo cargar la vista previa." }); });
        };
      }

      var commitConfirmBtn = document.getElementById("dw-commit-confirm-btn");
      if (commitConfirmBtn) {
        commitConfirmBtn.onclick = function () {
          var msg = (document.getElementById("dw-commit-message").value || "").trim() || "chore: delivery from Nexus DevSuite";
          var payload = state.pendingCommitPayload ? { commit_message: msg, create_pr: !!state.pendingCommitPayload.create_pr } : { commit_message: msg, create_pr: true };
          if (state.pendingCommitPayload && state.pendingCommitPayload.selected_file_paths) payload.selected_file_paths = state.pendingCommitPayload.selected_file_paths;
          commitConfirmBtn.disabled = true;
          var modalEl = document.getElementById("dw-commit-confirm-modal");
          if (modalEl && window.bootstrap && window.bootstrap.Modal) { var m = window.bootstrap.Modal.getInstance(modalEl); if (m) m.hide(); }
          var simulatePayload = payload.selected_file_paths ? { selected_file_paths: payload.selected_file_paths } : {};
          DeliveryWorkspaceAPI.simulateCommit(projectId, deliveryId, simulatePayload).then(function (simRes) {
            if (simRes && simRes.success && simRes.data && !simRes.data.ok) {
              commitConfirmBtn.disabled = false;
              var errs = (simRes.data.errors || []).map(function (e) { return e.message || e.code; }).join(" ");
              if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Validación", message: errs || "No se puede hacer commit. Revisa rama, archivos y sincronización." });
              return;
            }
            return DeliveryWorkspaceAPI.commitDelivery(projectId, deliveryId, payload);
          }).then(function (r) {
            commitConfirmBtn.disabled = false;
            if (!r) return;
            if (r.success && r.data) {
              var successMsg = "Commit creado: " + (r.data.sha || "").slice(0, 7);
              if (r.data.pull_request_url) successMsg += ". PR: " + r.data.pull_request_url;
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage(successMsg);
              loadCommits().then(loadDelivery).then(render);
              return;
            }
            var errBody = (r && r.error) || {};
            var errMsg = errBody.message || "No se pudo hacer commit.";
            if (errBody.code === "SNAPSHOT_DRIFT") errMsg = "Tu código ha cambiado desde la creación de la entrega. Sincroniza de nuevo desde Git o revierte los cambios antes de hacer commit.";
            if (errBody.code === "NO_FILES_SELECTED") errMsg = "Selecciona al menos un archivo para incluir en el commit.";
            if (errBody.code === "DELIVERY_STATUS_NOT_COMMITTABLE") errMsg = "Solo puedes hacer commit cuando la entrega esté en estado READY o LOCKED. Cambia el estado de la entrega e inténtalo de nuevo.";
            if (errBody.code === "DELIVERY_LOCKED") errMsg = "La entrega está bloqueada (LOCKED). No se pueden modificar archivos ni sincronizar desde Git.";
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: errMsg });
          }).catch(function () {
            commitConfirmBtn.disabled = false;
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "Error de conexión. No se pudo hacer commit." });
          });
        };
      }

      // Status update (READY/LOCKED) para habilitar commit-preview cuando la entrega está en COMMITTED/PREPARING/DRAFT, etc.
      var statusSelect = document.getElementById("dw-delivery-status-select");
      var changeStatusBtn = document.getElementById("dw-change-delivery-status");
      if (statusSelect && changeStatusBtn) {
        changeStatusBtn.onclick = function () {
          var newStatus = statusSelect.value;
          if (!newStatus) return;
          changeStatusBtn.disabled = true;
          var oldText = changeStatusBtn.textContent;
          changeStatusBtn.textContent = "Actualizando…";
          window.fetchApi("/projects/" + projectId + "/code-deliveries/" + deliveryId, {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus })
          }).then(function (r) {
            if (r && r.success) {
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Estado actualizado a " + newStatus + ".");
              return loadDelivery().then(function () {
                return Promise.all([loadFiles(), loadCommits(), loadReview(), loadCanMerge()]);
              }).then(function () {
                changeStatusBtn.disabled = false;
                changeStatusBtn.textContent = oldText;
                render();
              });
            }
            throw new Error((r && r.error && r.error.message) ? r.error.message : "No se pudo actualizar el estado.");
          }).catch(function (err) {
            changeStatusBtn.disabled = false;
            changeStatusBtn.textContent = oldText;
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: (err && err.message) ? err.message : "No se pudo actualizar el estado." });
          });
        };
      }

      var reviewApproveBtn = document.getElementById("dw-review-approve");
      if (reviewApproveBtn) {
        reviewApproveBtn.onclick = function () {
          reviewApproveBtn.disabled = true;
          DeliveryWorkspaceAPI.submitDeliveryReview(projectId, deliveryId, "APPROVED").then(function (r) {
            if (r && r.success) {
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Revisión enviada: Aprobado.");
              loadMyDeliveryReview().then(loadDeliveryReviews).then(loadCanMerge).then(render);
            } else reviewApproveBtn.disabled = false;
          }).catch(function () {
            reviewApproveBtn.disabled = false;
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo enviar la revisión." });
          });
        };
      }
      var reviewChangesBtn = document.getElementById("dw-review-changes");
      if (reviewChangesBtn) {
        reviewChangesBtn.onclick = function () {
          reviewChangesBtn.disabled = true;
          DeliveryWorkspaceAPI.submitDeliveryReview(projectId, deliveryId, "CHANGES_REQUESTED").then(function (r) {
            if (r && r.success) {
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Revisión enviada: Cambios solicitados.");
              loadMyDeliveryReview().then(loadDeliveryReviews).then(loadCanMerge).then(render);
            } else reviewChangesBtn.disabled = false;
          }).catch(function () {
            reviewChangesBtn.disabled = false;
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo enviar la revisión." });
          });
        };
      }

      var genReleaseNotesBtn = document.getElementById("dw-generate-release-notes");
      if (genReleaseNotesBtn) {
        genReleaseNotesBtn.onclick = function () {
          var baseId = (document.getElementById("dw-release-notes-base-id") && document.getElementById("dw-release-notes-base-id").value) || "";
          baseId = baseId.trim();
          if (!baseId) {
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Campo requerido", message: "Selecciona una entrega base en el desplegable para comparar." });
            return;
          }
          genReleaseNotesBtn.disabled = true;
          genReleaseNotesBtn.textContent = "Generando…";
          var outEl = document.getElementById("dw-release-notes-output");
          if (outEl) { outEl.style.display = "none"; outEl.textContent = ""; }
          DeliveryWorkspaceAPI.generateReleaseNotes(projectId, deliveryId, baseId).then(function (r) {
            genReleaseNotesBtn.disabled = false;
            genReleaseNotesBtn.textContent = "Generar release notes";
            if (r && r.success && r.data) {
              if (outEl) { outEl.textContent = r.data.release_notes || "(sin contenido)"; outEl.style.display = "block"; }
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Release notes generadas.");
            }
          }).catch(function () {
            genReleaseNotesBtn.disabled = false;
            genReleaseNotesBtn.textContent = "Generar release notes";
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudieron generar las release notes." });
          });
        };
      }

      var runReviewBtn = document.getElementById("dw-run-ai-review");
      if (runReviewBtn) {
        runReviewBtn.onclick = function () {
          runReviewBtn.disabled = true;
          runReviewBtn.textContent = "Analizando…";
          DeliveryWorkspaceAPI.runAIReview(projectId, deliveryId).then(function (r) {
            if (r && r.success && r.data) {
              if (typeof window.showSuccessMessage === "function") window.showSuccessMessage("Revisión de IA completada.");
              state.review = r.data;
              render();
            } else {
              runReviewBtn.disabled = false;
              runReviewBtn.textContent = "Run AI Review";
              if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: (r && r.error && r.error.message) || "No se pudo completar la revisión." });
            }
          }).catch(function () {
            runReviewBtn.disabled = false;
            runReviewBtn.textContent = "Run AI Review";
            if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo ejecutar la revisión de IA. Añade archivos al workspace e inténtalo de nuevo." });
          });
        };
      }
    }

    loadDelivery().then(function () {
      if (!state.delivery) {
        window.setContent('<div class="nui-card"><div class="nui-card-body"><p class="text-danger">Entrega no encontrada.</p><a href="#/projects/' + esc(projectId) + '/repository" class="btn btn-nexus-primary btn-sm">Volver a Repository</a></div></div>');
        return;
      }
      return Promise.all([
        loadFiles(),
        loadCommits(),
        loadReview(),
        loadOtherDeliveries(),
        loadReviewComments(),
        loadDeliveryReviews(),
        loadMyDeliveryReview(),
        loadCanMerge()
      ]).then(render);
    }).catch(function () {
      window.setContent('<div class="nui-card"><div class="nui-card-body"><p class="text-danger">Error al cargar la entrega.</p><a href="#/projects" class="btn btn-nexus-primary btn-sm">Ir a Proyectos</a></div></div>');
    });
  });
})();
