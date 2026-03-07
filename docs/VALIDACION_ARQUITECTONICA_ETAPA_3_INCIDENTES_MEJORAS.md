# Validación arquitectónica — ETAPA 3 Gestión de Incidentes y Mejoras

**Validador:** SYSTEM ARCHITECT (NEXUS ARCHITECT)  
**Fecha:** 2026-03-05  
**Documento validado:** `docs/PLAN_ETAPA_3_INCIDENTES_MEJORAS.md`  
**Referencia:** nexus-system-architect.mdc, nexus-contexto-arquitectonico.mdc

---

## I. Resultado de la validación

**ESTADO: APROBADO CON OBSERVACIONES**

La etapa 3 (Incidentes y Mejoras) respeta la arquitectura existente y es coherente con el diseño estructural. Se identifican observaciones que deben resolverse durante la implementación.

---

## II. Validación por principios arquitectónicos

### 1. Arquitectura en capas obligatoria (controller → service → repository)

| Capa | Incident | Improvement | Estado |
|------|----------|-------------|--------|
| Controller | buildSuccess, buildContext, Response Layer v1 | Idem | OK |
| Service | createIncident, getIncidentById, listIncidents, updateIncidentStatus | createImprovement, getImprovementById, listImprovements, updateImprovementStatus | OK |
| Repository | create, findById, list, update | create, findById, list, update | OK |

**Evidencia:** El plan define explícitamente la separación. No se detecta mezcla de responsabilidades.

**Observación:** El plan indica `PATCH /incidents/:id` para asignación y root_cause_analysis. El service debe incluir `updateIncident` (además de `updateIncidentStatus`) para soportar estas actualizaciones parciales. El repository ya tiene `update`; el service debe exponerlo correctamente.

---

### 2. Dominio gobernado

- Reglas de negocio en **incident.service.js** e **improvement.service.js**.
- Workflow centralizado en **incident.workflow.constants.js** y **improvement.workflow.constants.js**.
- Validadores de transición separados.
- No duplicación de lógica en controllers.

**Evidencia:** Coherente con sprints, changeRequests y releases.

---

### 3. Validadores separados

- **incident.validator.js** / **improvement.validator.js:** validaciones de formato.
- **incident.workflow.validator.js** / **improvement.workflow.validator.js:** validaciones de transición.

**Evidencia:** Patrón alineado con módulos existentes.

---

### 4. Migraciones controladas

| Requisito | Estado |
|-----------|--------|
| No modificar migraciones previas | OK — Solo migraciones nuevas |
| Migraciones incrementales | OK — create-incidents, create-improvements (orden: incidents antes que improvements) |
| snake_case en esquema | OK — incidents, improvements |
| Índices definidos | OK — idx_incidents_*, idx_improvements_* |
| Integridad referencial | OK — FKs documentadas |

| FK | onDelete | Justificación |
|----|---------|---------------|
| incidents.project_id | RESTRICT | OK — Plan explícito |
| improvements.project_id | SET NULL | OK — Mejora global si proyecto se borra |
| improvements.incident_id | SET NULL | OK — Mejora independiente si incidente se borra |

**Nomenclatura de migraciones:** El plan usa `YYYYMMDDHHMMSS`. Las últimas migraciones son `20260307100001` y `20260307100002`. Las nuevas deben ser `20260307100003-create-incidents.js` y `20260307100004-create-improvements.js` (o timestamps posteriores consecutivos).

---

### 5. Auditoría estructural obligatoria

| Entidad | Eventos | entity | entity_id |
|---------|---------|--------|-----------|
| Incident | INCIDENT_CREATED, STATUS_CHANGE, INCIDENT_CLOSED | INCIDENT | incidentId |
| Improvement | IMPROVEMENT_CREATED, STATUS_CHANGE, IMPROVEMENT_APPROVED, IMPROVEMENT_REJECTED | IMPROVEMENT | improvementId |

**Campos obligatorios:** user_id, request_id, entity, entity_id, action, metadata, ip_address, user_agent.

**Evidencia:** Patrón coherente con authRepository.createAuditLog usado en módulos existentes.

---

### 6. Response Layer v1 obligatorio

- success, data/error, meta.request_id, meta.timestamp.
- buildSuccess, buildContext en controllers.
- controllerUtils en todos los endpoints.

**Evidencia:** Explícito en criterio de cierre.

---

### 7. Error handling estandarizado

- AppError con códigos contractuales.
- Nuevos códigos: INCIDENT_*, IMPROVEMENT_*.
- Documentación en CONTRATO_API.md y openapi.yaml.

**Evidencia:** Cierre por MASTER usa códigos específicos (INCIDENT_CLOSE_MASTER_ONLY, IMPROVEMENT_APPROVE_MASTER_ONLY); no se duplica AUTH_FORBIDDEN para casos de negocio.

---

## III. Validaciones arquitectónicas adicionales

| Criterio | Estado |
|----------|--------|
| No rompe arquitectura existente | OK |
| No introduce dependencias circulares | OK — Incident depende de Project, User; Improvement depende de Project, Incident, User |
| No rompe separación de responsabilidades | OK |
| No mezcla dominio con transporte HTTP | OK |
| No rompe Response Layer | OK |
| No rompe modelo de auditoría | OK |

