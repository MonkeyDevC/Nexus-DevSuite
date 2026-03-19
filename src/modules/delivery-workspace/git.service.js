/**
 * Git Service — Fuente de verdad: estado real del repositorio en el servidor.
 * Ejecuta git en la ruta del proyecto (NEXUS_REPOS_BASE_PATH/projectId).
 * Respeta .gitignore automáticamente (git ya lo hace).
 */

const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const logger = require("../../config/logger");
const { env } = require("../../config/env");

const NEXUS_REPOS_BASE_PATH = (env.NEXUS_REPOS_BASE_PATH || "").trim();

/**
 * Ruta absoluta del repositorio del proyecto en el servidor.
 * Requiere NEXUS_REPOS_BASE_PATH y que exista la carpeta projectId dentro.
 */
function getProjectRepoPath(projectId) {
  if (!NEXUS_REPOS_BASE_PATH || !projectId) {
    return null;
  }
  const repoPath = path.resolve(NEXUS_REPOS_BASE_PATH, String(projectId));
  try {
    const stat = fs.statSync(repoPath);
    if (!stat.isDirectory()) return null;
    const gitDir = path.join(repoPath, ".git");
    if (!fs.existsSync(gitDir) || !fs.statSync(gitDir).isDirectory()) {
      return null;
    }
    return repoPath;
  } catch (_) {
    return null;
  }
}

/**
 * Indica si el backend tiene Git local configurado para este proyecto.
 */
function isGitLocalAvailable(projectId) {
  return !!getProjectRepoPath(projectId);
}

/** Extensiones consideradas binarias: no generar diff de texto (fallback cuando numstat no está disponible). */
const BINARY_EXTENSIONS = /\.(png|jpeg|jpg|gif|ico|webp|bmp|zip|tar|gz|rar|7z|pdf|woff|woff2|ttf|eot|otf|mp3|mp4|webm|ogg|wav|exe|dll|so|dylib)$/i;

function isBinaryPath(filePath) {
  return typeof filePath === "string" && BINARY_EXTENSIONS.test(filePath);
}

/** FASE 6: Detecta binarios por contenido vía `git diff --numstat`. Si devuelve "-	-" para un path → binario. Priorizar sobre extensión. */
function getBinaryPathsFromDiffNumstat(projectId, stagedOnly) {
  const repoPath = getProjectRepoPath(projectId);
  if (!repoPath) return new Set();
  try {
    const args = stagedOnly ? "diff --cached --numstat" : "diff HEAD --numstat";
    const { stdout } = runGit(projectId, args);
    const lines = (stdout || "").split(/\r?\n/).filter((l) => l.trim());
    const binaryPaths = new Set();
    for (const line of lines) {
      const parts = line.split(/\t/);
      if (parts.length >= 3) {
        const add = (parts[0] || "").trim();
        const del_ = (parts[1] || "").trim();
        const filePath = (parts[2] || "").trim();
        if (add === "-" && del_ === "-" && filePath) binaryPaths.add(filePath);
      }
    }
    return binaryPaths;
  } catch (_) {
    return new Set();
  }
}

/** Indica si un path es binario: primero por numstat (si se pasa el Set), luego por extensión. */
function isBinaryFilePath(projectId, filePath, binaryPathsFromNumstat) {
  if (binaryPathsFromNumstat && binaryPathsFromNumstat.has(filePath)) return true;
  return isBinaryPath(filePath);
}

/**
 * Cuenta archivos por tipo (binario vs texto) para logging.
 * @param {{ path: string }[]} files
 * @returns {{ binary: number, text: number }}
 */
function countFilesByType(files) {
  let binary = 0;
  let text = 0;
  for (const f of files) {
    if (isBinaryPath(f.path)) binary++;
    else text++;
  }
  return { binary, text };
}

/**
 * Meta del repositorio: rama actual, HEAD hash, última modificación HEAD (como proxy de "última sincronización").
 * Uso interno y para getRepoStatusMeta().
 */
