/**
 * Pie mínimo: solo aviso de solo lectura si aplica. Estado de guardado: icono en la barra de herramientas.
 */
import styles from "./EvidenceStudioFooter.module.css";

export default function EvidenceStudioFooter({ readOnly }) {
  if (!readOnly) return null;
  return (
    <footer className={styles.footer} data-testid="evidence-studio-footer">
      <span className={styles.hint}>Vista de solo lectura en el editor.</span>
    </footer>
  );
}
