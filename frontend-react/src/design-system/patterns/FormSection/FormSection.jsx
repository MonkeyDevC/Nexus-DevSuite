import styles from "./FormSection.module.css";

/**
 * Bloque de formulario con título y campos (fieldset si hay título; si no, section).
 */
export function FormSection({ title, description, children, className = "", ...rest }) {
  if (title) {
    return (
      <fieldset className={[styles.root, className].filter(Boolean).join(" ")} {...rest}>
        <legend className={styles.legend}>{title}</legend>
        {description ? <p className={styles.description}>{description}</p> : null}
        <div className={styles.body}>{children}</div>
      </fieldset>
    );
  }

  return (
    <section className={[styles.root, className].filter(Boolean).join(" ")} {...rest}>
      {description ? <p className={styles.description}>{description}</p> : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
