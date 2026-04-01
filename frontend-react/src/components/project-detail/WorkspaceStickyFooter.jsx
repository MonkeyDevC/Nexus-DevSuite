/**
 * Pie único del workspace: acciones destructivas a la izquierda; Cancelar / Guardar a la derecha.
 * No llama a la API: solo emite eventos.
 */
import { Button } from "../../design-system/components/Button/Button.jsx";

export default function WorkspaceStickyFooter({
  leftActions = null,
  onCancel,
  onSave,
  saveDisabled = true,
  cancelDisabled = false,
  isSaving = false,
  saveErrorMessage = "",
  /** Si se define, muestra bloque de conflicto de versión con acción de recarga */
  onReloadAfterConflict = null,
  canArchive = false,
  canDelete = false,
  onArchive,
  onDelete,
  archiveDisabled = true,
  deleteDisabled = false,
  className = "",
}) {
  return (
    <footer className={className}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ds-space-2)", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ds-space-2)", alignItems: "center" }}>
          {leftActions}
          {canArchive ? (
            <Button variant="secondary" type="button" onClick={onArchive} disabled={archiveDisabled} data-testid="project-archive-btn">
              Archivar
            </Button>
          ) : null}
          {canDelete ? (
            <Button variant="danger" type="button" onClick={onDelete} disabled={deleteDisabled} data-testid="project-delete-btn">
              Eliminar
            </Button>
          ) : null}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ds-space-2)" }}>
          <Button
            variant="outline"
            type="button"
            onClick={onCancel}
            disabled={cancelDisabled || isSaving}
            data-testid="project-workspace-cancel"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            aria-busy={isSaving}
            data-testid="project-workspace-save"
          >
            {isSaving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
      {typeof onReloadAfterConflict === "function" ? (
        <div
          role="alert"
          style={{
            margin: "var(--ds-space-2) 0 0",
            fontSize: "var(--ds-font-size-sm)",
            color: "var(--ds-color-danger)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "var(--ds-space-2)",
          }}
        >
          <span>Conflicto de versión con el servidor. Recargar descarta cambios locales no guardados.</span>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const p = onReloadAfterConflict();
              Promise.resolve(p).catch(() => {});
            }}
            disabled={isSaving}
            data-testid="project-reload-after-conflict"
          >
            Recargar proyecto
          </Button>
        </div>
      ) : null}
      {saveErrorMessage ? (
        <p
          role="alert"
          style={{
            margin: "var(--ds-space-2) 0 0",
            fontSize: "var(--ds-font-size-sm)",
            color: "var(--ds-color-danger)",
          }}
        >
          {saveErrorMessage}
        </p>
      ) : null}
    </footer>
  );
}
