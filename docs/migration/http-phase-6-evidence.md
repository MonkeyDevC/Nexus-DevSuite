## Fase 6 — Validación piloto + cierre del Punto 1 (evidencia ISO)

### Entorno objetivo
- **Staging** (backend real) — pendiente de ejecución completa (URLs/credenciales no provistas aún en esta sesión).
- **Readiness ya preparado en repo**:
  - `playwright.config.js` ahora admite `FRONTEND_URL`/`E2E_FRONTEND_URL`.
  - Nueva suite de cierre: `tests/e2e/phase6-http-closeout.spec.js`.
  - Script dedicado: `npm run test:e2e:phase6`.

### Retiro del fallback legacy (CRÍTICO)
**Estado**: aplicado en código.

- `public/js/api.js` quedó **bridge-only**:
  - `window.fetchApi` delega a `window.NEXUS_HTTP_LEGACY_BRIDGE.fetchApi`
  - si falta bridge → retorna `BRIDGE_MISSING` (no silencioso) + `console.error`
- `frontend-react/src/main.jsx`:
  - se **eliminó** `window.NEXUS_HTTP_LEGACY_FALLBACK_ENABLED`
  - se mantiene bridge oficial `window.NEXUS_HTTP_LEGACY_BRIDGE`

### Autoridad única de sesión (A6)
**Validación por código (PASS)**:
- Búsqueda en `frontend-react/src/**` y `public/js/**` de:
  - `sessionStorage.setItem/removeItem("nexus_access_token" | "nexus_refresh_token")`
- Resultado: **sin matches** (toda persistencia real vive en `frontend-react/src/shared/http/tokenStorage.js`).

Nota:
- Existen escrituras directas en **tests e2e** para setup (no runtime productivo). Se mantuvieron fuera del criterio de A6 (en producción).

### Validaciones ejecutadas (evidencia real)
- `frontend-react`:
  - `npm run lint` ✅ PASS
  - `npm run build` ✅ PASS
- `backend`:
  - `npm test` ❌ FAIL (hallazgo fuera del alcance HTTP: test de consistencia global no determinista).
- `playwright`:
  - suite Fase 6 creada y parametrizada para staging (`FRONTEND_URL`, `API_BASE_URL`, `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_ROLE`).
  - validación de sintaxis/listado: `npm run test:e2e:phase6 -- --list` ✅ PASS.
  - ejecución local de la suite: falla por bridge no disponible en el `FRONTEND_URL` efectivo del entorno actual (no bloquea readiness de staging; sí bloquea cierre final).

### Auditoría de desbloqueo (A/B/C)
- **A — existe y se encontró**:
  - scripts `lint/build/test:e2e` en `package.json`.
  - credenciales locales de prueba en scripts/tests (`admin_nexus@nexus.com` / `Zaq1029*`) para entorno local.
  - bridge-only y `BRIDGE_MISSING` en código.
- **B — no existía y se creó**:
  - suite de cierre Fase 6: `tests/e2e/phase6-http-closeout.spec.js`.
  - configuración Playwright parametrizable por env para staging.
  - script dedicado `npm run test:e2e:phase6`.
- **C — no existe y requiere input externo**:
  - `FRONTEND_URL` real de staging.
  - `API_BASE_URL` real de staging.
  - credenciales reales de staging para ejecución E2E.

### Matriz de escenarios (Punto 1)
React:
- A1 Login OK: ⏳ PENDIENTE (staging)
- A2 getMe OK: ⏳ PENDIENTE (staging)
- A3 Token expirado + refresh OK: ⏳ PENDIENTE (staging)
- A4 Token expirado + refresh FAIL: ⏳ PENDIENTE (staging)
- A5 Concurrencia (401→1 refresh): ⏳ PENDIENTE (staging)
- A6 Autoridad única de sesión: ✅ PASS (código)

Legacy:
- B1 Firma fetchApi intacta: ✅ PASS (código: firma preservada)
- B2 Bridge funcionando: ⏳ PENDIENTE (staging)
- B3 No doble refresh: ⏳ PENDIENTE (staging)
- B4 No __nexus: ⏳ PENDIENTE (staging)
- B5 BRIDGE_MISSING controlado: ✅ PASS (código: retorno controlado + log)

Compatibilidad:
- C1 login mantiene shape: ⏳ PENDIENTE (staging)
- C2 getMe mantiene shape: ⏳ PENDIENTE (staging)
- C3 legacy mantiene envelope: ⏳ PENDIENTE (staging)
- C4 errores mantienen semántica: ⏳ PENDIENTE (staging)

### Hallazgos y riesgos residuales
- **Bloqueante**: falta ejecutar piloto en **staging** (sin URLs/credenciales no se puede emitir GO).
- **Calidad transversal**: `npm test` falló por determinismo/hash mismatch en `global-consistency.integration.test.js`.
  - Evaluación de alcance: pertenece a orquestación/ledger global, no al flujo HTTP transversal del Punto 1.
  - Propuesta de gate: no bloqueante para cierre de Punto 1 **si** A1–A6/B2–B5/C1–C4 pasan en staging.
  - Debe quedar como riesgo residual formal para track aparte de backend.

### Decisión actual (GO/NO-GO)
- **NO-GO (temporal)** hasta:
  1) ejecutar A1–A6, B2–B5, C1–C4 en staging con evidencia (network/traces);
  2) confirmar el tratamiento del fallo `npm test` (fix fuera de alcance HTTP o aceptación formal no bloqueante del Punto 1).

### Comando de ejecución staging (listo)
```bash
FRONTEND_URL="https://<frontend-staging>" \
API_BASE_URL="https://<api-staging>/api/v1" \
E2E_EMAIL="<email>" \
E2E_PASSWORD="<password>" \
E2E_ROLE="<rol>" \
npm run test:e2e:phase6
```

