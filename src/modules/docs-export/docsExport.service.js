const {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TableLayoutType,
  ShadingType,
  BorderStyle
} = require("docx");
const { parseDocument } = require("htmlparser2");
const { AppError } = require("../../shared/errors/AppError");
const { getModels } = require("../../infrastructure/db/loadModels");
const { getExecutiveData } = require("./providers/executiveData.provider");
const { buildExecutiveReport } = require("./builders/executiveReport.builder");
const fs = require("fs");
const path = require("path");

function nowIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function textToRuns(text, opts = {}) {
  const t = text == null ? "" : String(text);
  if (!t) return [new TextRun("")];
  return [new TextRun({ text: t, ...opts })];
}

function normalizeText(t) {
  return (t || "").replace(/\r\n/g, "\n");
}

function isTag(node, name) {
  return node && node.type === "tag" && node.name && node.name.toLowerCase() === name;
}

function getNodeText(node) {
  if (!node) return "";
  if (node.type === "text") return node.data || "";
  const children = node.children || [];
  return children.map(getNodeText).join("");
}

function extractInlineRuns(node) {
  // Convierte texto + <strong> + <code> inline a runs.
  const runs = [];
  const walk = (n, style = {}) => {
    if (!n) return;
    if (n.type === "text") {
      const txt = n.data || "";
      if (txt) runs.push(new TextRun({ text: txt, ...style }));
      return;
    }
    if (n.type === "tag") {
      const nm = (n.name || "").toLowerCase();
      if (nm === "strong" || nm === "b") {
        (n.children || []).forEach((c) => walk(c, { ...style, bold: true }));
        return;
      }
      if (nm === "em" || nm === "i") {
        (n.children || []).forEach((c) => walk(c, { ...style, italics: true }));
        return;
      }
      if (nm === "code") {
        (n.children || []).forEach((c) => walk(c, { ...style, font: "Consolas" }));
        return;
      }
    }
    (n.children || []).forEach((c) => walk(c, style));
  };
  walk(node, {});
  if (runs.length === 0) runs.push(new TextRun(""));
  return runs;
}

function htmlToDocxChildren(html) {
  const root = parseDocument(String(html || ""));
  const children = [];

  const pushParagraph = (runsOrText, opts = {}) => {
    if (Array.isArray(runsOrText)) {
      children.push(new Paragraph({ children: runsOrText, ...opts }));
    } else {
      children.push(new Paragraph({ children: textToRuns(runsOrText), ...opts }));
    }
  };

  const pushCodeBlock = (codeText) => {
    const lines = normalizeText(codeText).split("\n");
    if (lines.length === 0) {
      pushParagraph("", {});
      return;
    }
    lines.forEach((ln) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: ln || "", font: "Consolas" })]
        })
      );
    });
    children.push(new Paragraph("")); // separación
  };

  const pushTable = (tableNode) => {
    const trNodes = (tableNode.children || []).flatMap((c) =>
      c && c.type === "tag"
        ? c.name === "tbody" || c.name === "thead"
          ? c.children || []
          : [c]
        : []
    );

    const rowCellNodes = [];
    let maxCols = 0;
    for (const tr of trNodes) {
      if (!(tr && tr.type === "tag" && tr.name && tr.name.toLowerCase() === "tr")) continue;
      const cells = (tr.children || []).filter((n) => n && n.type === "tag" && ["td", "th"].includes(String(n.name || "").toLowerCase()));
      if (!cells.length) continue;
      rowCellNodes.push(cells);
      if (cells.length > maxCols) maxCols = cells.length;
    }
    if (!rowCellNodes.length || !maxCols) return;

    const colWidthPct = Math.max(1, Math.floor(100 / maxCols));
    const themeHeaderFill = "F3F4F6";
    const themeLine = "E5E7EB";

    const rows = rowCellNodes.map((cells) => {
      const padded = cells.slice(0, maxCols);
      while (padded.length < maxCols) padded.push(null);

      const outCells = padded.map((cellNode) => {
        const isHeader = cellNode && String(cellNode.name || "").toLowerCase() === "th";
        const runs = cellNode ? extractInlineRuns(cellNode) : [new TextRun("")];
        return new TableCell({
          width: { size: colWidthPct, type: WidthType.PERCENTAGE },
          shading: isHeader ? { type: ShadingType.CLEAR, fill: themeHeaderFill, color: "auto" } : undefined,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: themeLine },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: themeLine },
            left: { style: BorderStyle.SINGLE, size: 2, color: themeLine },
            right: { style: BorderStyle.SINGLE, size: 2, color: themeLine }
          },
          children: [new Paragraph({ children: runs })]
        });
      });
      return new TableRow({ children: outCells });
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows
      })
    );
    children.push(new Paragraph(""));
  };

  const walkBlock = (node, listContext) => {
    if (!node) return;
    if (node.type === "text") return;

    if (isTag(node, "h1")) pushParagraph(extractInlineRuns(node), { heading: HeadingLevel.HEADING_1 });
    else if (isTag(node, "h2")) pushParagraph(extractInlineRuns(node), { heading: HeadingLevel.HEADING_2 });
    else if (isTag(node, "h3")) pushParagraph(extractInlineRuns(node), { heading: HeadingLevel.HEADING_3 });
    else if (isTag(node, "p")) pushParagraph(extractInlineRuns(node));
    else if (isTag(node, "hr")) children.push(new Paragraph(""));
    else if (isTag(node, "pre")) {
      pushCodeBlock(getNodeText(node));
    } else if (isTag(node, "ul")) {
      (node.children || []).forEach((c) => walkBlock(c, { type: "bullet" }));
    } else if (isTag(node, "ol")) {
      let idx = 1;
      (node.children || []).forEach((c) => {
        if (c && c.type === "tag" && (c.name || "").toLowerCase() === "li") {
          walkBlock(c, { type: "number", index: idx++ });
        } else {
          walkBlock(c, { type: "number", index: idx++ });
        }
      });
    } else if (isTag(node, "li")) {
      const runs = extractInlineRuns(node);
      if (listContext && listContext.type === "bullet") {
        children.push(new Paragraph({ children: runs, bullet: { level: 0 } }));
      } else if (listContext && listContext.type === "number") {
        // docx numbering formal requiere config; como alternativa renderizamos "1. " como texto.
        children.push(new Paragraph({ children: [new TextRun({ text: `${listContext.index}. `, bold: true }), ...runs] }));
      } else {
        pushParagraph(runs);
      }
    } else if (isTag(node, "table")) {
      pushTable(node);
    } else {
      (node.children || []).forEach((c) => walkBlock(c, listContext));
    }
  };

  (root.children || []).forEach((c) => walkBlock(c, null));
  return children;
}

