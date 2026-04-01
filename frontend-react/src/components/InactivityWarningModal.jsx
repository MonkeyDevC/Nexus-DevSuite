/**
 * Aviso previo a expiración por inactividad (solo CTA explícita; sin cierre casual).
 */
import Modal from "./ui/Modal/Modal.jsx";
import { INACTIVITY_WARNING_USER_MESSAGE } from "../services/sessionActivity.js";
import styles from "./InactivityWarningModal.module.css";

export default function InactivityWarningModal({ isOpen, onContinue }) {
  return (
    <Modal
      isOpen={isOpen}
      title="Aviso de sesión"
      allowBackdropClose={false}
      allowEscapeClose={false}
      showCloseButton={false}
    >
      <p className={styles.message}>{INACTIVITY_WARNING_USER_MESSAGE}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.primaryBtn} onClick={onContinue}>
          Continuar sesión
        </button>
      </div>
    </Modal>
  );
}
