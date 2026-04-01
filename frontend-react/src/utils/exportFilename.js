function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatExportStamp(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = String(d.getFullYear());

  let hours = d.getHours();
  const minutes = pad2(d.getMinutes());
  const isPm = hours >= 12;
  const ampm = isPm ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hh = pad2(hours);

  return `${dd}-${mm}-${yyyy} ${hh}:${minutes}${ampm}`;
}

function sanitizeForWindowsFilename(value) {
  const raw = String(value == null ? "" : value).trim();
  const safe = raw
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .trim();
  return safe || "export";
}

/**
 * Ej: "P1 - cambio de xyz - 30-03-2026 11:27AM.json"
 * @param {string} entityName
 * @param {Date} [date]
 */
export function buildExportFilename(entityName, date = new Date()) {
  const base = sanitizeForWindowsFilename(entityName);
  const stamp = formatExportStamp(date);
  return `${base} - ${stamp}.json`;
}

