/**
 * Unified diff parser (GitHub-like).
 *
 * parseUnifiedDiff(diffText) => {
 *   files: [
 *     { filePath, hunks: [ { header, lines: [ { type, content } ] } ] }
 *   ]
 * }
 */
(function () {
  "use strict";

  function extractPathFromPlusLine(line) {
    // "+++ b/path/to/file.ext"
    // "+++ /dev/null"
    const rest = String(line || "").slice(4).trim();
    const token = rest.split(/\s+/)[0] || "";
    if (!token || token === "/dev/null") return null;
    if (token.startsWith("b/")) return token.slice(2);
    if (token.startsWith("a/")) return token.slice(2);
    return token;
  }

  function extractPathFromMinusLine(line) {
    // "--- a/path/to/file.ext"
    const rest = String(line || "").slice(4).trim();
    const token = rest.split(/\s+/)[0] || "";
    if (!token || token === "/dev/null") return null;
    if (token.startsWith("a/")) return token.slice(2);
    if (token.startsWith("b/")) return token.slice(2);
    return token;
  }

  function parseUnifiedDiff(diffText) {
    const text = diffText == null ? "" : String(diffText);
    const lines = text.split(/\r?\n/);

    const files = [];
    let currentFilePath = null;
    let currentFile = null;
    let currentHunk = null;

    function parseHunkHeaderMeta(hunkHeaderLine) {
      // @@ -oldStart,oldCount +newStart,newCount @@
      // Counts pueden venir omitidos: @@ -1 +1 @@
      var m = String(hunkHeaderLine || "").match(/@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/);
      if (!m) return { oldStart: null, newStart: null, oldCount: null, newCount: null };
      return {
        oldStart: m[1] != null ? parseInt(m[1], 10) : null,
        oldCount: m[2] != null ? parseInt(m[2], 10) : null,
        newStart: m[3] != null ? parseInt(m[3], 10) : null,
        newCount: m[4] != null ? parseInt(m[4], 10) : null
      };
    }

    function ensureCurrentFile() {
      if (!currentFile) {
        currentFile = { filePath: currentFilePath || "unknown", hunks: [] };
      }
    }

    function flushHunk() {
      if (currentHunk) {
        ensureCurrentFile();
        currentFile.hunks.push(currentHunk);
        currentHunk = null;
      }
    }

    function flushFile() {
      flushHunk();
      if (currentFile) {
        // Si encontramos hunks, aunque falte filePath (metadatos incompletos),
        // igualmente devolvemos el bloque para que el renderer pueda colorear.
        files.push(currentFile);
        currentFile = null;
      }
      currentFilePath = null;
    }

    function setFileFromHeaderLine(diffHeaderLine) {
      // "diff --git a/path/to/file b/path/to/file"
      // We use the "b/" side.
      const m = String(diffHeaderLine || "").match(/^diff --git a\/(.+?) b\/(.+?)\s*$/);
      if (!m) return null;
      // Preserve "b" path; strip leading ./ if any.
      const p = m[2] || "";
      return p.replace(/^\.\//, "");
    }

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];

      if (line.startsWith("diff --git ")) {
        // New file begins.
        flushFile();
        currentFilePath = setFileFromHeaderLine(line);
        currentFile = null;
        continue;
      }

      // File path metadata lines (when diff --git is absent or for robustness).
      if (line.startsWith("--- ")) {
        const p = extractPathFromMinusLine(line);
        if (!currentFilePath && p) currentFilePath = p;
        continue;
      }

      if (line.startsWith("+++ ")) {
        const p = extractPathFromPlusLine(line);
        if (p) currentFilePath = p;
        continue;
      }

      if (line.startsWith("@@")) {
        // New hunk begins.
        flushHunk();
        ensureCurrentFile();
        var meta = parseHunkHeaderMeta(line);
        currentHunk = { header: line, oldStart: meta.oldStart, newStart: meta.newStart, oldCount: meta.oldCount, newCount: meta.newCount, lines: [] };
        continue;
      }

      if (!currentHunk) continue;

      // Skip some common metadata within diffs.
      if (line.startsWith("index ") || line.startsWith("new file mode ") || line.startsWith("deleted file mode ")) {
        continue;
      }

      // Ignore "No newline at end of file"
      if (line.startsWith("\\ No newline at end of file")) continue;

      // Unified diff line prefixes:
      // ' ' context, '+' added, '-' deleted.
      // Algunos diffs pueden traer espacios/CR extra antes del prefijo.
      // Intentamos robustecer sin asumir un formato rígido.
      const normalized = String(line || "");
      const ltrim = normalized.replace(/^\r/, "");
      const prefix = ltrim.charAt(0);
      const content = ltrim.slice(1);
      if (prefix === "+") currentHunk.lines.push({ type: "add", content });
      else if (prefix === "-") currentHunk.lines.push({ type: "remove", content });
      else if (prefix === " ") currentHunk.lines.push({ type: "context", content });
      else {
        // Some tools can emit empty lines without a prefix; treat as context.
        if (line === "") currentHunk.lines.push({ type: "context", content: "" });
      }
    }

    // flush remaining
    flushFile();
    return { files: files };
  }

  window.DiffParser = window.DiffParser || {};
  window.DiffParser.parseUnifiedDiff = parseUnifiedDiff;
  window.parseUnifiedDiff = parseUnifiedDiff; // convenience
})();

