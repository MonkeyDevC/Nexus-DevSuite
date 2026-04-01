import { forwardRef, useId } from "react";
import styles from "./Input.module.css";

/**
 * Input base del design system.
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.message] — texto de ayuda o error
 * @param {boolean} [props.error]
 * @param {boolean} [props.success] — borde y mensaje de éxito (no combinar con error: prevalece error)
 * @param {boolean} [props.disabled]
 * @param {string} [props.className]
 * @param {string} [props.id]
 */
export const Input = forwardRef(function Input(
  { label, message, error = false, success = false, disabled = false, className = "", id: idProp, ...rest },
  ref
) {
  const uid = useId();
  const id = idProp || `ds-input-${uid}`;
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
      <input
        ref={ref}
        id={id}
        className={fieldClass}
        disabled={disabled}
        aria-invalid={error || undefined}
        {...rest}
      />
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
