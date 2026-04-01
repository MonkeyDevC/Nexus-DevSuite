import styles from "./Topbar.module.css";

/**
 * Barra superior: slots start / end para acciones globales (solo presentación).
 */
export function Topbar({
  start,
  end,
  children,
  className = "",
  ...rest
}) {
  const rootClass = [styles.bar, className].filter(Boolean).join(" ");

  return (
    <header className={rootClass} data-ds-topbar {...rest}>
      {start != null || end != null ? (
        <>
          <div className={styles.start}>{start}</div>
          <div className={styles.end}>{end}</div>
        </>
      ) : (
        children
      )}
    </header>
  );
}
