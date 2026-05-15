/**
 * Pie mínimo: solo aviso de solo lectura si aplica. Estado de guardado: icono en la barra de herramientas.
 */
import styles from "./EvidenceStudioFooter.module.css";

export default function EvidenceStudioFooter({ readOnly, previewOnly = false }) {
  if (!readOnly) return null;
  return (
    <footer className={styles.footer} data-testid="evidence-studio-footer">
      <span className={styles.hint}>
        {previewOnly ? "Solo vista previa; no hay modo edición en esta vista." : "Vista de solo lectura en el editor."}
      </span>
    </footer>
  );
}
