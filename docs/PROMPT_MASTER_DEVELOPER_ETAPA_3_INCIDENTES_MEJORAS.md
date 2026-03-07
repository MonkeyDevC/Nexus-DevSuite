# Prompt de implementación — ETAPA 3 siguiente Gestión de Incidentes y Mejoras

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_3_INCIDENTES_MEJORAS.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_3_INCIDENTES_MEJORAS.md  
**Estructura:** nexus-engineering-execution.mdc

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 3 siguiente — Gestión de Incidentes y Mejoras** siguiendo estrictamente el plan `docs/PLAN_ETAPA_3_INCIDENTES_MEJORAS.md`.

**Propósito:** Control de desviaciones y mejora continua. Entidad Incident (con análisis de causa raíz), entidad Improvement. Cierre formal de incidentes solo por MASTER; aprobación/rechazo de mejoras solo por MASTER. Sistema formal de gestión de calidad.

---

## 2️⃣ REGLAS INNEGOCIABLES

- No romper arquitectura controller → service → repository.
- No usar sequelize.sync().
- No modificar migraciones previas.
- No crear endpoints fuera del plan.
- No introducir lógica de negocio en controllers.
- Cero respuestas 500 en flujos esperados.
- No dejar TODOs pendientes.
- Response Layer v1 en todos los endpoints (buildSuccess).
- Usar controllerUtils (buildContext, assertRequestValid).
- snake_case en BD.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Modelo y migraciones

1. Crear `src/modules/incidents/models/incident.model.js` (id, project_id, title, description, severity, status OPEN|IN_PROGRESS|RESOLVED|CLOSED, root_cause_analysis, reported_by, assigned_to, closed_by, closed_at, timestamps, paranoid).
2. Crear `src/modules/incidents/models/index.js`.
3. **Migración `20260307100003-create-incidents.js`** — tabla incidents, índices, FK project_id **ON DELETE RESTRICT**, FKs a users.
4. Crear `src/modules/improvements/models/improvement.model.js` (id, project_id nullable, incident_id nullable, title, description, status DRAFT|PROPOSED|APPROVED|REJECTED|IMPLEMENTED, proposed_by, approved_by, approved_at, implemented_at, timestamps, paranoid).
5. Crear `src/modules/improvements/models/index.js`.
6. **Migración `20260307100004-create-improvements.js`** — tabla improvements, índices, FK project_id ON DELETE SET NULL, FK incident_id ON DELETE SET NULL, FKs a users.
7. Actualizar `loadModels.js`: Incident, Improvement; Project.hasMany(Incident), Incident.belongsTo(Project); Incident.belongsTo(User) alias "reporter","assignee","closedByUser"; Incident.hasMany(Improvement), Improvement.belongsTo(Incident); Improvement.belongsTo(Project); Improvement.belongsTo(User) alias "proposer","approver". **Incluir ...incidentModels, ...improvementModels en cachedModels.** Orden: Incident antes que Improvement.

### FASE 2 — Workflow

8. Crear `incident.workflow.constants.js` (TRANSITION_MAP_INCIDENT) y `incident.workflow.validator.js` (validateIncidentTransition; RESOLVED→CLOSED solo MASTER).
9. Crear `improvement.workflow.constants.js` (TRANSITION_MAP_IMPROVEMENT) y `improvement.workflow.validator.js` (validateImprovementTransition; PROPOSED→APPROVED|REJECTED solo MASTER).

### FASE 3 — Error codes y documentación

10. Añadir en errorCodes.js: INCIDENT_NOT_FOUND, INCIDENT_INVALID_TRANSITION, INCIDENT_CLOSED, INCIDENT_CLOSE_MASTER_ONLY, INCIDENT_ROOT_CAUSE_REQUIRED (para RESOLVED→CLOSED sin root_cause), IMPROVEMENT_NOT_FOUND, IMPROVEMENT_INVALID_TRANSITION, IMPROVEMENT_APPROVE_MASTER_ONLY, IMPROVEMENT_CLOSED.
11. Actualizar CONTRATO_API.md y openapi.yaml.

### FASE 4 — Repository, Service, Controller (Incident)

