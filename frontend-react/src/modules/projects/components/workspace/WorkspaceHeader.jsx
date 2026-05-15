import Breadcrumb from "../../../../design-system/patterns/Breadcrumb/Breadcrumb.jsx";
import { Button } from "../../../../design-system/components/Button/Button.jsx";
import styles from "./WorkspaceHeader.module.css";

/**
 * Cabecera compartida del workspace: kicker, breadcrumb opcional, título xl, fila meta opcional, cierre.
 * @param {object} props
 * @param {string} [props.kicker]
 * @param {{ label: string, path?: string }[]} [props.breadcrumbItems]
 * @param {string} [props.breadcrumbDataTestId]
 * @param {string} [props.title]
 * @param {import('react').ReactNode} [props.meta] — badges, código, prioridad
 * @param {() => void} props.onRequestClose
 * @param {() => void} [props.onRequestBack] — vuelve un nivel en el stack jerárquico
 * @param {() => void} [props.onRequestCopyLink] — copia la URL actual al portapapeles
 * @param {boolean} [props.closeDisabled]
 * @param {string} [props.closeAriaLabel]
 */
export default function WorkspaceHeader({
  kicker,
  breadcrumbItems,
  breadcrumbDataTestId,
  title,
  meta = null,
  onRequestClose,
  onRequestBack,
  onRequestCopyLink,
  closeDisabled = false,
  closeAriaLabel = "Cerrar workspace",
}) {
  return (
    <header className={styles.root}>
      {onRequestBack || onRequestCopyLink ? (
        <div className={styles.toolbarRow}>
          {onRequestBack ? (
            <Button type="button" variant="outline" className={styles.toolbarBtn} onClick={onRequestBack}>
              Volver
            </Button>
          ) : (
            <span />
          )}
          {onRequestCopyLink ? (
            <Button type="button" variant="ghost" className={styles.toolbarBtn} onClick={onRequestCopyLink}>
              Copiar link
            </Button>
          ) : null}
        </div>
      ) : null}
      {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
      {breadcrumbItems?.length ? (
        <div data-testid={breadcrumbDataTestId}>
          <Breadcrumb items={breadcrumbItems} />
        </div>
      ) : null}
      <h1 className={styles.title}>{title || "—"}</h1>
      {meta ? <div className={styles.metaRow}>{meta}</div> : null}
      <Button
        variant="ghost"
        type="button"
        className={styles.closeButton}
        onClick={onRequestClose}
        disabled={closeDisabled}
        aria-label={closeAriaLabel}
      >
        ×
      </Button>
    </header>
  );
}
