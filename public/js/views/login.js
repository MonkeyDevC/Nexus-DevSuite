/**
 * Vista Login — ETAPA 11: layout split (formulario 40% izquierda, bloque visual 60% derecha).
 * POST /auth/login; token en sessionStorage; redirige a #/dashboard. Sin cambios en flujo ni backend.
 */
(function () {
  window.hideNav();
  window.registerView("login", function () {
    window.hideNav();
    const html = `
      <div class="login-page">
        <div class="login-card">
        <div class="login-panel-left">
          <div class="login-brand">NEXUS DevSuite</div>
          <p class="login-subtitle">Suite de desarrollo y gestión de producto</p>
          <h1 class="login-title">Iniciar sesión</h1>
          <div id="login-error" class="login-error d-none" role="alert"></div>
          <form id="login-form" class="login-form">
            <div class="mb-3">
              <label for="login-email" class="form-label">Correo electrónico</label>
              <input type="email" id="login-email" class="form-control" name="email" required autocomplete="email" placeholder="tu@ejemplo.com">
            </div>
            <div class="mb-3">
              <label for="login-password" class="form-label">Contraseña</label>
              <input type="password" id="login-password" class="form-control" name="password" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-nexus-accent">Entrar</button>
          </form>
          <a href="#" class="login-link-secondary" tabindex="-1">¿Olvidaste tu contraseña?</a>
          <footer class="login-footer">
            © 2026 NEXUS DevSuite · <a href="#">Términos</a> · <a href="#">Privacidad</a>
          </footer>
        </div>
        <div class="login-panel-right">
          <div class="login-visual">
            <span class="login-visual-mark" aria-hidden="true">NEXUS</span>
          </div>
        </div>
        </div>
      </div>`;
    window.setContent(html);
    const form = document.getElementById("login-form");
    const errEl = document.getElementById("login-error");
    var loginErrorHideTimer = null;
    function showLoginError(message) {
      if (loginErrorHideTimer) clearTimeout(loginErrorHideTimer);
      errEl.textContent = message || "Credenciales inválidas.";
      errEl.classList.remove("d-none");
      loginErrorHideTimer = setTimeout(function () {
        errEl.classList.add("d-none");
        loginErrorHideTimer = null;
      }, 2000);
    }
    if (form) {
      form.onsubmit = async function (e) {
        e.preventDefault();
        if (loginErrorHideTimer) clearTimeout(loginErrorHideTimer);
        errEl.classList.add("d-none");
        const email = form.email.value.trim();
        const password = form.password.value;
        if (!password) {
          showLoginError("Contraseña obligatoria.");
          return;
        }
        const body = await window.fetchApi("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });
        if (body && body.success && body.data) {
          window.setTokens(body.data.access_token, body.data.refresh_token);
          window.location.hash = "#/dashboard";
        } else {
          const msg = (body && body.error && body.error.message) || "Credenciales inválidas.";
          if (body && body.error && body.error.code === "AUTH_RATE_LIMIT_EXCEEDED") {
            if (typeof window.openNexusAlertModal === "function") {
              window.openNexusAlertModal({ title: "Límite de solicitudes", message: msg + " Espere unos minutos antes de intentar de nuevo." });
            } else {
              showLoginError(msg);
            }
          } else {
            showLoginError(msg);
          }
        }
      };
    }
  });
})();
