import { Badge } from "../../../design-system/components/Badge/Badge.jsx";
import { workOrderStatusLabel } from "../utils/workOrders.mapper.js";

const VARIANT_BY_STATUS = {
  PENDING: "neutral",
  IN_PROGRESS: "success",
  IN_REVIEW: "warning",
  DONE: "success",
};

/**
 * @param {{ status: string }} props
 */
export default function WorkOrderStatusBadge({ status }) {
  const variant = VARIANT_BY_STATUS[status] || "neutral";
  return (
    <Badge variant={variant} appearance="light">
      {workOrderStatusLabel(status)}
    </Badge>
  );
}
