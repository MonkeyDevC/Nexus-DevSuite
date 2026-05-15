import { get } from "../../shared/http/index.js";
import { unwrapSuccessData } from "../../shared/api/apiEnvelope.js";

/**
 * @param {{ days?: number }} [opts] — ventana para actividad y altas de proyecto (default 30).
 */
export async function getDashboardSummary(opts = {}) {
  const days = opts.days != null ? opts.days : 30;
  const res = await get("/dashboard/summary", { params: { days } });
  return unwrapSuccessData(res);
}
