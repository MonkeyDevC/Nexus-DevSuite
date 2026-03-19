/**
 * Git diff generator — genera UNIFIED DIFF real usando Git local en servidor.
 *
 * Nota: este servicio no construye diffs manualmente.
 * Delegamos en el `git.service.js` existente (delivery-workspace).
 */
const gitService = require("../../delivery-workspace/git.service");

async function generateUnifiedDiffForFile({ projectId, filePath, stagedOnly = false, baseRef }) {
  const binaryPaths = gitService.getBinaryPathsFromDiffNumstat(projectId, !!stagedOnly);
  const diff = gitService.getDiffForFile(projectId, String(filePath || "").trim(), {
    stagedOnly: !!stagedOnly,
    binaryPathsFromNumstat: binaryPaths,
    baseRef: baseRef ? String(baseRef).trim() : undefined
  });
  return diff || "";
}

module.exports = {
  generateUnifiedDiffForFile
};

