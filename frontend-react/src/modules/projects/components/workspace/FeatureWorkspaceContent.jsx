import { Badge } from "../../../../design-system/components/Badge/Badge.jsx";
import { mapStoryStatusToDsBadgeVariant } from "../../../../shared/wave1/wave1DsMappers.js";
import {
  OVERLAY_WORKSPACE_TAB_DETAIL,
  overlayFeaturePanelDomId,
  overlayFeatureTabDomId,
} from "./overlayWorkspaceConstants.js";
import { formatFeatureHumanId } from "../../../../shared/workspace/workItemHumanIds.js";
import styles from "./FeatureWorkspaceContent.module.css";

export function featureCodeDisplay(feature) {
  if (!feature) return "—";
  const code = formatFeatureHumanId(feature.number != null ? Number(feature.number) : null);
  if (code) return code;
  const id = feature.id != null ? String(feature.id) : "";
  return id ? `FT-${id.slice(0, 8)}` : "—";
}

/**
 * Cuerpo del workspace de feature (sin shell; scroll lo envuelve DetailWorkspaceShell).
 */
export default function FeatureWorkspaceContent({ feature, stories, loading, error, onOpenStory, blockStoryOpen }) {
  if (loading) {
    return <div className={styles.state}>Cargando feature…</div>;
  }
  if (error) {
    return (
      <div className={styles.error} role="alert">
        {error}
      </div>
    );
  }
  if (!feature) {
    return null;
  }

  const panelId = overlayFeaturePanelDomId(OVERLAY_WORKSPACE_TAB_DETAIL);

  return (
    <div role="tabpanel" id={panelId} aria-labelledby={overlayFeatureTabDomId(OVERLAY_WORKSPACE_TAB_DETAIL)}>
      <p className={styles.sectionLabel}>Descripción</p>
      <p className={styles.bodyText}>{feature.description?.trim() ? feature.description : "—"}</p>

      <p className={styles.sectionLabel}>Progreso</p>
      <div className={styles.progressTrack} aria-hidden>
        <div
          className={styles.progressBar}
          style={{ width: `${Math.min(100, Math.max(0, feature.progress_pct ?? 0))}%` }}
        />
      </div>
      <p className={styles.progressHint}>{Math.min(100, Math.max(0, feature.progress_pct ?? 0))}%</p>

      <p className={styles.sectionLabel}>Historias de usuario</p>
      {!stories?.length ? <p className={styles.muted}>Sin historias.</p> : null}
      {(stories || []).map((s) => (
        <button
          key={s.id}
          type="button"
          className={styles.storyRow}
          onClick={() => onOpenStory(s.id)}
          disabled={blockStoryOpen}
          data-testid={`project-overlay-open-story-${String(s.id).slice(0, 8)}`}
        >
          <span>{s.title?.trim() ? s.title : "—"}</span>
          <Badge variant={mapStoryStatusToDsBadgeVariant(s.status)}>{s.status}</Badge>
        </button>
      ))}
    </div>
  );
}
