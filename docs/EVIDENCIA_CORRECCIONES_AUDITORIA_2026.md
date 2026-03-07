# Evidencia de implementación — Correcciones de auditoría de código 2026

**Documento:** Evidencia para agente QA  
**Referencia:** `docs/AUDITORIA_CODIGO_MEJORAS_2026.md`, `docs/PROMPT_MASTER_DEVELOPER_CORRECCIONES_AUDITORIA.md`  
**Plan ejecutado:** Fases 1–8 del prompt de correcciones P1–P3  
**Fecha de cierre:** 2026-03-05  

---

## 1. Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `src/shared/utils/controllerUtils.js` | Utilidades compartidas: `buildContext(req)`, `assertRequestValid(req)` |
| `src/tests/integration/contract/contract.qa.test.js` | Tests de contrato: header `X-Response-Version: 1` en respuestas 200 y 4xx |
| `src/tests/integration/security/security.qa.test.js` | Suite QA seguridad: 401 sin token, 403 EMPLOYEE en endpoint MASTER, 403/404 al consultar otro usuario |

---

## 2. Archivos modificados

| Archivo | Fase | Cambio |
|---------|------|--------|
| `src/modules/auth/auth.repository.js` | 1 | Eliminadas `revokeRefreshToken` y `findRefreshTokenByHash` (código muerto; esquema usa `revoked_at`) |
| `src/modules/users/users.service.js` | 1, 4 | `invalidateUserRefreshTokens` usa `refreshToken.repository.revokeByUserId`; validaciones NOT_FOUND en `getUserById`, `updateUser`, `softDeleteUser`; política GET /users/:id: EMPLOYEE solo puede consultar su propio id (403 si otro) |
| `src/modules/auth/auth.controller.js` | 2, 5 | Respuestas login/refresh con `buildSuccess`; uso de `controllerUtils` (buildContext, assertRequestValid) |
| `src/modules/users/users.controller.js` | 2, 4, 5 | Todas las respuestas exitosas con `buildSuccess`; eliminadas validaciones de negocio (delegan al service); `getUserById` pasa `requester: req.user` al service |
| `src/modules/health/health.controller.js` | 3 | Respuesta envuelta con `buildSuccess` |
| `src/modules/auth/context.controller.js` | 3 | Respuestas `me` y `admin/test` con `buildSuccess` |
| `src/system/metrics/metrics.controller.js` | 3 | Respuesta con `buildSuccess` |
| `src/modules/backlog/backlog.controller.js` | 5 | Uso de `controllerUtils` (buildContextBase + assertRequestValid); buildContext local añade `changeRequestId` cuando viene en body |
| `src/modules/releases/release.controller.js` | 5 | Igual que backlog |
| `src/modules/changeRequests/changeRequest.controller.js` | 5 | Uso de `controllerUtils` (buildContext, assertRequestValid) |
| `src/modules/releases/release.service.js` | 6 | Auditoría `FEATURE_ASSIGN_RELEASE`: `entity: "FEATURE"`, `entity_id: featureId` (trazabilidad correcta) |
| `src/tests/integration/backlog/backlog.negative.test.js` | 7 | Login: uso de `res.body.data.access_token` (Response Layer v1) |
| `src/tests/integration/releases/releases.negative.test.js` | 7 | Idem |
| `src/tests/integration/releases/releases.hotfix.test.js` | 7 | Idem |
| `src/tests/integration/changeRequests/changeRequests.negative.test.js` | 7 | Idem |
| `docs/CONTRATO_API.md` | 8 | Sección «Cobertura de Response Layer v1»: todos los endpoints usan envelope; sin excepciones |

---

## 3. Migraciones aplicadas

Ninguna. La tarea fue solo refactors y correcciones de código.

---

## 4. Resultado de QA

- **Suites:** 6 (backlog.negative, releases.negative, releases.hotfix, changeRequests.negative, contract.qa, security.qa).
- **Tests totales:** 38.
- **Estado:** Todos pasando.
- **Omitidos:** 0.
- **Flujos esperados:** 0 respuestas 500.

**Comando de verificación (ejecutar con NODE_ENV=development):**

```bash
$env:NODE_ENV="development"; npm test -- --runInBand --forceExit
```

---

## 5. Confirmación de arquitectura

- Capas respetadas: Controller → Service → Repository.
- Validaciones de negocio en service (users: NOT_FOUND y 403 por usuario en getById).
- Respuestas vía `buildSuccess` / `buildError`; header `X-Response-Version: 1` en todas las respuestas.

---

## 6. Confirmación de Response Layer v1

- **Auth:** login, refresh, me, admin/test con envelope; logout 204 sin cuerpo.
- **Users:** create, getById, list, update, delete (204), changePassword con envelope.
- **Health, Context, Metrics:** respuestas con buildSuccess.
- **Projects, Features, Stories, Releases, Change-requests:** respuestas de éxito con `{ success, data, meta }`; errores con `{ success: false, error, meta }`.

No hay excepciones al envelope en endpoints que devuelven cuerpo.

---

## 7. Confirmación de auditoría

- No se añadieron nuevas entidades ni acciones críticas de dominio.
- Cambio en auditoría existente: `assignFeatureToRelease` registra `entity: "FEATURE"` y `entity_id: featureId` para trazabilidad correcta.

---

## 8. Riesgos / notas para QA

- **Entorno de tests:** Ejecutar con `NODE_ENV=development` (o secretos JWT válidos) para evitar error de env en carga de config.
- **Jest:** Puede ser necesario `--forceExit` si la conexión MySQL no se cierra antes de que Jest termine.
- **security.qa:** Puede aparecer un `ReferenceError` tras el teardown de Jest por asincronía de MySQL; los 3 tests de la suite pasan correctamente.

---

## 9. Criterios de cierre (checklist)

- [x] Tests existentes y nuevos ejecutados y en verde
- [x] 0 omitidos
- [x] 0 respuestas 500 en flujos esperados
- [x] Arquitectura intacta
- [x] auth.repository sin código muerto; alineado con revoked_at vía refreshToken.repository
- [x] Auth, Users, Health, Context, Metrics con Response Layer v1
- [x] Validaciones de users en service
- [x] buildContext y assertRequestValid en módulo compartido (controllerUtils)
- [x] entity_id en assignFeatureToRelease corregido
- [x] Suite security.qa.test.js creada y en verde
- [x] Tests de X-Response-Version en verde (contract.qa.test.js)
- [x] CONTRATO_API.md actualizado

---

**Uso por el agente QA:** Este archivo puede citarse como evidencia de que las correcciones de auditoría P1–P3 (Fases 1–8) fueron implementadas y validadas. Referencia: `docs/EVIDENCIA_CORRECCIONES_AUDITORIA_2026.md`.
