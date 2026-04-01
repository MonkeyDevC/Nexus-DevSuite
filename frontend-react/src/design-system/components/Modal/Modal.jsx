/**
 * Modal del Design System: overlay + diálogo con tokens (--ds-*). Sin Bootstrap.
 */
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

function getModalRoot() {
  return document.body;
}

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} [props.onClose]
 * @param {string} [props.title]
 * @param {import("react").ReactNode} props.children
 * @param {boolean} [props.allowBackdropClose]
 * @param {boolean} [props.allowEscapeClose]
 * @param {boolean} [props.showCloseButton]
 * @param {string} [props.dialogClassName] — clases extra en el contenedor del diálogo (p. ej. ancho).
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  allowBackdropClose = true,
  allowEscapeClose = true,
  showCloseButton = true,
  dialogClassName = "",
}) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen || !allowEscapeClose) return;
    function onKeyDown(e) {
      if (e.key === "Escape" && typeof onClose === "function") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, allowEscapeClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function onOverlayClick(e) {
    if (!allowBackdropClose || typeof onClose !== "function") return;
    if (e.target === e.currentTarget) onClose();
  }

  const root = getModalRoot();
  const modal = (
    <div
      className={styles.overlay}
      tabIndex={-1}
      role="presentation"
      onClick={onOverlayClick}
    >
      <div
        className={[styles.dialog, dialogClassName].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        <div className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            {title || "Modal"}
          </h2>
          {showCloseButton ? (
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Cerrar"
              onClick={() => (typeof onClose === "function" ? onClose() : null)}
            >
              ×
            </button>
          ) : null}
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );

  return createPortal(modal, root);
}
