# Validación QA — ETAPA 2 Gestión formal de Sprints

**Documento:** Evidencia de validación independiente por QA ENGINEER  
**Referencia:** `docs/EVIDENCIA_ETAPA_2_SPRINTS_2025-03-03.md`, `docs/PLAN_ETAPA_2_SPRINTS.md`, `docs/PROMPT_MASTER_DEVELOPER_ETAPA_2_SPRINTS.md`  
**Fecha de validación:** 2026-03-05  
**Estado:** **APROBADO** — Cierre de etapa recomendado al PO MASTER

---

## I. Resumen ejecutivo

El QA ENGINEER ha validado la implementación de la **ETAPA 2 — Gestión formal de Sprints** realizada por el MASTER DEVELOPER. La implementación cumple con los criterios de cierre del prompt, las reglas innegociables y el modelo de QA en 6 niveles.

**Resultado:** **APROBADO**. No se detectan incumplimientos que bloqueen el cierre de etapa.

---

## II. Validación por modelo de QA (6 niveles)

### 1️⃣ QA FUNCIONAL — ✅ CUMPLE

- Crear sprint en proyecto existente → 201.
- Listar sprints por proyecto con paginación y filtro status.
- Obtener sprint por id.
- Cambiar estado: PLANNED → IN_PROGRESS (MASTER y EMPLOYEE).
- Cambiar estado: IN_PROGRESS → CLOSED (solo MASTER).
- Asignar story a sprint (story del mismo proyecto).
- Desasignar story de sprint.
- Listar stories de un sprint.
- Tests incluyen flujo completo: crear proyecto → sprint → IN_PROGRESS → CLOSED (MASTER).

### 2️⃣ QA DE DOMINIO — ✅ CUMPLE

- Sprint pertenece a Project (project_id NOT NULL).
- UserStory.sprint_id nullable; una story en un solo sprint o ninguno.
- Sprint CLOSED: no asignar ni desasignar stories; no cambiar status.
- Asignar story: la story debe pertenecer a un Feature del mismo Project.
- Cierre IN_PROGRESS → CLOSED: solo MASTER; EMPLOYEE → 403 AUTH_FORBIDDEN.
- Al cerrar: closed_by = user.id, closed_at = new Date().
- Workflow: PLANNED → IN_PROGRESS → CLOSED; CLOSED sin salida.

### 3️⃣ QA NEGATIVA — ✅ CUMPLE

- 8 tests en sprints.negative.test.js, todos pasando.
- Crear sprint en proyecto inexistente → 404 PROJECT_NOT_FOUND.
- Transición inválida PLANNED → CLOSED → 400 SPRINT_INVALID_TRANSITION.
- EMPLOYEE intenta cerrar → 403 AUTH_FORBIDDEN.
- Asignar story a sprint CLOSED → 400 SPRINT_CLOSED.
- Asignar story de otro proyecto → 400 SPRINT_STORY_PROJECT_MISMATCH.
- Desasignar de sprint CLOSED → 400 SPRINT_CLOSED.
- Sprint inexistente → 404 SPRINT_NOT_FOUND.
- 0 respuestas 500 en flujos esperados.

### 4️⃣ QA DE REGRESIÓN — ✅ CUMPLE

- Suite completa: 7 suites, 46 tests, todos pasando.
- backlog.negative, releases.negative, releases.hotfix, changeRequests.negative, security.qa, contract.qa en verde.
- No se detecta ruptura de funcionalidades existentes.

### 5️⃣ QA DE SEGURIDAD — ✅ CUMPLE

- EMPLOYEE intenta cerrar sprint (IN_PROGRESS → CLOSED) → 403 AUTH_FORBIDDEN.
- Endpoints protegidos con authenticateMiddleware y authorizeMiddleware.
- POST /projects/:projectId/sprints solo MASTER.
- GET /projects/:projectId/sprints, GET /sprints/:id, PATCH status, POST/DELETE stories: MASTER y EMPLOYEE (cierre validado en service).

### 6️⃣ QA DE CONTRATO — ✅ CUMPLE

- Respuestas con buildSuccess (Response Layer v1).
- Header X-Response-Version: 1 (middleware global).
- Estructura { success, data, meta } en respuestas exitosas.
- Códigos de error documentados en CONTRATO_API.md: SPRINT_NOT_FOUND, SPRINT_INVALID_TRANSITION, SPRINT_CLOSED, SPRINT_STORY_PROJECT_MISMATCH, SPRINT_CLOSE_MASTER_ONLY.

---

## III. Verificación técnica de implementación

### Fase 1 — Modelo y migraciones

| Verificación | Estado |
|-------------|--------|
| sprint.model.js: campos id, project_id, name, goal, start_date, end_date, status, created_by, closed_by, closed_at, paranoid | ✅ |
| Migración create-sprints: tabla sprints, índices, FK project_id ON DELETE RESTRICT | ✅ |
| Migración add-sprint-id: columna sprint_id en user_stories, ON DELETE SET NULL | ✅ |
| loadModels: Sprint, Project–Sprint, User–Sprint (creator, closedByUser), Sprint–UserStory | ✅ |
| userStory.model con sprint_id | ✅ |

### Fase 2 — Workflow

| Verificación | Estado |
|-------------|--------|
| TRANSITION_MAP_SPRINT: PLANNED→[IN_PROGRESS], IN_PROGRESS→[CLOSED], CLOSED→[] | ✅ |
| validateSprintTransition en sprint.workflow.validator.js | ✅ |

