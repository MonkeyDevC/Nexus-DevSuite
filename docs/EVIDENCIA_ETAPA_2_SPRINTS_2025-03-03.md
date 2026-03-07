# Evidencia de implementación — ETAPA 2 Gestión formal de Sprints

**Documento:** Evidencia de cierre ETAPA 2  
**Nombre de etapa:** ETAPA 2 — Gestión formal de Sprints  
**Fecha de generación:** 2025-03-03  
**Referencia:** `docs/PLAN_ETAPA_2_SPRINTS.md`, `docs/PROMPT_MASTER_DEVELOPER_ETAPA_2_SPRINTS.md`

---

## 1. Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `src/modules/sprints/models/sprint.model.js` | Modelo Sprint (PLANNED, IN_PROGRESS, CLOSED), paranoid |
| `src/modules/sprints/models/index.js` | Índice de modelos de sprints |
| `src/infrastructure/db/migrations/20260307100001-create-sprints.js` | Tabla `sprints`, FK project_id ON DELETE RESTRICT |
| `src/infrastructure/db/migrations/20260307100002-add-sprint-id-to-user-stories.js` | Columna `sprint_id` en `user_stories` |
| `src/modules/sprints/sprint.workflow.constants.js` | TRANSITION_MAP_SPRINT |
| `src/modules/sprints/sprint.workflow.validator.js` | validateSprintTransition |
| `src/modules/sprints/sprint.repository.js` | create, findById, list, update, countStoriesBySprintId |
| `src/modules/sprints/sprint.service.js` | createSprint, getSprintById, listSprints, updateSprintStatus, assignStoryToSprint, unassignStoryFromSprint, listStoriesBySprintId + auditoría |
| `src/modules/sprints/sprint.controller.js` | Controladores con buildSuccess y controllerUtils |
| `src/modules/sprints/sprint.validator.js` | Validadores de entrada |
| `src/modules/sprints/sprint.routes.js` | Rutas bajo /sprints |
| `src/tests/integration/sprints/sprints.negative.test.js` | Suite QA negativo (8 tests) |

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/modules/backlog/models/userStory.model.js` | Campo `sprint_id` |
| `src/infrastructure/db/loadModels.js` | Carga Sprint, relaciones Project–Sprint, User–Sprint (creator, closedByUser), Sprint–UserStory |
| `src/shared/errors/errorCodes.js` | SPRINT_NOT_FOUND, SPRINT_INVALID_TRANSITION, SPRINT_CLOSED, SPRINT_STORY_PROJECT_MISMATCH, SPRINT_CLOSE_MASTER_ONLY |
| `docs/CONTRATO_API.md` | Códigos de error de sprints |
| `docs/openapi.yaml` | Enum de códigos de error de sprints |
| `src/modules/backlog/projects.routes.js` | Rutas anidadas GET/POST `/projects/:projectId/sprints` |
| `src/routes/v1.routes.js` | `router.use("/sprints", sprintRoutes)` |

---

## 3. Migraciones aplicadas

- `20260307100001-create-sprints`: tabla sprints, índices, FKs (project_id ON DELETE RESTRICT).
- `20260307100002-add-sprint-id-to-user-stories`: columna sprint_id en user_stories.

---

## 4. API implementada

| Método | Endpoint | Roles | Propósito |
|--------|----------|-------|-----------|
| POST | `/api/v1/projects/:projectId/sprints` | MASTER | Crear sprint |
| GET | `/api/v1/projects/:projectId/sprints` | MASTER, EMPLOYEE | Listar sprints (query: status, page, limit) |
| GET | `/api/v1/sprints/:id` | MASTER, EMPLOYEE | Obtener sprint |
| PATCH | `/api/v1/sprints/:id/status` | MASTER, EMPLOYEE (cierre solo MASTER) | Cambiar estado |
| POST | `/api/v1/sprints/:id/stories/:storyId` | MASTER, EMPLOYEE | Asignar story |
| DELETE | `/api/v1/sprints/:id/stories/:storyId` | MASTER, EMPLOYEE | Desasignar story |
| GET | `/api/v1/sprints/:id/stories` | MASTER, EMPLOYEE | Listar stories del sprint |

---

## 5. Reglas de dominio verificadas

- Sprint pertenece a Project (project_id NOT NULL).
- UserStory.sprint_id nullable; una story en un solo sprint o ninguno.
- Sprint CLOSED: no asignar ni desasignar stories; no cambiar status.
- Asignar story a sprint: la story debe pertenecer a un Feature del mismo Project.
- Cierre IN_PROGRESS → CLOSED: solo MASTER; EMPLOYEE → 403 AUTH_FORBIDDEN.
- Al cerrar: closed_by = user.id, closed_at = new Date().

---

## 6. Auditoría

Eventos registrados en audit_logs:

- STATUS_CHANGE (entity: SPRINT, metadata: from, to).
- STORY_ASSIGN_SPRINT (entity: USER_STORY, metadata: sprint_id).
- STORY_UNASSIGN_SPRINT (entity: USER_STORY, metadata: sprint_id).
- SPRINT_CLOSED (entity: SPRINT, metadata: closed_by, closed_at).

---

## 7. Resultado de QA

- **Suite:** `src/tests/integration/sprints/sprints.negative.test.js`
- **Tests:** 8/8 pasando.
- **Casos:** Crear sprint proyecto inexistente 404, transición inválida 400, EMPLOYEE cierra 403, MASTER cierra 200, asignar/desasignar en sprint CLOSED 400, story otro proyecto 400, sprint inexistente 404.

**Comando de verificación:**

```bash
$env:NODE_ENV="development"; npm test -- --testPathPattern="sprints.negative" --runInBand --forceExit
```

---

## 8. Criterios de cierre

- [x] Todos los tests de la suite sprints ejecutan y pasan.
- [x] 0 omitidos, 0 respuestas 500 en flujos esperados de sprints.
- [x] Arquitectura controller → service → repository intacta.
- [x] Migraciones ejecutables en BD limpia.
- [x] Auditoría generada (STATUS_CHANGE, STORY_ASSIGN_SPRINT, STORY_UNASSIGN_SPRINT, SPRINT_CLOSED).
- [x] Solo MASTER puede cerrar sprint (IN_PROGRESS → CLOSED).
- [x] Response Layer v1 y controllerUtils en todos los endpoints de sprints.

---

**Nomenclatura del archivo:** `EVIDENCIA_ETAPA_<N>_<NOMBRE_ETAPA>_<YYYY-MM-DD>.md`
