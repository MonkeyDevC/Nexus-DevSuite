/**
 * ----
 * Modulo: ConfirmModal
 * Descripcion: Modal de confirmacion reutilizable (composicion sobre Modal). UI pura por props.
 * Autor: Agente NEXUS
 * Fecha: 2026-03-25
 * ----
 */
import Modal from "../Modal/Modal.jsx";
import { Button } from "../../../design-system/components/Button/Button.jsx";
import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  message,
  itemId,
  entity,
  title,
  confirmLabel,
  cancelLabel,
}) {
  return (
    <Modal
      isOpen={Boolean(isOpen)}
      onClose={typeof onCancel === "function" ? onCancel : undefined}
      title={title || "Confirmación"}
    >
      <div className={styles.message}>{message || "¿Deseas confirmar esta acción?"}</div>
      <div className={styles.actions}>
        <Button type="button" variant="outline" onClick={() => (typeof onCancel === "function" ? onCancel() : null)}>
          {cancelLabel || "Cancelar"}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={() =>
            typeof onConfirm === "function"
              ? onConfirm({ itemId: itemId ?? null, entity: entity ?? "item" })
              : null
          }
        >
          {confirmLabel || "Confirmar"}
        </Button>
      </div>
    </Modal>
  );
}
