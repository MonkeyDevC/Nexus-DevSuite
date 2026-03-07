# Plan ETAPA 3 siguiente — Gestión de Incidentes y Mejoras

**Referencia:** nexus-plan-maestro-etapas.mdc  
**Objetivo Plan Maestro:** Control de desviaciones y mejora continua. Entidades Incident (con análisis de causa raíz) e Improvement. Sistema formal de gestión de calidad.  
**Estado:** Diseñado por PO MASTER — pendiente validación SYSTEM ARCHITECT

---

## Contexto

- **Decisión Plan Maestro:** Solo el rol MASTER puede cerrar Sprints, aprobar documentos y **cerrar Incidentes formalmente**.
- **Incident:** Desviación o evento no deseado en un proyecto. Requiere análisis de causa raíz. Cierre formal solo por MASTER.
- **Improvement:** Propuesta de mejora (puede originarse de un Incident o ser independiente). Aprobación por MASTER.
- **Patrones a seguir:** workflow.constants.js, workflow.validator.js, módulos changeRequests/sprints (repository, service, controller), auditoría estructural.

---

## FASE 1 — Modelo y migraciones

### 1.1 Modelo Incident

**Archivo:** `src/modules/incidents/models/incident.model.js`

Campos:
- `id` (UUID PK)
- `project_id` (UUID FK projects, NOT NULL)
- `title` (STRING 255, obligatorio)
- `description` (TEXT nullable)
- `severity` (ENUM: LOW, MEDIUM, HIGH, CRITICAL)
- `status` (ENUM: OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- `root_cause_analysis` (TEXT nullable) — obligatorio antes de cierre formal
- `reported_by` (UUID FK users, NOT NULL)
- `assigned_to` (UUID FK users, nullable)
- `closed_by` (UUID FK users, nullable) — solo MASTER
- `closed_at` (DATE nullable)
- timestamps, paranoid: true

Tabla: `incidents`

### 1.2 Migración create-incidents

**Archivo:** `src/infrastructure/db/migrations/YYYYMMDDHHMMSS-create-incidents.js`

- Crear tabla `incidents` con los campos anteriores.
- Índices: `idx_incidents_project_id`, `idx_incidents_status`, `idx_incidents_reported_by`, `idx_incidents_closed_by`.
- FK project_id → projects.id **ON DELETE RESTRICT**.
- FK reported_by, assigned_to, closed_by → users.id.

### 1.3 Modelo Improvement

**Archivo:** `src/modules/improvements/models/improvement.model.js`

Campos:
- `id` (UUID PK)
- `project_id` (UUID FK projects, nullable) — mejora puede ser de proyecto o global
- `incident_id` (UUID FK incidents, nullable) — si la mejora surge de un incidente
- `title` (STRING 255, obligatorio)
- `description` (TEXT nullable)
- `status` (ENUM: DRAFT, PROPOSED, APPROVED, REJECTED, IMPLEMENTED)
- `proposed_by` (UUID FK users, NOT NULL)
- `approved_by` (UUID FK users, nullable) — solo MASTER puede aprobar/rechazar
- `approved_at` (DATE nullable)
- `implemented_at` (DATE nullable)
- timestamps, paranoid: true

Tabla: `improvements`

### 1.4 Migración create-improvements

**Archivo:** `src/infrastructure/db/migrations/YYYYMMDDHHMMSS-create-improvements.js`

- Crear tabla `improvements` con los campos anteriores.
- Índices: `idx_improvements_project_id`, `idx_improvements_incident_id`, `idx_improvements_status`, `idx_improvements_proposed_by`.
- FK project_id → projects.id ON DELETE SET NULL (mejora global si proyecto se borra).
- FK incident_id → incidents.id ON DELETE SET NULL.
- FK proposed_by, approved_by → users.id.

### 1.5 loadModels

- Cargar Incident, Improvement.
- Project.hasMany(Incident), Incident.belongsTo(Project).
- Incident.belongsTo(User) para reported_by, assigned_to, closed_by (alias: "reporter", "assignee", "closedByUser").
- Incident.hasMany(Improvement), Improvement.belongsTo(Incident).
- Improvement.belongsTo(Project), Improvement.belongsTo(User) para proposed_by, approved_by (alias: "proposer", "approver").
- Incluir ...incidentModels, ...improvementModels en cachedModels.

---

## FASE 2 — Workflow

### 2.1 Incident — Constantes

**Archivo:** `src/modules/incidents/incident.workflow.constants.js`

```js
TRANSITION_MAP_INCIDENT = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],   // solo MASTER
  CLOSED: []
};
```

### 2.2 Incident — Validador

**Archivo:** `src/modules/incidents/incident.workflow.validator.js`

- `validateIncidentTransition(currentStatus, nextStatus)` → AppError INCIDENT_INVALID_TRANSITION si no permitida.
- Regla de cierre: RESOLVED → CLOSED **solo MASTER**. EMPLOYEE → 403 INCIDENT_CLOSE_MASTER_ONLY.
- Opcional: validar que root_cause_analysis esté presente al pasar a RESOLVED o CLOSED (según criterio de negocio).

### 2.3 Improvement — Constantes

**Archivo:** `src/modules/improvements/improvement.workflow.constants.js`

```js
TRANSITION_MAP_IMPROVEMENT = {
  DRAFT: ["PROPOSED"],
  PROPOSED: ["APPROVED", "REJECTED"],  // solo MASTER
  APPROVED: ["IMPLEMENTED"],
  REJECTED: [],
  IMPLEMENTED: []
};
```

### 2.4 Improvement — Validador

**Archivo:** `src/modules/improvements/improvement.workflow.validator.js`

- `validateImprovementTransition(currentStatus, nextStatus)` → AppError IMPROVEMENT_INVALID_TRANSITION.
- PROPOSED → APPROVED | REJECTED **solo MASTER**. EMPLOYEE → 403 IMPROVEMENT_APPROVE_MASTER_ONLY.

---

## FASE 3 — Reglas de dominio

### Incident
- Pertenece a un Project (project_id NOT NULL).
- CLOSED: no permitir cambio de status ni edición de datos sensibles.
- Cierre RESOLVED → CLOSED: solo MASTER (403 si EMPLOYEE).
- Al cerrar: closed_by = user.id, closed_at = new Date().
- root_cause_analysis: recomendado al pasar a RESOLVED; puede exigirse antes de CLOSED (definir en implementación).

### Improvement
- project_id nullable (mejora global) o vinculada a proyecto.
- incident_id nullable (mejora surgida de incidente o independiente).
- PROPOSED → APPROVED | REJECTED: solo MASTER.
- APPROVED → IMPLEMENTED: tras aplicar la mejora (manual o integración futura).
- REJECTED e IMPLEMENTED sin salida.

---

## FASE 4 — Error codes

Añadir en errorCodes.js:
- INCIDENT_NOT_FOUND
- INCIDENT_INVALID_TRANSITION
- INCIDENT_CLOSED
- INCIDENT_CLOSE_MASTER_ONLY
- IMPROVEMENT_NOT_FOUND
- IMPROVEMENT_INVALID_TRANSITION
- IMPROVEMENT_APPROVE_MASTER_ONLY
- IMPROVEMENT_CLOSED (status REJECTED o IMPLEMENTED)

Documentar en CONTRATO_API.md y openapi.yaml.

---

## FASE 5 — Repository, Service, Controller

### Incident
- **Repository:** create, findById, list (por project_id, status, paginado), update.
- **Service:** createIncident, getIncidentById, listIncidents, updateIncidentStatus (workflow; cierre solo MASTER).
- **Controller:** buildSuccess, controllerUtils (buildContext, assertRequestValid), Response Layer v1.

### Improvement
- **Repository:** create, findById, list (por project_id, incident_id, status, paginado), update.
- **Service:** createImprovement, getImprovementById, listImprovements, updateImprovementStatus (workflow; aprobación/rechazo solo MASTER).
- **Controller:** buildSuccess, controllerUtils, Response Layer v1.

---

## FASE 6 — Auditoría

### Incident
- INCIDENT_CREATED (entity: INCIDENT, entity_id).
- STATUS_CHANGE (entity: INCIDENT, metadata: from, to).
- INCIDENT_CLOSED (al cerrar; metadata: closed_by, closed_at).

### Improvement
- IMPROVEMENT_CREATED (entity: IMPROVEMENT, entity_id).
- STATUS_CHANGE (entity: IMPROVEMENT, metadata: from, to).
- IMPROVEMENT_APPROVED / IMPROVEMENT_REJECTED (metadata: approved_by, approved_at).

Campos obligatorios: user_id, request_id, entity, entity_id, action, metadata, ip_address, user_agent.

---

## FASE 7 — Rutas

Base: `/api/v1`

### Incidents
- POST /projects/:projectId/incidents — MASTER, EMPLOYEE (body: title, description, severity)
- GET /projects/:projectId/incidents — MASTER, EMPLOYEE (listado, ?status=, paginado)
- GET /incidents/:id — MASTER, EMPLOYEE
- PATCH /incidents/:id/status — MASTER para RESOLVED→CLOSED; MASTER y EMPLOYEE para OPEN→IN_PROGRESS, IN_PROGRESS→RESOLVED (body: status, root_cause_analysis opcional)
- PATCH /incidents/:id — MASTER, EMPLOYEE (asignación, root_cause_analysis; solo si no CLOSED)

Montar rutas anidadas POST/GET /projects/:projectId/incidents en projects.routes.js. Resto en v1: router.use("/incidents", incidentRoutes).

### Improvements
- POST /improvements — MASTER, EMPLOYEE (body: project_id opcional, incident_id opcional, title, description)
- GET /improvements — MASTER, EMPLOYEE (?project_id=, ?incident_id=, ?status=, paginado)
- GET /improvements/:id — MASTER, EMPLOYEE
- PATCH /improvements/:id/status — MASTER para PROPOSED→APPROVED|REJECTED; proposed_by o MASTER para DRAFT→PROPOSED; APPROVED→IMPLEMENTED (según política)

Montar en v1: router.use("/improvements", improvementRoutes).

---

## FASE 8 — QA

### Suite Incident
**Archivo:** `src/tests/integration/incidents/incidents.negative.test.js`

Tests sugeridos:
- Crear incident en proyecto inexistente → 404
- Transición inválida (OPEN → CLOSED) → 400 INCIDENT_INVALID_TRANSITION
- EMPLOYEE intenta cerrar (RESOLVED → CLOSED) → 403 INCIDENT_CLOSE_MASTER_ONLY
- MASTER cierra incident → 200
- Actualizar status de incident CLOSED → 400 INCIDENT_CLOSED
- Incident inexistente → 404

### Suite Improvement
**Archivo:** `src/tests/integration/improvements/improvements.negative.test.js`

Tests sugeridos:
- Improvement inexistente → 404
- Transición inválida (DRAFT → APPROVED) → 400 IMPROVEMENT_INVALID_TRANSITION
- EMPLOYEE intenta aprobar/rechazar (PROPOSED → APPROVED) → 403 IMPROVEMENT_APPROVE_MASTER_ONLY
- MASTER aprueba/rechaza → 200
- Cambio de status en IMPLEMENTED o REJECTED → 400

### Regresión
- backlog, releases, changeRequests, sprints en verde.

---

## Archivos nuevos / modificados

| Tipo | Ruta |
|------|------|
| Nuevo | src/modules/incidents/models/incident.model.js |
| Nuevo | src/modules/incidents/models/index.js |
| Nuevo | src/modules/incidents/incident.workflow.constants.js |
| Nuevo | src/modules/incidents/incident.workflow.validator.js |
| Nuevo | src/modules/incidents/incident.repository.js |
| Nuevo | src/modules/incidents/incident.service.js |
| Nuevo | src/modules/incidents/incident.controller.js |
| Nuevo | src/modules/incidents/incident.validator.js |
| Nuevo | src/modules/incidents/incident.routes.js |
| Nuevo | src/modules/improvements/models/improvement.model.js |
| Nuevo | src/modules/improvements/models/index.js |
| Nuevo | src/modules/improvements/improvement.workflow.constants.js |
| Nuevo | src/modules/improvements/improvement.workflow.validator.js |
| Nuevo | src/modules/improvements/improvement.repository.js |
| Nuevo | src/modules/improvements/improvement.service.js |
| Nuevo | src/modules/improvements/improvement.controller.js |
| Nuevo | src/modules/improvements/improvement.validator.js |
| Nuevo | src/modules/improvements/improvement.routes.js |
| Nuevo | Migraciones create-incidents, create-improvements |
| Modif | src/infrastructure/db/loadModels.js |
| Modif | src/shared/errors/errorCodes.js |
| Modif | src/modules/backlog/projects.routes.js (rutas anidadas incidents) |
| Modif | src/routes/v1.routes.js (incidents, improvements) |
| Modif | docs/CONTRATO_API.md, docs/openapi.yaml |
| Nuevo | src/tests/integration/incidents/incidents.negative.test.js |
| Nuevo | src/tests/integration/improvements/improvements.negative.test.js |

---

## Criterio de cierre

- Todas las fases implementadas.
- Tests en verde; 0 respuestas 500.
- Solo MASTER puede cerrar incidentes (RESOLVED → CLOSED) y aprobar/rechazar mejoras (PROPOSED → APPROVED | REJECTED).
- Auditoría generada para incidentes y mejoras.
- Response Layer v1 y controllerUtils en todos los endpoints.
- Arquitectura controller → service → repository intacta.
- Regresión: backlog, releases, changeRequests, sprints en verde.
