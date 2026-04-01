/**
 * Editor de detalle para un criterio: controlado, sin lógica de arrays ni índices.
 */
import { Textarea } from "../../design-system/components/Textarea/Textarea.jsx";
import { Button } from "../../design-system/components/Button/Button.jsx";
import styles from "./CriteriaEditor.module.css";

const PLACEHOLDER = "Escribe el criterio aquí...";

export default function CriteriaEditor({
  value,
  disabled,
  hasUnsavedChanges,
  onValueChange,
  onSave,
  onCancel,
}) {
  return (
    <div className={styles.root} data-testid="criteria-editor">
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleRow}>
          <h3 className={styles.panelTitle}>Editar criterio</h3>
          {hasUnsavedChanges ? (
            <span className={styles.unsavedBadge} aria-live="polite">
              Sin guardar
            </span>
          ) : null}
        </div>
      </div>
      <div className={styles.panelDivider} aria-hidden />

      <div className={styles.panelBody}>
        <div className={styles.textareaWrap}>
          <Textarea
            label="Contenido"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={disabled}
            placeholder={PLACEHOLDER}
            className={styles.textarea}
            rows={8}
          />
        </div>
      </div>

      <div className={styles.panelFooter}>
        <Button type="button" variant="primary" onClick={onSave} disabled={disabled || !hasUnsavedChanges}>
          Guardar cambios
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={disabled || !hasUnsavedChanges}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
