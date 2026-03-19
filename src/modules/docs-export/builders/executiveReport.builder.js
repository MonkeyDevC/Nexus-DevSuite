const {
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageBreak,
  ImageRun
} = require("docx");
const fs = require("fs");
const path = require("path");
const { corporateTheme } = require("../theme/corporateTheme");

function noBorders() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
  };
}

function hr(theme) {
  return new Paragraph({
    children: [new TextRun({ text: " " })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: theme.colors.line } }
  });
}

function safeReadLogoBuffer() {
  // Ruta sugerida por requisito: public/assets/logo.png
  const abs = path.join(process.cwd(), "public", "assets", "logo.png");
  try {
    if (!fs.existsSync(abs)) return null;
    return fs.readFileSync(abs);
  } catch (_) {
    return null;
  }
}

function headerBlock({ projectName, docTypeLabel, generatedAt, version, theme }) {
  const logoBuf = safeReadLogoBuffer();
  const leftChildren = [];
  if (logoBuf) {
    leftChildren.push(
      new ImageRun({
        data: logoBuf,
        transformation: { width: 96, height: 24 }
      })
    );
    leftChildren.push(new TextRun({ text: "  " }));
  }
  leftChildren.push(new TextRun({ text: theme.brandName, bold: true, color: theme.colors.primary }));

  const left = new Paragraph({ children: leftChildren });
  const right = new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [
      new TextRun({ text: `Proyecto: ${projectName}`, color: theme.colors.muted }),
      new TextRun({ text: "  |  ", color: theme.colors.line }),
      new TextRun({ text: `Doc: ${docTypeLabel}`, color: theme.colors.muted }),
      new TextRun({ text: "  |  ", color: theme.colors.line }),
      new TextRun({ text: `Generado: ${generatedAt}`, color: theme.colors.muted }),
      new TextRun({ text: "  |  ", color: theme.colors.line }),
      new TextRun({ text: `Versión: ${version}`, color: theme.colors.muted })
    ]
  });

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ borders: noBorders(), children: [left] }),
          new TableCell({ borders: noBorders(), children: [right] })
        ]
      })
    ]
  });

  return [headerTable, hr(theme), new Paragraph("")];
}

function titleBlock({ projectName, docTypeLabel, generatedAt, theme }) {
  return [
    new Paragraph({ text: "Project Documentation", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [
        new TextRun({ text: String(projectName || "—"), bold: true, color: theme.colors.text }),
        new TextRun({ text: "  |  ", color: theme.colors.line }),
        new TextRun({ text: String(docTypeLabel || "—"), color: theme.colors.muted }),
        new TextRun({ text: "  |  ", color: theme.colors.line }),
        new TextRun({ text: String(generatedAt || "—"), color: theme.colors.muted })
      ]
    }),
    new Paragraph("")
  ];
}

function cardCell({ label, value, theme }) {
  return new TableCell({
    borders: noBorders(),
    shading: { type: ShadingType.CLEAR, fill: theme.colors.cardFill, color: "auto" },
    children: [
      new Paragraph({ children: [new TextRun({ text: label, bold: true, color: theme.colors.muted })] }),
      new Paragraph({ children: [new TextRun({ text: value != null ? String(value) : "—", bold: true, color: theme.colors.text })] })
    ]
  });
}

function cards2x2({ summary, theme }) {
  const rows = [
    new TableRow({
      children: [
        cardCell({ label: "Release", value: summary.releaseName, theme }),
        cardCell({ label: "Estado", value: summary.deliveryStatus, theme })
      ]
    }),
    new TableRow({
      children: [
        cardCell({ label: "Features", value: summary.featuresCount, theme }),
        cardCell({ label: "Stories", value: summary.storiesCount, theme })
      ]
    })
  ];
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function keyValueGrid(items, theme) {
  const rows = items.map((it) =>
    new TableRow({
      children: [
        new TableCell({
          borders: noBorders(),
          shading: { type: ShadingType.CLEAR, fill: theme.colors.tableHeaderFill, color: "auto" },
          children: [new Paragraph({ children: [new TextRun({ text: it.label, bold: true, color: theme.colors.muted })] })]
        }),
        new TableCell({
          borders: noBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: it.value != null ? String(it.value) : "—", color: theme.colors.text })] })]
        })
      ]
    })
  );
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function bulletList(items, theme) {
  if (!items || !items.length) return [new Paragraph({ children: [new TextRun({ text: "—", color: theme.colors.muted })] })];
  return items.map((t) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: String(t), color: theme.colors.text })] }));
}

