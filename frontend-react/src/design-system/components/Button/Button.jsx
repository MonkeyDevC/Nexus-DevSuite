import styles from "./Button.module.css";

const VARIANT_CLASS = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  danger: styles.danger,
  outline: styles.outline,
  link: styles.link,
};

/**
 * Botón base del design system. Sin lógica de dominio.
 * @param {object} props
 * @param {"button"|"submit"|"reset"} [props.type]
 * @param {"primary"|"secondary"|"ghost"|"danger"|"outline"|"link"} [props.variant]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.loading]
 * @param {boolean} [props.fullWidth]
 * @param {string} [props.className]
 * @param {import("react").ReactNode} [props.children]
 * @param {import("react").ButtonHTMLAttributes<HTMLButtonElement>["onClick"]} [props.onClick]
 */
export function Button({
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  fullWidth = false,
  className = "",
  children,
  onClick,
  ...rest
}) {
  const v = VARIANT_CLASS[variant] || VARIANT_CLASS.primary;
  const isDisabled = disabled || loading;
  const rootClass = [
    styles.button,
    v,
    fullWidth ? styles.fullWidth : "",
    isDisabled ? styles.buttonDisabled : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={rootClass}
      disabled={isDisabled}
      onClick={loading ? undefined : onClick}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden /> : null}
      {children}
    </button>
  );
}
