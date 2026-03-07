# Plan ETAPA 5 — Trazabilidad y reportes

**Referencia:** nexus-plan-maestro-etapas.mdc  
**Objetivo Plan Maestro:** Garantizar auditabilidad completa. Reportes históricos por proyecto, sprint y usuario. Preparación para auditoría externa.  
**Estado:** Diseñado por PO MASTER — pendiente validación SYSTEM ARCHITECT

---

## Contexto

- **Objetivo:** Endpoints de solo lectura (GET) que agreguen datos existentes para trazabilidad y preparación para auditoría externa.
- **No se crean nuevas entidades ni tablas.** Se reutilizan Project, Feature, UserStory, Sprint, Release, Incident, Improvement, Document y la tabla `audit_logs` existente.
- **Módulo reports:** service que orquesta repositorios y modelos existentes; controller con Response Layer v1; rutas protegidas con RBAC.
- **Patrones:** controller → service → repository; buildSuccess, controllerUtils; sin lógica de negocio en controller.

---

## FASE 1 — Acceso a audit_logs (lectura)

### 1.1 Consultas de auditoría

La tabla `audit_logs` ya existe (user_id, action, entity, entity_id, metadata, request_id, ip_address, user_agent, created_at). No se modifican migraciones.

**Requisito:** Poder consultar audit_logs con filtros (user_id, entity, entity_id, rango de fechas) y paginación para los reportes.

**Opciones:**

- **A)** Añadir en `auth.repository.js` (o en un módulo compartido): `findAuditLogs(filters, pagination)` que reciba `{ user_id, entity, entity_id, from, to }` y `{ page, limit }`, y devuelva lista de registros + total.  
- **B)** Crear `report.repository.js` que use `getModels().AuditLog` y exponga `getAuditLogs(filters, pagination)`.

**Recomendación:** Crear módulo `reports` con `report.repository.js` que use getModels() para AuditLog y, si se necesita, otros modelos solo para lecturas agregadas. Mantiene el dominio de reportes separado de auth.

### 1.2 Índices (opcional)

Si el rendimiento lo requiere, valorar en una migración futura índices adicionales en `audit_logs` (por ejemplo `entity`, `created_at`). No obligatorio para esta etapa.

---

## FASE 2 — Reportes por proyecto

### 2.1 Resumen de proyecto

**Endpoint:** `GET /api/v1/reports/projects/:projectId/summary`

**Respuesta (ejemplo):**

- `project`: metadatos del proyecto (id, name, code, description, created_at, …).
- `counts`: objeto con totales del proyecto:
  - `features`: número de features del proyecto.
  - `userStories`: número de user stories (vía features del proyecto).
  - `sprints`: número de sprints del proyecto.
  - `incidents`: número de incidentes del proyecto.
  - `improvements`: número de mejoras con `project_id = projectId` (o vinculadas al proyecto según modelo).
  - `documents`: número de documentos con `project_id = projectId`.
- Opcional: `lastActivity`: fecha del último evento en `audit_logs` relacionado con el proyecto (por ejemplo entity = PROJECT y entity_id = projectId), si se implementa sin coste excesivo.

**Reglas:**

- Validar que el proyecto exista → 404 PROJECT_NOT_FOUND si no.
- **RBAC:** MASTER puede ver cualquier proyecto. EMPLOYEE: según política (por ejemplo solo proyectos en los que participa, o todos si la política es permisiva). Definir en implementación; si no hay política, MASTER y EMPLOYEE pueden ver todos los reportes de proyecto.

**Service:** `report.service.js` — `getProjectSummary(projectId, user)`. Usa project.repository (o getModels().Project) para obtener el proyecto; cuenta features, userStories (por features del proyecto), sprints, incidents, improvements, documents usando modelos o repos existentes. No modificar datos; solo lecturas.

---

## FASE 3 — Reportes por sprint

### 3.1 Resumen de sprint

**Endpoint:** `GET /api/v1/reports/sprints/:sprintId/summary`

**Respuesta (ejemplo):**

- `sprint`: metadatos del sprint (id, name, goal, status, project_id, start_date, end_date, closed_at, …).
- `project`: metadatos del proyecto al que pertenece el sprint (id, name, code).
- `stories`: lista de user stories asignadas al sprint (id, title, status, feature_id, …) o solo conteo `storiesCount` si se prefiere resumen ligero.
- `storiesCount`: número de user stories en el sprint.

**Reglas:**

- Validar que el sprint exista → 404 SPRINT_NOT_FOUND si no.
- **RBAC:** MASTER y EMPLOYEE (o restringir por proyecto si se define política).

**Service:** `getSprintSummary(sprintId, user)`. Usa sprint.repository y userStory (o modelos) para obtener sprint, proyecto y stories del sprint.

---

## FASE 4 — Reportes por usuario

### 4.1 Actividad de usuario

**Endpoint:** `GET /api/v1/reports/users/:userId/activity`

**Query params (opcional):** `page`, `limit`, `from`, `to` (fechas), `action` (filtrar por tipo de acción).

**Respuesta (ejemplo):**

- `user`: metadatos básicos del usuario (id, email, role; sin datos sensibles).
- `auditLogs`: lista paginada de registros de `audit_logs` donde `user_id = userId`, ordenados por `created_at` DESC.
- `pagination`: page, limit, total.

**Reglas:**

- Validar que el usuario exista → 404 NOT_FOUND si no.
- **RBAC:** MASTER puede ver actividad de cualquier usuario. EMPLOYEE solo puede ver su propia actividad (userId === req.user.id); si no → 403 AUTH_FORBIDDEN.

**Service:** `getUserActivity(userId, user, filters, pagination)`. Valida existencia del usuario y RBAC; llama a report.repository.getAuditLogs({ user_id: userId, ...filters }, pagination).

