# Auditoría de código — Mejoras necesarias — NEXUS DevSuite

**Fecha:** 2026-03-03  
**Objetivo:** Identificar mejoras necesarias para alinear el código con estándares enterprise, gobernanza y criterios ISO 9001.  
**Base:** Análisis del código, reglas de gobernanza (nexus-engineering-execution, nexus-contexto-arquitectonico) y auditoría previa.

---

## Resumen ejecutivo

El proyecto cumple en general con la arquitectura y las reglas definidas. Se identifican **mejoras prioritarias** en Response Layer v1, deuda técnica en auth.repository y cobertura de QA. No hay TODOs pendientes ni uso de console.log en producción.

---

## 1. Mejoras de alta prioridad (P1)

### 1.1 auth.repository — revoked vs revoked_at

| Aspecto | Detalle |
|---------|---------|
| **Problema** | `auth.repository.js` usa `revoked: true` y `revoked: false`; el esquema actual usa `revoked_at`. |
| **Ubicación** | `src/modules/auth/auth.repository.js` líneas 42, 48 |
| **Impacto** | `revokeRefreshToken` y `findRefreshTokenByHash` son código muerto o incorrecto. El flujo activo usa `refreshToken.repository.js` con `revoked_at`. |
| **Riesgo** | Si alguien reutiliza auth.repository, fallaría. |

**Recomendación:** Eliminar `revokeRefreshToken` y `findRefreshTokenByHash` de auth.repository (no se usan) o adaptarlos a `revoked_at`. Revisar `users.service.invalidateUserRefreshTokens` que tiene workaround para ambos campos.

---

### 1.2 Response Layer v1 — Auth y Users sin envelope

| Aspecto | Detalle |
|---------|---------|
| **Problema** | Auth (login, refresh) y Users devuelven objetos directos sin `success`, `data`, `meta.request_id`, `meta.timestamp`. |
| **Ubicación** | `auth.controller.js`, `users.controller.js` |
| **Impacto** | Inconsistencia contractual; clientes deben manejar dos formatos de respuesta. |
| **Estándar** | nexus-engineering-execution exige Response Layer v1 en todos los endpoints. |

**Recomendación:** Envolver respuestas de auth y users con `buildSuccess(data, { request_id })`. Mantener compatibilidad con clientes existentes si aplica (versionado).

---

## 2. Mejoras de prioridad media (P2)

### 2.1 Response Layer v1 — Health, Context, Metrics

| Aspecto | Detalle |
|---------|---------|
| **Problema** | Health, context (me, admin/test) y metrics devuelven objetos directos sin envelope. |
| **Ubicación** | `health.controller.js`, `context.controller.js`, `metrics.controller.js` |
| **Impacto** | Inconsistencia con contrato API. |

**Recomendación:** Aplicar `buildSuccess` en estos endpoints. Health puede mantener estructura mínima para health checks externos si se documenta como excepción.

---

### 2.2 Validaciones en users.controller

| Aspecto | Detalle |
|---------|---------|
| **Problema** | Validaciones `!user`, `!updatedUser`, `!deleted` y lanzamiento de AppError en el controller. |
| **Ubicación** | `users.controller.js` líneas 36-40, 71-75, 88-92 |
| **Impacto** | Lógica de negocio en controller; viola separación Controller → Service. |

**Recomendación:** Mover estas validaciones al `users.service`; el controller solo delega y maneja la respuesta.

---

### 2.3 entity_id en auditoría de assignFeatureToRelease

| Aspecto | Detalle |
|---------|---------|
| **Problema** | `entity_id` en auditoría de FEATURE_ASSIGN_RELEASE podría usar el ID de la entidad en lugar de un valor genérico. |
| **Ubicación** | `release.service.js` línea ~194 |
| **Impacto** | Trazabilidad menos precisa. |

**Recomendación:** Usar `feature_id` o `release_id` como `entity_id` para mantener trazabilidad correcta.

