# Plan ETAPA 2 — Gestión formal de Sprints

**Referencia:** nexus-plan-maestro-etapas.mdc  
**Objetivo Plan Maestro:** Control formal de ejecución. Entidades Sprint y asignación de UserStories. Cierre formal exclusivo por MASTER.  
**Estado:** Diseñado por PO MASTER — pendiente validación SYSTEM ARCHITECT

---

## Contexto

- **Estructura actual:** Project → Feature → UserStory. Release es independiente (asigna Features).
- **Sprint:** Período de ejecución dentro de un proyecto. Agrupa UserStories para planificación y cierre controlado.
- **Regla Plan Maestro:** Solo MASTER puede cerrar Sprints.
- **Patrones a seguir:** workflow.constants.js, workflow.validator.js, backlog.controller/service/repository, auditoría como en feature.service.

---

## FASE 1 — Modelo y migración Sprint

### 1.1 Modelo Sprint

**Archivo:** `src/modules/sprints/models/sprint.model.js`

Campos:
- `id` (UUID PK)
- `project_id` (UUID FK projects, NOT NULL)
- `name` (STRING 255, obligatorio) — ej. "Sprint 1", "Sprint Q1-2026"
- `goal` (TEXT nullable)
- `start_date` (DATE nullable)
- `end_date` (DATE nullable)
- `status` (ENUM: PLANNED, IN_PROGRESS, CLOSED)
- `created_by` (UUID FK users)
- `closed_by` (UUID FK users nullable) — MASTER que cerró
- `closed_at` (DATE nullable)
- timestamps, paranoid: true (deleted_at)

Tabla: `sprints`

### 1.2 Migración create-sprints

**Archivo:** `src/infrastructure/db/migrations/20260307100001-create-sprints.js`

- Crear tabla `sprints` con los campos anteriores.
- Índices: `idx_sprints_project_id`, `idx_sprints_status`, `idx_sprints_created_by`, `idx_sprints_closed_by`.
- FK project_id → projects.id (CASCADE/RESTRICT según convención).
- FK created_by, closed_by → users.id.

### 1.3 Migración add-sprint-id-to-user-stories

**Archivo:** `src/infrastructure/db/migrations/20260307100002-add-sprint-id-to-user-stories.js`

- Añadir columna `sprint_id` (UUID nullable, FK → sprints.id, ON DELETE SET NULL).
- Índice `idx_user_stories_sprint_id`.

### 1.4 loadModels

- Cargar Sprint.
- Project.hasMany(Sprint), Sprint.belongsTo(Project).
- Sprint.belongsTo(User, created_by), Sprint.belongsTo(User, closed_by).
- UserStory.belongsTo(Sprint), Sprint.hasMany(UserStory).

---

## FASE 2 — Workflow Sprint

### 2.1 Constantes

**Archivo:** `src/modules/sprints/sprint.workflow.constants.js`

```js
TRANSITION_MAP_SPRINT = {
  PLANNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["CLOSED"],
  CLOSED: []
};
```

### 2.2 Validador

**Archivo:** `src/modules/sprints/sprint.workflow.validator.js`

- `validateSprintTransition(currentStatus, nextStatus)` — si no permitida → AppError SPRINT_INVALID_TRANSITION.

### 2.3 Regla de cierre

- Transición IN_PROGRESS → CLOSED: **solo MASTER**. Si EMPLOYEE intenta → 403 AUTH_FORBIDDEN.
- Al cerrar: setear `closed_by = user.id`, `closed_at = new Date()`.

---

## FASE 3 — Reglas de dominio

- **Sprint pertenece a Project:** project_id obligatorio.
- **UserStory en un solo Sprint:** sprint_id nullable; una story puede estar en un sprint o en ninguno.
- **Sprint CLOSED:** no permitir asignar ni desasignar stories; no permitir cambio de status.
- **Asignar story a sprint:** la story debe pertenecer a un Feature del mismo Project que el Sprint.
- **Fechas:** start_date, end_date opcionales; si se validan, end_date >= start_date.

---

## FASE 4 — Error codes

Añadir en errorCodes.js:
- SPRINT_NOT_FOUND
- SPRINT_INVALID_TRANSITION
- SPRINT_CLOSED
- SPRINT_STORY_PROJECT_MISMATCH
- SPRINT_CLOSE_MASTER_ONLY

