# Prompt de implementación — Correcciones de auditoría de código

**Para:** MASTER DEVELOPER  
**Referencia:** docs/AUDITORIA_CODIGO_MEJORAS_2026.md  
**Plan:** Correcciones P1–P3 identificadas en auditoría técnica  
**Estructura:** nexus-engineering-execution.mdc

---

## 1️⃣ OBJETIVO

Implementar las **correcciones de auditoría de código** identificadas en `docs/AUDITORIA_CODIGO_MEJORAS_2026.md`.

**Propósito:** Alinear el código de NEXUS DevSuite con estándares enterprise, Response Layer v1, separación de responsabilidades y cobertura de QA según nexus-engineering-execution.

**Referencia:** Este prompt sigue el plan de acción definido en la auditoría (Fases 1–7).

---

## 2️⃣ REGLAS INNEGOCIABLES

- No romper arquitectura controller → service → repository.
- No usar sequelize.sync().
- No modificar migraciones previas.
- No crear endpoints nuevos.
- No introducir lógica de negocio en controllers (mover validaciones al service).
- Cero respuestas 500 en flujos esperados.
- No dejar TODOs pendientes.
- Mantener compatibilidad con tests existentes (backlog, releases, changeRequests).
- Usar `buildSuccess` y `buildError` de `responseLayer.js` para todas las respuestas.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — auth.repository (código muerto / revoked_at)

1. Revisar `src/modules/auth/auth.repository.js`.
2. Las funciones `revokeRefreshToken` y `findRefreshTokenByHash` usan `revoked`; el esquema usa `revoked_at`.
3. Verificar si estas funciones se usan en el código (auth.service usa refreshToken.repository).
4. **Eliminar** `revokeRefreshToken` y `findRefreshTokenByHash` de auth.repository si no se usan, y actualizar el module.exports.
5. Si algún módulo las importa, actualizar ese módulo para usar refreshToken.repository.
6. Revisar `users.service.invalidateUserRefreshTokens`: eliminar el workaround para `revoked`; usar solo `revoked_at` (el modelo RefreshToken tiene revoked_at).

### FASE 2 — Response Layer v1 en Auth y Users

1. En `auth.controller.js`:
   - Importar `buildSuccess` de `responseLayer.js`.
   - Obtener `request_id` del contexto (req.requestId o requestContext).
   - En login: envolver `{ access_token, refresh_token, user }` con `buildSuccess(data, { request_id })`.
   - En refresh: igual.
   - En logout: si devuelve algo, envolver con buildSuccess.
   - En me: envolver con buildSuccess.
2. En `users.controller.js`:
   - Importar `buildSuccess`.
   - Envolver todas las respuestas exitosas (create, getById, list, update, delete, changePassword) con `buildSuccess(data, { request_id })`.
   - Las respuestas de error ya pasan por errorHandler; no modificar.

### FASE 3 — Response Layer v1 en Health, Context, Metrics

1. En `health.controller.js`: envolver `{ status, timestamp_utc, request_id }` con `buildSuccess(data, { request_id })`.
2. En `context.controller.js` (me, admin/test): envolver con buildSuccess.
3. En `metrics.controller.js`: envolver la respuesta con buildSuccess.

### FASE 4 — Validaciones de users en service

1. En `users.service.js`: añadir validaciones que devuelvan AppError cuando:
   - `getById` no encuentra usuario → NOT_FOUND.
   - `update` no encuentra usuario → NOT_FOUND.
   - `delete` no encuentra usuario o no se puede eliminar → NOT_FOUND o error apropiado.
2. En `users.controller.js`: eliminar las validaciones `!user`, `!updatedUser`, `!deleted` y los lanzamientos de AppError. El controller solo delega al service y devuelve la respuesta; si el service lanza AppError, el errorHandler lo captura.

### FASE 5 — Extraer buildContext y assertRequestValid

1. Crear `src/shared/controllerUtils.js` (o `shared/utils/controllerUtils.js`).
2. Extraer la función `buildContext(req)` que retorna `{ user, requestId, ip, userAgent }`.
3. Extraer la función `assertRequestValid(req)` que valida que req tenga requestId (o lanzar).
4. Actualizar `backlog.controller.js`, `release.controller.js`, `changeRequest.controller.js`, `auth.controller.js` para importar y usar estas funciones en lugar de duplicar el código.

### FASE 6 — entity_id en auditoría assignFeatureToRelease

1. En `release.service.js`, en la función que asigna feature a release y crea auditoría FEATURE_ASSIGN_RELEASE:
   - Verificar el valor de `entity_id` en `createAuditLog`.
   - Usar `feature_id` o `release_id` como `entity_id` para trazabilidad correcta (no un string genérico como "FEATURE_ASSIGN_RELEASE").

### FASE 7 — Tests de contrato y QA de seguridad

1. **Tests de X-Response-Version:**
   - En una suite existente (por ejemplo `backlog.negative.test.js` o crear `contract.qa.test.js`), añadir tests que verifiquen:
     - `expect(res.headers['x-response-version']).toBe('1')` en al menos una respuesta exitosa (200) y una de error (4xx).
