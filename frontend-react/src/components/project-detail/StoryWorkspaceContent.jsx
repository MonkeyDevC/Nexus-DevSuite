import {
  OVERLAY_WORKSPACE_TAB_DETAIL,
  overlayStoryPanelDomId,
  overlayStoryTabDomId,
} from "./overlayWorkspaceConstants.js";
import styles from "./StoryWorkspaceContent.module.css";

function criteriaLines(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x ?? "").trim()).filter(Boolean);
  if (typeof raw === "object") return [];
  const s = String(raw).trim();
  return s ? [s] : [];
}

function CriteriaBlock({ label, items }) {
  const list = criteriaLines(items);
  return (
    <>
      <p className={styles.sectionLabel}>{label}</p>
      {list.length === 0 ? <p className={styles.bodyText}>—</p> : null}
      {list.length > 0 ? (
        <ul className={styles.list}>
          {list.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

/**
 * Cuerpo del workspace de historia de usuario.
 */
export default function StoryWorkspaceContent({ story, loading, error }) {
  if (loading) {
    return <div className={styles.state}>Cargando historia…</div>;
  }
  if (error) {
    return (
      <div className={styles.error} role="alert">
        {error}
      </div>
    );
  }
  if (!story) {
    return null;
  }

  const panelId = overlayStoryPanelDomId(OVERLAY_WORKSPACE_TAB_DETAIL);

  return (
    <div role="tabpanel" id={panelId} aria-labelledby={overlayStoryTabDomId(OVERLAY_WORKSPACE_TAB_DETAIL)}>
      <p className={styles.sectionLabel}>Descripción</p>
      <p className={styles.bodyText}>{story.description?.trim() ? story.description : "—"}</p>

      <CriteriaBlock label="Criterios de aceptación" items={story.acceptance_criteria} />
      <CriteriaBlock label="Criterios de implementación" items={story.implementation_criteria} />
    </div>
  );
}
