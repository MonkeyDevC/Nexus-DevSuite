# Evidencia de Ejecucion — Punto 1 / Fase 3 (Refresh Manager)

## Estado de fase
- Estado: COMPLETADA (pendiente de aprobacion de cierre)
- Alcance aplicado: solo Fase 3 (refresh centralizado en nucleo)
- Exclusiones respetadas:
  - sin `legacyAdapter.js`
  - sin cambios en `public/js/api.js`
  - sin normalizadores (Fase 4)

## Archivos creados
- `frontend-react/src/shared/http/authSession.js`
- `frontend-react/src/shared/http/refreshManager.js`

## Archivos modificados
- `frontend-react/src/shared/http/httpClient.js`
- `frontend-react/src/services/apiClient.js`

## Flujo central de refresh (SSOT)
- Unico motor: `shared/http/refreshManager.js`
- Fuente refresh: `tokenStorage.getRefreshToken()`
- Transporte refresh: llamada directa del nucleo a `POST /auth/refresh` via `httpClient.post(..., { __skipAuthRefresh: true })`
- Regla: `refreshManager` NO invoca `apiClient.refreshToken()` (helper de compatibilidad fuera del flujo central).

## Politica 401 controladas (deterministica)
- Si refresh es exitoso:
  - se persisten tokens (`tokenStorage.setTokens`)
  - se notifica una vez (`authSession.notifyTokensUpdated`)
  - se reintenta request original exactamente una vez (`config._retry = true`)
  - se resuelve toda la cola con retry (todas con `_retry = true`)
- Si refresh falla:
  - cleanup centralizado (`tokenStorage.clearTokens`)
  - notificacion una sola vez por evento (`authSession.notifyUnauthenticatedOnce(eventId, ...)`)
  - la cola se resuelve completamente con respuesta 401 controlada (sin promesas colgadas)
  - el request original retorna su respuesta 401 (sin throw inconsistente)

## Anti-duplicacion / anti-loop
- Mutex: `refreshPromise` (1 refresh en vuelo).
- Cola: `queue[]` (se drena en exito o falla).
- Anti-loop: `config._retry === true` bloquea reintento adicional.
- Elegibilidad excluye endpoints `/auth/login` y `/auth/refresh` y respeta `__skipAuthRefresh`.

## Compatibilidad observable (apiClient)
- `apiClient.login/getMe` siguen devolviendo `res.data` (sin exponer contrato interno).
- `apiClient.refreshToken()` permanece como helper manual sin lock/cola/retry/cleanup.
- `registerAuthCallbacks` delega a `authSession` para evitar competencia.

## Validaciones ejecutadas
- `frontend-react npm run lint`: OK
- `frontend-react npm run build`: OK
- Busquedas de no-duplicacion:
  - no se detecto llamada `apiClient.refreshToken()` desde `shared/http/*`.

## Riesgos residuales
- `apiClient.getMe` notifica una 401 via `authSession.notifyUnauthenticatedOnce` aunque el refresh manager ya gestione otros 401; se mantiene idempotencia por `eventId` (flujo de refresh) y clave `"getMe-401"` (getMe directo).

