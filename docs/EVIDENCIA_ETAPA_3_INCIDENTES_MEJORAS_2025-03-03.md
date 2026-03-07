# Evidencia de implementación — ETAPA 3 Gestión de Incidentes y Mejoras

**Documento:** Evidencia de cierre ETAPA 3  
**Nombre de etapa:** ETAPA 3 — Gestión de Incidentes y Mejoras  
**Fecha de generación:** 2025-03-03  
**Referencia:** `docs/PLAN_ETAPA_3_INCIDENTES_MEJORAS.md`, `docs/PROMPT_MASTER_DEVELOPER_ETAPA_3_INCIDENTES_MEJORAS.md`, `docs/VALIDACION_ARQUITECTONICA_ETAPA_3_INCIDENTES_MEJORAS.md`

---

## 1. Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `src/modules/incidents/models/incident.model.js` | Modelo Incident (OPEN, IN_PROGRESS, RESOLVED, CLOSED), severity, root_cause_analysis, paranoid |
| `src/modules/incidents/models/index.js` | Índice de modelos incidents |
| `src/infrastructure/db/migrations/20260307100003-create-incidents.js` | Tabla incidents, FK project_id ON DELETE RESTRICT |
| `src/modules/improvements/models/improvement.model.js` | Modelo Improvement (DRAFT, PROPOSED, APPROVED, REJECTED, IMPLEMENTED), paranoid |
| `src/modules/improvements/models/index.js` | Índice de modelos improvements |
| `src/infrastructure/db/migrations/20260307100004-create-improvements.js` | Tabla improvements, project_id/incident_id ON DELETE SET NULL |
| `src/modules/incidents/incident.workflow.constants.js` | TRANSITION_MAP_INCIDENT |
| `src/modules/incidents/incident.workflow.validator.js` | validateIncidentTransition |
| `src/modules/improvements/improvement.workflow.constants.js` | TRANSITION_MAP_IMPROVEMENT |
| `src/modules/improvements/improvement.workflow.validator.js` | validateImprovementTransition |
| `src/modules/incidents/incident.repository.js` | create, findById, list, update |
| `src/modules/incidents/incident.service.js` | createIncident, getIncidentById, listIncidents, updateIncidentStatus, updateIncident (PATCH), root_cause obligatorio antes de CLOSED |
| `src/modules/incidents/incident.controller.js` | Controladores con buildSuccess y controllerUtils |
| `src/modules/incidents/incident.validator.js` | Validadores de entrada |
| `src/modules/incidents/incident.routes.js` | Rutas bajo /incidents |
| `src/modules/improvements/improvement.repository.js` | create, findById, list, update |
| `src/modules/improvements/improvement.service.js` | createImprovement (validación incident_id/project_id), getImprovementById, listImprovements, updateImprovementStatus (DRAFT→PROPOSED solo propietario/MASTER; PROPOSED→APPROVED\|REJECTED y APPROVED→IMPLEMENTED solo MASTER) |
| `src/modules/improvements/improvement.controller.js` | Controladores con buildSuccess y controllerUtils |
| `src/modules/improvements/improvement.validator.js` | Validadores de entrada |
| `src/modules/improvements/improvement.routes.js` | Rutas bajo /improvements |
| `src/tests/integration/incidents/incidents.negative.test.js` | Suite QA negativo incidentes (7 tests) |
| `src/tests/integration/improvements/improvements.negative.test.js` | Suite QA negativo mejoras (6 tests) |

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/infrastructure/db/loadModels.js` | Carga Incident, Improvement; relaciones Project–Incident, User–Incident (reporter, assignee, closedByUser), Incident–Improvement, Improvement–Project, User–Improvement (proposer, approver) |
| `src/shared/errors/errorCodes.js` | INCIDENT_*, IMPROVEMENT_* (INCIDENT_ROOT_CAUSE_REQUIRED, IMPROVEMENT_CLOSED, etc.) |
| `docs/CONTRATO_API.md` | Códigos de error de incidentes y mejoras |
| `docs/openapi.yaml` | Enum de códigos de error incident/improvement |
| `src/modules/backlog/projects.routes.js` | Rutas anidadas GET/POST `/projects/:projectId/incidents` |
| `src/routes/v1.routes.js` | `router.use("/incidents", incidentRoutes)`, `router.use("/improvements", improvementRoutes)` |

---

## 3. Migraciones aplicadas

- **20260307100003-create-incidents:** tabla incidents, índices, FK project_id ON DELETE RESTRICT, FKs a users.
- **20260307100004-create-improvements:** tabla improvements, índices, FK project_id ON DELETE SET NULL, FK incident_id ON DELETE SET NULL, FKs a users.

---

## 4. API implementada

### Incidents

| Método | Endpoint | Roles | Propósito |
|--------|----------|-------|-----------|
| POST | `/api/v1/projects/:projectId/incidents` | MASTER, EMPLOYEE | Crear incidente |
| GET | `/api/v1/projects/:projectId/incidents` | MASTER, EMPLOYEE | Listar incidentes (query: status, page, limit) |
| GET | `/api/v1/incidents/:id` | MASTER, EMPLOYEE | Obtener incidente |
| PATCH | `/api/v1/incidents/:id/status` | MASTER, EMPLOYEE (cierre solo MASTER) | Cambiar estado (root_cause_analysis opcional en body) |
| PATCH | `/api/v1/incidents/:id` | MASTER, EMPLOYEE | Actualizar assigned_to, root_cause_analysis (solo si no CLOSED) |

### Improvements

| Método | Endpoint | Roles | Propósito |
|--------|----------|-------|-----------|
| POST | `/api/v1/improvements` | MASTER, EMPLOYEE | Crear mejora (project_id, incident_id opcionales) |
| GET | `/api/v1/improvements` | MASTER, EMPLOYEE | Listar (?project_id=, ?incident_id=, ?status=, paginado) |
| GET | `/api/v1/improvements/:id` | MASTER, EMPLOYEE | Obtener mejora |
| PATCH | `/api/v1/improvements/:id/status` | MASTER, EMPLOYEE (DRAFT→PROPOSED solo propietario/MASTER; aprobación/IMPLEMENTED solo MASTER) | Cambiar estado |

---

## 5. Reglas de dominio verificadas

### Incident

- Pertenece a Project (project_id NOT NULL).
- CLOSED: no permitir cambio de status ni actualización vía PATCH.
- RESOLVED→CLOSED: solo MASTER (403 INCIDENT_CLOSE_MASTER_ONLY si EMPLOYEE).
- **root_cause_analysis no vacío obligatorio antes de RESOLVED→CLOSED** (400 INCIDENT_ROOT_CAUSE_REQUIRED).
- Al cerrar: closed_by = user.id, closed_at = new Date().

### Improvement

- project_id e incident_id opcionales (mejora global o ligada a incidente).
- Al crear con incident_id: se valida que el incidente exista; si project_id y incident.project_id están presentes, deben coincidir.
- DRAFT→PROPOSED: solo proposed_by o MASTER (validación en service).
- PROPOSED→APPROVED|REJECTED: solo MASTER.
- APPROVED→IMPLEMENTED: solo MASTER (EMPLOYEE → 403).
- REJECTED e IMPLEMENTED sin salida (IMPROVEMENT_CLOSED).

---

## 6. Auditoría

### Incident

- INCIDENT_CREATED (entity: INCIDENT).
- STATUS_CHANGE (entity: INCIDENT, metadata: from, to).
- INCIDENT_CLOSED (metadata: closed_by, closed_at).

### Improvement

- IMPROVEMENT_CREATED (entity: IMPROVEMENT).
- STATUS_CHANGE (entity: IMPROVEMENT, metadata: from, to).
- IMPROVEMENT_APPROVED / IMPROVEMENT_REJECTED (metadata: approved_by, approved_at).

Campos: user_id, request_id, entity, entity_id, action, metadata, ip_address, user_agent.

---

## 7. Resultado de QA

- **incidents.negative.test.js:** 7/7 pasando (proyecto inexistente 404, transición inválida 400, EMPLOYEE cierra 403, MASTER cierra 200, actualizar CLOSED 400, root_cause vacío 400, incidente inexistente 404).
- **improvements.negative.test.js:** 6/6 pasando (inexistente 404, transición inválida 400, EMPLOYEE aprueba 403, MASTER aprueba 200, cambio en IMPLEMENTED 400 IMPROVEMENT_CLOSED, EMPLOYEE IMPLEMENTED 403).

**Comando de verificación:**

```bash
$env:NODE_ENV="development"; npm test -- --testPathPattern="incidents.negative|improvements.negative" --runInBand --forceExit
```

---

## 8. Criterios de cierre

- [x] Todos los tests de incidentes y mejoras ejecutan y pasan.
- [x] 0 omitidos, 0 respuestas 500 en flujos esperados.
- [x] Arquitectura controller → service → repository intacta.
- [x] Migraciones 20260307100003 y 20260307100004 ejecutables en BD limpia.
- [x] updateIncident (PATCH /incidents/:id) implementado; root_cause_analysis obligatorio antes de CLOSED.
- [x] Solo MASTER cierra incidentes (RESOLVED→CLOSED) y aprueba/rechaza mejoras (PROPOSED→APPROVED|REJECTED); solo MASTER marca IMPLEMENTED.
- [x] Auditoría generada (INCIDENT_*, IMPROVEMENT_*).
- [x] Response Layer v1 y controllerUtils en todos los endpoints.

---

**Nomenclatura del archivo:** `EVIDENCIA_ETAPA_3_INCIDENTES_MEJORAS_<YYYY-MM-DD>.md`
