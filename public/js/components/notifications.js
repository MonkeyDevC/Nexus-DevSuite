/**
 * Notificaciones reutilizables — mensajes de éxito tras acciones CRUD.
 * Uso: window.showSuccessMessage("Cambios guardados correctamente");
 */
(function () {
  var TOAST_DURATION_MS = 2500;
  var CONTAINER_ID = "nexus-toast-container";

  function ensureContainer() {
    var el = document.getElementById(CONTAINER_ID);
    if (el) return el;
    el = document.createElement("div");
    el.id = CONTAINER_ID;
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    el.className = "position-fixed top-0 end-0 p-3";
    el.style.zIndex = "9999";
    document.body.appendChild(el);
    return el;
  }

  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  /**
   * Muestra un mensaje de éxito breve que se oculta automáticamente.
   * @param {string} message - Texto a mostrar (ej. "Guardado correctamente").
   */
  window.showSuccessMessage = function (message) {
    var container = ensureContainer();
    var div = document.createElement("div");
    div.className = "alert alert-success alert-dismissible fade show shadow-sm";
    div.role = "alert";
    div.innerHTML = esc(message || "Operación realizada correctamente.");
    container.appendChild(div);
    setTimeout(function () {
      div.classList.remove("show");
      setTimeout(function () {
        if (div.parentNode) div.parentNode.removeChild(div);
      }, 150);
    }, TOAST_DURATION_MS);
  };
})();
