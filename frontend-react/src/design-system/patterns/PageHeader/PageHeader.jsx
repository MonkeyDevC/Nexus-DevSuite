import styles from "./PageHeader.module.css";

/**
 * Cabecera de página estilo admin: título, descripción opcional, breadcrumb y acciones.
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {import("react").ReactNode} [props.breadcrumb]
 * @param {import("react").ReactNode} [props.actions]
 * @param {string} [props.className]
 */
export function PageHeader({ title, description, breadcrumb, actions, className = "", ...rest }) {
  return (
    <header className={[styles.root, className].filter(Boolean).join(" ")} {...rest}>
      <div className={styles.main}>
        {breadcrumb ? <div className={styles.breadcrumbSlot}>{breadcrumb}</div> : null}
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
