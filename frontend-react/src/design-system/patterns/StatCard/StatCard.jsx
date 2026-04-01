import styles from "./StatCard.module.css";

const VARIANT_ROOT = {
  neutral: styles.rootNeutral,
  primary: styles.rootPrimary,
  success: styles.rootSuccess,
  warning: styles.rootWarning,
  danger: styles.rootDanger,
};

const VARIANT_ICON = {
  neutral: "",
  primary: styles.iconWrapPrimary,
  success: styles.iconWrapSuccess,
  warning: "",
  danger: "",
};

/**
 * Tarjeta métrica / KPI para dashboards y reportes.
 * @param {"neutral"|"primary"|"success"|"warning"|"danger"} [props.variant]
 * @param {boolean} [props.motion] — entrada escalonada + hover “elevado” (p. ej. dashboard).
 * @param {number} [props.revealIndex] — índice para retardo de aparición cuando `motion` es true.
 */
export function StatCard({
  label,
  value,
  hint,
  variant = "neutral",
  icon,
  className = "",
  motion = false,
  revealIndex = 0,
  style,
  ...rest
}) {
  const vRoot = VARIANT_ROOT[variant] || VARIANT_ROOT.neutral;
  const vIcon = VARIANT_ICON[variant] || "";
  const motionClass = motion ? styles.rootMotion : "";
  const delaySec = 0.04 + Math.max(0, Number(revealIndex) || 0) * 0.078;
  const mergedStyle =
    motion ? { ...(style || {}), "--stat-reveal-delay": `${delaySec}s` } : style;

  return (
    <div
      className={[styles.root, vRoot, motionClass, className].filter(Boolean).join(" ")}
      style={mergedStyle}
      {...rest}
    >
      <div className={styles.topRow}>
        <span className={styles.label}>{label}</span>
        {icon ? <span className={[styles.iconWrap, vIcon].filter(Boolean).join(" ")}>{icon}</span> : null}
      </div>
      <span className={styles.value}>{value}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}

/**
 * Contenedor en grid para varias StatCard.
 */
export function StatCardGrid({ children, className = "", ...rest }) {
  return (
    <div className={[styles.grid, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}
