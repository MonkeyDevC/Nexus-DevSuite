/**
 * Lógica centralizada de permisos por rol.
 * Las vistas deben usar getMe() y luego nexusCanAccessMasterActions(user)
 * para mostrar u ocultar acciones reservadas a MASTER.
 */
(function () {
  /**
   * Indica si el usuario puede ver y ejecutar acciones reservadas al rol MASTER.
   * @param {{ role?: string } | null} user - Objeto usuario (p. ej. devuelto por getMe()).
   * @returns {boolean}
   */
  window.nexusCanAccessMasterActions = function (user) {
    return !!(user && user.role === "MASTER");
  };
})();
