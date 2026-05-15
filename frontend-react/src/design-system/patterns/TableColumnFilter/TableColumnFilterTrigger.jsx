import styles from "./TableColumnFilter.module.css";

/**
 * Botón discreto para abrir el menú de filtro de columna (estilo Excel / grid).
 * @param {object} props
 * @param {boolean} props.isActive — hay un valor distinto de “todas”
 * @param {boolean} props.open
 * @param {() => void} props.onToggle
 * @param {boolean} [props.disabled]
 * @param {string} props.ariaLabel
 * @param {string} [props.ariaControlsId]
 * @param {string} [props.testId]
 */
export function TableColumnFilterTrigger({
  isActive,
  open,
  onToggle,
  disabled = false,
  ariaLabel,
  ariaControlsId,
  testId,
}) {
  return (
    <span className={styles.triggerWrap}>
      <button
        type="button"
        className={[styles.trigger, isActive ? styles.triggerActive : ""].filter(Boolean).join(" ")}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={ariaControlsId}
        data-testid={testId}
      >
        <span aria-hidden>▾</span>
      </button>
      {isActive ? <span className={styles.triggerDot} aria-hidden /> : null}
    </span>
  );
}