async function getProjectName(projectId, organizationId) {
  if (!projectId) return "Nexus DevSuite";
  const { Project } = getModels();
  const proj = await Project.findOne({
    where: { id: projectId, organization_id: organizationId },
    attributes: ["id", "name", "title"]
  });
  return (proj && (proj.name || proj.title)) || "Nexus DevSuite";
}

function appVersion() {
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    const raw = fs.readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
    return (pkg && pkg.version) ? String(pkg.version) : "—";
  } catch (_) {
    return "—";
  }
}

async function getContentFromDb(projectId, organizationId, type) {
  const { DocumentationContent } = getModels();
  const row = await DocumentationContent.findOne({
    where: {
      organization_id: organizationId,
      project_id: projectId || null,
      type
    },
    order: [["updated_at", "DESC"]]
  });
  if (!row) return null;
  const p = row.toJSON ? row.toJSON() : row;
  return { format: p.format, content: p.content };
}

function buildCoverChildren(projectName, docTypeLabel, executiveData) {
  const generatedAt = nowIsoDate();
  const version = appVersion();
  const built = buildExecutiveReport({
    projectName,
    docTypeLabel,
    data: executiveData,
    version,
    generatedAt
  });
  return built.children;
}

function filenameFor(type, projectName) {
  const safe = String(projectName || "nexus").replace(/[^\w\-]+/g, "_").slice(0, 50);
  const date = nowIsoDate();
  if (type === "functional") return `Nexus_Documentacion_Funcional_${safe}_${date}.docx`;
  if (type === "technical") return `Nexus_Documentacion_Tecnica_${safe}_${date}.docx`;
  return `Nexus_Documentacion_${safe}_${date}.docx`;
}

async function exportDocsToDocx(payload, context) {
  const { type, projectId, deliveryId, contentHtml, contentHtmlFunctional, contentHtmlTechnical } = payload || {};
  if (!type) {
    throw new AppError("type es obligatorio", { statusCode: 400, code: "VALIDATION_ERROR" });
  }

  const projectName = await getProjectName(projectId, context.organizationId);
  const executiveData = await getExecutiveData({ projectId: projectId || null, deliveryId: deliveryId || null, organizationId: context.organizationId }).catch(() => null);

  const buildOne = async (docType, htmlOverride) => {
    const db = await getContentFromDb(projectId, context.organizationId, docType);
    const html = htmlOverride || (db && db.format === "html" ? db.content : null);
    if (!html) {
      throw new AppError(
        `No hay contenido para documentación ${docType}. Guarde contenido en DB o envíe contentHtml desde la UI.`,
        { statusCode: 404, code: "DOC_CONTENT_NOT_FOUND" }
      );
    }
    const label = docType === "functional" ? "Documentación Funcional" : "Documentación Técnica";
    return {
      label,
      children: [
        ...buildCoverChildren(projectName, label, executiveData),
        new Paragraph({ text: label, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: "Contenido", bold: true })] }),
        new Paragraph(""),
        ...htmlToDocxChildren(html)
      ]
    };
  };

  let sections;
  if (type === "functional") {
    const one = await buildOne("functional", contentHtml || null);
    sections = [{ children: one.children }];
  } else if (type === "technical") {
    const one = await buildOne("technical", contentHtml || null);
    sections = [{ children: one.children }];
  } else {
    const functional = await buildOne("functional", contentHtmlFunctional || null);
    const technical = await buildOne("technical", contentHtmlTechnical || null);
    sections = [
      {
        children: [
          ...buildCoverChildren(projectName, "Documentación (Funcional + Técnica)"),
          new Paragraph({ children: [new PageBreak()] })
        ]
      },
      { children: functional.children },
      { children: technical.children }
    ];
  }

  const doc = new Document({ sections });
  const buffer = await Packer.toBuffer(doc);
  return { buffer, filename: filenameFor(type, projectName) };
}

module.exports = {
  exportDocsToDocx,
  htmlToDocxChildren
};

