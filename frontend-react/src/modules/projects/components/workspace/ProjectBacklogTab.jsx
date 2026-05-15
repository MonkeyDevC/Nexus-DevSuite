/**
 * Backlog de features del proyecto: filtro local + apertura de overlay (con dirty gate en el padre).
 */
import { useMemo, useState } from "react";
import BacklogFeaturesToolbar from "./BacklogFeaturesToolbar.jsx";
import BacklogFeaturesTable from "./BacklogFeaturesTable.jsx";
import styles from "./ProjectBacklogTab.module.css";

function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

export default function ProjectBacklogTab({
  features,
  loading,
  errorMessage,
  onRefresh,
  onRequestOpenFeature,
  onRequestOpenFeatureEdit,
  onFeatureRemovedFromBacklog,
  canWriteFeature = false,
  onRequestCreateFeature,
  interactionDisabled = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(searchQuery);
    return (Array.isArray(features) ? features : []).filter((row) => {
      if (statusFilter && String(row.status || "") !== statusFilter) return false;
      if (priorityFilter && String(row.priority || "") !== priorityFilter) return false;
      if (!q) return true;
      const title = normalize(row.title);
      const code =
        row.number != null && Number.isFinite(Number(row.number))
          ? `f${Number(row.number)}`
          : normalize(row.id).slice(0, 8);
      return title.includes(q) || code.includes(q);
    });
  }, [features, searchQuery, statusFilter, priorityFilter]);

  const priorityOptions = useMemo(() => {
    const set = new Set();
    (Array.isArray(features) ? features : []).forEach((f) => {
      if (f && f.priority != null && String(f.priority).trim()) set.add(String(f.priority));
    });
    return Array.from(set).sort();
  }, [features]);

  return (
    <div className={styles.root} data-testid="project-detail-tab-backlog">
      <BacklogFeaturesToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        priorityOptions={priorityOptions}
        onRefresh={onRefresh}
        onCreateFeature={onRequestCreateFeature}
        loading={loading}
      />

      <div className={styles.summaryRow} aria-hidden>
        {Array.isArray(features) && Array.isArray(filtered)
          ? `Showing 1-${filtered.length} of ${features.length} features`
          : ""}
      </div>

      {loading ? <p className={styles.stateText}>Cargando backlog…</p> : null}
      {errorMessage ? (
        <div role="alert" className={styles.errorBox}>
          {errorMessage}
        </div>
      ) : null}

      {!loading && !errorMessage && (!features || features.length === 0) ? (
        <p className={styles.stateText}>No hay features en este proyecto.</p>
      ) : null}

      {!loading && !errorMessage && Array.isArray(features) && features.length > 0 ? (
        <BacklogFeaturesTable
          rows={filtered}
          onOpenFeature={onRequestOpenFeature}
          onOpenFeatureEdit={onRequestOpenFeatureEdit}
          onRefresh={onRefresh}
          onFeatureRemovedFromBacklog={onFeatureRemovedFromBacklog}
          canWriteFeature={canWriteFeature}
          interactionDisabled={interactionDisabled}
        />
      ) : null}
    </div>
  );
}