---

## FASE 5 — Reporte de auditoría (preparación auditoría externa)

### 5.1 Listado de auditoría con filtros

**Endpoint:** `GET /api/v1/reports/audit`

**Query params:** `entity` (opcional), `entity_id` (opcional), `user_id` (opcional), `from` (fecha ISO), `to` (fecha ISO), `page`, `limit`.

**Respuesta (ejemplo):**

- `auditLogs`: lista paginada de registros de `audit_logs` que cumplan los filtros, ordenados por `created_at` DESC.
- `pagination`: page, limit, total.

**Reglas:**

- **RBAC:** Solo **MASTER**. EMPLOYEE → 403 AUTH_FORBIDDEN (datos sensibles para auditoría externa).
- Filtros opcionales; si no se envían, listar con paginación (evitar respuestas sin límite).

**Service:** `getAuditLogs(user, filters, pagination)`. Comprobar rol MASTER; llamar a report.repository.getAuditLogs(filters, pagination).

---

## FASE 6 — Error codes y documentación

- Reutilizar códigos existentes donde aplique: PROJECT_NOT_FOUND, SPRINT_NOT_FOUND, NOT_FOUND, AUTH_FORBIDDEN.
- Si se añaden códigos específicos: REPORT_* (ej. REPORT_ACCESS_DENIED). No obligatorio si AUTH_FORBIDDEN es suficiente.
- Actualizar CONTRATO_API.md y openapi.yaml con los nuevos endpoints GET /reports/...

---

## FASE 7 — Estructura del módulo reports

### 7.1 Archivos

| Archivo | Propósito |
|---------|-----------|
| `src/modules/reports/report.repository.js` | getAuditLogs(filters, pagination); opcionalmente helpers de conteo por proyecto/sprint si se centralizan aquí. |
| `src/modules/reports/report.service.js` | getProjectSummary, getSprintSummary, getUserActivity, getAuditLogs. Orquesta modelos/repos (Project, Feature, UserStory, Sprint, Incident, Improvement, Document, AuditLog). |
| `src/modules/reports/report.controller.js` | GET handlers; buildSuccess, controllerUtils; sin lógica de negocio. |
| `src/modules/reports/report.validator.js` | Validación de query params (page, limit, from, to, entity, etc.) si se usa express-validator. |
| `src/modules/reports/report.routes.js` | GET /reports/projects/:projectId/summary, GET /reports/sprints/:sprintId/summary, GET /reports/users/:userId/activity, GET /reports/audit. |

### 7.2 Montaje de rutas

- En `v1.routes.js`: `router.use("/reports", reportRoutes)`.
- Rutas protegidas con authenticateMiddleware; autorización (MASTER/EMPLOYEE) en controller o middleware según política existente.

### 7.3 Auditoría

- Los endpoints de reportes son de **solo lectura**. No se exige crear registros en audit_logs por cada consulta (evitar ruido). Opcional: registrar acceso a GET /reports/audit si se considera crítico para trazabilidad.

---

## FASE 8 — QA

### 8.1 Suite reports

**Archivo:** `src/tests/integration/reports/reports.negative.test.js` (o similar).

Tests sugeridos:

- GET /reports/projects/:projectId/summary con projectId inexistente → 404.
- GET /reports/sprints/:sprintId/summary con sprintId inexistente → 404.
- GET /reports/users/:userId/activity con userId inexistente → 404.
- GET /reports/users/:otherUserId/activity como EMPLOYEE (otherUserId ≠ req.user.id) → 403.
- GET /reports/audit como EMPLOYEE → 403.
- GET /reports/audit como MASTER → 200 (con o sin filtros).
- Sin token → 401.

### 8.2 Regresión

- Ejecutar suites existentes (backlog, releases, changeRequests, sprints, incidents, improvements, documents, security, contract) y confirmar que siguen en verde.

---

## Resumen de endpoints

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | /api/v1/reports/projects/:projectId/summary | MASTER, EMPLOYEE* | Resumen proyecto + conteos |
| GET | /api/v1/reports/sprints/:sprintId/summary | MASTER, EMPLOYEE* | Resumen sprint + stories |
| GET | /api/v1/reports/users/:userId/activity | MASTER; EMPLOYEE solo propio | Actividad usuario (audit_logs) |
| GET | /api/v1/reports/audit | Solo MASTER | Listado auditoría con filtros |

\* Política EMPLOYEE para proyectos/sprints: definir en implementación (por defecto puede ser acceso a todos si no hay restricción por proyecto).

---

## Criterio de cierre

- Los cuatro endpoints implementados y documentados.
- report.repository y report.service usan solo lecturas (modelos/repos existentes y audit_logs).
- RBAC: EMPLOYEE no accede a GET /reports/audit; EMPLOYEE solo ve su propia actividad en GET /reports/users/:userId/activity.
- Response Layer v1 y controllerUtils en todos los endpoints.
- Tests de QA negativa en verde; regresión en verde.
- Sin nuevas migraciones obligatorias (salvo índices opcionales en audit_logs).
- Arquitectura controller → service → repository intacta.

---

## Archivos nuevos / modificados

| Tipo | Ruta |
|------|------|
| Nuevo | src/modules/reports/report.repository.js |
| Nuevo | src/modules/reports/report.service.js |
| Nuevo | src/modules/reports/report.controller.js |
| Nuevo | src/modules/reports/report.validator.js |
| Nuevo | src/modules/reports/report.routes.js |
| Modif | src/routes/v1.routes.js (montar reportRoutes) |
| Modif | docs/CONTRATO_API.md, docs/openapi.yaml |
| Nuevo | src/tests/integration/reports/reports.negative.test.js |

No se modifican loadModels ni migraciones (salvo mejora opcional de índices en audit_logs).
