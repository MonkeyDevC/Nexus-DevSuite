# Prompt de implementación — ETAPA 2 Gestión formal de Sprints

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_2_SPRINTS.md, nexus-plan-maestro-etapas.mdc  
**Estructura:** nexus-engineering-execution.mdc

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 2 — Gestión formal de Sprints** siguiendo estrictamente el plan `docs/PLAN_ETAPA_2_SPRINTS.md`.

**Propósito:** Control formal de ejecución. Entidad Sprint por proyecto, asignación de UserStories a Sprint, cierre formal exclusivo por MASTER. Evidencia de ejecución controlada.

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

1. Crear `src/modules/sprints/models/sprint.model.js` con campos: id, project_id, name, goal, start_date, end_date, status (PLANNED, IN_PROGRESS, CLOSED), created_by, closed_by, closed_at, timestamps, paranoid.
2. Crear `src/modules/sprints/models/index.js`.
3. Migración `20260307100001-create-sprints.js` — tabla sprints, índices, FKs. **Usar explícitamente ON DELETE RESTRICT en la FK project_id.**
4. Migración `20260307100002-add-sprint-id-to-user-stories.js` — columna sprint_id en user_stories.
5. Actualizar `userStory.model.js` con sprint_id.
6. Actualizar `loadModels.js`: Sprint, Project.hasMany(Sprint), Sprint.belongsTo(Project), Sprint.belongsTo(User x2 con alias distintos: "creator" para created_by, "closedByUser" para closed_by), UserStory.belongsTo(Sprint), Sprint.hasMany(UserStory). **Incluir ...sprintModels en cachedModels.**

### FASE 2 — Workflow

7. Crear `sprint.workflow.constants.js` con TRANSITION_MAP_SPRINT.
8. Crear `sprint.workflow.validator.js` con validateSprintTransition.

### FASE 3 — Error codes y documentación

9. Añadir en errorCodes.js: SPRINT_NOT_FOUND, SPRINT_INVALID_TRANSITION, SPRINT_CLOSED, SPRINT_STORY_PROJECT_MISMATCH, SPRINT_CLOSE_MASTER_ONLY.
10. Actualizar CONTRATO_API.md y openapi.yaml.

### FASE 4 — Repository y Service

11. Crear `sprint.repository.js`: create, findById, list, update, countStoriesBySprintId.
12. Crear `sprint.service.js`: createSprint, getSprintById, listSprints, updateSprintStatus (workflow + cierre solo MASTER), assignStoryToSprint, unassignStoryFromSprint.
13. Reglas: sprint CLOSED bloquea asignación/desasignación; story debe ser del mismo project; cierre solo MASTER (403 si EMPLOYEE intenta IN_PROGRESS→CLOSED).

### FASE 5 — Auditoría

14. createAuditLog en updateSprintStatus (STATUS_CHANGE), assignStoryToSprint (STORY_ASSIGN_SPRINT), unassignStoryFromSprint (STORY_UNASSIGN_SPRINT), al cerrar (SPRINT_CLOSED).

### FASE 6 — Controller, Validator, Routes

15. Crear `sprint.controller.js`, `sprint.validator.js`, `sprint.routes.js`.
16. Rutas: POST /projects/:projectId/sprints, GET /projects/:projectId/sprints, GET /sprints/:id, PATCH /sprints/:id/status, POST /sprints/:id/stories/:storyId, DELETE /sprints/:id/stories/:storyId, GET /sprints/:id/stories.
17. **Montar rutas anidadas:** Las rutas POST/GET /projects/:projectId/sprints deben montarse en `projects.routes.js` (modificar ese archivo para incluir el router de sprints anidado). El resto de rutas de sprints (GET/PATCH/POST/DELETE /sprints/:id...) en v1.routes.js.

### FASE 7 — QA

18. Crear `src/tests/integration/sprints/sprints.negative.test.js` con todos los casos del plan.
19. Verificar que backlog, releases, changeRequests siguen en verde (regresión).

---

## 4️⃣ REGLAS DE DOMINIO CRÍTICAS

- Sprint pertenece a Project (project_id NOT NULL).
- UserStory.sprint_id nullable; una story en un solo sprint o ninguno.
- Sprint CLOSED: no asignar ni desasignar stories; no cambiar status.
- Asignar story a sprint: la story debe pertenecer a un Feature del mismo Project.
- Cierre (IN_PROGRESS → CLOSED): solo MASTER. EMPLOYEE → 403.
- Al cerrar: closed_by = user.id, closed_at = new Date().

---

## 5️⃣ AUDITORÍA OBLIGATORIA

- STATUS_CHANGE (Sprint)
- STORY_ASSIGN_SPRINT
- STORY_UNASSIGN_SPRINT
- SPRINT_CLOSED (al cerrar)

entity, entity_id, action, metadata, request_id, ip_address, user_agent.

---

## 6️⃣ QA OBLIGATORIA (6 niveles)

- **Funcional:** Crear sprint, asignar story, cerrar sprint (MASTER).
- **Dominio:** Transiciones válidas/inválidas, sprint CLOSED bloquea.
- **Negativa:** Casos del plan (404, 400, 403).
- **Regresión:** backlog, releases, changeRequests en verde.
- **Seguridad:** EMPLOYEE no puede cerrar sprint → 403.
- **Contrato:** X-Response-Version, envelope.

---

## 7️⃣ CRITERIO DE CIERRE

- Todos los tests ejecutan.
- 0 omitidos, 0 respuestas 500.
- Arquitectura intacta.
- Migraciones ejecutables en BD limpia.
- Auditoría generada.
- Solo MASTER cierra sprint.

---

## 8️⃣ EVIDENCIA OBLIGATORIA

**Entrega en archivo:** La evidencia debe entregarse en un archivo en `docs/` con la siguiente nomenclatura:

```
EVIDENCIA_ETAPA_2_SPRINTS_<YYYY-MM-DD>.md
```

Donde `<YYYY-MM-DD>` es la fecha de generación del documento (ej. `2026-03-03`).

**Ejemplo:** `docs/EVIDENCIA_ETAPA_2_SPRINTS_2026-03-03.md`

**Contenido mínimo del archivo:**

1. Lista de archivos creados/modificados.
2. Migraciones aplicadas.
3. Confirmación de arquitectura intacta.
4. Confirmación de reglas de dominio respetadas.
5. Resultado de QA funcional.
6. Resultado de QA negativa.
7. Confirmación de auditoría generada.
8. Confirmación de ausencia de errores 500.
9. Confirmación de Response Layer v1 intacto.

---

---

## 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (incorporadas)

| Observación | Aplicación |
|-------------|------------|
| Rutas anidadas | Montar POST/GET /projects/:projectId/sprints en projects.routes.js |
| onDelete project_id | ON DELETE RESTRICT en migración create-sprints |
| loadModels | Incluir ...sprintModels en cachedModels |
| Alias User–Sprint | "creator" para created_by, "closedByUser" para closed_by |

---

**Validación:** APROBADO CON OBSERVACIONES — SYSTEM ARCHITECT (observaciones incorporadas). Ver nexus-system-architect.mdc.
