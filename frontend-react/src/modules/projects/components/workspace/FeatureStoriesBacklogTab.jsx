/**
 * Backlog de User Stories **solo de la feature** (overlay / página detalle).
 * No es el Product Backlog global (`/backlog`); no usa `useParams` ni `?project=`.
 * Los datos vienen del padre (`stories` + `onRefresh`); `projectId` / `featureId` son contexto explícito y accesibilidad.
 */
import { useMemo, useState } from "react";
import BacklogFeaturesToolbar from "./BacklogFeaturesToolbar.jsx";
import BacklogStoriesTable from "./BacklogStoriesTable.jsx";
import styles from "./ProjectBacklogTab.module.css";

const STORY_STATUS_OPTIONS = ["DRAFT", "READY", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "ARCHIVED"];

function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

/**
 * @param {object} props
 * @param {string|undefined} props.projectId — UUID del proyecto (contexto; el padre es SSOT).
 * @param {string|undefined} props.featureId — UUID de la feature (contexto; el padre es SSOT).
 */
export default function FeatureStoriesBacklogTab({
  projectId,
  featureId,
  stories,
  loading,
  errorMessage,
  onRefresh,
  onOpenStory,
  onOpenStoryEdit,
  onRequestCreateStory,
  onStoryRemovedFromBacklog,
  canWriteStory = false,
  interactionDisabled = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(searchQuery);
    return (Array.isArray(stories) ? stories : []).filter((row) => {
      if (statusFilter && String(row.status || "") !== statusFilter) return false;
      if (priorityFilter && String(row.priority || "") !== priorityFilter) return false;
      if (!q) return true;
      const title = normalize(row.title);
      const code =
        row.number != null && Number.isFinite(Number(row.number))
          ? `us${Number(row.number)}`
          : normalize(row.id).slice(0, 8);
      return title.includes(q) || code.includes(q);
    });
  }, [stories, searchQuery, statusFilter, priorityFilter]);

  const priorityOptions = useMemo(() => {
    const set = new Set();
    (Array.isArray(stories) ? stories : []).forEach((s) => {
      if (s && s.priority != null && String(s.priority).trim()) set.add(String(s.priority));
    });
    return Array.from(set).sort();
  }, [stories]);

  return (
    <div
      className={styles.root}
      data-testid="feature-overlay-tab-backlog"
      data-project-id={projectId ?? ""}
      data-feature-id={featureId ?? ""}
    >
      <BacklogFeaturesToolbar
        toolbarTestId="feature-backlog-toolbar"
        subtitle="User Stories de la feature"
        searchPlaceholder="Buscar historias (Título, Código)…"
        statusOptions={STORY_STATUS_OPTIONS}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        priorityOptions={priorityOptions}
        onRefresh={onRefresh}
        refreshButtonTestId="feature-backlog-refresh"
        onCreate={onRequestCreateStory}
        createButtonLabel="+ Nueva User Story"
        createButtonTestId="feature-backlog-create-story"
        loading={loading}
      />

      <div className={styles.summaryRow} aria-hidden>
        {Array.isArray(stories) && Array.isArray(filtered)
          ? `Showing 1-${filtered.length} of ${stories.length} historias`
          : ""}
      </div>

      {loading ? <p className={styles.stateText}>Cargando historias…</p> : null}
      {errorMessage ? (
        <div role="alert" className={styles.errorBox}>
          {errorMessage}
        </div>
      ) : null}

      {!loading && !errorMessage && (!stories || stories.length === 0) ? (
        <p className={styles.stateText}>No hay historias en esta feature.</p>
      ) : null}

      {!loading && !errorMessage && Array.isArray(stories) && stories.length > 0 ? (
        <BacklogStoriesTable
          rows={filtered}
          onOpenStory={onOpenStory}
          onOpenStoryEdit={onOpenStoryEdit}
          onRefresh={onRefresh}
          onStoryRemovedFromBacklog={onStoryRemovedFromBacklog}
          canWriteStory={canWriteStory}
          interactionDisabled={interactionDisabled}
        />
      ) : null}
    </div>
  );
}
