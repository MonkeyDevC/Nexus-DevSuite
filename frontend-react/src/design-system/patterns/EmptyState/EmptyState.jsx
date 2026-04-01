import styles from "./EmptyState.module.css";

/**
 * Estado vacío para listas, tablas y secciones sin datos.
 */
export function EmptyState({
  title,
  description,
  icon,
  actions,
  wide = false,
  className = "",
  ...rest
}) {
  return (
    <div
      className={[styles.root, wide ? styles.wide : "", className].filter(Boolean).join(" ")}
      role="status"
      {...rest}
    >
      {icon ? <div className={styles.icon}>{icon}</div> : null}
      <h2 className={styles.title}>{title}</h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