---

## IV. Validación de base de datos

| Aspecto | Estado |
|---------|--------|
| snake_case | OK |
| Migración dedicada por entidad | OK |
| Orden de migraciones | OK — incidents antes que improvements (FK incident_id) |
| Paridad paranoid | OK — Incident e Improvement con paranoid: true |
| Alias en relaciones User | OK — Plan especifica alias: reporter, assignee, closedByUser, proposer, approver |

---

## V. Escalabilidad SaaS

| Criterio | Estado |
|----------|--------|
| No introduce estado global indebido | OK |
| No rompe escalabilidad horizontal | OK |
| No depende de memoria local | OK |
| No introduce acoplamientos innecesarios | OK — Incident e Improvement son módulos independientes |

---

## VI. Integración con entidades existentes

| Entidad | Relación | Estado |
|---------|----------|--------|
| Project | Incident pertenece a Project; Improvement puede ser global (project_id nullable) | OK |
| User | reported_by, assigned_to, closed_by (Incident); proposed_by, approved_by (Improvement) | OK |
| Incident | Improvement puede originarse de Incident (incident_id nullable) | OK |

**loadModels:** El plan especifica incluir `...incidentModels, ...improvementModels` en cachedModels. Orden correcto: Incident antes que Improvement (por dependencia FK).

---

## VII. Change Control ISO Mode

El contexto arquitectónico indica que ChangeRequest aplica a **Feature** y **Release**. Las operaciones de **Incident** e **Improvement** no requieren ChangeRequest. Coherente con el Plan Maestro.

---

## VIII. Rutas y montaje

| Ruta | Montaje | Estado |
|------|---------|--------|
| POST/GET /projects/:projectId/incidents | projects.routes.js (rutas anidadas) | OK — Plan explícito |
| GET /incidents/:id, PATCH /incidents/:id/status, PATCH /incidents/:id | router.use("/incidents", incidentRoutes) | OK |
| POST /improvements, GET /improvements, GET /improvements/:id, PATCH /improvements/:id/status | router.use("/improvements", improvementRoutes) | OK |

**Evidencia:** El plan incluye explícitamente `projects.routes.js` en la lista de archivos modificados. Patrón consistente con sprints.

---

## IX. Observaciones para el MASTER DEVELOPER

### O1. updateIncident en service

El plan define `PATCH /incidents/:id` para asignación y root_cause_analysis. El service debe incluir `updateIncident` (además de `updateIncidentStatus`) que:
- Valide que el incident no esté CLOSED.
- Actualice `assigned_to` y/o `root_cause_analysis`.
- Genere auditoría si aplica.

### O2. root_cause_analysis — obligatoriedad

El plan indica "obligatorio antes de cierre formal" en el modelo y "recomendado al pasar a RESOLVED; puede exigirse antes de CLOSED (definir en implementación)". **Recomendación:** Definir explícitamente en el prompt: exigir `root_cause_analysis` no vacío antes de transición RESOLVED→CLOSED. Evita ambigüedad.

### O3. APPROVED → IMPLEMENTED — quién puede ejecutar

El plan dice "APPROVED→IMPLEMENTED (según política)" sin especificar. **Recomendación:** Definir en el prompt: MASTER o EMPLOYEE (proposer) pueden marcar. O restringir a MASTER para consistencia con cierre de incidentes. Evitar ambigüedad.

### O4. DRAFT → PROPOSED — validación de propietario

El plan indica "proposed_by o MASTER" para DRAFT→PROPOSED. El service debe validar que el usuario sea `proposed_by` o tenga rol MASTER. No delegar en el controller.

### O5. Validación incident_id al crear Improvement

Si se crea Improvement con `incident_id`, validar que el incident exista y (opcional) que `project_id` coincida con el de la mejora si ambos están presentes.

### O6. Timestamps de migraciones

Usar timestamps consecutivos posteriores a `20260307100002`, por ejemplo:
- `20260307100003-create-incidents.js`
- `20260307100004-create-improvements.js`

---

## X. Criterios de bloqueo — No aplicados

No se detectan:

- Violación de arquitectura en capas
- Duplicación de lógica de dominio
- Cambios peligrosos en base de datos
- Rompimiento del Response Layer
- Acoplamientos fuertes entre módulos
- Introducción de deuda técnica estructural

---

## XI. Evidencia de validación

| Elemento | Confirmado |
|----------|------------|
| Arquitectura intacta | Sí |
| Separación de capas respetada | Sí |
| Dominio correctamente encapsulado | Sí |
| Migraciones correctas | Sí |
| Response Layer intacto | Sí |
| Auditoría estructural consistente | Sí |

---

## XII. Conclusión

**La ETAPA 3 — Gestión de Incidentes y Mejoras está APROBADA para implementación** por el MASTER DEVELOPER.

Las observaciones O1–O6 son de clarificación y no bloquean la ejecución. El PO MASTER debe incorporarlas al prompt de implementación antes de enviarlo al MASTER DEVELOPER.

**Firma de validación:** SYSTEM ARCHITECT (NEXUS ARCHITECT) — 2026-03-05
