## Evidencia — Fase 0 Hardening (Frontend React aislado)

Fecha de generacion: 2026-03-25

---

### 1) Archivos creados/modificados

**Creados**
- `frontend-react/src/utils/runtimeMode.js`
- `frontend-react/src/routes/ProtectedRoute.jsx`
- `tests/e2e/frontend-auth-refresh-queue.spec.js`
- `docs/EVIDENCIA_ETAPA_0_FRONTEND_REACT_AUTH_HARDENING_2026-03-25.md`

**Modificados**
- `frontend-react/src/services/apiClient.js`
- `frontend-react/src/context/AuthContext.jsx`
- `frontend-react/src/app/App.jsx`

---

### 2) Migraciones aplicadas

No aplica.

---

### 3) Confirmacion de arquitectura intacta

- Cambios limitados al frontend (`frontend-react/`) y soporte de QA (`tests/e2e`).
- No se modificaron endpoints backend, Response Layer v1, ni contratos API.

---

### 4) Confirmacion de reglas de dominio respetadas (contrato API)

- Consumo exclusivo de endpoints existentes:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `GET /api/v1/auth/me`
- Response Layer v1 se mantiene:
  - `apiClient` retorna `response.data` sin transformar.
- No existe dependencia de `window.*` en el frontend nuevo.
- Refresh automatico solo ocurre desde interceptores axios y solo en modo ejecucion.

---

### 5) Resultado de ejecucion de tests (suite y conteo)

Validaciones ejecutadas en `frontend-react/`:
- `npm run lint` => OK
- `npm run build` => OK

Validacion E2E (Playwright) contra:
- `http://localhost:5173/` (frontend Vite)
- `http://localhost:3000/api/v1/*` (backend real)

Resultado:
- `tests/e2e/frontend-auth-refresh-queue.spec.js` => **2 passed**

---

### 6) Evidencia QA negativa / casos cubiertos

Playwright cubrio:
- **Concurrencia (negativo estructural):** varios `GET /auth/me` simultaneos con access token invalido estructuralmente (provoca 401).
  - Esperado: solo **1** llamada a `POST /api/v1/auth/refresh`.
  - Esperado: los requests reintentados resuelven con `success: true`.
- **Refresh invalidado (negativo de dominio):** refresh token invalido.
  - Esperado: `onUnauthenticated` se ejecuta.
  - Esperado: tokens limpiados (`sessionStorage` sin `nexus_access_token` y `nexus_refresh_token`).
  - Esperado: respuesta del `getMe()` con `success: false`.

---

### 7) Confirmacion de auditoria funcional (si aplica)

No aplica: no se generaron acciones backend que requieran auditoria adicional.

---

### 8) Confirmacion ausencia de errores 500 en flujos esperados

Playwright validó que:
- `success: true` en el escenario happy path con refresh.
- `success: false` (error controlado) en escenarios negativos.

---

### 9) Confirmacion Response Layer v1 intacto

Los asserts en Playwright validaron `response.success` y `response.data` retornados tal cual el contrato v1.

---

### Checklist de criterios de cierre

- [x] Separacion clara entre modo construccion vs modo ejecucion (con `runtimeMode.js`)
- [x] Refresh determinista con queue y lock (sin race conditions)
- [x] Anti-loop por request (`_retry` max 1)
- [x] Interceptores refresh solo en modo ejecucion
- [x] Auth desacoplado de `App.jsx` (control en `ProtectedRoute`)
- [x] Logout automatico si refresh falla

**FASE 0 HARDENING COMPLETADA**

