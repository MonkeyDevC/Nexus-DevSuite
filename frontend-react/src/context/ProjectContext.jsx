/* eslint-disable react-refresh/only-export-components */
/**
 * ----
 * Modulo: ProjectContext
 * Descripcion: Estado de dominio Project para sincronizar listados y detalle en SPA.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-26
 * ----
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  archiveProject,
  createProject,
  deleteProject,
  deleteProjectsBulk,
  getProjectById,
  listProjects,
  updateProject,
} from "../services/projectApiClient.js";

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);

  const refreshProjects = useCallback(async () => {
    const items = await listProjects();
    setProjects(items);
    return items;
  }, []);

  const loadProject = useCallback(async (id) => getProjectById(id), []);

  const createProjectAction = useCallback(async (payload) => {
    const created = await createProject(payload);
    setProjects((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateProjectAction = useCallback(async (id, payload) => {
    const updated = await updateProject(id, payload);
    setProjects((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    return updated;
  }, []);

  const archiveProjectAction = useCallback(async (id, expectedVersion) => {
    const archived = await archiveProject(id, expectedVersion);
    setProjects((prev) => prev.map((item) => (item.id === archived.id ? archived : item)));
    return archived;
  }, []);

  const deleteProjectAction = useCallback(async (id, expectedVersion) => {
    const result = await deleteProject(id, expectedVersion);
    if (result.deleted) {
      setProjects((prev) => prev.filter((item) => item.id !== id));
    }
    return result;
  }, []);

  const bulkDeleteProjectsAction = useCallback(async (ids) => {
    const unique = [...new Set(ids.map(String))];
    const BATCH = 100;
    let deleted = 0;
    for (let i = 0; i < unique.length; i += BATCH) {
      const chunk = unique.slice(i, i + BATCH);
      const result = await deleteProjectsBulk(chunk);
      deleted += result.deleted || chunk.length;
      setProjects((prev) => prev.filter((item) => !chunk.includes(item.id)));
    }
    return { deleted, ids: unique };
  }, []);

  const value = useMemo(
    () => ({
      projects,
      refreshProjects,
      loadProject,
      createProject: createProjectAction,
      updateProject: updateProjectAction,
      archiveProject: archiveProjectAction,
      deleteProject: deleteProjectAction,
      bulkDeleteProjects: bulkDeleteProjectsAction,
    }),
    [
      projects,
      refreshProjects,
      loadProject,
      createProjectAction,
      updateProjectAction,
      archiveProjectAction,
      deleteProjectAction,
      bulkDeleteProjectsAction,
    ]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("ProjectContext no disponible");
  }
  return ctx;
}
