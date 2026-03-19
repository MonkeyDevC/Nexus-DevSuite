/**
 * Target Stack Manager — controla las targets apiladas (Project/Feature/Story, etc.).
 * API pública (adjunta a window):
 *   targetStackManager.openTarget(type, id, meta?)
 *   targetStackManager.closeTarget(type, id)
 *   targetStackManager.closeTopTarget()
 *   targetStackManager.getTargetStack()
 *   targetStackManager.reset(stackBaseArray)
 *   targetStackManager.subscribe(listener)
 *   targetStackManager.unsubscribe(listener)
 *
 * Cada target = { entity_type, entity_id, meta }.
 * El elemento base del stack suele ser { entity_type: "view", entity_id: "projects" | "features" | "stories", meta?: {} }.
 */
(function () {
  "use strict";

  var _stack = [];
  var _listeners = [];

  function notify() {
    var snapshot = _stack.slice();
    _listeners.forEach(function (fn) {
      try {
        fn(snapshot);
      } catch (e) {
        // evitar que un listener defectuoso rompa el flujo
      }
    });
  }

  function normalizeTarget(type, id, meta) {
    return {
      entity_type: type,
      entity_id: id,
      meta: meta || {}
    };
  }

  function findIndex(type, id) {
    for (var i = 0; i < _stack.length; i++) {
      var t = _stack[i];
      if (t && t.entity_type === type && String(t.entity_id) === String(id)) {
        return i;
      }
    }
    return -1;
  }

  var api = {
    /**
     * Abre (o enfoca) un target.
     * Si ya existe en el stack, se mueve al tope sin duplicarlo.
     */
    openTarget: function (type, id, meta) {
      if (!type || id == null) return;
      var idx = findIndex(type, id);
      if (idx !== -1) {
        var existing = _stack.splice(idx, 1)[0];
        if (meta && typeof meta === "object") {
          existing.meta = Object.assign({}, existing.meta || {}, meta);
        }
        _stack.push(existing);
      } else {
        _stack.push(normalizeTarget(type, id, meta));
      }
      notify();
    },

    /**
     * Cierra un target concreto; si estaba en el tope, descubre el anterior.
     */
    closeTarget: function (type, id) {
      if (!type || id == null) return;
      var idx = findIndex(type, id);
      if (idx === -1) return;
      _stack.splice(idx, 1);
      notify();
    },

    /**
     * Cierra el target superior (último de la pila).
     */
    closeTopTarget: function () {
      if (_stack.length === 0) return;
      _stack.pop();
      notify();
    },

    /**
     * Devuelve una copia inmutable del stack actual.
     */
    getTargetStack: function () {
      return _stack.slice();
    },

    /**
     * Reemplaza completamente el stack actual.
     * Útil para inicializar según el hash (deep links).
     */
    reset: function (newStack) {
      if (!Array.isArray(newStack)) {
        _stack = [];
      } else {
        _stack = newStack.map(function (t) {
          if (!t) return null;
          return normalizeTarget(t.entity_type, t.entity_id, t.meta);
        }).filter(Boolean);
      }
      notify();
    },

    /**
     * Suscribe un listener a los cambios de stack.
     * Devuelve función de desuscripción.
     */
    subscribe: function (listener) {
      if (typeof listener !== "function") return function () {};
      if (_listeners.indexOf(listener) === -1) {
        _listeners.push(listener);
      }
      // disparar inmediatamente con snapshot actual
      try {
        listener(_stack.slice());
      } catch (e) {
        // ignorar
      }
      var unsubscribed = false;
      return function () {
        if (unsubscribed) return;
        unsubscribed = true;
        var idx = _listeners.indexOf(listener);
        if (idx !== -1) _listeners.splice(idx, 1);
      };
    },

    /**
     * Desuscribe un listener previamente registrado.
     */
    unsubscribe: function (listener) {
      if (typeof listener !== "function") return;
      var idx = _listeners.indexOf(listener);
      if (idx !== -1) _listeners.splice(idx, 1);
    }
  };

  window.targetStackManager = api;
})();

