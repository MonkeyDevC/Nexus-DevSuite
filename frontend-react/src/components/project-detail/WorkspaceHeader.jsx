import Breadcrumb from "../ui/Breadcrumb/Breadcrumb.jsx";
import { Button } from "../../design-system/components/Button/Button.jsx";
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
  closeDisabled = false,
  closeAriaLabel = "Cerrar workspace",
}) {
  return (
    <header className={styles.root}>
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
