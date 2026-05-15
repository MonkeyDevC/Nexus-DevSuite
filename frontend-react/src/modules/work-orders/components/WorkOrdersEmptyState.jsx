import { Button } from "../../../design-system/components/Button/Button.jsx";
import styles from "./WorkOrdersEmptyState.module.css";

/**
 * @param {{ onCreateRequest?: () => void, canCreate?: boolean }} props
 */
export default function WorkOrdersEmptyState({ onCreateRequest, canCreate = false }) {
  return (
    <div className={styles.root} data-testid="work-orders-empty">
      <p className={styles.title}>Aún no hay órdenes para esta historia</p>
      <p className={styles.sub}>Crea la primera orden de trabajo o de reproceso para seguir el avance técnico.</p>
      {canCreate && typeof onCreateRequest === "function" ? (
        <Button type="button" variant="primary" onClick={onCreateRequest}>
          + Nueva orden
        </Button>
      ) : null}
    </div>
  );
}
