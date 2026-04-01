/**
 * Exportación .docx vía POST /docs/export (mismo contrato que public/js/views/documentation.js).
 */
import { post } from "../../shared/http/index.js";

function parseFilename(contentDisposition) {
  const cd = contentDisposition || "";
  const match = cd.match(/filename="?([^";]+)"?/i);
  return match ? match[1].trim() : "nexus-docs.docx";
}

/**
 * @param {"functional" | "technical" | "all"} mode
 * @param {{ functional: string; technical: string }} htmlBySection
 * @returns {Promise<{ ok: true } | { ok: false; message: string }>}
 */
export async function downloadDocumentationDocx(mode, htmlBySection) {
  const body = { type: mode };
  if (mode === "functional") {
    body.contentHtml = htmlBySection.functional || "";
  } else if (mode === "technical") {
    body.contentHtml = htmlBySection.technical || "";
  } else if (mode === "all") {
    body.contentHtmlFunctional = htmlBySection.functional || "";
    body.contentHtmlTechnical = htmlBySection.technical || "";
  } else {
    return { ok: false, message: "Modo de exportación no válido." };
  }

  try {
    const res = await post("/docs/export", body, { responseType: "blob" });
    const status = res.status;
    if (status < 200 || status >= 300) {
      let message = `Error al exportar (${status})`;
      if (res.data instanceof Blob) {
        try {
          const t = await res.data.text();
          if (t?.trim()) message = t.trim();
        } catch {
          /* ignore */
        }
      }
      return { ok: false, message };
    }

    const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
    const cd = res.headers?.["content-disposition"] ?? res.headers?.["Content-Disposition"];
    const filename = parseFilename(typeof cd === "string" ? cd : "");
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        URL.revokeObjectURL(href);
      } catch {
        /* ignore */
      }
      try {
        document.body.removeChild(link);
      } catch {
        /* ignore */
      }
    }, 1000);

    return { ok: true };
  } catch {
    return { ok: false, message: "No se pudo descargar el documento." };
  }
}