function getRepoStatusMetaInternal(projectId) {
  const repoPath = getProjectRepoPath(projectId);
  if (!repoPath) return { branch: null, headHash: null, lastCommitDate: null };

  try {
    const { stdout: branch } = runGit(projectId, "rev-parse --abbrev-ref HEAD");
    const { stdout: headHash } = runGit(projectId, "rev-parse HEAD");
    const { stdout: logOut } = runGit(projectId, "log -1 --format=%ci HEAD");
    return {
      branch: (branch || "").trim() || null,
      headHash: (headHash || "").trim() || null,
      lastCommitDate: (logOut || "").trim() || null
    };
  } catch (_) {
    return { branch: null, headHash: null, lastCommitDate: null };
  }
}

/**
 * API pública: estado del repo para validación de consistencia (FASE 3).
 * Devuelve branch, headHash, lastCommitDate. Si expectedHead se pasa, indica si hay desincronización.
 */
function getRepoStatusMeta(projectId, options = {}) {
  const meta = getRepoStatusMetaInternal(projectId);
  const expectedHead = options.expectedHead && String(options.expectedHead).trim();
  const syncWarning = !!(
    expectedHead &&
    meta.headHash &&
    meta.headHash !== expectedHead
  );
  return {
    ...meta,
    available: !!getProjectRepoPath(projectId),
    syncWarning,
    message: syncWarning
      ? "El repositorio del servidor no está sincronizado con tu entorno local."
      : null
  };
}

/**
 * Ejecuta un comando git en la raíz del repo del proyecto.
 * @param {string} projectId
 * @param {string} gitArgs - argumentos para git (ej. "status", "--porcelain")
 * @returns {{ stdout: string, stderr: string }}
 */
function runGit(projectId, gitArgs) {
  const repoPath = getProjectRepoPath(projectId);
  if (!repoPath) {
    throw new Error("Git local no configurado: defina NEXUS_REPOS_BASE_PATH y asegure que el repositorio esté clonado en esa ruta para este proyecto.");
  }
  const cmd = `git ${gitArgs}`;
  try {
    const stdout = execSync(cmd, {
      cwd: repoPath,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024
    });
    return { stdout: stdout || "", stderr: "" };
  } catch (e) {
    const stderr = (e.stderr || e.message || "").toString();
    logger.warn(
      { event: "GIT_COMMAND_ERROR", project_id: projectId, cmd, stderr: stderr.slice(0, 500) },
      "Git command failed"
    );
    throw e;
  }
}

/**
 * Parsea la salida de `git status --porcelain`.
 * Formato: XY path (o "?? path" para untracked). R → RENAMED con oldPath.
 * @param {string} text
 * @returns {{ path: string, status: string, oldPath?: string }[]}
 */
