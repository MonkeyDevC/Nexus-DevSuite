/**
 * ----
 * Modulo: reactMount
 * Descripcion: Bridge legacy aislado; montaje React desactivado para runtime SPA principal.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
(function () {
  /**
   * React ya se inicia de forma autonoma desde public/index.html + /react-app/index.js.
   * Este bridge legacy queda aislado y sin efecto para eliminar acoplamiento bidireccional.
   */
  window.mountReactApp = async function mountReactApp() {
    return;
  };

  window.unmountReactApp = async function unmountReactApp() {
    return;
  };
})();

