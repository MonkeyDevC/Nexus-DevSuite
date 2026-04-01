/**
 * ----
 * Modulo: Projects
 * Descripcion: Listado de proyectos con normalizacion defensiva, mensajes UX unificados y anti-race.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb/Breadcrumb.jsx";
import ErrorBanner from "../components/projects/ErrorBanner.jsx";
import FormCreateProject from "../components/projects/FormCreateProject.jsx";
import LoadingSpinner from "../components/projects/LoadingSpinner.jsx";
import TableProjects from "../components/projects/TableProjects.jsx";
import Modal from "../components/ui/Modal/Modal.jsx";
import { useProjectContext } from "../context/ProjectContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { hasPermission, hasRole, ROLE_MASTER } from "../auth/authorization.js";
import pageStyles from "./projectsPage.module.css";

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, refreshProjects, createProject } = useProjectContext();
  const canCreateProject = hasPermission(user, "project:create");
  const isMaster = hasRole(user, ROLE_MASTER);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const successTimerRef = useRef(null);

  function showSuccess(msg) {
    setErrorMessage("");
    setSuccessMessage(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(""), 6000);
  }

  useEffect(() => () => clearTimeout(successTimerRef.current), []);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      setLoading(true);
      setErrorMessage("");
      try {
        if (cancelled) return;
        await refreshProjects();
      } catch {
        if (cancelled) return;
        setErrorMessage("Error cargando datos");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProjects();
    return () => {
      cancelled = true;
    };
  }, [refreshProjects]);

  async function handleCreate(payload) {
    setSaving(true);
    setErrorMessage("");
    try {
      await createProject(payload);
      setCreateModalOpen(false);
    } catch (error) {
      setErrorMessage(error && error.message ? error.message : "Error cargando datos");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={pageStyles.root} data-testid="projects-root">
      <div>
        <h1 className={pageStyles.pageTitle}>Projects - Nexus DevSuite</h1>
        <Breadcrumb items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Projects" }]} />
      </div>

      <LoadingSpinner show={loading} />
      <ErrorBanner message={!loading ? errorMessage : ""} />

      {canCreateProject ? (
        <Modal
          isOpen={createModalOpen}
          onClose={() => {
            if (!saving) setCreateModalOpen(false);
          }}
          title="Nuevo proyecto"
          dialogClassName={pageStyles.createProjectDialog}
          allowBackdropClose={!saving}
          allowEscapeClose={!saving}
        >
          <div data-testid="project-create-modal">
            <FormCreateProject
              embedded
              busy={saving}
              onSubmit={handleCreate}
              onCancel={saving ? undefined : () => setCreateModalOpen(false)}
            />
          </div>
        </Modal>
      ) : null}

      {!loading ? (
        <TableProjects
          projects={projects}
          onOpen={(id) => navigate(`/projects/${id}`)}
          canCreate={canCreateProject}
          onCreateClick={canCreateProject ? () => setCreateModalOpen(true) : undefined}
          onActionError={(msg) => setErrorMessage(msg === "" ? "" : msg || "Error cargando datos")}
          onSuccessMessage={showSuccess}
          onRefreshProjects={refreshProjects}
          isMaster={isMaster}
        />
      ) : null}
    </div>
  );
}
