/**
 * Evidence Studio V2: composición, modo, fullscreen, historial, pegado de imagen.
 */
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { Button } from "../../design-system/components/Button/Button.jsx";
import EvidenceEditorPane from "./EvidenceEditorPane.jsx";
import EvidenceMainToolbar from "./EvidenceMainToolbar.jsx";
import EvidencePreviewPane from "./EvidencePreviewPane.jsx";
import EvidenceStudioFooter from "./EvidenceStudioFooter.jsx";
import { applyMarkdownToolbarAction } from "./evidenceMarkdownTransforms.js";
import { uploadProjectEvidenceImage } from "../../services/evidenceUploadService.js";
import { useEvidenceMarkdownHistory } from "./useEvidenceMarkdownHistory.js";
import styles from "./EvidenceStudio.module.css";

/**
 * @param {object} [props.workspaceFooterActions]
 * @param {() => void} props.workspaceFooterActions.onCancel
 * @param {() => void} props.workspaceFooterActions.onSave
 * @param {boolean} props.workspaceFooterActions.saveDisabled
 * @param {boolean} props.workspaceFooterActions.cancelDisabled
 * @param {boolean} props.workspaceFooterActions.isSaving
 */
export default function EvidenceStudio({
  value,
  onChange,
  disabled = false,
  isDirty = false,
  projectId = "",
  featureId = "",
  storyId = "",
  historyResetKey = "",
  onImageUploadError,
  workspaceFooterActions = null,
}) {
  const editorRef = useRef(null);
  const reactId = useId();
  const uid = useMemo(() => String(reactId).replace(/:/g, ""), [reactId]);
  const editorTextareaId = `evidence-studio-editor-${uid}`;

  const tabListId = `ev-studio-tablist-${uid}`;
  const getTabId = useCallback((m) => `ev-studio-tab-${m}-${uid}`, [uid]);
  const getPanelId = useCallback((m) => `ev-studio-panel-${m}-${uid}`, [uid]);

  const modeSwitchIds = useMemo(() => ({ tabListId, getTabId, getPanelId }), [tabListId, getTabId, getPanelId]);

  const [mode, setMode] = useState("split");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hist = useEvidenceMarkdownHistory(value, onChange, historyResetKey);

  const uploadImageFile = useCallback(
    async (file) => {
      if (!projectId || typeof projectId !== "string") {
        throw new Error("No hay proyecto para guardar la imagen");
      }
      return uploadProjectEvidenceImage(projectId, file, {
        featureId: featureId || undefined,
        storyId: storyId || undefined,
      });
    },
    [projectId, featureId, storyId],
  );

  const formatDisabled = disabled || mode === "preview";

  const handleToolbarAction = useCallback(
    (action) => {
      if (formatDisabled) return;
      const ed = editorRef.current?.getState?.();
      if (!ed) return;
      const scrollTop = editorRef.current?.getScrollTop?.() ?? 0;
      hist.prepareDiscreteMutation();
      const applied = applyMarkdownToolbarAction(action, ed.text, ed.selStart, ed.selEnd);
      if (!applied) return;
      hist.applyDiscrete(applied.next);
      requestAnimationFrame(() => {
        editorRef.current?.setSelectionRange?.(applied.start, applied.end, scrollTop);
      });
    },
    [formatDisabled, hist],
  );

  const readOnlyFooter = disabled;
  const shellClass = [styles.shell, isFullscreen ? styles.shellFullscreen : ""].filter(Boolean).join(" ");

  const editorPasteProps = {
    prepareDiscreteMutation: hist.prepareDiscreteMutation,
    applyDiscrete: hist.applyDiscrete,
    onUndo: disabled ? undefined : hist.undo,
    onRedo: disabled ? undefined : hist.redo,
    onImageUploadError,
    uploadImageFile: !disabled && projectId ? uploadImageFile : undefined,
  };

  const showWorkspaceFooter =
    isFullscreen &&
    workspaceFooterActions &&
    typeof workspaceFooterActions.onCancel === "function" &&
    typeof workspaceFooterActions.onSave === "function";

  const editorPaneProps = {
    ref: editorRef,
    id: editorTextareaId,
    value,
    onChange: hist.onEditorChange,
    disabled,
    formatDisabled,
    onFormatAction: handleToolbarAction,
    ...editorPasteProps,
  };

  return (
    <div className={shellClass} data-testid="evidence-studio-root">
      <EvidenceMainToolbar
        mode={mode}
        onModeChange={setMode}
        modeSwitchIds={modeSwitchIds}
        modeSwitchDisabled={disabled}
        isDirty={isDirty}
        readOnly={disabled}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((v) => !v)}
        onExitFullscreen={() => setIsFullscreen(false)}
      />

      <div className={styles.body}>
        <div
          id={getPanelId("editor")}
          role="tabpanel"
          className={styles.tabPanel}
          hidden={mode !== "editor"}
          aria-labelledby={getTabId("editor")}
        >
          {mode === "editor" ? <EvidenceEditorPane {...editorPaneProps} /> : null}
        </div>

        <div
          id={getPanelId("preview")}
          role="tabpanel"
          className={styles.tabPanel}
          hidden={mode !== "preview"}
          aria-labelledby={getTabId("preview")}
        >
          {mode === "preview" ? <EvidencePreviewPane value={value} /> : null}
        </div>

        <div
          id={getPanelId("split")}
          role="tabpanel"
          className={styles.tabPanel}
          hidden={mode !== "split"}
          aria-labelledby={getTabId("split")}
        >
          {mode === "split" ? (
            <div className={styles.split}>
              <div className={styles.splitPane}>
                <EvidenceEditorPane {...editorPaneProps} />
              </div>
              <div className={styles.splitPane}>
                <EvidencePreviewPane value={value} />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {showWorkspaceFooter ? (
        <div className={styles.fullscreenWorkspaceFooter}>
          <Button
            variant="outline"
            type="button"
            onClick={workspaceFooterActions.onCancel}
            disabled={workspaceFooterActions.cancelDisabled || workspaceFooterActions.isSaving}
            data-testid="evidence-fullscreen-cancel"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={workspaceFooterActions.onSave}
            disabled={workspaceFooterActions.saveDisabled}
            aria-busy={workspaceFooterActions.isSaving}
            data-testid="evidence-fullscreen-save"
          >
            {workspaceFooterActions.isSaving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      ) : null}

      <EvidenceStudioFooter readOnly={readOnlyFooter} />
    </div>
  );
}
