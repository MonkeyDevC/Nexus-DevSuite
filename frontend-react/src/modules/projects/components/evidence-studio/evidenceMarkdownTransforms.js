/**
 * Transformaciones markdown para toolbar (V2).
 * Cada función devuelve { next, selectionStart, selectionEnd } o null si no aplica.
 */

export function replaceRange(text, start, end, replacement) {
  const next = text.slice(0, start) + replacement + text.slice(end);
  return next;
}

function lineStartIndex(text, pos) {
  const p = Math.max(0, Math.min(pos, text.length));
  let s = text.lastIndexOf("\n", p - 1);
  return s < 0 ? 0 : s + 1;
}

function lineEndIndex(text, pos) {
  const p = Math.max(0, Math.min(pos, text.length));
  let e = text.indexOf("\n", p);
  return e < 0 ? text.length : e;
}

function lineIndicesForRange(text, selStart, selEnd) {
  const start = lineStartIndex(text, Math.min(selStart, selEnd));
  let endLine = Math.max(selStart, selEnd);
  const end = lineEndIndex(text, endLine);
  const lines = [];
  let i = start;
  while (i <= end) {
    const le = lineEndIndex(text, i);
    lines.push({ start: i, end: le });
    i = le + 1;
    if (i > text.length) break;
  }
  return lines;
}

function mapLinesInSelection(text, selStart, selEnd, fn) {
  const lines = lineIndicesForRange(text, selStart, selEnd);
  if (lines.length === 0) return text;
  const parts = [];
  for (const { start, end } of lines) {
    const lineContent = text.slice(start, end);
    parts.push(fn(lineContent).nextLine);
  }
  const first = lines[0].start;
  const last = lines[lines.length - 1].end;
  return text.slice(0, first) + parts.join("\n") + text.slice(last);
}

/**
 * @returns {{ next: string, start: number, end: number }}
 */
export function applyBold(text, selStart, selEnd) {
  const a = Math.min(selStart, selEnd);
  const b = Math.max(selStart, selEnd);
  if (a < b) {
    const sel = text.slice(a, b);
    if (sel.startsWith("**") && sel.endsWith("**") && sel.length >= 4) {
      const inner = sel.slice(2, -2);
      const next = replaceRange(text, a, b, inner);
      return { next, start: a, end: a + inner.length };
    }
    const wrapped = `**${sel}**`;
    const next = replaceRange(text, a, b, wrapped);
    return { next, start: a + 2, end: a + 2 + (b - a) };
  }
  const ins = "****";
  const next = replaceRange(text, a, a, ins);
  return { next, start: a + 2, end: a + 2 };
}

export function applyItalic(text, selStart, selEnd) {
  const a = Math.min(selStart, selEnd);
  const b = Math.max(selStart, selEnd);
  if (a < b) {
    const sel = text.slice(a, b);
    if (sel.startsWith("*") && sel.endsWith("*") && !sel.startsWith("**") && sel.length >= 2) {
      const inner = sel.slice(1, -1);
      const next = replaceRange(text, a, b, inner);
      return { next, start: a, end: a + inner.length };
    }
    const wrapped = `*${sel}*`;
    const next = replaceRange(text, a, b, wrapped);
    return { next, start: a + 1, end: a + 1 + (b - a) };
  }
  const ins = `*texto*`;
  const next = replaceRange(text, a, a, ins);
  return { next, start: a + 1, end: a + 6 };
}