12. Crear `incident.repository.js`: create, findById, list (por project_id, status, paginado), update.
13. Crear `incident.service.js`: createIncident, getIncidentById, listIncidents, **updateIncidentStatus** (workflow; RESOLVED→CLOSED solo MASTER), **updateIncident** (PATCH /incidents/:id: validar no CLOSED; actualizar assigned_to y/o root_cause_analysis; auditoría si aplica).
14. **Regla root_cause_analysis:** Exigir `root_cause_analysis` no vacío antes de permitir transición RESOLVED→CLOSED. Si está vacío → 400 o código específico (ej. INCIDENT_ROOT_CAUSE_REQUIRED).
15. Crear incident.controller.js, incident.validator.js, incident.routes.js.

### FASE 5 — Repository, Service, Controller (Improvement)

16. Crear `improvement.repository.js`: create, findById, list (por project_id, incident_id, status, paginado), update.
17. Crear `improvement.service.js`: createImprovement, getImprovementById, listImprovements, updateImprovementStatus (workflow; PROPOSED→APPROVED|REJECTED solo MASTER; **DRAFT→PROPOSED:** validar que el usuario sea `proposed_by` o tenga rol MASTER — validación en service, no en controller). **Al crear Improvement con incident_id:** validar que el incident exista; si project_id e incident.project_id están presentes, validar que coincidan.
18. **APPROVED→IMPLEMENTED:** Definir en implementación: **solo MASTER** puede marcar IMPLEMENTED (consistencia con cierre de incidentes). EMPLOYEE → 403 si intenta.
19. Crear improvement.controller.js, improvement.validator.js, improvement.routes.js.

### FASE 6 — Auditoría

20. Incident: INCIDENT_CREATED, STATUS_CHANGE (entity INCIDENT), INCIDENT_CLOSED (al cerrar). Improvement: IMPROVEMENT_CREATED, STATUS_CHANGE (entity IMPROVEMENT), IMPROVEMENT_APPROVED / IMPROVEMENT_REJECTED. Campos: user_id, request_id, entity, entity_id, action, metadata, ip_address, user_agent.

### FASE 7 — Rutas y montaje

21. **Incidents:** POST/GET /projects/:projectId/incidents → montar en `projects.routes.js`. GET /incidents/:id, PATCH /incidents/:id/status, PATCH /incidents/:id → v1.routes.js con `router.use("/incidents", incidentRoutes)`.
22. **Improvements:** POST /improvements, GET /improvements, GET /improvements/:id, PATCH /improvements/:id/status → v1.routes.js con `router.use("/improvements", improvementRoutes)`.

### FASE 8 — QA

23. Crear `src/tests/integration/incidents/incidents.negative.test.js` (proyecto inexistente 404, transición inválida 400, EMPLOYEE cierra 403, MASTER cierra 200, actualizar CLOSED 400, incident inexistente 404; opcional: root_cause vacío antes de CLOSED 400).
24. Crear `src/tests/integration/improvements/improvements.negative.test.js` (improvement inexistente 404, transición inválida 400, EMPLOYEE aprueba 403, MASTER aprueba 200, cambio en IMPLEMENTED/REJECTED 400; opcional: DRAFT→PROPOSED por otro usuario 403).
25. Verificar regresión: backlog, releases, changeRequests, sprints en verde.

---

## 4️⃣ REGLAS DE DOMINIO CRÍTICAS

### Incident
- Pertenece a Project (project_id NOT NULL).
- CLOSED: no permitir cambio de status ni actualización vía updateIncident.
- RESOLVED→CLOSED: solo MASTER (403 INCIDENT_CLOSE_MASTER_ONLY si EMPLOYEE).
- **root_cause_analysis no vacío obligatorio antes de RESOLVED→CLOSED.**
- Al cerrar: closed_by = user.id, closed_at = new Date().

### Improvement
- project_id nullable (mejora global); incident_id nullable (origen en incidente o independiente).
- Al crear con incident_id: validar que el incident exista; si project_id y incident.project_id presentes, deben coincidir.
- DRAFT→PROPOSED: solo el usuario `proposed_by` o MASTER (validación en service).
- PROPOSED→APPROVED|REJECTED: solo MASTER.
- APPROVED→IMPLEMENTED: solo MASTER.
- REJECTED e IMPLEMENTED sin salida.

