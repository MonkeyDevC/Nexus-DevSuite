/**
 * FASE 2 (Nucleo HTTP): cliente axios central sin refresh.
 *
 * FASE 4 (Normalizacion):
 * - Se adjunta `__nexus` como metadata interna transitoria del nucleo HTTP.
 * - Prohibido consumir `__nexus` fuera de `src/shared/http/**`.
 * - El contrato observable hacia consumidores actuales NO cambia: se sigue retornando axiosResponse.
 */
import axios from "axios";
import {
  HTTP_BASE_URL,
  HTTP_TIMEOUT_MS,
  HTTP_DEFAULT_HEADERS,
  HTTP_VALIDATE_STATUS,
} from "./requestConfig.js";
import { getAccessToken } from "./tokenStorage.js";
import { handle401AndMaybeRetry } from "./refreshManager.js";
import { normalizeAxiosResponse } from "./responseNormalizer.js";
import { normalizeAxiosError } from "./errorNormalizer.js";

const httpClient = axios.create({
  baseURL: HTTP_BASE_URL,
  timeout: HTTP_TIMEOUT_MS,
  headers: { ...HTTP_DEFAULT_HEADERS },
  validateStatus: HTTP_VALIDATE_STATUS,
});

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (!token) return config;
  config.headers = config.headers || {};
  if (!config.headers.Authorization) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

httpClient.interceptors.response.use(async (response) => {
  if (!response || response.status !== 401) return response;
  return await handle401AndMaybeRetry(response, httpClient);
});

// Normalizacion tecnica interna (no cambia el contrato observable de axiosResponse).
httpClient.interceptors.response.use(
  (response) => {
    try {
      response.__nexus = normalizeAxiosResponse(response);
    } catch {
      // Si normalizacion falla, no romper compatibilidad.
      response.__nexus = {
        ok: false,
        status: response && typeof response.status === "number" ? response.status : null,
        error: { code: "HTTP_NORMALIZATION_FAILED", message: "Normalizacion fallida.", details: {} },
        meta: {},
      };
    }
    return response;
  },
  (error) => {
    try {
      error.__nexus = normalizeAxiosError(error);
    } catch {
      error.__nexus = {
        ok: false,
        status: null,
        error: { code: "HTTP_NORMALIZATION_FAILED", message: "Normalizacion fallida.", details: {} },
        meta: {},
      };
    }
    return Promise.reject(error);
  }
);

export default httpClient;

