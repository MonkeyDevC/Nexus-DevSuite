/**
 * GitHub Commit Engine — Commit y push desde archivos de delivery_files.
 * Usa la Git Data API: ref → blobs → tree → commit → update ref.
 * No modifica módulos tasks, work orders, releases; solo extiende code deliveries.
 */

const githubService = require("./github.service");
const logger = require("../../config/logger");
const gitService = require("../delivery-workspace/git.service");
const fs = require("fs");
const path = require("path");

function readFileBase64FromFs(repoPath, filePath) {
  const normalized = String(filePath).replace(/\//g, path.sep);
  const fullPath = path.resolve(repoPath, normalized);
  return fs.readFileSync(fullPath).toString("base64");
}

function readFileTextFromFs(repoPath, filePath) {
  const normalized = String(filePath).replace(/\//g, path.sep);
  const fullPath = path.resolve(repoPath, normalized);
  return fs.readFileSync(fullPath, "utf8");
}

/**
 * Construye el array para `createCommit`:
 * - si existe `content_base64` en BD => usamos base64 directo
 * - si no existe (por límites DB) => leemos desde el filesystem del repo del servidor
 */
function buildFilesForCommit(projectId, deliveryFiles) {
  const repoPath = gitService.getProjectRepoPath(projectId);
  const files = [];
  for (const f of deliveryFiles || []) {
    if (f.status === "DELETED") continue;
    const filePath = f.file_path;

    let content = f.content;
    let contentBase64 = f.content_base64;

    const missingContent = (content == null || content === "") && (contentBase64 == null || contentBase64 === "");
    if (missingContent && repoPath && filePath) {
      try {
        if (gitService.isBinaryPath(filePath)) {
          contentBase64 = readFileBase64FromFs(repoPath, filePath);
        } else {
          content = readFileTextFromFs(repoPath, filePath);
        }
      } catch (_) {
        // Si falla leer, commit probablemente fallará; dejamos valores vacíos.
      }
    }

    if (contentBase64 != null && contentBase64 !== "") {
      files.push({ path: filePath, contentBase64 });
    } else {
      if (content == null) content = "";
      files.push({ path: filePath, content });
    }
  }
  return files;
}

/**
 * Realiza commit y push a la rama usando la API de GitHub.
 * Requiere: delivery con branch_name, archivos en delivery_files (ADDED/MODIFIED).
 * @returns { sha, message }
 */
async function commitAndPushToBranch(projectId, userId, branch, message, deliveryFiles) {
  const files = buildFilesForCommit(projectId, deliveryFiles);
  if (files.length === 0) {
    throw new Error("No hay archivos para hacer commit (añade o modifica archivos en el workspace)");
  }
  const config = await githubService.getConfigAsync(projectId, userId);
  if (!config.owner || !config.repo) {
    throw new Error("GitHub repo no configurado. Conecta el proyecto a GitHub.");
  }
  const result = await githubService.createCommit(branch, message, files, projectId, userId);
  logger.info(
    { event: "DELIVERY_PUSH_COMPLETED", project_id: projectId, branch, sha: result.sha, files_count: files.length },
    "Delivery push completed"
  );
  return { sha: result.sha, message };
}

module.exports = {
  buildFilesForCommit,
  commitAndPushToBranch
};
