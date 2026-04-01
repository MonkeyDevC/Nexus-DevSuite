/**
 * Tiempo relativo en español para marcas de actividad (p. ej. listado de proyectos).
 */
export function formatRelativeTimeEs(input) {
  if (input == null || input === "") return "—";
  const d = input instanceof Date ? input : new Date(input);
  const t = d.getTime();
  if (Number.isNaN(t)) return "—";
  const diffMin = Math.round((t - Date.now()) / 60000);
  if (diffMin === 0) return "Hace un momento";
  if (Math.abs(diffMin) < 1) return "Hace un momento";
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const abs = Math.abs(diffMin);
  if (abs < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 48) return rtf.format(diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 14) return rtf.format(diffDay, "day");
  const diffWeek = Math.round(diffDay / 7);
  if (Math.abs(diffWeek) < 8) return rtf.format(diffWeek, "week");
  const diffMonth = Math.round(diffDay / 30);
  return rtf.format(diffMonth, "month");
}