function riskParagraph(r, theme) {
  const isCritical = (r.level || "").toLowerCase() === "critical";
  const prefix = isCritical ? "CRÍTICO" : (r.level || "INFO").toUpperCase();
  const color = isCritical ? theme.colors.danger : theme.colors.muted;
  return new Paragraph({
    children: [
      new TextRun({ text: `${prefix}: `, bold: true, color }),
      new TextRun({ text: `${r.title} — ${r.detail}`, color: theme.colors.text })
    ]
  });
}

function section(title) {
  return new Paragraph({ text: title, heading: HeadingLevel.HEADING_2 });
}

function buildExecutiveReport({ projectName, docTypeLabel, data, version, generatedAt }) {
  const theme = corporateTheme();
  const exec = (data && data.executiveSummary) || {};
  const snapshot = (data && data.snapshotSummary) || {};
  const commits = (data && data.recentCommits) || [];
  const gitStatus = (data && data.gitStatus) || {};
  const risks = (data && data.risks) || [];
  const reviews = (data && data.reviews) || { reviews: [], comments: [] };

  const children = [];

  children.push(...headerBlock({ projectName, docTypeLabel, generatedAt, version, theme }));
  children.push(...titleBlock({ projectName, docTypeLabel, generatedAt, theme }));

  children.push(section("Resumen"));
  children.push(cards2x2({ summary: exec, theme }));
  children.push(new Paragraph(""));

  children.push(section("Overview"));
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text:
            "Reporte ejecutivo generado por Nexus DevSuite. Basado en la Code Delivery seleccionada (o la última del proyecto).",
          color: theme.colors.text
        })
      ]
    })
  );
  children.push(new Paragraph(""));

  children.push(section("Code Summary"));
  children.push(
    keyValueGrid(
      [
        { label: "Delivery ID", value: data && data.scope ? data.scope.deliveryId : "—" },
        { label: "Branch", value: data && data.chain && data.chain.delivery ? data.chain.delivery.branch_name : "—" },
        { label: "Snapshot válido", value: snapshot.hasSnapshot ? "Sí" : "No" },
        { label: "Snapshot total_files", value: snapshot.total_files },
        { label: "Snapshot large_files", value: snapshot.large_files_count },
        { label: "Snapshot hash_count", value: snapshot.hash_count }
      ],
      theme
    )
  );
  children.push(new Paragraph(""));

  children.push(section("Recent Changes"));
  children.push(
    ...bulletList(
      commits.map((c) => `${c.shortSha} — ${c.message || "(sin mensaje)"}`),
      theme
    )
  );
  children.push(new Paragraph(""));

  children.push(section("Git Status (snapshot vs actual)"));
  children.push(
    keyValueGrid(
      [
        { label: "Modified", value: (gitStatus.modified || []).length },
        { label: "Added", value: (gitStatus.added || []).length },
        { label: "Deleted", value: (gitStatus.deleted || []).length },
        { label: "Extra", value: (gitStatus.extra || []).length }
      ],
      theme
    )
  );
  children.push(new Paragraph(""));

  children.push(section("Issues & Risks"));
  if (!risks.length) children.push(new Paragraph({ children: [new TextRun({ text: "—", color: theme.colors.muted })] }));
  else risks.forEach((r) => children.push(riskParagraph(r, theme)));
  children.push(new Paragraph(""));

  children.push(section("Comments / Reviews"));
  if (!reviews.comments || reviews.comments.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: "—", color: theme.colors.muted })] }));
  } else {
    // “Cards” simuladas por tabla (2 columnas): meta + body
    const rows = reviews.comments.slice(0, 6).map((cmt) => {
      const meta = `${(cmt.author && (cmt.author.name || cmt.author.email)) || "—"}${cmt.file_path ? " | " + cmt.file_path : ""}${cmt.line_number != null ? " :L" + cmt.line_number : ""}`;
      return new TableRow({
        children: [
          new TableCell({
            borders: noBorders(),
            shading: { type: ShadingType.CLEAR, fill: theme.colors.cardFill, color: "auto" },
            children: [new Paragraph({ children: [new TextRun({ text: meta, color: theme.colors.muted, bold: true })] })]
          }),
          new TableCell({
            borders: noBorders(),
            children: [new Paragraph({ children: [new TextRun({ text: cmt.body || "", color: theme.colors.text })] })]
          })
        ]
      });
    });
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  }
  children.push(new Paragraph(""));

  children.push(new Paragraph({ children: [new PageBreak()] }));
  return { children, theme };
}

module.exports = {
  buildExecutiveReport
};

