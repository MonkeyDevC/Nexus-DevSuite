/**
 * Vista previa: solo lectura, render seguro (sin edición ni parseo en UI del editor).
 */
import { MarkdownDocument } from "./markdown/renderMarkdownDocument.jsx";
import styles from "./EvidencePreviewPane.module.css";

export default function EvidencePreviewPane({ value, emphasizeHeadingHierarchy = false }) {
  const raw = value == null ? "" : String(value);
  const isEmpty = raw.trim() === "";

  return (
    <div className={styles.previewShell} data-testid="evidence-preview-pane">
      {isEmpty ? (
        <p className={styles.previewEmpty}>Sin contenido para previsualizar.</p>
      ) : (
        <MarkdownDocument
          value={raw}
          idPrefix="ev-prev"
          emphasizeHeadingHierarchy={emphasizeHeadingHierarchy}
        />
      )}
    </div>
  );
}
