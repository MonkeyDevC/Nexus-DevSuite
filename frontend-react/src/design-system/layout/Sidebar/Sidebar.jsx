import styles from "./Sidebar.module.css";

/**
 * Sidebar estructural: branding + área de navegación vía children.
 * Sin rutas ni datos de dominio.
 *
 * @param {import("react").ReactNode} [props.brandIcon] — logo u icono
 * @param {string} [props.brandTitle]
 * @param {string} [props.brandSubtitle]
 * @param {import("react").ReactNode} props.children — normalmente enlaces de nav
 */
export function Sidebar({ brandIcon, brandTitle, brandSubtitle, children, className = "", ...rest }) {
  const rootClass = [styles.aside, className].filter(Boolean).join(" ");

  return (
    <aside className={rootClass} data-ds-sidebar {...rest}>
      {(brandIcon || brandTitle || brandSubtitle) && (
        <div className={styles.brand}>
          {brandIcon ? <div className={styles.brandIcon}>{brandIcon}</div> : null}
          {(brandTitle || brandSubtitle) && (
            <div className={styles.brandText}>
              {brandTitle ? <p className={styles.brandTitle}>{brandTitle}</p> : null}
              {brandSubtitle ? <p className={styles.brandSubtitle}>{brandSubtitle}</p> : null}
            </div>
          )}
        </div>
      )}
      <nav className={styles.nav} aria-label="Navegación lateral">
        {children}
      </nav>
    </aside>
  );
}
