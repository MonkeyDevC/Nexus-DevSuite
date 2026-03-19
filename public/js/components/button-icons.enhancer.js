(function () {
  "use strict";

  function normalizeText(v) {
    return String(v || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function includesAny(text, words) {
    for (var i = 0; i < words.length; i += 1) {
      if (text.indexOf(words[i]) !== -1) return true;
    }
    return false;
  }

  function inferAction(btn) {
    var explicit = btn.getAttribute("data-action")
      || btn.getAttribute("data-cr-action")
      || btn.getAttribute("aria-label")
      || btn.getAttribute("title")
      || btn.getAttribute("data-tooltip")
      || btn.id
      || btn.className
      || btn.textContent;
    var t = normalizeText(explicit);

    if (!t) return null;
    if (includesAny(t, ["approve", "aprobar"])) return "approve";
    if (includesAny(t, ["reject", "rechazar"])) return "reject";
    if (includesAny(t, ["submit", "enviar"])) return "submit";
    if (includesAny(t, ["implement", "implementar"])) return "implement";
    if (includesAny(t, ["restore", "restaurar"])) return "restore";
    if (includesAny(t, ["create", "crear", "nuevo", "nueva"])) return "create";
    if (includesAny(t, ["save", "guardar"])) return "save";
    if (includesAny(t, ["edit", "editar"])) return "edit";
    if (includesAny(t, ["delete", "eliminar", "borrar"])) return "delete";
    // "volver" contiene "ver", por eso back debe evaluarse antes de view.
    if (includesAny(t, ["volver", "atras", "back"])) return "back";
    if (includesAny(t, ["view", "ver", "detalle"])) return "view";
    if (includesAny(t, ["download", "descargar", "exportar"])) return "download";
    if (includesAny(t, ["upload", "subir", "importar"])) return "upload";
    if (includesAny(t, ["cancel", "cancelar", "cerrar"])) return "cancel";
    if (includesAny(t, ["refresh", "actualizar", "recargar", "sync", "sincronizar"])) return "refresh";
    if (includesAny(t, ["buscar", "search"])) return "search";
    if (includesAny(t, ["archivo", "archivar", "archive"])) return "archive";
    if (includesAny(t, ["siguiente", "next"])) return "next";
    if (includesAny(t, ["asignar", "assign"])) return "assign";
    if (includesAny(t, ["enlazar", "link"])) return "link";
    if (includesAny(t, ["entrar", "iniciar sesion", "login", "log in"])) return "login";
    return null;
  }

  function hasIcon(btn) {
    return !!btn.querySelector("i[data-lucide], svg, .nexus-btn-icon");
  }

  function shouldSkipAutoIcon(btn) {
    if (!btn) return true;
    // Bootstrap close buttons already render their own icon/background.
    if (btn.classList && btn.classList.contains("btn-close")) return true;
    // Generic dismiss controls should keep native/modal close styling.
    if (btn.hasAttribute("data-bs-dismiss")) return true;
    var aria = normalizeText(btn.getAttribute("aria-label") || "");
    if (aria === "close" || aria === "cerrar") return true;
    return false;
  }

  function ensureLabelWrap(btn) {
    if (!btn) return;
    // Si ya hay label explícita, no tocar.
    if (btn.querySelector(".nexus-btn-label")) return;
    var hasText = false;
    var nodes = [];
    btn.childNodes.forEach(function (n) {
      if (n.nodeType === 3 && String(n.textContent || "").trim()) hasText = true;
      nodes.push(n);
    });
    if (!hasText) return;
    var span = document.createElement("span");
    span.className = "nexus-btn-label";
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        if (String(n.textContent || "").trim()) span.appendChild(n);
      } else if (!(n.matches && n.matches("i[data-lucide], svg"))) {
        span.appendChild(n);
      }
    });
    btn.appendChild(span);
  }

  function applyButtonIcon(btn) {
    if (!btn || btn.getAttribute("data-no-auto-icon") === "1") return;
    if (shouldSkipAutoIcon(btn)) return;
    btn.classList.add("nexus-btn-enhanced");

    var action = btn.getAttribute("data-action") || inferAction(btn);
    if (!action) return;
    var map = window.NEXUS_BUTTON_ICON_MAP || {};
    var iconName = map[action];
    if (!iconName) return;

    if (!hasIcon(btn)) {
      var i = document.createElement("i");
      i.setAttribute("data-lucide", iconName);
      i.className = "nexus-btn-icon";
      i.setAttribute("aria-hidden", "true");
      btn.insertBefore(i, btn.firstChild);
    }
    ensureLabelWrap(btn);
  }

  function enhanceButtons(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var buttons = scope.querySelectorAll("button, a.btn");
    buttons.forEach(applyButtonIcon);
  }

  window.nexusEnhanceButtons = enhanceButtons;
})();

