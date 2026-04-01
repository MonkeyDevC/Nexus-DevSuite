import styles from "./FilterToolbar.module.css";

/**
 * Barra de filtros / búsqueda para listados admin.
 * @param {import("react").ReactNode} props.children — campos (Input, selects, etc.)
 * @param {import("react").ReactNode} [props.actions] — botones reset / aplicar
 */
export function FilterToolbar({ children, actions, className = "", ...rest }) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")} role="search" {...rest}>
      <div className={styles.fields}>{children}</div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
