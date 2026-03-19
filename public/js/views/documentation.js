/**
 * Documentación — Vista #/documentation
 * Dos bloques: Documentación funcional | Documentación técnica. Enlace a Documentos (#/documents).
 */
(function () {
  "use strict";

  var SECTION_FUNCTIONAL = "functional";
  var SECTION_TECHNICAL = "technical";

  function esc(s) {
    if (s == null) return "";
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function getDocumentationSection() {
    var segs = window.getHashSegments ? window.getHashSegments() : [];
    if (segs[0] === "documentation" && segs[1] === SECTION_TECHNICAL) return SECTION_TECHNICAL;
    return SECTION_FUNCTIONAL;
  }

  function renderDocLayout(activeSection, contentHtml) {
    var nav = '<nav class="nav nav-pills flex-column gap-1 mb-3">' +
      '<a class="nav-link ' + (activeSection === SECTION_FUNCTIONAL ? "active" : "") + '" href="#/documentation/functional">Documentación funcional</a>' +
      '<a class="nav-link ' + (activeSection === SECTION_TECHNICAL ? "active" : "") + '" href="#/documentation/technical">Documentación técnica</a>' +
      '<hr class="my-2">' +
      '<a class="nav-link" href="#/documents"><span class="nexus-text-secondary">Documentos</span></a>' +
      "</nav>";
    var main = '<div class="nexus-doc-content flex-grow-1 overflow-auto">' + (contentHtml || "<p class=\"text-muted\">Cargando…</p>") + "</div>";
    return '<div class="d-flex gap-4 flex-wrap flex-lg-nowrap">' +
      '<aside class="nexus-doc-sidebar flex-shrink-0" style="min-width: 220px;">' + nav + "</aside>" +
      "<div class=\"flex-grow-1\" style=\"min-width: 0;\">" + main + "</div>" +
      "</div>";
  }

  window.registerView("documentation", async function () {
    await window.showNav();
    var section = getDocumentationSection();
    var breadcrumb = window.renderBreadcrumbs
      ? window.renderBreadcrumbs([
          { label: "Panel", href: "#/dashboard" },
          { label: "Documentación", href: "#/documentation" },
          { label: section === SECTION_TECHNICAL ? "Documentación técnica" : "Documentación funcional", href: "" }
        ])
      : '<nav aria-label="breadcrumb"><ol class="breadcrumb mb-2"><li class="breadcrumb-item"><a href="#/dashboard">Panel</a></li><li class="breadcrumb-item"><a href="#/documentation">Documentación</a></li><li class="breadcrumb-item text-muted">' + (section === SECTION_TECHNICAL ? "Técnica" : "Funcional") + "</li></ol></nav>";

    var contentHtml = "";
    if (section === SECTION_FUNCTIONAL && typeof window.DocumentationFunctionalContent === "string") {
      contentHtml = window.DocumentationFunctionalContent;
    } else if (section === SECTION_TECHNICAL && typeof window.DocumentationTechnicalContent === "string") {
      contentHtml = window.DocumentationTechnicalContent;
    } else {
      contentHtml = "<p class=\"text-muted\">Cargando contenido…</p>";
    }

    function renderExportBar(section) {
      var btnThis = '<button type="button" class="btn btn-outline-primary btn-sm" id="docx-export-this">Descargar como Word</button>';
      var btnAll = '<button type="button" class="btn btn-outline-secondary btn-sm" id="docx-export-all">Descargar ambos</button>';
      var hint = '<div class="text-muted small mt-1">Exporta a .docx (Word) con formato (títulos, listas, tablas y código).</div>';
      return (
        '<div class="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-3">' +
        '<div><div class="fw-semibold">Exportar</div>' + hint + "</div>" +
        '<div class="btn-group" role="group" aria-label="Exportar documentación">' +
        btnThis +
        btnAll +
        "</div></div>"
      );
    }

    var html = '<div class="nexus-panel nexus-section-spacing">' +
      breadcrumb +
      '<h1 class="nexus-page-title mb-3">Documentación</h1>' +
      renderExportBar(section) +
      renderDocLayout(section, contentHtml) +
      "</div>";
    window.setContent(html);

    async function downloadDocx(mode) {
      var base = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ? window.APP_CONFIG.API_BASE : "/api/v1";
      var token = (typeof window.getToken === "function") ? window.getToken() : null;
      var url = base + "/docs/export";

      var body = { type: mode };
      if (mode === "functional") body.contentHtml = typeof window.DocumentationFunctionalContent === "string" ? window.DocumentationFunctionalContent : "";
      if (mode === "technical") body.contentHtml = typeof window.DocumentationTechnicalContent === "string" ? window.DocumentationTechnicalContent : "";
      if (mode === "all") {
        body.contentHtmlFunctional = typeof window.DocumentationFunctionalContent === "string" ? window.DocumentationFunctionalContent : "";
        body.contentHtmlTechnical = typeof window.DocumentationTechnicalContent === "string" ? window.DocumentationTechnicalContent : "";
      }

      try {
        var res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {})
          },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          var txt = "";
          try { txt = await res.text(); } catch (_) {}
          if (typeof window.openNexusAlertModal === "function") {
            window.openNexusAlertModal({ title: "Error", message: txt || ("Error al exportar (" + res.status + ")") });
          } else if (typeof window.alert === "function") window.alert(txt || ("Error al exportar (" + res.status + ")"));
          return;
        }
        var blob = await res.blob();
        var cd = res.headers.get("content-disposition") || "";
        var match = cd.match(/filename=\"?([^\";]+)\"?/i);
        var filename = match ? match[1] : "nexus-docs.docx";
        var link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(function () {
          try { URL.revokeObjectURL(link.href); } catch (_) {}
          try { document.body.removeChild(link); } catch (_) {}
        }, 1000);
      } catch (e) {
        if (typeof window.openNexusAlertModal === "function") window.openNexusAlertModal({ title: "Error", message: "No se pudo descargar el documento." });
        else if (typeof window.alert === "function") window.alert("No se pudo descargar el documento.");
      }
    }

    var btnThis = document.getElementById("docx-export-this");
    if (btnThis) btnThis.onclick = function () {
      downloadDocx(section === SECTION_TECHNICAL ? "technical" : "functional");
    };
    var btnAll = document.getElementById("docx-export-all");
    if (btnAll) btnAll.onclick = function () { downloadDocx("all"); };

    window.addEventListener("hashchange", function onDocHashChange() {
      var name = window.getViewName ? window.getViewName() : "";
      if (name !== "documentation") {
        window.removeEventListener("hashchange", onDocHashChange);
        return;
      }
      var newSection = getDocumentationSection();
      var newContent = "";
      if (newSection === SECTION_FUNCTIONAL && typeof window.DocumentationFunctionalContent === "string") {
        newContent = window.DocumentationFunctionalContent;
      } else if (newSection === SECTION_TECHNICAL && typeof window.DocumentationTechnicalContent === "string") {
        newContent = window.DocumentationTechnicalContent;
      } else {
        newContent = "<p class=\"text-muted\">Cargando contenido…</p>";
      }
      var container = document.querySelector("#content .nexus-doc-content");
      if (container) container.innerHTML = newContent;
      // Actualiza el comportamiento del botón \"Descargar como Word\" para la sección activa.
      var btnThis2 = document.getElementById("docx-export-this");
      if (btnThis2) btnThis2.onclick = function () {
        downloadDocx(newSection === SECTION_TECHNICAL ? "technical" : "functional");
      };
      var aside = document.querySelector("#content .nexus-doc-sidebar");
      if (aside) {
        var links = aside.querySelectorAll(".nav-link");
        links.forEach(function (a) {
          a.classList.remove("active");
          if (a.getAttribute("href") === "#/documentation/functional" && newSection === SECTION_FUNCTIONAL) a.classList.add("active");
          if (a.getAttribute("href") === "#/documentation/technical" && newSection === SECTION_TECHNICAL) a.classList.add("active");
        });
      }
    });
  });
})();
