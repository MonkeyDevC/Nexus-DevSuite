/**
 * Backlog de historias dentro del overlay de feature (misma idea que ProjectBacklogTab).
 */
import { useMemo, useState } from "react";
import BacklogFeaturesToolbar from "./BacklogFeaturesToolbar.jsx";
import BacklogStoriesTable from "./BacklogStoriesTable.jsx";

function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

export default function FeatureStoriesBacklogTab({
  stories,
  loading,
  errorMessage,
  onRefresh,
  onOpenStory,
  interactionDisabled = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(searchQuery);
    return (Array.isArray(stories) ? stories : []).filter((row) => {
      if (statusFilter && String(row.status || "") !== statusFilter) return false;
      if (!q) return true;
      const title = normalize(row.title);
      const code =
        row.number != null && Number.isFinite(Number(row.number))
          ? `us${Number(row.number)}`
          : normalize(row.id).slice(0, 8);
      return title.includes(q) || code.includes(q);
    });
  }, [stories, searchQuery, statusFilter]);

  return (
    <div data-testid="feature-overlay-tab-backlog">
      <BacklogFeaturesToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onRefresh={onRefresh}
        loading={loading}
      />

      {loading ? <p style={{ color: "var(--ds-color-text-muted)", fontSize: "var(--ds-font-size-sm)" }}>Cargando historias…</p> : null}
      {errorMessage ? (
        <div
          role="alert"
          style={{
            padding: "var(--ds-space-3)",
            borderRadius: "var(--ds-radius-md)",
            background: "var(--ds-color-danger-muted)",
            fontSize: "var(--ds-font-size-sm)",
          }}
        >
          {errorMessage}
        </div>
      ) : null}

      {!loading && !errorMessage && (!stories || stories.length === 0) ? (
        <p style={{ color: "var(--ds-color-text-muted)", fontSize: "var(--ds-font-size-sm)" }}>No hay historias en esta feature.</p>
      ) : null}

      {!loading && !errorMessage && stories && stories.length > 0 ? (
        <BacklogStoriesTable rows={filtered} onOpenStory={onOpenStory} interactionDisabled={interactionDisabled} />
      ) : null}
    </div>
  );
}
