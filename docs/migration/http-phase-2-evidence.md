# Evidencia de Ejecucion — Punto 1 / Fase 2 (Nucleo HTTP)

## Estado de fase
- Estado: COMPLETADA (pendiente de aprobacion de cierre)
- Alcance aplicado: solo Fase 2
- Exclusiones respetadas:
  - sin `refreshManager.js`
  - sin refresh automatico
  - sin `legacyAdapter.js`
  - sin cambios en `public/js/api.js`

## Archivos creados
- `frontend-react/src/shared/http/tokenStorage.js`
- `frontend-react/src/shared/http/httpClient.js`

## Archivos modificados
- `frontend-react/src/shared/http/index.js`
- `frontend-react/src/services/apiClient.js`
- `frontend-react/src/context/AuthContext.jsx`
- `frontend-react/eslint.config.js`

## Funciones expuestas por tokenStorage.js
- `getAccessToken()`
- `setAccessToken(token)`
- `getRefreshToken()`
- `setRefreshToken(token)`
- `setTokens(accessToken, refreshToken)`
- `clearTokens()`

## Compatibilidad contractual (login/getMe)
- Antes (consumidor):
  - `login()` devolvia `res.data`.
  - `getMe()` devolvia `res.data`.
- Despues (consumidor):
  - `login()` sigue devolviendo `res.data`.
  - `getMe()` sigue devolviendo `res.data`.
- Resultado:
  - no se expone `HttpResult` a consumidores actuales de `apiClient`.
  - no se expone axios raw distinto al contrato observable previo.

## Autoridad de tokens
- Verificacion de escrituras/limpiezas efectivas de tokens:
  - match solo en `frontend-react/src/shared/http/tokenStorage.js`.
  - sin escrituras de `nexus_access_token`/`nexus_refresh_token` en `apiClient.js`.
  - sin escrituras de `nexus_access_token`/`nexus_refresh_token` en `AuthContext.jsx`.
- `AuthContext.jsx` conserva escritura de `nexus_runtime_phase` (fuera de alcance de autoridad de tokens).

## Validaciones ejecutadas
- `npm run lint` en `frontend-react`: OK
- `npm run build` en `frontend-react`: OK
- auditoria `rg`:
  - `import axios` solo en `src/shared/http/httpClient.js`.
  - sin refresh logic en `shared/http/httpClient.js` (`isRefreshing`, `refreshQueue`, `interceptors.response` no presentes).

## Riesgos residuales
- `apiClient.refreshToken()` permanece como helper manual de endpoint para compatibilidad; no existe orquestacion de refresh automatico en Fase 2.
- pantallas React legacy siguen usando `fetch` (EXC-HTTP-002); fuera del alcance de Fase 2.

## Conclusión
- Fase 2 implementada con compatibilidad conservada y autoridad unica de tokens en `tokenStorage`.
- Sin introduccion de refresh ni adelanto de fases posteriores.