function parsePorcelainOutput(text) {
  const lines = (text || "").split(/\r?\n/).filter((line) => line.trim());
  const result = [];
  const seen = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 3) continue;

    // Formato porcelain: "XY path" (X = index, Y = work tree). "??" = untracked. " R  old -> new" = renamed.
    const xy = trimmed.slice(0, 2);
    let filePath = trimmed.slice(2).replace(/^\s+/, "");

    // Renamed: "R  old -> new" → RENAMED con oldPath (FASE 2)
    let oldPath = null;
    const arrow = filePath.indexOf("->");
    if (arrow !== -1) {
      oldPath = filePath.slice(0, arrow).trim().replace(/^["']|["']$/g, "");
      filePath = filePath.slice(arrow + 2).trim().replace(/^["']|["']$/g, "");
    }

    filePath = filePath.replace(/^["']|["']$/g, "").trim();
    if (!filePath || seen.has(filePath)) continue;
    seen.add(filePath);

    let status = "MODIFIED";
    if (xy === "??") {
      status = "UNTRACKED";
    } else if (xy === "D " || xy === " D" || xy === "DD") {
      status = "DELETED";
    } else if (xy === "A " || xy === " A" || xy === "M " || xy === " M" || xy === "MM" || xy === "AM") {
      status = xy.includes("A") && xy !== "AM" ? "ADDED" : "MODIFIED";
    } else if (xy === "R " || xy === " R" || xy === "RM") {
      status = "RENAMED";
    }

    const entry = { path: filePath, status };
    if (oldPath) entry.oldPath = oldPath;
    result.push(entry);
  }

  return result;
}

/**
 * Parsea la salida de `git diff --cached --name-status` o `git diff HEAD --name-status`.
 * Formato: X\tpath (o para rename: R\told\tnew). R → { status: "RENAMED", path: newPath, oldPath }.
 * @param {string} text
 * @returns {{ path: string, status: string, oldPath?: string }[]}
 */
function parseDiffNameStatus(text) {
  const lines = (text || "").split(/\r?\n/).filter((line) => line.trim());
  const result = [];
  const seen = new Set();

  for (const line of lines) {
    const parts = line.split(/\t/);
    if (parts.length < 2) continue;
    const rawCode = (parts[0] || "").trim().toUpperCase();
    const code = rawCode.charAt(0);
    const firstPath = (parts[1] || "").trim();
    const secondPath = parts[2] ? (parts[2] || "").trim() : "";

    let filePath = firstPath;
    let oldPath = null;
    if ((rawCode.startsWith("R") || rawCode.startsWith("C")) && secondPath) {
      oldPath = firstPath;
      filePath = secondPath;
    }
    if (!filePath || seen.has(filePath)) continue;
    seen.add(filePath);

    let status = "MODIFIED";
    if (code === "A") status = "ADDED";
    else if (code === "D") status = "DELETED";
    else if (code === "M") status = "MODIFIED";
    else if (rawCode.startsWith("R")) status = "RENAMED";
    else if (rawCode.startsWith("C")) status = "COPIED"; // FASE 3

    const entry = { path: filePath, status };
    if (oldPath) entry.oldPath = oldPath;
    result.push(entry);
  }

  return result;
}

/** @deprecated Use parseDiffNameStatus. Mantenido por compatibilidad. */
function parseCachedNameStatus(text) {
  return parseDiffNameStatus(text);
}

/**
 * FASE 1: Parsea salida de `git status --porcelain=v2`.
 * Formato: "1 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <path>" y "2 <XY> ... <R|C> <score> <path1>\\t<path2>" para renames/copies.
 * @param {string} text
 * @returns {{ path: string, status: string, oldPath?: string, source?: 'staged'|'worktree'|'untracked' }[]}
 */
function parsePorcelainV2(text) {
  const lines = (text || "").split(/\r?\n/).filter((line) => line.trim());
  const result = [];
  const seen = new Set();

  for (const line of lines) {
    if (line.startsWith("#")) continue; // branch.oid, branch.head, etc.
    const trimmed = line.trim();
    if (trimmed.length < 2) continue;

    const type = trimmed.charAt(0);
    if (type === "1") {
      // 1 XY sub mH mI mW hH hI path  (path = resto después del 8º campo; en la práctica suele ser el último token si no hay espacios)
      const tabIdx = trimmed.indexOf("\t");
      const path = tabIdx !== -1 ? trimmed.slice(tabIdx + 1).trim() : trimmed.split(/\s+/).slice(8).join(" ").trim();
      if (!path || seen.has(path)) continue;
      seen.add(path);
      const xy = trimmed.slice(2, 4);
      let status = "MODIFIED";
      if (xy === "??") status = "UNTRACKED";
      else if (xy === "D " || xy === " D" || xy === "DD") status = "DELETED";
      else if (xy.charAt(0) === "A" || xy === "A ") status = "ADDED";
      else if (xy.charAt(1) === "A") status = "ADDED";
      else if (xy.includes("R")) status = "RENAMED";
      else if (xy.includes("C")) status = "COPIED";
      else if (xy.includes("M") || xy === "M ") status = "MODIFIED";
      result.push({ path, status });
    } else if (type === "2") {
      // 2 <XY> ... <R|C><score> [path1]\t<path2> → path=path2 (new), oldPath=path1 (path1 puede contener espacios)
      const parts = trimmed.split("\t");
      if (parts.length < 2) continue;
      const left = (parts[0] || "").trim();
      let origPath;
      let targetPath;
      if (parts.length >= 3) {
        origPath = (parts[1] || "").trim();
        targetPath = (parts[2] || "").trim();
      } else {
        targetPath = (parts[1] || "").trim();
        const match = left.match(/[RC]\d+\s+(.+)$/);
        origPath = match ? match[1].trim() : "";
      }
      if (!targetPath || seen.has(targetPath)) continue;
      seen.add(targetPath);
      const code = left.match(/\s([RC])\s*\d*/)?.[1]?.toUpperCase() || "R";
      const status = code === "C" ? "COPIED" : "RENAMED";
      result.push({ path: targetPath, status, oldPath: origPath || undefined });
    }
  }
  return result;
}

/**
 * FASE 2 + 7: Construye mapa unificado por path final. Prioridad: staged > working > untracked.
 * Clave única = path; evita duplicados. Resuelve conflictos (último estado válido gana).
 * @param {string} projectId
 * @param {{ stagedOnly?: boolean }} options
 * @returns {{ files: { path: string, status: string, oldPath?: string }[], rawV2: string, rawDiffCached: string, rawDiffHead: string }}
 */
function buildUnifiedFileMap(projectId, options = {}) {
  const stagedOnly = !!options.stagedOnly;
  const repoPath = getProjectRepoPath(projectId);
  if (!repoPath) {
    return { files: [], rawV2: "", rawDiffCached: "", rawDiffHead: "" };
  }

  let rawV2 = "";
  let rawDiffCached = "";
  let rawDiffHead = "";
  const mapByPath = new Map(); // path -> { path, status, oldPath, priority }

  const PRIO = { staged: 3, working: 2, untracked: 1 };

  try {
    rawV2 = runGit(projectId, "status --porcelain=v2").stdout || "";
  } catch (_) {
    rawV2 = "";
  }

  const v2Entries = parsePorcelainV2(rawV2);

  if (stagedOnly) {
    try {
      rawDiffCached = runGit(projectId, "diff --cached --name-status").stdout || "";
    } catch (_) {}
    const cachedEntries = parseDiffNameStatus(rawDiffCached);
    for (const e of cachedEntries) {
      const key = e.path;
      const current = mapByPath.get(key);
      if (!current || PRIO.staged >= (PRIO[current.priority] || 0)) {
        mapByPath.set(key, {
          path: e.path,
          status: e.status,
          oldPath: e.oldPath,
          priority: "staged"
        });
      }
    }
  } else {
    try {
      rawDiffHead = runGit(projectId, "diff HEAD --name-status").stdout || "";
    } catch (_) {}
    const diffEntries = parseDiffNameStatus(rawDiffHead);
    for (const e of diffEntries) {
      const key = e.path;
      const current = mapByPath.get(key);
      if (!current || PRIO.working >= (PRIO[current.priority] || 0)) {
        mapByPath.set(key, {
          path: e.path,
          status: e.status,
          oldPath: e.oldPath,
          priority: "working"
        });
      }
    }
    for (const e of v2Entries) {
      if (e.status !== "UNTRACKED") continue;
      const key = e.path;
      if (mapByPath.has(key)) continue;
      mapByPath.set(key, { path: e.path, status: "UNTRACKED", oldPath: undefined, priority: "untracked" });
    }
  }

  // FASE 4: Normalizar RENAMED: asegurar oldPath/newPath; no dejar como DELETED+ADDED
  const deletedPaths = new Set();
  for (const [p, entry] of mapByPath) {
    if (entry.status === "DELETED") deletedPaths.add(entry.oldPath || p);
  }
  for (const [p, entry] of mapByPath) {
    if (entry.status === "ADDED" && entry.oldPath) {
      entry.status = "RENAMED";
    }
    if (entry.status === "RENAMED" && !entry.oldPath && deletedPaths.has(p)) {
      // Ya está como RENAMED con oldPath en diff; no duplicar
    }
  }

  const files = Array.from(mapByPath.values()).map((e) => {
    const out = { path: e.path, status: e.status };
    if (e.oldPath) out.oldPath = e.oldPath;
    return out;
  });

  return { files, rawV2, rawDiffCached, rawDiffHead };
}

/**
 * Obtiene el estado Git del repositorio. Fuente unificada: porcelain v2 + diff (FASE 1-2-7-8).
 * stagedOnly: true → git diff --cached --name-status (+ porcelain v2 como referencia).
 * stagedOnly: false → buildUnifiedFileMap (diff HEAD + untracked desde porcelain v2). Prioridad staged > working > untracked.
 * Si porcelain v2 no está disponible, fallback a diff + status --porcelain v1.
 * @param {string} projectId
 * @param {{ stagedOnly?: boolean, usePorcelainV2?: boolean }} options
 * @returns {{ files: { path: string, status: string, oldPath?: string }[], raw?: string }}
 */
function getGitStatus(projectId, options = {}) {
  const stagedOnly = !!options.stagedOnly;
  const usePorcelainV2 = options.usePorcelainV2 !== false;
  const repoPath = getProjectRepoPath(projectId);
  if (!repoPath) {
    return {
      files: [],
      available: false,
      message: "Git local no configurado. Configure NEXUS_REPOS_BASE_PATH y clone el repositorio en el servidor."
    };
  }

  let files = [];
  let raw = "";

  let usedUnified = false;
  if (usePorcelainV2) {
    try {
      const unified = buildUnifiedFileMap(projectId, { stagedOnly });
      files = unified.files;
      raw = unified.rawV2 + "\n" + unified.rawDiffCached + "\n" + unified.rawDiffHead;
      usedUnified = true;

      // FASE 8: Validación contra porcelain v2 (solo cuando incluye working, para comparar mismas fuentes)
      const v2Paths = new Set(parsePorcelainV2(unified.rawV2).map((e) => e.path));
      const resultPaths = new Set(files.map((f) => f.path));
      const missing = [...v2Paths].filter((p) => !resultPaths.has(p));
      const extra = [...resultPaths].filter((p) => !v2Paths.has(p));
      if (!stagedOnly && (missing.length > 0 || extra.length > 0)) {
        logger.warn(
          {
            event: "GIT_MISMATCH_DETECTED",
            project_id: projectId,
            staged_only: stagedOnly,
            missing_count: missing.length,
            extra_count: extra.length,
            missing_sample: missing.slice(0, 5),
            extra_sample: extra.slice(0, 5)
          },
          "Final file list differs from porcelain v2"
        );
      }
    } catch (_) {
      usedUnified = false;
    }
  }

  if (!usedUnified || files.length === 0) {
    if (stagedOnly) {
      const { stdout } = runGit(projectId, "diff --cached --name-status");
      raw = stdout;
      files = parseDiffNameStatus(stdout);
    } else {
      const { stdout: diffOut } = runGit(projectId, "diff HEAD --name-status");
      files = parseDiffNameStatus(diffOut);
      const { stdout: statusOut } = runGit(projectId, "status --porcelain");
      raw = diffOut + "\n" + statusOut;
      const untracked = parsePorcelainOutput(statusOut).filter((f) => f.status === "UNTRACKED");
      const seenPaths = new Set(files.map((f) => f.path));
      for (const u of untracked) {
        if (!seenPaths.has(u.path)) {
          seenPaths.add(u.path);
          files.push({ path: u.path, status: "UNTRACKED" });
        }
      }
    }
  }

  const meta = getRepoStatusMetaInternal(projectId);
  const filesByType = countFilesByType(files);
  logger.info(
    {
      event: "GIT_STATUS_LOADED",
      project_id: projectId,
      staged_only: stagedOnly,
      files_detected_count: files.length,
      GIT_HEAD_HASH: meta.headHash || null,
      GIT_BRANCH: meta.branch || null,
      FILES_BY_TYPE: filesByType
    },
    "Git status loaded"
  );

  return {
    files,
    raw,
    available: true
  };
}

/**
 * Lee el contenido de un archivo desde el filesystem del repo.
 */
function getFileContentFromFs(projectId, filePath) {
  const repoPath = getProjectRepoPath(projectId);
  if (!repoPath) return null;
  const fullPath = path.join(repoPath, filePath);
  if (path.relative(repoPath, fullPath).startsWith("..")) {
    return null;
  }
  try {
    return fs.readFileSync(fullPath, "utf8");
  } catch (_) {
    return null;
  }
}

/**
 * Obtiene el contenido de un archivo en una ref de Git (ej. HEAD).
 * git show HEAD:path
 */
function getFileContentFromGit(projectId, ref, filePath) {
  const repoPath = getProjectRepoPath(projectId);
  if (!repoPath || !ref || !filePath) return null;
  const safePath = filePath.replace(/\\/g, "/");
  try {
    const { stdout } = runGit(projectId, `show ${ref}:${JSON.stringify(safePath)}`);
    return stdout || "";
  } catch (_) {
    return null;
  }
}

/**
 * Genera diff entre dos contenidos (implementación simple por líneas).
 * Para MODIFIED: diff(old, new). Para ADDED: diff("", new). Para DELETED: diff(old, "").
 */
function simpleDiff(oldContent, newContent) {
  const oldLines = (oldContent || "").split(/\n/);
  const newLines = (newContent || "").split(/\n/);
  const result = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i];
    const n = newLines[i];
    if (o === undefined) result.push({ type: "add", line: i + 1, base: null, workspace: n });
    else if (n === undefined) result.push({ type: "del", line: i + 1, base: o, workspace: null });
    else if (o !== n) result.push({ type: "mod", line: i + 1, base: o, workspace: n });
  }
  return result;
}

/**
 * FASE 5 + Pre-Git: Diff real de Git por archivo.
 * stagedOnly: true → git diff --cached -- path
 * stagedOnly: false && baseRef → git diff baseRef -- path (FASE 1: diffs contra base_commit_hash de la entrega)
 * stagedOnly: false && !baseRef → git diff HEAD -- path
 * Para binarios devuelve null.
 */
function getDiffForFile(projectId, filePath, options = {}) {
  const stagedOnly = !!options.stagedOnly;
  const baseRef = options.baseRef && String(options.baseRef).trim();
  const binarySet = options.binaryPathsFromNumstat;
  if (binarySet && binarySet.has(filePath)) return null;
  if (!binarySet && isBinaryPath(filePath)) return null;
  const repoPath = getProjectRepoPath(projectId);
  if (!repoPath || !filePath) return null;
  const safePath = filePath.replace(/\\/g, "/").replace(/"/g, '\\"');
  try {
    let diffCmd;
    if (stagedOnly) {
      diffCmd = `diff --cached -- "${safePath}"`;
    } else if (baseRef) {
      diffCmd = `diff ${baseRef} -- "${safePath}"`;
    } else {
      diffCmd = `diff HEAD -- "${safePath}"`;
    }
    const { stdout } = runGit(projectId, diffCmd);
    return stdout || "";
  } catch (_) {
    return null;
  }
}

/**
 * Diff completo HEAD en un solo comando (batch). FASE 8.
 * Útil para no ejecutar N comandos por archivo.
 */
function getFullDiffHead(projectId) {
  const repoPath = getProjectRepoPath(projectId);
  if (!repoPath) return null;
  try {
    const { stdout } = runGit(projectId, "diff HEAD");
    return stdout || "";
  } catch (_) {
    return null;
  }
}

module.exports = {
  getProjectRepoPath,
  isGitLocalAvailable,
  getGitStatus,
  getRepoStatusMeta,
  buildUnifiedFileMap,
  parsePorcelainV2,
  getFileContentFromFs,
  getFileContentFromGit,
  getDiffForFile,
  getFullDiffHead,
  getBinaryPathsFromDiffNumstat,
  isBinaryFilePath,
  simpleDiff,
  isBinaryPath,
  parsePorcelainOutput,
  parseDiffNameStatus,
  parseCachedNameStatus,
  countFilesByType
};
