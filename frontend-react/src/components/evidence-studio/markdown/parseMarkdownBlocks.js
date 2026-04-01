/**
 * Parser por líneas/bloques (V2). Orden: fences → headings/HR → quotes → listas → párrafos.
 * No produce HTML crudo; el render lo hace React con sanitizeText en nodos de texto.
 */

const HR_RE = /^(\*{3,}|-{3,})\s*$/;

function stripQuotePrefix(line) {
  if (line.startsWith("> ")) return line.slice(2);
  if (line.startsWith(">")) return line.slice(1).trimStart();
  return line;
}

function parseListItemLine(line) {
  const chk = line.match(/^-\s\[([ xX])\]\s+(.*)$/);
  if (chk) {
    return {
      listType: "check",
      checked: chk[1].toLowerCase() === "x",
      text: chk[2],
    };
  }
  const bullet = line.match(/^-\s+(.*)$/);
  if (bullet) {
    return { listType: "bullet", text: bullet[1] };
  }
  const ord = line.match(/^(\d+)\.\s+(.*)$/);
  if (ord) {
    return { listType: "ordered", text: ord[2], startNum: parseInt(ord[1], 10) };
  }
  return null;
}

/**
 * @param {string} source
 * @returns {Array<{ type: string, [key: string]: unknown }>}
 */
export function parseMarkdownBlocks(source) {
  const text = source == null ? "" : String(source);
  const rawLines = text.split(/\r?\n/);
  const blocks = [];

  let i = 0;
  let inFence = false;
  let fenceLang = "";
  let codeLines = [];

  function flushCode() {
    blocks.push({ type: "code", lang: fenceLang, body: codeLines.join("\n") });
    codeLines = [];
    fenceLang = "";
  }

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (inFence) {
      if (trimmed.startsWith("```")) {
        inFence = false;
        flushCode();
        i += 1;
        continue;
      }
      codeLines.push(line);
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      inFence = true;
      const rest = trimmed.slice(3).trim();
      fenceLang = rest;
      i += 1;
      continue;
    }

    if (trimmed === "") {
      i += 1;
      continue;
    }

    if (HR_RE.test(trimmed)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    if (/^#\s+/.test(line)) {
      blocks.push({ type: "h1", text: line.replace(/^#\s+/, "").trimEnd() });
      i += 1;
      continue;
    }

    if (/^##\s+/.test(line)) {
      blocks.push({ type: "h2", text: line.replace(/^##\s+/, "").trimEnd() });
      i += 1;
      continue;
    }

    if (line.startsWith(">") || line.startsWith("> ")) {
      const quoteLines = [];
      while (i < rawLines.length) {
        const ln = rawLines[i];
        if (ln.trim() === "") break;
        if (!ln.startsWith(">") && !ln.startsWith("> ")) break;
        quoteLines.push(stripQuotePrefix(ln));
        i += 1;
      }
      blocks.push({ type: "blockquote", lines: quoteLines });
      continue;
    }

    const firstList = parseListItemLine(line);
    if (firstList) {
      const listKind = firstList.listType;
      if (listKind === "ordered") {
        const items = [firstList.text];
        i += 1;
        while (i < rawLines.length) {
          const ln = rawLines[i];
          if (ln.trim() === "") break;
          const it = parseListItemLine(ln);
          if (!it || it.listType !== "ordered") break;
          items.push(it.text);
          i += 1;
        }
        blocks.push({ type: "ol", items });
      } else if (listKind === "check") {
        const items = [{ checked: firstList.checked, text: firstList.text }];
        i += 1;
        while (i < rawLines.length) {
          const ln = rawLines[i];
          if (ln.trim() === "") break;
          const it = parseListItemLine(ln);
          if (!it || it.listType !== "check") break;
          items.push({ checked: it.checked, text: it.text });
          i += 1;
        }
        blocks.push({ type: "checklist", items });
      } else {
        const items = [firstList.text];
        i += 1;
        while (i < rawLines.length) {
          const ln = rawLines[i];
          if (ln.trim() === "") break;
          const it = parseListItemLine(ln);
          if (!it || it.listType !== "bullet") break;
          items.push(it.text);
          i += 1;
        }
        blocks.push({ type: "ul", items });
      }
      continue;
    }

    const paraLines = [];
    while (i < rawLines.length) {
      const ln = rawLines[i];
      if (ln.trim() === "") break;
      if (ln.trim().startsWith("```")) break;
      if (/^#\s|^##\s/.test(ln)) break;
      if (HR_RE.test(ln.trim())) break;
      if (ln.startsWith(">")) break;
      if (parseListItemLine(ln)) break;
      paraLines.push(ln);
      i += 1;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "p", text: paraLines.join("\n") });
    }
  }

  if (inFence) {
    blocks.push({ type: "code", lang: fenceLang, body: codeLines.join("\n") });
  }

  return blocks;
}
