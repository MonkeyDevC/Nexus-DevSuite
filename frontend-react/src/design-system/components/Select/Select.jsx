import { forwardRef, useId } from "react";
import styles from "./Select.module.css";

/**
 * Select nativo alineado al Input del DS.
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.message]
 * @param {boolean} [props.error]
 * @param {boolean} [props.success]
 * @param {boolean} [props.disabled]
 * @param {import("react").ReactNode} [props.children] — elementos option
 */
export const Select = forwardRef(function Select(
  { label, message, error = false, success = false, disabled = false, className = "", id: idProp, children, ...rest },
  ref,
) {
  const uid = useId();
  const id = idProp || `ds-select-${uid}`;
  const showSuccess = Boolean(success) && !error;
  const fieldClass = [
    styles.field,
    error ? styles.fieldError : "",
    showSuccess ? styles.fieldSuccess : "",
    disabled ? styles.fieldDisabled : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const messageToneClass = error
    ? styles.messageError
    : showSuccess
      ? styles.messageSuccess
      : styles.messageHelp;

  return (
    <div className={styles.wrapper}>
      {label ? (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <select ref={ref} id={id} className={fieldClass} disabled={disabled} aria-invalid={error || undefined} {...rest}>
        {children}
      </select>
      {message ? (
        <span
          className={[styles.messageBase, messageToneClass].join(" ")}
          role={error ? "alert" : undefined}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
});
