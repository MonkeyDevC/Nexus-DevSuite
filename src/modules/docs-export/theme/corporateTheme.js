function corporateTheme() {
  return {
    brandName: "NEXUS DevSuite",
    colors: {
      primary: "111827", // gris muy oscuro (títulos)
      secondary: "374151",
      text: "111827",
      muted: "6B7280",
      line: "E5E7EB",
      cardFill: "F3F4F6",
      tableHeaderFill: "F3F4F6",
      danger: "B91C1C"
    },
    fonts: {
      body: "Calibri",
      mono: "Consolas"
    },
    fontSizes: {
      title: 34,
      h1: 26,
      h2: 22,
      h3: 18,
      body: 22 // half-points no docx; se usa por TextRun size cuando aplique
    },
    spacing: {
      blockGapParagraphs: 1
    }
  };
}

module.exports = {
  corporateTheme
};

