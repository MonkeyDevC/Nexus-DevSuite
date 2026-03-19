/**
 * Delivery Upload Zone (PRO) — Drag & Drop + multi-file selection + validations + preview.
 * Expuesto como window.DeliveryUploadZone.
 */
(function () {
  "use strict";

  var NexusUI = window.NexusUI;

  function esc(s) {
    return NexusUI && NexusUI.esc
      ? NexusUI.esc(s)
      : (s == null ? "" : String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"));
  }

  var DEFAULTS = {
    maxBytes: 5 * 1024 * 1024,
    blockedExt: [".exe", ".bat", ".cmd", ".ps1", ".sh", ".msi", ".dll", ".com", ".scr"]
  };

  function extOf(name) {
    var n = String(name || "").toLowerCase();
    var i = n.lastIndexOf(".");
    return i === -1 ? "" : n.slice(i);
  }

  function validateFiles(files, opts) {
    var o = Object.assign({}, DEFAULTS, opts || {});
    var ok = [];
    var rejected = [];
    for (var i = 0; i < (files || []).length; i++) {
      var f = files[i];
      if (!f) continue;
      var e = extOf(f.name);
      if (o.blockedExt.indexOf(e) !== -1) {
        rejected.push({ file: f, reason: "Extensión no permitida: " + e });
        continue;
      }
      if (f.size > o.maxBytes) {
        rejected.push({ file: f, reason: "Archivo supera el máximo (" + Math.round(o.maxBytes / (1024 * 1024)) + "MB)" });
        continue;
      }
      ok.push(f);
    }
    return { ok: ok, rejected: rejected };
  }

  /**
   * Renderiza una dropzone dentro de containerEl y dispara callbacks.
   * @param {{containerEl:HTMLElement,onPick:(File[])=>void,options?:object}} cfg
   */
  function mount(cfg) {
    var containerEl = cfg && cfg.containerEl;
    if (!containerEl) throw new Error("containerEl requerido");
    var onPick = cfg.onPick;
    var options = cfg.options || {};

    containerEl.innerHTML =
      '<div class="nui-card" style="border-style:dashed;">' +
      '  <div class="nui-card-header"><h3 class="nui-card-title mb-0">Upload Files</h3></div>' +
      '  <div class="nui-card-body">' +
      '    <div id="duz-drop" class="text-center p-4" style="border-radius:12px;background:rgba(0,0,0,.02);cursor:pointer;">' +
      '      <div class="mb-1"><strong>Arrastra archivos</strong> o haz click para subir</div>' +
      '      <div class="text-muted small">Multi-file • Validación 5MB • Bloqueo de ejecutables</div>' +
      '      <input type="file" id="duz-input" multiple style="display:none;">' +
      "    </div>" +
      '    <div class="mt-3" id="duz-errors" style="display:none;"></div>' +
      "  </div>" +
      "</div>";

    var drop = containerEl.querySelector("#duz-drop");
    var input = containerEl.querySelector("#duz-input");
    var errors = containerEl.querySelector("#duz-errors");

    function showErrors(items) {
      if (!items || !items.length) {
        errors.style.display = "none";
        errors.innerHTML = "";
        return;
      }
      errors.style.display = "block";
      var html = '<div class="alert alert-warning py-2 mb-0"><div class="small"><strong>Archivos rechazados</strong></div><ul class="mb-0 small">';
      for (var i = 0; i < items.length; i++) {
        html += "<li><code>" + esc(items[i].file && items[i].file.name) + "</code> — " + esc(items[i].reason) + "</li>";
      }
      html += "</ul></div>";
      errors.innerHTML = html;
    }

    function pickFiles(fileList) {
      var arr = [];
      for (var i = 0; i < (fileList ? fileList.length : 0); i++) arr.push(fileList[i]);
      var res = validateFiles(arr, options);
      showErrors(res.rejected);
      if (typeof onPick === "function" && res.ok.length) onPick(res.ok);
    }

    drop.addEventListener("click", function () {
      input.click();
    });
    input.addEventListener("change", function () {
      pickFiles(input.files);
      try { input.value = ""; } catch (_) {}
    });
    drop.addEventListener("dragover", function (e) {
      e.preventDefault();
      drop.style.background = "rgba(0,0,0,.04)";
    });
    drop.addEventListener("dragleave", function () {
      drop.style.background = "rgba(0,0,0,.02)";
    });
    drop.addEventListener("drop", function (e) {
      e.preventDefault();
      drop.style.background = "rgba(0,0,0,.02)";
      if (e.dataTransfer && e.dataTransfer.files) pickFiles(e.dataTransfer.files);
    });
  }

  window.DeliveryUploadZone = {
    mount: mount,
    validateFiles: validateFiles
  };
})();

