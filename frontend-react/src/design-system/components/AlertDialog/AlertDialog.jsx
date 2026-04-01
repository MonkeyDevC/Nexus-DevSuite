/**
 * AlertDialog (DS): confirm/alert con icono + descripción + acciones.
 * Basado en Modal DS (overlay + foco). Sin librerías externas.
 *
 * Iconos: color explícito en JSX + refuerzo de `style` para anclar `color` usado por `currentColor` en paths.
 *
 * Causa raíz documentada: `lucide-react` marca todo SVG con la clase global `.lucide`; en páginas que
 * cargan `public/css/design-system.css`, el selector `.lucide` fuerza tamaño/display y puede competir
 * con estilos del módulo; además el legacy afirma trazos vía `stroke: currentColor` en ciertos contextos.
 * El wrapper `data-nexus-ds-alert-icon` permite un override localizado y determinista (ver CSS del módulo).
 */
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle, Info } from "lucide-react";
import Modal from "../Modal/Modal.jsx";
import { Button } from "../Button/Button.jsx";
import styles from "./AlertDialog.module.css";

/** @type {Record<string, import("react").ComponentType<import("lucide-react").LucideProps>>} */
const ICON_BY_TONE = {
  info: Info,
  question: HelpCircle,
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
};

/** Colores explícitos (tokens DS) — visibles en light/dark sin herencia del wrapper. */
const ICON_COLOR_BY_TONE = {
  info: "var(--ds-color-primary)",
  question: "var(--ds-color-primary)",
  error: "var(--ds-color-danger)",
  success: "var(--ds-color-success)",
  warning: "var(--ds-color-warning)",
};

const WRAPPER_CLASS_BY_TONE = {
  info: styles.iconToneInfo,
  question: styles.iconToneQuestion,
  error: styles.iconToneError,
  success: styles.iconToneSuccess,
  warning: styles.iconToneWarning,
};

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {"info"|"question"|"error"|"success"|"warning"} [props.tone]
 * @param {string} props.title
 * @param {string} props.description
 * @param {string} [props.confirmLabel]
 * @param {string} [props.cancelLabel]
 * @param {"primary"|"danger"} [props.confirmVariant]
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 * @param {boolean} [props.busy]
 */
export default function AlertDialog({
  isOpen,
  tone = "info",
  title,
  description,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  busy = false,
}) {
  const Icon = ICON_BY_TONE[tone] || ICON_BY_TONE.info;
  const iconColor = ICON_COLOR_BY_TONE[tone] || ICON_COLOR_BY_TONE.info;
  const iconWrapClass = [styles.iconWrap, WRAPPER_CLASS_BY_TONE[tone] || styles.iconToneInfo].filter(Boolean).join(" ");

  const isConfirmOnly = !cancelLabel;
  const shouldFocusSafe =
    confirmVariant === "danger" && !isConfirmOnly && typeof cancelLabel === "string" && cancelLabel.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      title=""
      onClose={onCancel}
      showCloseButton={false}
      allowBackdropClose={!busy}
      allowEscapeClose={!busy}
      dialogClassName={[styles.dialogWide, styles.alertDialogDialog, "dsDialogMotionIn"].join(" ")}
    >
      <div className={styles.content} role="alertdialog" aria-modal="true" aria-label={title}>
        <div className={styles.topRow}>
          <span className={iconWrapClass} data-nexus-ds-alert-icon="true" aria-hidden>
            <Icon
              size={24}
              strokeWidth={2.4}
              color={iconColor}
              style={{ color: iconColor }}
              className={styles.iconSvg}
              aria-hidden
            />
          </span>
          <div className={styles.textBlock}>
            <p className={styles.title}>{title}</p>
            <p className={styles.description}>{description}</p>
          </div>
        </div>

        <div className={styles.actions}>
          {!isConfirmOnly ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={busy} autoFocus={shouldFocusSafe}>
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy || undefined}
            autoFocus={!shouldFocusSafe}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
