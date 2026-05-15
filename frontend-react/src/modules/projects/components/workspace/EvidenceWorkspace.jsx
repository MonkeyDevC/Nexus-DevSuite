/**
 * Evidencia: modos editor / preview / split. Preview = texto escapado + pre-wrap (sin librería Markdown).
 * Contenido enlazado a draftData.evidence_markdown vía props.
 */
import { useId, useState } from "react";
import { Textarea } from "../../../../design-system/components/Textarea/Textarea.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import { escapeHtmlForEvidencePreview } from "./evidencePreviewUtils.js";
import styles from "./EvidenceWorkspace.module.css";

const MODE_EDITOR = "editor";
const MODE_PREVIEW = "preview";
const MODE_SPLIT = "split";

export default function EvidenceWorkspace({ value, onChange, disabled = false }) {
  const baseId = useId();
  const [mode, setMode] = useState(MODE_SPLIT);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewHtml = escapeHtmlForEvidencePreview(value);
  const isEmpty = String(value || "").trim() === "";

  const shellClass = [styles.shell, isFullscreen ? styles.shellFullscreen : ""].filter(Boolean).join(" ");

  return (
    <div className={shellClass} data-testid="project-evidence-workspace">
      <div className={styles.toolbar}>
        <div className={styles.modeGroup} role="group" aria-label="Modo de evidencia">
          <Button
            type="button"
            variant={mode === MODE_EDITOR ? "primary" : "outline"}
            onClick={() => setMode(MODE_EDITOR)}
            disabled={disabled}
          >
            Editor
          </Button>
          <Button
            type="button"
            variant={mode === MODE_PREVIEW ? "primary" : "outline"}
            onClick={() => setMode(MODE_PREVIEW)}
            disabled={disabled}
          >
            Vista previa
          </Button>
          <Button
            type="button"
            variant={mode === MODE_SPLIT ? "primary" : "outline"}
            onClick={() => setMode(MODE_SPLIT)}
            disabled={disabled}
          >
            Dividido
          </Button>
        </div>
        <Button type="button" variant="ghost" onClick={() => setIsFullscreen((v) => !v)}>
          {isFullscreen ? "Salir pantalla completa" : "Pantalla completa"}
        </Button>
      </div>

      {mode === MODE_EDITOR ? (
        <Textarea
          id={`${baseId}-evidence`}
          label="Notas de evidencia"
          rows={12}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      ) : null}

      {mode === MODE_PREVIEW ? (
        <div className={styles.previewWrap} aria-label="Vista previa de evidencia">
          {isEmpty ? (
            <p className={styles.empty}>Sin notas de evidencia.</p>
          ) : (
            <pre className={styles.previewPre} dangerouslySetInnerHTML={{ __html: previewHtml }} />
          )}
        </div>
      ) : null}

      {mode === MODE_SPLIT ? (
        <div className={styles.split}>
          <div className={styles.splitPane}>
            <Textarea
              id={`${baseId}-evidence-split`}
              label="Edición"
              rows={10}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className={styles.splitPane} aria-label="Vista previa">
            {isEmpty ? (
              <p className={styles.empty}>Sin contenido para previsualizar.</p>
            ) : (
              <pre className={styles.previewPre} dangerouslySetInnerHTML={{ __html: previewHtml }} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