---

## 5️⃣ AUDITORÍA OBLIGATORIA

- INCIDENT_CREATED, STATUS_CHANGE (INCIDENT), INCIDENT_CLOSED.
- IMPROVEMENT_CREATED, STATUS_CHANGE (IMPROVEMENT), IMPROVEMENT_APPROVED, IMPROVEMENT_REJECTED.

entity, entity_id, action, metadata, request_id, ip_address, user_agent.

---

## 6️⃣ QA OBLIGATORIA (6 niveles)

- **Funcional:** Crear incident/improvement, transiciones válidas, cierre incident (MASTER), aprobación mejora (MASTER).
- **Dominio:** Workflows respetados; root_cause obligatorio antes de CLOSED; DRAFT→PROPOSED solo propietario/MASTER.
- **Negativa:** Casos del plan (404, 400, 403).
- **Regresión:** backlog, releases, changeRequests, sprints en verde.
- **Seguridad:** EMPLOYEE no cierra incident → 403; EMPLOYEE no aprueba mejora → 403.
- **Contrato:** X-Response-Version, envelope Response Layer v1.

---

## 7️⃣ CRITERIO DE CIERRE

- Todos los tests ejecutan (incidents, improvements, regresión).
- 0 omitidos, 0 respuestas 500.
- Arquitectura intacta.
- Migraciones 20260307100003 y 20260307100004 ejecutables en BD limpia.
- updateIncident (PATCH /incidents/:id) implementado; root_cause_analysis obligatorio antes de CLOSED.
- Solo MASTER cierra incidentes y aprueba/rechaza mejoras; solo MASTER marca IMPLEMENTED.
- Auditoría generada.
- Response Layer v1 en todos los endpoints.

---

## 8️⃣ EVIDENCIA OBLIGATORIA

**Entrega en archivo:** La evidencia debe entregarse en un archivo en `docs/` con la siguiente nomenclatura:

```
EVIDENCIA_ETAPA_3_INCIDENTES_MEJORAS_<YYYY-MM-DD>.md
```

**Ejemplo:** `docs/EVIDENCIA_ETAPA_3_INCIDENTES_MEJORAS_2026-03-05.md`

**Contenido mínimo del archivo:**

1. Lista de archivos creados/modificados.
2. Migraciones aplicadas (20260307100003, 20260307100004).
3. Confirmación de arquitectura intacta.
4. Confirmación de reglas de dominio (root_cause obligatorio, DRAFT→PROPOSED, MASTER-only cierre/aprobación/IMPLEMENTED).
5. Resultado de QA funcional.
6. Resultado de QA negativa.
7. Confirmación de auditoría generada.
8. Confirmación de ausencia de errores 500.
9. Confirmación de Response Layer v1 intacto.

---

## 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (incorporadas)

| Id | Observación | Aplicación en el prompt |
|----|-------------|-------------------------|
| O1 | updateIncident en service | FASE 4: updateIncident para PATCH /incidents/:id (assigned_to, root_cause_analysis); validar no CLOSED; auditoría. |
| O2 | root_cause_analysis obligatorio | Regla explícita: exigir no vacío antes de RESOLVED→CLOSED; FASE 4 paso 14. |
| O3 | APPROVED→IMPLEMENTED quién ejecuta | Definido: solo MASTER puede marcar IMPLEMENTED (FASE 5 paso 18). |
| O4 | DRAFT→PROPOSED validación propietario | Service valida que usuario sea proposed_by o MASTER (FASE 5 paso 17). |
| O5 | Validación incident_id al crear Improvement | Al crear con incident_id: validar incident existe; si project_id presente, coincidir con incident.project_id (FASE 5 paso 17). |
| O6 | Timestamps migraciones | Migraciones 20260307100003-create-incidents.js y 20260307100004-create-improvements.js (FASE 1 pasos 3 y 6). |

---

**Validación:** APROBADO CON OBSERVACIONES — SYSTEM ARCHITECT (observaciones incorporadas). Ver docs/VALIDACION_ARQUITECTONICA_ETAPA_3_INCIDENTES_MEJORAS.md.
