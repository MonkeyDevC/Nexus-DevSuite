/**
 * Panel Administrativo — Solo MASTER. #/admin (dashboard), #/admin/users, #/admin/audit, #/admin/metrics.
 * Guard en router; menú Admin en layout. GET/POST/PUT/DELETE /users, PATCH /users/:id/password, GET /reports/audit, GET /system/metrics.
 * openManageUserModal(userId, onSaved) expuesto en window para abrir la card desde el menú de usuario (Editar usuario).
 * buildNexusFormCardModal: punto único para desplegar formularios en tarjeta (mismo estilo que Edición de usuario).
 */
(function () {
  /**
   * Construye el HTML de un modal tipo "form card" (tarjeta centrada, bordes redondeados, sombra).
   * @param {Object} opts - { id, title, bodyHtml, primaryButtonId, primaryLabel }
   * @returns {string} HTML del modal completo
   */
  function buildNexusFormCardModal(opts) {
    var id = opts.id || "nexusFormCardModal";
    var title = opts.title || "";
    var bodyHtml = opts.bodyHtml || "";
    var primaryId = opts.primaryButtonId || "nexus-form-card-submit";
    var primaryLabel = opts.primaryLabel || "Guardar";
    var html = '<div class="modal fade nexus-modal-manage-user" id="' + id + '" tabindex="-1" aria-labelledby="' + id + 'Label" aria-hidden="true">';
    html += '<div class="modal-dialog modal-dialog-centered"><div class="nexus-manage-user-card modal-content">';
    html += '<div class="modal-header border-0 pb-0"><h5 class="modal-title nexus-manage-user-title" id="' + id + 'Label">' + title + '</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>';
    html += '<div class="modal-body pt-2">' + bodyHtml + '</div>';
    html += '<div class="modal-footer border-0"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn btn-nexus-primary" id="' + primaryId + '">' + primaryLabel + '</button></div>';
    html += "</div></div></div>";
    return html;
  }

  function openManageUserModal(userId, onSaved) {
    var bodyHtml = '<div class="d-flex flex-column align-items-center mb-4">';
    bodyHtml += '<div class="nexus-manage-user-avatar-wrap" id="admin-manage-user-avatar"><span class="nexus-manage-user-initials" id="admin-manage-user-initials">—</span></div>';
    bodyHtml += '<input type="file" id="admin-manage-user-photo-file" accept="image/*" class="d-none">';
    bodyHtml += '<button type="button" class="btn btn-nexus-secondary btn-sm rounded-pill mt-2" id="admin-manage-user-photo-btn">Subir foto</button>';
    bodyHtml += '</div>';
    bodyHtml += '<div class="mb-3"><label class="form-label">Nombre</label><div class="input-group">';
    bodyHtml += '<input type="text" id="admin-manage-user-name" class="form-control" placeholder="Nombre del usuario">';
    bodyHtml += '<span class="input-group-text nexus-manage-user-pencil" title="Editar nombre" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span></div></div>';
    bodyHtml += '<div class="mb-3"><label class="form-label">Correo electrónico</label><input type="email" id="admin-manage-user-email" class="form-control" placeholder="correo@ejemplo.com"></div>';
    bodyHtml += '<div class="mb-3" id="admin-manage-user-role-wrap"><label class="form-label">Rol</label>';
    bodyHtml += '<input type="text" id="admin-manage-user-role" class="form-control" placeholder="—" readonly style="background: var(--nexus-bg-page);">';
    bodyHtml += '<select id="admin-manage-user-role-select" class="form-select d-none" aria-label="Rol"></select></div>';
    bodyHtml += '<div class="mb-3" id="admin-manage-user-pwd-current-row"><label class="form-label" id="admin-manage-user-pwd-label">Contraseña</label><div class="input-group">';
    bodyHtml += '<input type="password" id="admin-manage-user-pwd-input" class="form-control" placeholder="********" readonly style="background: var(--nexus-bg-page);" autocomplete="off">';
    bodyHtml += '<span class="input-group-text nexus-manage-user-pencil" title="Cambiar contraseña" id="admin-manage-user-pwd-edit" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span></div></div>';
    bodyHtml += '<div class="mb-3 d-none" id="admin-manage-user-pwd-fields"><label class="form-label">Nueva contraseña (mín. 8 caracteres)</label><input type="password" id="admin-manage-user-new-pwd" class="form-control" placeholder="Nueva contraseña"></div>';
    bodyHtml += '<div id="admin-manage-user-error" class="alert alert-danger d-none"></div>';
    var modalHtml = buildNexusFormCardModal({
      id: "adminManageUserModal",
      title: "Edición de usuario",
      bodyHtml: bodyHtml,
      primaryButtonId: "admin-manage-user-save",
      primaryLabel: "Guardar"
    });
    var wrap = document.createElement("div");
    wrap.innerHTML = modalHtml;
    document.body.appendChild(wrap.firstElementChild);
    var modalEl = document.getElementById("adminManageUserModal");
    var roleInput = document.getElementById("admin-manage-user-role");
    var roleSelect = document.getElementById("admin-manage-user-role-select");
    var isMasterInModal = false;
    Promise.all([window.fetchApi("/users/" + userId), window.getMe()]).then(function (results) {
      var body = results[0];
      var me = results[1];
      if (!body || !body.success || !body.data) return;
      var d = body.data;
      document.getElementById("admin-manage-user-email").value = d.email || "";
      document.getElementById("admin-manage-user-name").value = d.name || "";
      var roleName = (d.role && d.role.name) ? d.role.name : "—";
      isMasterInModal = me && me.role === "MASTER";
      if (isMasterInModal) {
        roleInput.classList.add("d-none");
        roleSelect.classList.remove("d-none");
        window.fetchApi("/auth/roles").then(function (rolesRes) {
          if (rolesRes && rolesRes.success && rolesRes.data && Array.isArray(rolesRes.data)) {
            roleSelect.innerHTML = "";
            rolesRes.data.forEach(function (r) {
              var opt = document.createElement("option");
              opt.value = r.id;
              opt.textContent = r.name;
              roleSelect.appendChild(opt);
            });
            roleSelect.value = d.role_id || "";
          }
        });
      } else {
        roleInput.value = roleName;
      }
      var name = (d.name || "").trim() || (d.email || "").trim();
      var initial = name ? name.charAt(0).toUpperCase() : "?";
      document.getElementById("admin-manage-user-initials").textContent = initial;
      var avatarWrap = document.getElementById("admin-manage-user-avatar");
      if (d.profile_photo_url) {
        var img = document.createElement("img");
        img.src = d.profile_photo_url;
        img.alt = "";
        img.className = "nexus-manage-user-avatar-img";
        var spanFallback = document.createElement("span");
        spanFallback.className = "nexus-manage-user-initials";
        spanFallback.style.display = "none";
        spanFallback.textContent = initial;
        img.onerror = function () { img.style.display = "none"; spanFallback.style.display = "block"; };
        avatarWrap.innerHTML = "";
        avatarWrap.appendChild(img);
        avatarWrap.appendChild(spanFallback);
      }
    });
    document.getElementById("admin-manage-user-photo-btn").onclick = function () {
      document.getElementById("admin-manage-user-photo-file").click();
    };
    document.getElementById("admin-manage-user-photo-file").onchange = function () {
      var file = this.files && this.files[0];
      if (!file) return;
      var formData = new FormData();
      formData.append("photo", file);
      var errEl = document.getElementById("admin-manage-user-error");
      errEl.classList.add("d-none");
      window.fetchApi("/users/" + userId + "/photo", { method: "POST", body: formData }).then(function (r) {
        if (r && r.success && r.data && r.data.profile_photo_url) {
          var avatarWrap = document.getElementById("admin-manage-user-avatar");
          var nameVal = document.getElementById("admin-manage-user-name").value.trim();
          var initial = nameVal ? nameVal.charAt(0).toUpperCase() : "—";
          var img = document.createElement("img");
          img.src = r.data.profile_photo_url;
          img.alt = "";
          img.className = "nexus-manage-user-avatar-img";
          var span = document.createElement("span");
          span.className = "nexus-manage-user-initials";
          span.style.display = "none";
          span.textContent = initial;
          img.onerror = function () { img.style.display = "none"; span.style.display = "block"; };
          avatarWrap.innerHTML = "";
          avatarWrap.appendChild(img);
          avatarWrap.appendChild(span);
        } else {
          errEl.textContent = (r && r.error && r.error.message) || "Error al subir la foto.";
          errEl.classList.remove("d-none");
        }
      });
      this.value = "";
    };
    document.getElementById("admin-manage-user-name").oninput = function () {
      var initialsEl = document.getElementById("admin-manage-user-initials");
      if (initialsEl && !document.getElementById("admin-manage-user-avatar").querySelector("img")) {
        var c = this.value.trim().charAt(0).toUpperCase();
        initialsEl.textContent = c || "—";
      }
    };
    document.getElementById("admin-manage-user-pwd-edit").onclick = function () {
      var label = document.getElementById("admin-manage-user-pwd-label");
      var input = document.getElementById("admin-manage-user-pwd-input");
      var pwdWrap = document.getElementById("admin-manage-user-pwd-fields");
      var pwdCurrentRow = document.getElementById("admin-manage-user-pwd-current-row");
      var newPwdInput = document.getElementById("admin-manage-user-new-pwd");
      var isEditing = !pwdWrap.classList.contains("d-none");
      if (isEditing) {
        label.textContent = "Contraseña";
        input.setAttribute("readonly", "readonly");
        input.value = "";
        input.placeholder = "********";
        input.style.background = "var(--nexus-bg-page)";
        newPwdInput.value = "";
        pwdWrap.classList.add("d-none");
        if (pwdCurrentRow && isMasterInModal) pwdCurrentRow.classList.remove("d-none");
      } else {
        if (isMasterInModal && pwdCurrentRow) {
          pwdCurrentRow.classList.add("d-none");
        } else {
          label.textContent = "Contraseña actual";
          input.removeAttribute("readonly");
          input.value = "";
          input.placeholder = "Contraseña actual";
          input.style.background = "";
        }
        pwdWrap.classList.remove("d-none");
      }
    };
    document.getElementById("admin-manage-user-save").onclick = function () {
      var errEl = document.getElementById("admin-manage-user-error");
      errEl.classList.add("d-none");
      var email = document.getElementById("admin-manage-user-email").value.trim();
      var name = document.getElementById("admin-manage-user-name").value.trim();
      var currentPwd = document.getElementById("admin-manage-user-pwd-input").value;
      var newPwd = document.getElementById("admin-manage-user-new-pwd").value;
      if (!email) { errEl.textContent = "El correo es obligatorio."; errEl.classList.remove("d-none"); return; }
      if (newPwd) {
        if (!isMasterInModal && !currentPwd) { errEl.textContent = "Indique la contraseña actual para cambiar la contraseña."; errEl.classList.remove("d-none"); return; }
        if (newPwd.length < 8) { errEl.textContent = "La nueva contraseña debe tener al menos 8 caracteres."; errEl.classList.remove("d-none"); return; }
        var pwdPayload = { new_password: newPwd };
        if (!isMasterInModal && currentPwd) pwdPayload.current_password = currentPwd;
        window.fetchApi("/users/" + userId + "/password", { method: "PATCH", body: JSON.stringify(pwdPayload) }).then(function (r) {
          if (!r || !r.success) {
            errEl.textContent = (r && r.error && r.error.message) || "Error al cambiar contraseña.";
            errEl.classList.remove("d-none");
            return;
          }
          saveProfile();
        });
      } else {
        saveProfile();
      }
      function saveProfile() {
        var payload = { email: email };
        if (name) payload.name = name;
        var roleSelectEl = document.getElementById("admin-manage-user-role-select");
        if (roleSelectEl && !roleSelectEl.classList.contains("d-none") && roleSelectEl.value) {
          payload.role_id = roleSelectEl.value;
        }
        window.fetchApi("/users/" + userId, { method: "PUT", body: JSON.stringify(payload) }).then(function (r) {
          if (r && r.success) {
            bsModalManage.hide();
            if (typeof onSaved === "function") onSaved();
          } else {
            errEl.textContent = (r && r.error && r.error.message) || "Error.";
            errEl.classList.remove("d-none");
          }
        });
      }
    };
    var bsModalManage = new bootstrap.Modal(modalEl);
    modalEl.addEventListener("shown.bs.modal", function () { document.body.classList.add("nexus-manage-user-modal-open"); });
    modalEl.addEventListener("hidden.bs.modal", function () { document.body.classList.remove("nexus-manage-user-modal-open"); modalEl.remove(); });
    bsModalManage.show();
  }
  window.openManageUserModal = openManageUserModal;

  function renderBreadcrumb(sub) {
    var items = [{ label: "Administración", href: "#/admin" }];
    if (sub) items.push({ label: sub, href: "" });
    return window.renderBreadcrumbs ? window.renderBreadcrumbs(items) : '<nav aria-label="breadcrumb"><ol class="breadcrumb mb-2"><li class="breadcrumb-item"><a href="#/admin">Administración</a></li>' + (sub ? '<li class="breadcrumb-item text-muted">' + sub + "</li>" : "") + "</ol></nav>";
  }

  function renderDashboard() {
    var html = renderBreadcrumb();
    html += '<h1 class="nexus-page-title">Administración</h1>';
    html += '<div class="row g-4">';
    html += '<div class="col-md-4"><div class="nexus-card h-100"><div class="nexus-font-semibold nexus-text-primary mb-2">Usuarios</div><p class="nexus-text-secondary nexus-text-sm">Gestionar usuarios, roles y contraseñas.</p><a href="#/admin/users" class="btn btn-nexus-primary btn-sm">Abrir</a></div></div>';
    html += '<div class="col-md-4"><div class="nexus-card h-100"><div class="nexus-font-semibold nexus-text-primary mb-2">Registro de auditoría</div><p class="nexus-text-secondary nexus-text-sm">Ver registro de auditoría con filtros.</p><a href="#/admin/audit" class="btn btn-nexus-primary btn-sm">Abrir</a></div></div>';
    html += '<div class="col-md-4"><div class="nexus-card h-100"><div class="nexus-font-semibold nexus-text-primary mb-2">Métricas</div><p class="nexus-text-secondary nexus-text-sm">Métricas de la instancia del sistema.</p><a href="#/admin/metrics" class="btn btn-nexus-primary btn-sm">Abrir</a></div></div>';
    html += "</div>";
    return html;
  }

  window.registerView("admin", async function () {
    await window.showNav();
    var segs = window.getHashSegments();
    var sub = segs[1]; // "users" | "audit" | "metrics" | undefined (dashboard)
    if (!sub || sub === "dashboard") {
      window.setContent(renderDashboard());
      return;
    }
    if (sub === "users") {
      window.setContent(window.showLoading());
      await renderAdminUsers();
      return;
    }
    if (sub === "audit") {
      window.setContent(window.showLoading());
      await renderAdminAudit();
      return;
    }
    if (sub === "metrics") {
      window.setContent(window.showLoading());
      await renderAdminMetrics();
      return;
    }
    window.setContent(renderDashboard());
  });

  async function renderAdminUsers() {
    var state = { page: 1, limit: 10, email: "", role_id: "", sort: "email", dir: "asc" };
    var currentMeta = null;
    var currentItems = [];
    var roleOptions = [];

    function buildQuery() {
      var q = "?page=" + state.page + "&limit=" + state.limit;
      if (state.email) q += "&email=" + encodeURIComponent(state.email);
      if (state.role_id) q += "&role_id=" + encodeURIComponent(state.role_id);
      return q;
    }

    function getDisplayItems(raw) {
      var list = raw || [];
      list = window.sortArray(list, state.sort, state.dir);
      return list;
    }

    function renderList(items, meta) {
      var html = renderBreadcrumb("Gestión de usuarios");
      html += '<h1 class="nexus-page-title">Usuarios</h1>';
      html += '<div class="nexus-panel nexus-section-spacing">';
      html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3"><input type="search" id="admin-user-email" class="form-control form-control-sm nexus-input" placeholder="Buscar por email..." style="max-width:220px" aria-label="Buscar email">';
      html += '<label class="mb-0"><span class="nexus-text-sm">Filtrar por rol</span> <select id="admin-user-role" class="form-select form-select-sm d-inline-block" style="width:auto"><option value="">Todos</option>';
      roleOptions.forEach(function (r) { html += '<option value="' + r.id + '">' + (r.name || r.id) + "</option>"; });
      html += "</select></label><a href=\"#\" id=\"admin-user-new\" class=\"btn btn-nexus-primary btn-sm ms-auto\">+ Nuevo usuario</a></div>";
      if (!items || items.length === 0) {
        html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">No hay usuarios</p><p class="nexus-text-secondary">No hay usuarios o no hay resultados para el filtro.</p></div>';
      } else {
        html += '<div class="table-responsive" id="admin-users-table"><table class="table table-sm nexus-table"><thead><tr>';
        html += window.sortableTh("Email", "email", state.sort, state.dir, setSort) + "<th scope=\"col\">Rol</th>" + window.sortableTh("Estado", "is_active", state.sort, state.dir, setSort) + "<th scope=\"col\">Acciones</th></tr></thead><tbody>";
        items.forEach(function (u) {
          var roleName = (u.role && u.role.name) || (u.role_id ? "Rol" : "—");
          html += "<tr><td>" + (u.email || "") + "</td><td>" + roleName + "</td><td>" + (u.is_active ? "Activo" : "Inactivo") + "</td><td><button type=\"button\" class=\"btn btn-nexus-primary btn-sm me-1 admin-btn-manage\" data-id=\"" + u.id + "\">Gestionar usuario</button> <button type=\"button\" class=\"btn btn-link btn-sm p-0 admin-btn-edit\" data-id=\"" + u.id + "\">Editar</button> <button type=\"button\" class=\"btn btn-link btn-sm p-0 admin-btn-pwd\" data-id=\"" + u.id + "\">Contraseña</button> <button type=\"button\" class=\"btn btn-link btn-sm p-0 text-danger admin-btn-del\" data-id=\"" + u.id + "\">Eliminar</button></td></tr>";
        });
        html += "</tbody></table></div>";
        if (meta && meta.totalPages > 1) html += '<div id="admin-users-pagination" class="mt-2"></div>';
      }
      html += "</div>";
      return html;
    }

    function setSort(key) {
      state.sort = key;
      state.dir = state.sort === key && state.dir === "asc" ? "desc" : "asc";
      refreshUsers();
    }

    function refreshUsers() {
      var toShow = getDisplayItems(currentItems);
      var meta = currentMeta || { page: 1, limit: state.limit, total: toShow.length, totalPages: 1 };
      window.setContent(renderList(toShow, meta));
      bindUsers();
    }

    function loadUsers() {
      window.setContent(window.showLoading());
      window.fetchApi("/users" + buildQuery()).then(function (body) {
        if (body && body.success && body.data) {
          var data = body.data;
          var raw = data.data || data.items || (Array.isArray(data) ? data : []);
          currentItems = raw;
          roleOptions = [];
          raw.forEach(function (u) {
            if (u.role_id && !roleOptions.some(function (r) { return r.id === u.role_id; })) {
              roleOptions.push({ id: u.role_id, name: (u.role && u.role.name) || ("Rol " + (u.role_id || "").substring(0, 8)) });
            }
          });
          var toShow = getDisplayItems(raw);
          var meta = data.meta || {};
          currentMeta = { page: meta.page || state.page, limit: meta.limit || state.limit, total: meta.total != null ? meta.total : raw.length, totalPages: meta.totalPages != null ? meta.totalPages : 1 };
          window.setContent(renderList(toShow, currentMeta));
          bindUsers();
        } else {
          window.setContent(window.showError(body && body.error && body.error.message));
        }
      });
    }

    function bindUsers() {
      var emailEl = document.getElementById("admin-user-email");
      var roleEl = document.getElementById("admin-user-role");
      if (emailEl) {
        emailEl.value = state.email;
        var t;
        emailEl.oninput = function () { clearTimeout(t); t = setTimeout(function () { state.email = emailEl.value; state.page = 1; loadUsers(); }, 300); };
      }
      if (roleEl) {
        roleEl.value = state.role_id;
        roleEl.onchange = function () { state.role_id = roleEl.value; state.page = 1; loadUsers(); };
      }
      var pagEl = document.getElementById("admin-users-pagination");
      if (pagEl && currentMeta && currentMeta.totalPages > 1) {
        pagEl.innerHTML = window.renderPagination(currentMeta, function (p) { state.page = p; loadUsers(); });
        pagEl.querySelectorAll(".page-link").forEach(function (a) {
          if (a.getAttribute("data-page")) a.onclick = function (e) { e.preventDefault(); var p = parseInt(a.getAttribute("data-page"), 10); if (p >= 1 && p <= currentMeta.totalPages) { state.page = p; loadUsers(); } };
        });
      }
      document.querySelectorAll("#content [data-sort]").forEach(function (a) {
        a.onclick = function (e) { e.preventDefault(); setSort(a.getAttribute("data-sort")); };
      });
      document.getElementById("admin-user-new").onclick = function (e) { e.preventDefault(); showUserModal(); };
      document.querySelectorAll(".admin-btn-manage").forEach(function (btn) {
        btn.onclick = function () { showManageUserModal(btn.getAttribute("data-id")); };
      });
      document.querySelectorAll(".admin-btn-edit").forEach(function (btn) {
        btn.onclick = function () { showUserModal(btn.getAttribute("data-id")); };
      });
      document.querySelectorAll(".admin-btn-pwd").forEach(function (btn) {
        btn.onclick = function () { showPasswordModal(btn.getAttribute("data-id")); };
      });
      document.querySelectorAll(".admin-btn-del").forEach(function (btn) {
        btn.onclick = function () { confirmDeleteUser(btn.getAttribute("data-id")); };
      });
    }

    function showUserModal(userId) {
      var isEdit = !!userId;
      var title = isEdit ? "Editar usuario" : "Nuevo usuario";
      var bodyHtml = '<div class="mb-3"><label class="form-label">Correo electrónico</label><input type="email" id="admin-user-form-email" class="form-control" placeholder="correo@ejemplo.com" required></div>';
      bodyHtml += '<div class="mb-3" id="admin-user-form-pwd-wrap"><label class="form-label">Contraseña (mín. 8 caracteres)</label><input type="password" id="admin-user-form-pwd" class="form-control" placeholder="Contraseña"></div>';
      bodyHtml += '<div class="mb-3"><label class="form-label">Rol</label><select id="admin-user-form-role" class="form-select" aria-label="Rol"></select></div>';
      bodyHtml += '<div id="admin-user-form-error" class="alert alert-danger d-none"></div>';
      var html = buildNexusFormCardModal({
        id: "adminUserModal",
        title: title,
        bodyHtml: bodyHtml,
        primaryButtonId: "admin-user-form-submit",
        primaryLabel: "Guardar"
      });
      var wrap = document.createElement("div");
      wrap.innerHTML = html;
      document.body.appendChild(wrap.firstElementChild);
      var modalEl = document.getElementById("adminUserModal");
      modalEl.addEventListener("shown.bs.modal", function () { document.body.classList.add("nexus-manage-user-modal-open"); });
      modalEl.addEventListener("hidden.bs.modal", function () { document.body.classList.remove("nexus-manage-user-modal-open"); modalEl.remove(); });
      var roleSelect = document.getElementById("admin-user-form-role");
      roleOptions.forEach(function (r) {
        var opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = r.name;
        roleSelect.appendChild(opt);
      });
      if (isEdit) {
        document.getElementById("admin-user-form-pwd-wrap").style.display = "none";
        window.fetchApi("/users/" + userId).then(function (body) {
          if (body && body.success && body.data) {
            document.getElementById("admin-user-form-email").value = body.data.email || "";
            roleSelect.value = body.data.role_id || "";
          }
        });
      }
      var bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
      document.getElementById("admin-user-form-submit").onclick = function () {
        var email = document.getElementById("admin-user-form-email").value.trim();
        var pwd = document.getElementById("admin-user-form-pwd").value;
        var role_id = roleSelect.value;
        var errEl = document.getElementById("admin-user-form-error");
        errEl.classList.add("d-none");
        if (!email) { errEl.textContent = "Email es obligatorio."; errEl.classList.remove("d-none"); return; }
        if (!isEdit && !pwd) { errEl.textContent = "Contraseña es obligatoria al crear."; errEl.classList.remove("d-none"); return; }
        if (isEdit && pwd && pwd.length < 8) { errEl.textContent = "La contraseña debe tener al menos 8 caracteres."; errEl.classList.remove("d-none"); return; }
        if (!role_id) { errEl.textContent = "Seleccione un rol."; errEl.classList.remove("d-none"); return; }
        if (isEdit) {
          var payload = { email: email, role_id: role_id };
          if (pwd) payload.password = pwd;
          window.fetchApi("/users/" + userId, { method: "PUT", body: JSON.stringify(payload) }).then(function (r) {
            if (r && r.success) { bsModal.hide(); loadUsers(); } else { errEl.textContent = (r && r.error && r.error.message) || "Error."; errEl.classList.remove("d-none"); }
          });
        } else {
          window.fetchApi("/users", { method: "POST", body: JSON.stringify({ email: email, password: pwd, role_id: role_id }) }).then(function (r) {
            if (r && r.success) { bsModal.hide(); loadUsers(); } else { errEl.textContent = (r && r.error && r.error.message) || "Error."; errEl.classList.remove("d-none"); }
          });
        }
      };
    }

    function showPasswordModal(userId) {
      var html = '<div class="modal fade" id="adminPwdModal" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Cambiar contraseña</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body">';
      html += '<div class="mb-2"><label class="form-label">Contraseña actual</label><input type="password" id="admin-pwd-current" class="form-control"></div>';
      html += '<div class="mb-2"><label class="form-label">Nueva contraseña (mín. 8)</label><input type="password" id="admin-pwd-new" class="form-control"></div>';
      html += '<div id="admin-pwd-error" class="alert alert-danger d-none"></div></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn btn-primary" id="admin-pwd-submit">Cambiar</button></div></div></div></div>';
      var wrap = document.createElement("div");
      wrap.innerHTML = html;
      document.body.appendChild(wrap.firstElementChild);
      var modalEl = document.getElementById("adminPwdModal");
      var bsModal = new bootstrap.Modal(modalEl);
      modalEl.addEventListener("hidden.bs.modal", function () { modalEl.remove(); });
      bsModal.show();
      document.getElementById("admin-pwd-submit").onclick = function () {
        var current = document.getElementById("admin-pwd-current").value;
        var newPwd = document.getElementById("admin-pwd-new").value;
        var errEl = document.getElementById("admin-pwd-error");
        errEl.classList.add("d-none");
        if (!current || !newPwd) { errEl.textContent = "Ambos campos son obligatorios."; errEl.classList.remove("d-none"); return; }
        if (newPwd.length < 8) { errEl.textContent = "La nueva contraseña debe tener al menos 8 caracteres."; errEl.classList.remove("d-none"); return; }
        window.fetchApi("/users/" + userId + "/password", { method: "PATCH", body: JSON.stringify({ current_password: current, new_password: newPwd }) }).then(function (r) {
          if (r && r.success) { bsModal.hide(); } else { errEl.textContent = (r && r.error && r.error.message) || "Error."; errEl.classList.remove("d-none"); }
        });
      };
    }

    function showManageUserModal(userId) {
      openManageUserModal(userId, loadUsers);
    }

    function confirmDeleteUser(userId) {
      if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
      window.fetchApi("/users/" + userId, { method: "DELETE" }).then(function (r) {
        if (r && r.success) loadUsers();
        else alert((r && r.error && r.error.message) || "Error al eliminar");
      });
    }

    loadUsers();
  }

  async function renderAdminAudit() {
    var state = { page: 1, limit: 20, entity: "", user_id: "", from: "", to: "", action: "" };
    var currentMeta = null;

    function buildQuery() {
      var q = "?page=" + state.page + "&limit=" + state.limit;
      if (state.entity) q += "&entity=" + encodeURIComponent(state.entity);
      if (state.user_id) q += "&user_id=" + encodeURIComponent(state.user_id);
      if (state.from) q += "&from=" + encodeURIComponent(state.from);
      if (state.to) q += "&to=" + encodeURIComponent(state.to);
      if (state.action) q += "&action=" + encodeURIComponent(state.action);
      return q;
    }

    function load() {
      window.setContent(window.showLoading());
      window.fetchApi("/reports/audit" + buildQuery()).then(function (body) {
        if (body && body.success && body.data) {
          var list = body.data.auditLogs || [];
          var pag = body.data.pagination || {};
          var total = pag.total != null ? pag.total : list.length;
          var totalPages = pag.totalPages != null ? pag.totalPages : (total === 0 ? 0 : Math.ceil(total / state.limit));
          currentMeta = { page: pag.page || state.page, limit: pag.limit || state.limit, total: total, totalPages: totalPages };
          var html = renderBreadcrumb("Registro de auditoría");
          html += '<h1 class="nexus-page-title">Registro de auditoría</h1>';
          html += '<div class="nexus-panel nexus-section-spacing">';
          html += '<div class="d-flex flex-wrap gap-2 align-items-end mb-3"><input type="text" id="audit-entity" class="form-control form-control-sm nexus-input" placeholder="Entidad" style="max-width:120px" aria-label="Entidad">';
          html += '<input type="text" id="audit-action" class="form-control form-control-sm nexus-input" placeholder="Acción" style="max-width:120px" aria-label="Acción">';
          html += '<input type="date" id="audit-from" class="form-control form-control-sm nexus-input" aria-label="Desde">';
          html += '<input type="date" id="audit-to" class="form-control form-control-sm nexus-input" aria-label="Hasta">';
          html += '<button type="button" class="btn btn-nexus-primary btn-sm" id="audit-btn">Filtrar</button></div>';
          if (list.length === 0) {
            html += '<div class="nexus-empty-state"><p class="nexus-empty-state-title">No hay registros de auditoría</p><p class="nexus-text-secondary">Ningún registro coincide con los filtros.</p></div>';
          } else {
            html += '<div class="table-responsive"><table class="table table-sm nexus-table"><thead><tr><th scope="col">Fecha</th><th scope="col">Usuario</th><th scope="col">Entidad</th><th scope="col">entity_id</th><th scope="col">Acción</th><th scope="col">IP</th></tr></thead><tbody>';
            list.forEach(function (a) {
              html += "<tr><td>" + (a.created_at || "") + "</td><td>" + (a.user_id || "") + "</td><td>" + (a.entity || "") + "</td><td>" + (a.entity_id || "") + "</td><td>" + (a.action || "") + "</td><td>" + (a.ip_address || "") + "</td></tr>";
            });
            html += "</tbody></table></div>";
            if (currentMeta.totalPages > 1) html += '<div id="audit-pagination" class="mt-2"></div>';
          }
          html += "</div>";
          window.setContent(html);
          document.getElementById("audit-entity").value = state.entity;
          document.getElementById("audit-action").value = state.action;
          document.getElementById("audit-from").value = state.from;
          document.getElementById("audit-to").value = state.to;
          document.getElementById("audit-btn").onclick = function () {
            state.entity = document.getElementById("audit-entity").value.trim();
            state.action = document.getElementById("audit-action").value.trim();
            state.from = document.getElementById("audit-from").value;
            state.to = document.getElementById("audit-to").value;
            state.page = 1;
            load();
          };
          var pagEl = document.getElementById("audit-pagination");
          if (pagEl && currentMeta.totalPages > 1) {
            pagEl.innerHTML = window.renderPagination(currentMeta, function (p) { state.page = p; load(); });
            pagEl.querySelectorAll(".page-link").forEach(function (a) {
              if (a.getAttribute("data-page")) a.onclick = function (e) { e.preventDefault(); var p = parseInt(a.getAttribute("data-page"), 10); if (p >= 1 && p <= currentMeta.totalPages) { state.page = p; load(); } };
            });
          }
        } else {
          window.setContent(window.showError(body && body.error && body.error.message));
        }
      });
    }
    load();
  }

  async function renderAdminMetrics() {
    window.fetchApi("/system/metrics").then(function (body) {
      if (body && body.success && body.data) {
        var d = body.data;
        var html = renderBreadcrumb("Métricas");
        html += '<h1 class="nexus-page-title">Métricas</h1>';
        html += '<div class="nexus-panel nexus-section-spacing"><div class="d-flex justify-content-between align-items-center mb-3"><span class="nexus-text-secondary">Ámbito: ' + (d.scope || "instance") + '</span><button type="button" class="btn btn-nexus-primary btn-sm" id="admin-metrics-refresh">Actualizar métricas</button></div>';
        html += '<div class="row g-3 mb-4">';
        html += '<div class="col-sm-6 col-md-3"><div class="nexus-card"><div class="nexus-text-sm nexus-text-secondary">total_requests</div><div class="nexus-font-semibold nexus-text-lg">' + (d.total_requests != null ? d.total_requests : "—") + "</div></div></div>";
        html += '<div class="col-sm-6 col-md-3"><div class="nexus-card"><div class="nexus-text-sm nexus-text-secondary">total_errors</div><div class="nexus-font-semibold nexus-text-lg">' + (d.total_errors != null ? d.total_errors : "—") + "</div></div></div>";
        html += '<div class="col-sm-6 col-md-3"><div class="nexus-card"><div class="nexus-text-sm nexus-text-secondary">auth_failures</div><div class="nexus-font-semibold nexus-text-lg">' + (d.auth_failures != null ? d.auth_failures : "—") + "</div></div></div>";
        html += '<div class="col-sm-6 col-md-3"><div class="nexus-card"><div class="nexus-text-sm nexus-text-secondary">refresh_failures</div><div class="nexus-font-semibold nexus-text-lg">' + (d.refresh_failures != null ? d.refresh_failures : "—") + "</div></div></div>";
        html += "</div>";
        html += '<h3 class="nexus-font-semibold nexus-text-primary mb-2">Detalles de métricas</h3><pre class="bg-light p-3 rounded nexus-text-sm" style="max-height:300px;overflow:auto">' + (typeof d === "object" ? JSON.stringify(d, null, 2) : d) + "</pre></div>";
        window.setContent(html);
        document.getElementById("admin-metrics-refresh").onclick = function () { window.setContent(window.showLoading()); renderAdminMetrics(); };
      } else {
        window.setContent(window.showError(body && body.error && body.error.message));
      }
    });
  }
})();