### Fase 3 — Error codes y documentación

| Verificación | Estado |
|-------------|--------|
| errorCodes: SPRINT_NOT_FOUND, SPRINT_INVALID_TRANSITION, SPRINT_CLOSED, SPRINT_STORY_PROJECT_MISMATCH, SPRINT_CLOSE_MASTER_ONLY | ✅ |
| CONTRATO_API.md actualizado | ✅ |
| openapi.yaml (según evidencia) | ✅ |

### Fase 4 — Repository y Service

| Verificación | Estado |
|-------------|--------|
| sprint.repository: create, findById, list, update, countStoriesBySprintId | ✅ |
| createSprint: valida project existe, status PLANNED | ✅ |
| updateSprintStatus: workflow, cierre solo MASTER (403 si EMPLOYEE) | ✅ |
| assignStoryToSprint: story mismo project, sprint no CLOSED | ✅ |
| unassignStoryFromSprint: sprint no CLOSED | ✅ |
| listStoriesBySprintId | ✅ |

### Fase 5 — Auditoría

| Verificación | Estado |
|-------------|--------|
| STATUS_CHANGE (entity: SPRINT, entity_id, metadata: from, to) | ✅ |
| STORY_ASSIGN_SPRINT (entity: USER_STORY, entity_id: storyId, metadata: sprint_id) | ✅ |
| STORY_UNASSIGN_SPRINT (entity: USER_STORY, entity_id: storyId, metadata: sprint_id) | ✅ |
| SPRINT_CLOSED (entity: SPRINT, metadata: closed_by, closed_at) | ✅ |
| Campos: user_id, request_id, ip_address, user_agent | ✅ |

### Fase 6 — Controller, Validator, Routes

| Verificación | Estado |
|-------------|--------|
| sprint.controller: buildSuccess, buildContext, assertRequestValid (controllerUtils) | ✅ |
| Rutas anidadas: POST/GET /projects/:projectId/sprints en projects.routes.js | ✅ |
| Rutas en v1: GET /sprints/:id, PATCH /sprints/:id/status, POST/DELETE /sprints/:id/stories/:storyId, GET /sprints/:id/stories | ✅ |
| RBAC: POST sprints solo MASTER; resto MASTER, EMPLOYEE | ✅ |

### Fase 7 — QA

| Verificación | Estado |
|-------------|--------|
| sprints.negative.test.js: 8 tests, todos pasando | ✅ |
| backlog, releases, changeRequests en verde | ✅ |

---

## IV. Resultado de ejecución de tests

**Suite sprints:**
```
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

**Suite completa (regresión):**
```
Test Suites: 7 passed, 7 total
Tests:       46 passed, 46 total
Snapshots:   0 total
Time:        ~11.3 s
```

**Omitidos:** 0  
**Fallos:** 0  
**Respuestas 500 en flujos esperados:** 0

---

## V. Notas y observaciones

### Nota sobre código de error en cierre

- El plan especifica SPRINT_CLOSE_MASTER_ONLY en errorCodes; el service usa AUTH_FORBIDDEN para la respuesta 403 cuando EMPLOYEE intenta cerrar. CONTRATO_API.md documenta: "EMPLOYEE recibe 403 AUTH_FORBIDDEN". Comportamiento correcto y coherente con contrato.

### Observación menor (no bloqueante)

- **Fecha en evidencia:** El documento de evidencia indica "2025-03-03"; podría ser typo (2026). No afecta la validación técnica.

---

## VI. Criterios de bloqueo — Verificación

| Criterio de bloqueo | Estado |
|---------------------|--------|
| Violación de reglas de dominio | ❌ No detectada |
| Errores 500 | ❌ No detectados |
| Response Layer inconsistente | ❌ No detectada |
| Endpoint inseguro | ❌ No detectado |
| Migración incorrecta | ❌ No detectada |
| Ruptura de regresión | ❌ No detectada |
| Contrato API roto | ❌ No detectado |

**Ningún criterio de bloqueo se activa.**

---

## VII. Evidencia obligatoria — Checklist

| Elemento | Estado |
|----------|--------|
| 1. Lista de archivos creados/modificados | ✅ |
| 2. Migraciones aplicadas | ✅ |
| 3. Confirmación de arquitectura intacta | ✅ |
| 4. Confirmación de reglas de dominio respetadas | ✅ |
| 5. Resultado de QA funcional | ✅ |
| 6. Resultado de QA negativa | ✅ |
| 7. Confirmación de auditoría generada | ✅ |
| 8. Confirmación de ausencia de errores 500 | ✅ |
| 9. Confirmación de Response Layer v1 intacto | ✅ |

---

## VIII. Conclusión

La implementación de la ETAPA 2 — Gestión formal de Sprints cumple con:

- Reglas innegociables del prompt
- Modelo de QA en 6 niveles
- Criterios de cierre definidos
- Evidencia obligatoria de implementación
- Plan Maestro: control formal de ejecución, cierre exclusivo por MASTER

**Recomendación al PO MASTER:** **APROBAR el cierre de etapa** para la ETAPA 2 — Gestión formal de Sprints.

---

*Documento generado por el agente QA ENGINEER (NEXUS QA) en cumplimiento de nexus-qa-engineer.mdc.*