export function applyHeading(text, selStart, selEnd, level) {
  const prefix = level === 1 ? "# " : "## ";
  const a = Math.min(selStart, selEnd);
  const lineStart = lineStartIndex(text, a);
  const lineEnd = lineEndIndex(text, a);
  const firstLine = text.slice(lineStart, lineEnd);
  const without = firstLine.replace(/^#{1,2}\s+/, "");
  const newLine = prefix + without;
  const next = replaceRange(text, lineStart, lineEnd, newLine);
  const cursor = lineStart + newLine.length;
  return { next, start: cursor, end: cursor };
}

export function applyBulletList(text, selStart, selEnd) {
  const next = mapLinesInSelection(text, selStart, selEnd, (line) => {
    const t = line.trim() === "" ? "" : line;
    if (!t) return { nextLine: "- " };
    if (/^-\s\[[ xX]\]\s/.test(t)) {
      const rest = t.replace(/^-\s\[[ xX]\]\s+/, "");
      return { nextLine: `- ${rest}` };
    }
    if (/^\d+\.\s/.test(t)) {
      const rest = t.replace(/^\d+\.\s+/, "");
      return { nextLine: `- ${rest}` };
    }
    if (t.startsWith("- ")) return { nextLine: t };
    return { nextLine: `- ${t}` };
  });
  const s = Math.min(selStart, selEnd);
  return { next, start: s, end: s };
}

export function applyNumberedList(text, selStart, selEnd) {
  const lines = lineIndicesForRange(text, selStart, selEnd);
  let n = 1;
  const parts = lines.map(({ start, end }) => {
    const lineContent = text.slice(start, end);
    const t = lineContent.trim() === "" ? "" : lineContent;
    let nextLine;
    if (!t) {
      nextLine = `${n}. `;
    } else if (/^-\s\[[ xX]\]\s/.test(t)) {
      nextLine = `${n}. ${t.replace(/^-\s\[[ xX]\]\s+/, "")}`;
    } else if (t.startsWith("- ")) {
      nextLine = `${n}. ${t.slice(2)}`;
    } else if (/^\d+\.\s/.test(t)) {
      nextLine = `${n}. ${t.replace(/^\d+\.\s+/, "")}`;
    } else {
      nextLine = `${n}. ${t}`;
    }
    n += 1;
    return nextLine;
  });
  if (lines.length === 0) return { next: text, start: selStart, end: selEnd };
  const first = lines[0].start;
  const last = lines[lines.length - 1].end;
  const next = text.slice(0, first) + parts.join("\n") + text.slice(last);
  const s = Math.min(selStart, selEnd);
  return { next, start: s, end: s };
}

export function applyChecklist(text, selStart, selEnd) {
  const next = mapLinesInSelection(text, selStart, selEnd, (line) => {
    const t = line.trim() === "" ? "" : line;
    if (!t) return { nextLine: "- [ ] " };
    if (/^-\s\[[ xX]\]\s/.test(t)) return { nextLine: t };
    if (/^\d+\.\s/.test(t)) {
      return { nextLine: `- [ ] ${t.replace(/^\d+\.\s+/, "")}` };
    }
    if (t.startsWith("- ")) {
      return { nextLine: `- [ ] ${t.slice(2)}` };
    }
    return { nextLine: `- [ ] ${t}` };
  });
  const s = Math.min(selStart, selEnd);
  return { next, start: s, end: s };
}

export function applyQuote(text, selStart, selEnd) {
  const next = mapLinesInSelection(text, selStart, selEnd, (line) => {
    const t = line.trim() === "" ? "" : line;
    if (!t) return { nextLine: "> " };
    if (t.startsWith("> ")) return { nextLine: t };
    if (t.startsWith(">")) return { nextLine: `> ${t.slice(1).trimStart()}` };
    return { nextLine: `> ${t}` };
  });
  const s = Math.min(selStart, selEnd);
  return { next, start: s, end: s };
}

export function applyCodeBlock(text, selStart, selEnd) {
  const a = Math.min(selStart, selEnd);
  const b = Math.max(selStart, selEnd);
  const fenceBefore = "\n```\n";
  const fenceAfter = "\n```\n";
  if (a < b) {
    const sel = text.slice(a, b);
    const wrapped = `${fenceBefore}${sel}${fenceAfter}`;
    const next = replaceRange(text, a, b, wrapped);
    return { next, start: a + fenceBefore.length, end: a + fenceBefore.length + sel.length };
  }
  const template = `${fenceBefore}${fenceAfter}`;
  const next = replaceRange(text, a, a, template);
  const innerStart = a + fenceBefore.length;
  return { next, start: innerStart, end: innerStart };
}

export function applyLink(text, selStart, selEnd) {
  const a = Math.min(selStart, selEnd);
  const b = Math.max(selStart, selEnd);
  if (a < b) {
    const sel = text.slice(a, b);
    const wrapped = `[${sel}](https://)`;
    const next = replaceRange(text, a, b, wrapped);
    return { next, start: a + 1, end: a + 1 + sel.length };
  }
  const ins = `[texto](https://)`;
  const next = replaceRange(text, a, a, ins);
  return { next, start: a + 1, end: a + 6 };
}

export function applyImage(text, selStart, selEnd) {
  const a = Math.min(selStart, selEnd);
  const b = Math.max(selStart, selEnd);
  if (a < b) {
    const sel = text.slice(a, b);
    const wrapped = `![${sel}](https://)`;
    const next = replaceRange(text, a, b, wrapped);
    return { next, start: a + wrapped.length, end: a + wrapped.length };
  }
  const ins = `![descripción](https://)`;
  const next = replaceRange(text, a, a, ins);
  return { next, start: a + ins.length, end: a + ins.length };
}

export function applyDivider(text, selStart, selEnd) {
  const pos = Math.max(selStart, selEnd);
  const before = text.slice(0, pos);
  const needsNl = before.length > 0 && !before.endsWith("\n");
  const ins = `${needsNl ? "\n" : ""}\n---\n`;
  const next = replaceRange(text, pos, pos, ins);
  return { next, start: pos + ins.length, end: pos + ins.length };
}

/**
 * @param {string} action
 * @param {string} text
 * @param {number} selStart
 * @param {number} selEnd
 * @returns {{ next: string, start: number, end: number } | null}
 */
export function applyMarkdownToolbarAction(action, text, selStart, selEnd) {
  switch (action) {
    case "bold":
      return applyBold(text, selStart, selEnd);
    case "italic":
      return applyItalic(text, selStart, selEnd);
    case "h1":
      return applyHeading(text, selStart, selEnd, 1);
    case "h2":
      return applyHeading(text, selStart, selEnd, 2);
    case "bullet_list":
      return applyBulletList(text, selStart, selEnd);
    case "ordered_list":
      return applyNumberedList(text, selStart, selEnd);
    case "checklist":
      return applyChecklist(text, selStart, selEnd);
    case "quote":
      return applyQuote(text, selStart, selEnd);
    case "code_block":
      return applyCodeBlock(text, selStart, selEnd);
    case "link":
      return applyLink(text, selStart, selEnd);
    case "image":
      return applyImage(text, selStart, selEnd);
    case "divider":
      return applyDivider(text, selStart, selEnd);
    default:
      return null;
  }
}