Documentar en CONTRATO_API.md y openapi.yaml.

---

## FASE 5 — Repository, Service, Controller

### Repository
- create, findById, list (por project_id, status, paginado), update, countStoriesBySprintId.

### Service
- createSprint (validar project existe, status PLANNED)
- getSprintById, listSprints
- updateSprintStatus (workflow, cierre solo MASTER)
- assignStoryToSprint (validar story del mismo project, sprint no CLOSED)
- unassignStoryFromSprint (sprint no CLOSED)

### Controller
- buildSuccess, buildContext (controllerUtils)
- Respuestas con Response Layer v1

---

## FASE 6 — Auditoría

- STATUS_CHANGE en Sprint (entity: "SPRINT", entity_id: sprintId, metadata: { from, to }).
- STORY_ASSIGN_SPRINT (entity: "USER_STORY", entity_id: storyId, metadata: { sprint_id }).
- STORY_UNASSIGN_SPRINT (similar).
- Al cerrar sprint: SPRINT_CLOSED (metadata: closed_by, closed_at).

---

## FASE 7 — Rutas

Base: `/api/v1`

- POST /projects/:projectId/sprints — MASTER (body: name, goal, start_date, end_date)
- GET /projects/:projectId/sprints — MASTER, EMPLOYEE (listado, ?status=)
- GET /sprints/:id — MASTER, EMPLOYEE
- PATCH /sprints/:id/status — MASTER solo para CLOSED; EMPLOYEE puede PLANNED→IN_PROGRESS
- POST /sprints/:id/stories/:storyId — MASTER, EMPLOYEE (asignar story)
- DELETE /sprints/:id/stories/:storyId — MASTER, EMPLOYEE (desasignar)
- GET /sprints/:id/stories — MASTER, EMPLOYEE (listar stories del sprint)

Montar en v1.routes.js: `router.use("/sprints", sprintRoutes)` y rutas anidadas en projects si aplica.

---

## FASE 8 — QA

**Suite:** `src/tests/integration/sprints/sprints.negative.test.js`

Tests:
- Crear sprint en proyecto inexistente → 404
- Transición inválida (PLANNED → CLOSED) → 400 SPRINT_INVALID_TRANSITION
- EMPLOYEE intenta cerrar sprint (IN_PROGRESS → CLOSED) → 403
- MASTER cierra sprint → 200
- Asignar story a sprint CLOSED → 400 SPRINT_CLOSED
- Asignar story de otro proyecto → 400 SPRINT_STORY_PROJECT_MISMATCH
- Desasignar de sprint CLOSED → 400 SPRINT_CLOSED
- Sprint inexistente → 404

---

## Archivos nuevos / modificados

| Tipo | Ruta |
|------|------|
| Nuevo | src/modules/sprints/models/sprint.model.js |
| Nuevo | src/modules/sprints/models/index.js |
| Nuevo | src/infrastructure/db/migrations/20260307100001-create-sprints.js |
| Nuevo | src/infrastructure/db/migrations/20260307100002-add-sprint-id-to-user-stories.js |
| Modif | src/modules/backlog/models/userStory.model.js (sprint_id) |
| Modif | src/infrastructure/db/loadModels.js |
| Nuevo | src/modules/sprints/sprint.workflow.constants.js |
| Nuevo | src/modules/sprints/sprint.workflow.validator.js |
| Nuevo | src/modules/sprints/sprint.repository.js |
| Nuevo | src/modules/sprints/sprint.service.js |
| Nuevo | src/modules/sprints/sprint.controller.js |
| Nuevo | src/modules/sprints/sprint.validator.js |
| Nuevo | src/modules/sprints/sprint.routes.js |
| Modif | src/shared/errors/errorCodes.js |
| Modif | docs/CONTRATO_API.md, docs/openapi.yaml |
| Modif | src/routes/v1.routes.js |
| Nuevo | src/tests/integration/sprints/sprints.negative.test.js |

---

## Criterio de cierre

- Todas las fases implementadas.
- Tests en verde; 0 respuestas 500.
- Solo MASTER puede cerrar sprint.
- Auditoría generada.
- Response Layer v1 en todos los endpoints.
- Arquitectura controller → service → repository intacta.
