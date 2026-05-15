/**
 * Pestaña Evidencia: modo proyecto = agregado solo lectura (features + historias).
 * Modo feature/historia = edición local con guardado en su entidad (padre).
 */
import { useCallback, useState } from "react";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
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
  /** Vista proyecto: markdown compilado, sin edición ni subida */
  readOnlyAggregate = false,
  aggregateLoading = false,
  aggregateError = "",
  onRefreshAggregate = null,
}) {
  const block = !canEdit || disabled;
  const [imageError, setImageError] = useState("");

  const onImageUploadError = useCallback((message) => {
    setImageError(message ? String(message) : "Error al subir la imagen");
  }, []);

  const noopDraft = useCallback(() => {}, []);

  const editable = !readOnlyAggregate;
  const studioDisabled = readOnlyAggregate || block;
  const studioValue = evidenceMarkdown ?? "";
  const studioOnChange = editable
    ? (next) => onDraftPatch({ evidence_markdown: next })
    : noopDraft;
  const studioIsDirty = Boolean(editable && canEdit && !disabled && isDirty);
  const showEvidenceStudio = !readOnlyAggregate || !aggregateLoading;

  return (
    <div className={styles.root} data-testid="project-detail-tab-evidencia">
      {readOnlyAggregate ? (
        <div className={styles.aggregateNotice}>
          <p className={styles.aggregateHelp}>
            Vista de solo lectura: la evidencia se edita en cada feature o historia del backlog. Este resumen agrupa
            todo por feature y sus historias asociadas.
          </p>
          <div className={styles.aggregateToolbar}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={aggregateLoading || typeof onRefreshAggregate !== "function"}
              onClick={onRefreshAggregate}
            >
              Actualizar vista
            </Button>
          </div>
        </div>
      ) : null}
      {!canEdit && !readOnlyAggregate ? (
        <p className={styles.note}>No tiene permiso para editar evidencia del proyecto.</p>
      ) : null}
      {aggregateError ? (
        <p className={styles.aggregateError} role="alert">
          {aggregateError}{" "}
          {typeof onRefreshAggregate === "function" ? (
            <button type="button" className={styles.dismissError} onClick={onRefreshAggregate}>
              Reintentar
            </button>
          ) : null}
        </p>
      ) : null}
      {aggregateLoading && readOnlyAggregate ? (
        <p className={styles.aggregateLoading}>Cargando evidencia agrupada…</p>
      ) : null}
      {showEvidenceStudio ? (
        <>
          {!readOnlyAggregate && imageError ? (
            <p className={styles.uploadError} role="alert">
              {imageError}{" "}
              <button type="button" className={styles.dismissError} onClick={() => setImageError("")}>
                Cerrar
              </button>
            </p>
          ) : null}
          <EvidenceStudio
            value={studioValue}
            onChange={studioOnChange}
            disabled={studioDisabled}
            isDirty={studioIsDirty}
            projectId={readOnlyAggregate ? "" : projectId}
            featureId={featureId}
            storyId={storyId}
            historyResetKey={evidenceHistoryResetKey}
            onImageUploadError={readOnlyAggregate ? undefined : onImageUploadError}
            workspaceFooterActions={workspaceFooterActions}
            previewOnly={readOnlyAggregate}
          />
        </>
      ) : null}
    </div>
  );
}
