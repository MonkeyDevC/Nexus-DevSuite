/**
 * Utilidades puras de fechas para sprints (ISO YYYY-MM-DD, calendario local).
 */

/** @param {number} y @param {number} m0 0-11 @param {number} d */
export function toIsoDateLocal(y, m0, d) {
  const mm = String(m0 + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

/** @param {string|undefined|null} iso */
export function parseIsoDateToUTCStart(iso) {
  const s = iso == null ? "" : String(iso).trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

/** @param {Date} d */
export function formatDateAsIsoLocal(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return toIsoDateLocal(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * @param {string} isoStart
 * @param {string} isoEnd
 * @returns {number}
 */
export function inclusiveDayCountIso(isoStart, isoEnd) {
  const a = parseIsoDateToUTCStart(isoStart);
  const b = parseIsoDateToUTCStart(isoEnd);
  if (!a || !b) return 0;
  const ms = 24 * 3600 * 1000;
  return Math.round((b.getTime() - a.getTime()) / ms) + 1;
}

/**
 * Rango corto en español: "12 oct – 26 oct".
 * @param {string|null} isoStart
 * @param {string|null} isoEnd
 */
export function formatSprintPeriodShort(isoStart, isoEnd) {
  if (!isoStart || !isoEnd) return null;
  const a = parseIsoDateToUTCStart(isoStart);
  const b = parseIsoDateToUTCStart(isoEnd);
  if (!a || !b) return null;
  const opts = { day: "numeric", month: "short" };
  const left = a.toLocaleDateString("es", opts);
  const right = b.toLocaleDateString("es", opts);
  return `${left} – ${right}`;
}

/**
 * @param {string} isoA
 * @param {string} isoB
 * @returns {number}
 */
export function compareIsoDates(isoA, isoB) {
  if (isoA < isoB) return -1;
  if (isoA > isoB) return 1;
  return 0;
}
