/**
 * Contrato HTTP único (FASE 1): base del API para axios y legacyAdapter.
 *
 * - Por defecto: ruta relativa `/api/v1` (mismo origen).
 * - Desarrollo (Vite): el proxy reenvía `/api` al Express local; sin hardcodes en código.
 * - Producción: Express sirve SPA + API en un solo puerto; relativo sigue siendo correcto.
 *
 * `VITE_API_URL` solo para casos excepcionales (API en otro host). Debe ser URL absoluta
 * o relativa coherente; se normaliza sin barra final.
 */
function normalizeApiBase(raw) {
  if (typeof raw !== "string") return "";
  const t = raw.trim();
  if (!t) return "";
  return t.replace(/\/+$/, "");
}

const fromEnv = normalizeApiBase(import.meta.env?.VITE_API_URL);
export const HTTP_BASE_URL = fromEnv || "/api/v1";

export const HTTP_TIMEOUT_MS = 15000;

export const HTTP_DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

export const HTTP_VALIDATE_STATUS = () => true;
