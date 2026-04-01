## Fase 5 — Integración legacy (evidencia ISO)

### Objetivo
- Integrar `public/js/api.js` (legacy) al **mismo núcleo HTTP** (`frontend-react/src/shared/http/**`) mediante un bridge global, sin romper compatibilidad observable y sin segundo refresh paralelo.

### Archivos creados
- `frontend-react/src/shared/http/legacyAdapter.js`
- `docs/migration/http-phase-5-evidence.md`

### Archivos modificados
- `frontend-react/src/main.jsx`
- `public/js/api.js`

### Implementación aplicada
- **Bridge global (obligatorio)**:
  - `window.NEXUS_HTTP_LEGACY_BRIDGE = { fetchApi: async (path, options) => ... }`
  - Fuente: `frontend-react/src/shared/http/legacyAdapter.js` (único traductor al contrato legacy).
- **Feature toggle temporal (retirado en Fase 6)**:
  - En Fase 5 existió un fallback temporal para contingencia.
  - **Estado actual**: retirado en **Fase 6** (bridge-only).
- **Regla `BRIDGE_MISSING` no silenciosa**:
  - Si `fallback === false` y no existe `window.NEXUS_HTTP_LEGACY_BRIDGE.fetchApi`:
    - `console.error` explícito
    - retorno controlado:
      - `{ success:false, error:{ code:"BRIDGE_MISSING", message:"Infra HTTP no disponible" } }`
- **Shims globales de tokens (compatibilidad, sin lógica)**:
  - `window.getToken/getRefreshToken/setTokens/clearTokens` quedan como wrappers directos sobre `sessionStorage` (sin refresh, sin locks, sin retry).

### Ajuste quirúrgico posterior (hardening) — Política de `options.body`
- **Regla absoluta**: el adapter no “adivina” ni transforma payloads. **Transporte puro**.
- **FormData**: se envía exactamente como viene (sin serializar, sin tocar headers).
- **string**: se envía exactamente como viene (**sin `JSON.parse`**, sin heurísticas).
- **objeto plano**: se envía como objeto (sin mutación) y solo se agrega `Content-Type: application/json` **si falta**.
- **null/undefined**: no se envía body.

### Eliminación de doble refresh (criterio)
- **Modo bridge (fallback desactivado)**:
  - `public/js/api.js` delega inmediatamente al bridge (núcleo).
  - No ejecuta:
    - refresh at boot
    - refresh on 401
    - lock/cola legacy
  - Resultado: **no existe refresh legacy paralelo** durante el modo bridge.
- **Modo fallback (temporal)**:
  - Existió solo como contingencia controlada en Fase 5.
  - **Retirado** en Fase 6 (no debe existir en cierre del Punto 1).

### Blindajes críticos verificados por diseño
- **No filtración del núcleo**:
  - `legacyAdapter.js` devuelve siempre envelope legacy (Response Layer v1) y nunca retorna `HttpResult` ni `__nexus`.
- **Frontera HTTP vs dominio**:
  - `legacyAdapter.js` no adapta estructuras de dominio (no `items`, no `rows`, no `data.data`).

### Validaciones obligatorias (checklist)
- [ ] Firma `window.fetchApi(path, options)` preservada (mismo contrato de entrada).
- [ ] Envelope legacy preservado (`success/data/error/meta`).
- [ ] Modo bridge delega al núcleo HTTP (mismo `httpClient` + `refreshManager`).
- [ ] No doble refresh en modo bridge.
- [ ] `BRIDGE_MISSING` observable cuando corresponde (no silencioso).
- [ ] Toggle habilita fallback solo cuando está activo.
- [ ] Shims de tokens sin lógica adicional.
- [ ] `lint`/`build` del microapp React en verde.
- [ ] `legacyAdapter.js` no contiene `JSON.parse` ni lógica heurística para body.

### Riesgos residuales
- Si el legacy se ejecuta **antes** de que el microapp React inicialice `window.NEXUS_HTTP_LEGACY_BRIDGE`, y `fallback === false`, se observará `BRIDGE_MISSING` (comportamiento deseado; requiere ordenar carga o habilitar fallback temporal).

