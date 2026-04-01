/**
 * Pestaña Evidencia: edita solo `draftData.evidence_markdown` (sin persistencia propia).
 */
import { useCallback, useState } from "react";
import EvidenceStudio from "../evidence-studio/EvidenceStudio.jsx";
import styles from "./ProjectEvidenceTab.module.css";

export default function ProjectEvidenceTab({
  evidenceMarkdown,
  onDraftPatch,
  canEdit,
  disabled = false,
  isDirty = false,
  projectId = "",
  featureId = "",
  storyId = "",
  evidenceHistoryResetKey = "",
  workspaceFooterActions = null,
}) {
  const block = !canEdit || disabled;
  const [imageError, setImageError] = useState("");

  const onImageUploadError = useCallback((message) => {
    setImageError(message ? String(message) : "Error al subir la imagen");
  }, []);

  return (
    <div className={styles.root} data-testid="project-detail-tab-evidencia">
      {!canEdit ? <p className={styles.note}>No tiene permiso para editar evidencia del proyecto.</p> : null}
      {imageError ? (
        <p className={styles.uploadError} role="alert">
          {imageError}{" "}
          <button type="button" className={styles.dismissError} onClick={() => setImageError("")}>
            Cerrar
          </button>
        </p>
      ) : null}
      <EvidenceStudio
        value={evidenceMarkdown ?? ""}
        onChange={(next) => onDraftPatch({ evidence_markdown: next })}
        disabled={block}
        isDirty={Boolean(canEdit && !disabled && isDirty)}
        projectId={projectId}
        featureId={featureId}
        storyId={storyId}
        historyResetKey={evidenceHistoryResetKey}
        onImageUploadError={onImageUploadError}
        workspaceFooterActions={workspaceFooterActions}
      />
    </div>
  );
}