2. **Suite de QA de seguridad:**
   - Crear `src/tests/integration/security/security.qa.test.js`.
   - Tests: (a) GET endpoint protegido sin token → 401; (b) GET endpoint MASTER-only con token EMPLOYEE → 403; (c) GET /users/:id con ID de otro usuario (manipulación) → 403 o 404 según política.
   - Usar el mismo patrón de setup que backlog.negative (crear usuario MASTER, EMPLOYEE, login, etc.).

### FASE 8 — Documentación CONTRATO_API

1. En `docs/CONTRATO_API.md`:
   - Añadir sección "Endpoints que usan Response Layer v1" (o "Cobertura de Response Layer v1").
   - Tras las correcciones, todos los endpoints deben usar envelope; documentar que no hay excepciones tras esta implementación.
   - Si por alguna razón se mantiene alguna excepción (por ejemplo health para health checks externos), listarla explícitamente.

---

## 4️⃣ REGLAS DE DOMINIO CRÍTICAS

- Response Layer v1: `success`, `data` (o `error`), `meta.request_id`, `meta.timestamp`.
- Header `X-Response-Version: 1` ya lo añade el middleware; no modificar.
- Auditoría: `entity`, `entity_id` (ID real de la entidad), `action`, `metadata`, `request_id`.
- Validaciones de negocio siempre en service, nunca en controller.

---

## 5️⃣ AUDITORÍA OBLIGATORIA

No se crean nuevas entidades ni acciones críticas de dominio. Las modificaciones son refactors. No se requieren nuevos registros de auditoría para esta tarea.

---

## 6️⃣ QA AUTOMATIZADA OBLIGATORIA

- **QA funcional:** Los tests existentes (backlog, releases, changeRequests) deben seguir pasando.
- **QA de regresión:** Ejecutar todas las suites; no romper tests existentes.
- **QA de contrato:** Añadir tests de X-Response-Version (Fase 7).
- **QA de seguridad:** Crear suite security.qa.test.js (Fase 7).
- **Reproducible:** Entorno limpio; sin dependencia de orden.

---

## 7️⃣ CRITERIO DE CIERRE

- Todos los tests ejecutan (existentes + nuevos).
- 0 omitidos.
- 0 respuestas 500 en flujos esperados.
- Arquitectura intacta.
- auth.repository sin código muerto o alineado con revoked_at.
- Auth, Users, Health, Context, Metrics usan Response Layer v1.
- Validaciones de users en service.
- buildContext y assertRequestValid en módulo compartido.
- entity_id en assignFeatureToRelease corregido.
- Suite security.qa.test.js creada y en verde.
- Tests de X-Response-Version en verde.
- CONTRATO_API.md actualizado.

---

## 8️⃣ EVIDENCIA OBLIGATORIA DE IMPLEMENTACIÓN

Al finalizar, entregar:

1. Lista de archivos creados o modificados.
2. Migraciones aplicadas (ninguna en esta tarea).
3. Confirmación de arquitectura intacta.
4. Confirmación de reglas de dominio respetadas.
5. Resultado de QA funcional (tests existentes pasando).
6. Resultado de QA negativa (tests existentes pasando).
7. Confirmación de auditoría (no aplica cambios en auditoría).
8. Confirmación de ausencia de errores 500 en flujos esperados.
9. Confirmación de Response Layer v1 intacto en todos los endpoints modificados.

---

## Archivos a modificar (resumen)

| Archivo | Fase | Acción |
|---------|------|--------|
| `src/modules/auth/auth.repository.js` | 1 | Eliminar revokeRefreshToken, findRefreshTokenByHash; actualizar exports |
| `src/modules/users/users.service.js` | 1 | Simplificar invalidateUserRefreshTokens (solo revoked_at) |
| `src/modules/auth/auth.controller.js` | 2 | Envolver respuestas con buildSuccess |
| `src/modules/users/users.controller.js` | 2, 4 | buildSuccess + eliminar validaciones |
| `src/modules/users/users.service.js` | 4 | Añadir validaciones NOT_FOUND |
| `src/modules/health/health.controller.js` | 3 | buildSuccess |
| `src/modules/auth/context.controller.js` | 3 | buildSuccess |
| `src/system/metrics/metrics.controller.js` | 3 | buildSuccess |
| `src/shared/utils/controllerUtils.js` o similar | 5 | Crear (buildContext, assertRequestValid) |
| `src/modules/backlog/backlog.controller.js` | 5 | Usar controllerUtils |
| `src/modules/releases/release.controller.js` | 5 | Usar controllerUtils |
| `src/modules/changeRequests/changeRequest.controller.js` | 5 | Usar controllerUtils |
| `src/modules/auth/auth.controller.js` | 5 | Usar controllerUtils |
| `src/modules/releases/release.service.js` | 6 | Corregir entity_id en auditoría |
| `src/tests/integration/security/security.qa.test.js` | 7 | Crear |
| Tests existentes o `contract.qa.test.js` | 7 | Añadir tests X-Response-Version |
| `docs/CONTRATO_API.md` | 8 | Actualizar |

---

**Verificar antes de entregar:** scripts/qa-dia2.js debe ejecutarse sin fallos. Todas las suites de integración deben pasar.
