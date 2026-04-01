/**
 * FASE 1 (Infra base): entrypoint del HTTP layer.
 * En Fase 2 se expone API publica minima (sin refresh ni legacy).
 */
import httpClient from "./httpClient.js";

export {
  HTTP_BASE_URL,
  HTTP_TIMEOUT_MS,
  HTTP_DEFAULT_HEADERS,
  HTTP_VALIDATE_STATUS,
} from "./requestConfig.js";

export {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  setTokens,
  clearTokens,
  getTokenPair,
  getTokenRealm,
} from "./tokenStorage.js";

export function request(config) {
  return httpClient.request(config);
}

export function get(url, config) {
  return httpClient.get(url, config);
}

export function post(url, data, config) {
  return httpClient.post(url, data, config);
}

export function put(url, data, config) {
  return httpClient.put(url, data, config);
}

export function patch(url, data, config) {
  return httpClient.patch(url, data, config);
}

export function del(url, config) {
  return httpClient.delete(url, config);
}

const api = {
  request,
  get,
  post,
  put,
  patch,
  delete: del,
};

export default api;

