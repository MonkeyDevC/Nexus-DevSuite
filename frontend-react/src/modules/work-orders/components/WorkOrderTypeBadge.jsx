import { Badge } from "../../../design-system/components/Badge/Badge.jsx";
import { WORK_ORDER_KIND, WORK_ORDER_KIND_LABEL, WORK_ORDER_KIND_UI_LABEL } from "../utils/workOrders.constants.js";
import styles from "./WorkOrderTypeBadge.module.css";

/**
 * @param {{ kind: keyof typeof WORK_ORDER_KIND }} props
 */
export default function WorkOrderTypeBadge({ kind }) {
  const isRework = kind === WORK_ORDER_KIND.REWORK;
  const variant = isRework ? "warning" : "success";
  const code = isRework ? WORK_ORDER_KIND_LABEL.REWORK : WORK_ORDER_KIND_LABEL.WORK;
  const label = isRework ? WORK_ORDER_KIND_UI_LABEL.REWORK : WORK_ORDER_KIND_UI_LABEL.WORK;

  return (
    <span className={styles.wrap} title={label}>
      <span className={isRework ? styles.dotRework : styles.dotWork} aria-hidden />
      <Badge variant={variant} appearance="light">
        {code}
      </Badge>
    </span>
  );
}
