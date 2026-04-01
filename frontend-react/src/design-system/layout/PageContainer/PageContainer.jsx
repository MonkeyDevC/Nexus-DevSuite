import styles from "./PageContainer.module.css";

/**
 * Wrapper estándar de contenido de página.
 */
export function PageContainer({ compact = false, className = "", children, ...rest }) {
  const outer = [styles.outer, compact ? styles.compact : "", className].filter(Boolean).join(" ");

  return (
    <div className={outer} data-ds-page-container {...rest}>
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
