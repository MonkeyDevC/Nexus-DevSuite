/**
 * Barra superior única: marca + modo vista + estado + pantalla completa (sin ajustes).
 */
import { Maximize2, Minimize2, SquarePen, X } from "lucide-react";
import { Button } from "../../design-system/components/Button/Button.jsx";
import EvidenceModeSwitch from "./EvidenceModeSwitch.jsx";
import EvidenceToolbarGroup from "./EvidenceToolbarGroup.jsx";
import styles from "./EvidenceMainToolbar.module.css";

function EvidenceDirtyStatusIcon({ isDirty, readOnly }) {
  if (readOnly) {
    return (
      <span className={styles.saveStatus} title="Solo lectura" aria-label="Solo lectura" role="status">
        <SquarePen size={18} className={styles.saveStatusReadonly} aria-hidden />
      </span>
    );
  }
  if (isDirty) {
    return (
      <span
        className={styles.saveStatus}
        title="Cambios sin guardar"
        aria-label="Cambios sin guardar"
        role="status"
      >
        <SquarePen size={18} className={styles.saveStatusDirty} aria-hidden />
      </span>
    );
  }
  return (
    <span
      className={styles.saveStatus}
      title="Todos los cambios guardados"
      aria-label="Todos los cambios guardados"
      role="status"
    >
      <SquarePen size={18} className={styles.saveStatusClean} aria-hidden />
    </span>
  );
}

export default function EvidenceMainToolbar({
  mode,
  onModeChange,
  modeSwitchIds,
  modeSwitchDisabled = false,
  isDirty = false,
  readOnly = false,
  isFullscreen,
  onToggleFullscreen,
  onExitFullscreen,
}) {
  const { tabListId, getTabId, getPanelId } = modeSwitchIds;

  return (
    <div className={styles.toolbar} data-testid="evidence-main-toolbar">
      <div className={styles.toolbarLead}>
        <span className={styles.brandTitle}>Evidence Studio</span>
        <span className={styles.brandSubtitle}>Documenta evidencia técnica e implementación</span>
      </div>

      <div className={styles.toolbarTrailing}>
        <EvidenceToolbarGroup label="Vista">
          <EvidenceModeSwitch
            mode={mode}
            onModeChange={onModeChange}
            disabled={modeSwitchDisabled}
            tabListId={tabListId}
            getTabId={getTabId}
            getPanelId={getPanelId}
          />
        </EvidenceToolbarGroup>
        <EvidenceToolbarGroup label="Estado">
          <EvidenceDirtyStatusIcon isDirty={isDirty} readOnly={readOnly} />
        </EvidenceToolbarGroup>
        <div className={styles.fullscreenSlot}>
          <Button
            type="button"
            variant="ghost"
            className={styles.iconBtn}
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize2 size={18} aria-hidden /> : <Maximize2 size={18} aria-hidden />}
          </Button>
          {isFullscreen ? (
            <Button
              type="button"
              variant="ghost"
              className={styles.iconBtn}
              onClick={onExitFullscreen}
              title="Cerrar vista pantalla completa"
              aria-label="Cerrar pantalla completa"
            >
              <X size={18} aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
