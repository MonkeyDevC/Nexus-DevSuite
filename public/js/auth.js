/**
 * Auth — Guard de rutas, getMe, redirect a login
 */
(function () {
  let currentUser = null;

  window.redirectToLogin = function () {
    window.location.hash = "#/login";
  };

  window.requireAuth = function () {
    if (!window.getToken()) {
      window.redirectToLogin();
      return false;
    }
    return true;
  };

  window.getMe = async function () {
    if (!window.getToken()) return null;
    if (currentUser) return currentUser;
    const body = await window.fetchApi("/auth/me");
    if (body && body.success && body.data) {
      currentUser = body.data;
      return currentUser;
    }
    return null;
  };

  window.clearUser = function () {
    currentUser = null;
  };

  window.logout = async function () {
    const refreshToken = window.getRefreshToken();
    if (refreshToken) {
      try {
        await fetch((window.APP_CONFIG && window.APP_CONFIG.API_BASE || "/api/v1") + "/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
      } catch (_) {}
    }
    window.clearTokens();
    window.clearUser();
    window.redirectToLogin();
  };
})();
