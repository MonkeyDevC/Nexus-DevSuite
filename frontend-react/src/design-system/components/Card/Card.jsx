import styles from "./Card.module.css";

const PADDING = {
  default: styles.paddingDefault,
  compact: styles.paddingCompact,
  spacious: styles.paddingSpacious,
};

/**
 * Contenedor tipo card reutilizable.
 * @param {"default"|"compact"|"spacious"|"none"} [props.padding]
 */
export function Card({ padding = "default", className = "", children, ...rest }) {
  const pad = padding === "none" ? "" : PADDING[padding] || PADDING.default;
  const rootClass = [styles.card, pad, className].filter(Boolean).join(" ");

  return (
    <div className={rootClass} {...rest}>
      {children}
    </div>
  );
}
