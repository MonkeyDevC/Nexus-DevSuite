import { forwardRef, useId } from "react";
import styles from "./Textarea.module.css";

/**
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.message]
 * @param {boolean} [props.error]
 * @param {boolean} [props.success]
 * @param {boolean} [props.disabled]
 */
export const Textarea = forwardRef(function Textarea(
  { label, message, error = false, success = false, disabled = false, className = "", id: idProp, ...rest },
  ref,
) {
  const uid = useId();
  const id = idProp || `ds-textarea-${uid}`;
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
      <textarea
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
