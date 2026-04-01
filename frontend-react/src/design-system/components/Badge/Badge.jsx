import styles from "./Badge.module.css";

const VARIANT_APPEARANCE = {
  success: { light: styles.successLight, solid: styles.successSolid },
  warning: { light: styles.warningLight, solid: styles.warningSolid },
  danger: { light: styles.dangerLight, solid: styles.dangerSolid },
  neutral: { light: styles.neutralLight, solid: styles.neutralSolid },
};

/**
 * @param {"success"|"warning"|"danger"|"neutral"} [props.variant]
 * @param {"light"|"solid"} [props.appearance] — light: fondo suave (default); solid: color pleno
 */
export function Badge({ variant = "neutral", appearance = "light", className = "", children, ...rest }) {
  const map = VARIANT_APPEARANCE[variant] || VARIANT_APPEARANCE.neutral;
  const tone = appearance === "solid" ? "solid" : "light";
  const v = map[tone];
  const rootClass = [styles.badge, v, className].filter(Boolean).join(" ");

  return (
    <span className={rootClass} {...rest}>
      {children}
    </span>
  );
}
