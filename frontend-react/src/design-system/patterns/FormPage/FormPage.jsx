import styles from "./FormPage.module.css";

/**
 * Contenedor de página de formulario (secciones + pie de acciones).
 * Usar como <form> envolviendo children o pasar props de formulario vía formProps.
 */
export function FormPage({
  children,
  actions,
  wide = false,
  className = "",
  formProps,
  ...rest
}) {
  const inner = (
    <>
      {children}
      {actions ? <div className={styles.footer}>{actions}</div> : null}
    </>
  );

  const rootClass = [styles.root, wide ? styles.rootWide : "", className].filter(Boolean).join(" ");

  if (formProps) {
    return (
      <form className={[rootClass, styles.form].join(" ")} {...formProps} {...rest}>
        {inner}
      </form>
    );
  }

  return (
    <div className={rootClass} {...rest}>
      {inner}
    </div>
  );
}