---

### 2.4 Tests — QA de contrato y seguridad

| Aspecto | Detalle |
|---------|---------|
| **Problema** | No hay tests explícitos de `X-Response-Version`; no hay suite dedicada de QA de seguridad (401/403, RBAC, IDs manipulados). |
| **Impacto** | Cobertura incompleta según nexus-engineering-execution (6 niveles de QA). |

**Recomendación:** Añadir tests que verifiquen `res.headers['x-response-version'] === '1'`. Crear suite `security.qa.test.js` con 401 sin token, 403 con rol incorrecto, acceso a recursos ajenos.

---

## 3. Mejoras de prioridad baja (P3)

### 3.1 Duplicación de buildContext y assertRequestValid

| Aspecto | Detalle |
|---------|---------|
| **Problema** | `buildContext` y `assertRequestValid` duplicados en backlog.controller, release.controller, changeRequest.controller, auth.controller. |
| **Impacto** | Mantenibilidad; riesgo de divergencia. |

**Recomendación:** Extraer a `shared/controllerUtils.js` o similar.

---

### 3.2 Documentación de excepciones al Response Layer

| Aspecto | Detalle |
|---------|---------|
| **Problema** | CONTRATO_API.md indica que algunos endpoints pueden no usar envelope pero no lista cuáles. |
| **Ubicación** | `docs/CONTRATO_API.md` |
| **Impacto** | Ambigüedad para consumidores de la API. |

**Recomendación:** Documentar explícitamente los endpoints que no usan envelope y el plan de migración.

---

## 4. Áreas que cumplen correctamente

| Área | Estado |
|------|--------|
| **Arquitectura Controller → Service → Repository** | ✅ En backlog, releases, changeRequests, auth (salvo users.controller) |
| **AppError y códigos contractuales** | ✅ Uso consistente |
| **Migraciones** | ✅ snake_case, no modificadas, incrementales |
| **Auditoría estructural** | ✅ createAuditLog con entity, entity_id, action, metadata, request_id |
| **RBAC y seguridad** | ✅ Endpoints protegidos, métricas solo MASTER |
| **Tests negativos** | ✅ backlog, releases, changeRequests |
| **Sin console.log** | ✅ |
| **Sin TODOs pendientes** | ✅ |

---

## 5. Plan de acción sugerido

| Fase | Acciones | Esfuerzo estimado |
|------|----------|-------------------|
| **Fase 1** | Corregir auth.repository (eliminar código muerto o adaptar revoked_at) | Bajo |
| **Fase 2** | Unificar Response Layer v1 en auth y users | Medio |
| **Fase 3** | Aplicar Response Layer v1 en health, context, metrics | Bajo |
| **Fase 4** | Mover validaciones de users.controller al service | Bajo |
| **Fase 5** | Extraer buildContext y assertRequestValid a módulo compartido | Bajo |
| **Fase 6** | Añadir tests de contrato (X-Response-Version) y QA de seguridad | Medio |
| **Fase 7** | Corregir entity_id en auditoría assignFeatureToRelease | Bajo |

---

## 6. Criterios de cierre de auditoría

La auditoría se considera **CERRADA** (2026-03-05):

- [x] auth.repository alineado con revoked_at o código muerto eliminado
- [x] Auth y Users usan Response Layer v1
- [x] Health, context, metrics documentados o migrados a Response Layer v1
- [x] Validaciones de users en service
- [x] Tests de X-Response-Version y suite de seguridad creados
- [x] entity_id corregido en assignFeatureToRelease
- [x] CONTRATO_API.md actualizado con excepciones documentadas

**Auditoría de cierre:** QA ENGINEER validó (docs/QA_VALIDACION_CORRECCIONES_AUDITORIA_2026.md). PO MASTER aprobó cierre.

---

*Documento generado tras auditoría de código. Cierre aprobado 2026-03-05.*
