import { get } from "../../shared/http/index.js";
import { unwrapSuccessData } from "../domain/apiEnvelope.js";

function qs(params) {
  const sp = new URLSearchParams();
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * Normaliza GET /users a shape estable para la vista (sin anidación del backend).
 * @returns {{ items: object[], pagination: { page, limit, total, totalPages } }}
 */
export async function listUsersNormalized({ page = 1, limit = 20 } = {}) {
  const res = await get(`/users${qs({ page, limit })}`);
  const payload = unwrapSuccessData(res);
  const inner = payload && typeof payload === "object" ? payload : {};
  const items = Array.isArray(inner.data) ? inner.data : [];
  const meta = inner.meta && typeof inner.meta === "object" ? inner.meta : {};
  const pagination = {
    page: Number(meta.page) || page,
    limit: Number(meta.limit) || limit,
    total: Number(meta.total) || 0,
    totalPages: Number(meta.totalPages) || 0
  };
  return { items, pagination };
}

/**
 * @returns {{ logs: object[], pagination: { page, limit, total, totalPages } }}
 */
export async function listAuditLogsNormalized({ page = 1, limit = 20 } = {}) {
  const res = await get(`/reports/audit${qs({ page, limit })}`);
  const payload = unwrapSuccessData(res);
  const inner = payload && typeof payload === "object" ? payload : {};
  const logs = Array.isArray(inner.auditLogs) ? inner.auditLogs : [];
  const p = inner.pagination && typeof inner.pagination === "object" ? inner.pagination : {};
  const pagination = {
    page: Number(p.page) || page,
    limit: Number(p.limit) || limit,
    total: Number(p.total) || 0,
    totalPages: Number(p.totalPages) || 0
  };
  return { logs, pagination };
}

/**
 * Snapshot técnico de proceso (GET /system/metrics).
 * @returns {object}
 */
export async function getSystemMetricsSnapshot() {
  const res = await get("/system/metrics");
  return unwrapSuccessData(res);
}
