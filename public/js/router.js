/**
 * Router — Hash-based (#/dashboard, #/projects, ...)
 */
(function () {
  /**
   * Router legacy aislado: no participa del runtime principal SPA.
   * Se preserva interfaz minima para evitar errores de carga en scripts heredados.
   */
  window.registerView = function () {};
  window.getViewName = function () {
    return "dashboard";
  };
  window.getHashPath = function () {
    return "/";
  };
  window.getHashSegments = function () {
    return [];
  };
})();
