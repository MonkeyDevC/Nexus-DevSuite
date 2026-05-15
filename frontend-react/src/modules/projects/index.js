/**
 * API pública intencional del dominio projects (refinamiento post–Ola B).
 * Solo exportar lo que consumidores externos necesitan; el resto vive en rutas internas del módulo.
 */
export { ProjectProvider, useProjectContext } from "./context/ProjectContext.jsx";
export { getProjectById, importProjects } from "./services/projectApiClient.js";
export { uploadProjectEvidenceImage } from "./services/evidenceUploadService.js";
export { default as ProjectDetailWorkspace } from "./components/workspace/ProjectDetailWorkspace.jsx";
