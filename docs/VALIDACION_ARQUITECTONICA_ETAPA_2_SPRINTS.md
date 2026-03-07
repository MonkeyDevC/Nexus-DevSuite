# Validación arquitectónica — ETAPA 2 Gestión formal de Sprints

**Validador:** SYSTEM ARCHITECT (NEXUS ARCHITECT)  
**Fecha:** 2026-03-05  
**Documentos validados:** `docs/PLAN_ETAPA_2_SPRINTS.md`, `docs/PROMPT_MASTER_DEVELOPER_ETAPA_2_SPRINTS.md`  
**Referencia:** nexus-system-architect.mdc, nexus-contexto-arquitectonico.mdc

---

## I. Resultado de la validación

**ESTADO: APROBADO CON OBSERVACIONES**

La etapa 2 respeta la arquitectura existente y es coherente con el diseño estructural. Se identifican observaciones menores que deben resolverse durante la implementación.

---

## II. Validación por principios arquitectónicos

### 1. Arquitectura en capas obligatoria (controller → service → repository)

| Capa | Plan | Prompt | Estado |
|------|------|--------|--------|
| Controller | buildSuccess, buildContext, Response Layer v1 | Sin lógica de negocio, controllerUtils | OK |
| Service | createSprint, updateSprintStatus, assignStoryToSprint, unassignStoryFromSprint | Reglas de negocio centralizadas | OK |
| Repository | create, findById, list, update, countStoriesBySprintId | Solo acceso a BD | OK |

**Evidencia:** El plan y el prompt definen explícitamente la separación. No se detecta mezcla de responsabilidades.

---

### 2. Dominio gobernado

- Reglas de negocio en **sprint.service.js**.
- Workflow centralizado en **sprint.workflow.constants.js** y **sprint.workflow.validator.js**.
- No duplicación de lógica en controllers.

**Evidencia:** Coherente con backlog (workflow.constants/validator) y releases (release.workflow.constants/validator).

---

### 3. Validadores separados

- **sprint.validator.js:** validaciones de formato (express-validator).
- **sprint.workflow.validator.js:** validaciones de transición de estado.

**Evidencia:** Patrón alineado con módulos existentes.

---

### 4. Migraciones controladas

| Requisito | Estado |
|-----------|--------|
| No modificar migraciones previas | OK — Solo migraciones nuevas |
| Migraciones incrementales | OK — 20260307100001, 20260307100002 |
| snake_case en esquema | OK — sprints, user_stories.sprint_id |
| Índices definidos | OK — idx_sprints_project_id, status, created_by, closed_by; idx_user_stories_sprint_id |
| Integridad referencial | OK — FKs documentadas |

**Observación:** El plan indica "CASCADE/RESTRICT según convención" para `project_id`. **Recomendación:** usar `ON DELETE RESTRICT` para mantener integridad (no eliminar proyecto con sprints activos). El MASTER DEVELOPER debe seguir la convención del proyecto (releases usa RESTRICT en features).

---

### 5. Auditoría estructural obligatoria

| Evento | entity | entity_id | metadata |
|--------|--------|-----------|----------|
| STATUS_CHANGE | SPRINT | sprintId | { from, to } |
| STORY_ASSIGN_SPRINT | USER_STORY | storyId | { sprint_id } |
| STORY_UNASSIGN_SPRINT | USER_STORY | storyId | similar |
| SPRINT_CLOSED | SPRINT | sprintId | { closed_by, closed_at } |

**Evidencia:** El plan especifica entity, entity_id, action, metadata, request_id, ip_address, user_agent. Patrón coherente con feature.service y release.service (authRepository.createAuditLog).

---

### 6. Response Layer v1 obligatorio

- success, data/error, meta.request_id, meta.timestamp.
- buildSuccess, buildContext en controllers.
- X-Response-Version documentado en QA de contrato.

**Evidencia:** Explícito en reglas innegociables y criterio de cierre.

---

### 7. Error handling estandarizado

- AppError con códigos contractuales.
- Nuevos códigos: SPRINT_NOT_FOUND, SPRINT_INVALID_TRANSITION, SPRINT_CLOSED, SPRINT_STORY_PROJECT_MISMATCH, SPRINT_CLOSE_MASTER_ONLY.
- Documentación en CONTRATO_API.md y openapi.yaml.

**Evidencia:** Cierre por MASTER usa AUTH_FORBIDDEN (403) existente; no se introduce código redundante.

---

## III. Validaciones arquitectónicas adicionales

| Criterio | Estado |
|----------|--------|
| No rompe arquitectura existente | OK |
| No introduce dependencias circulares | OK — Sprint depende de backlog (Project, UserStory), backlog no depende de Sprint |
| No rompe separación de responsabilidades | OK |
| No mezcla dominio con transporte HTTP | OK |
| No rompe Response Layer | OK |
| No rompe modelo de auditoría | OK |

---

## IV. Validación de base de datos

| Aspecto | Estado |
|---------|--------|
| snake_case | OK |
| Migración dedicada | OK — 2 migraciones |
| Índices necesarios | OK |
| Integridad referencial | OK — project_id, created_by, closed_by, sprint_id |
| ON DELETE SET NULL en sprint_id | OK — desasignar stories si se elimina sprint (paranoid evita eliminación física) |

**Nota:** Con `paranoid: true` en Sprint, la eliminación es lógica (deleted_at). La FK `sprint_id` con ON DELETE SET NULL protege ante eliminación física si se usara `force: true`. Correcto.

---

## V. Escalabilidad SaaS

| Criterio | Estado |
|----------|--------|
| No introduce estado global indebido | OK |
| No rompe escalabilidad horizontal | OK |
| No depende de memoria local | OK |
| No introduce acoplamientos innecesarios | OK — Sprint es módulo independiente |

---

## VI. Integración con entidades existentes

| Entidad | Relación | Estado |
|---------|----------|--------|
| Project | Sprint pertenece a Project | OK |
| UserStory | UserStory.belongsTo(Sprint), sprint_id nullable | OK |
| User | created_by, closed_by | OK |
| Feature | Validación story→feature→project para asignación | OK |

**Regla de dominio verificada:** "Asignar story a sprint: la story debe pertenecer a un Feature del mismo Project". La validación requiere: `story.feature.project_id === sprint.project_id`. El plan lo especifica correctamente.

---

## VII. Change Control ISO Mode

El Plan Maestro y el contexto arquitectónico indican que ChangeRequest aplica a **Feature** y **Release**. Las operaciones de Sprint (create, updateStatus, assignStory, unassignStory) **no requieren ChangeRequest**. Coherente con la etapa actual.

---

## VIII. Observaciones para el MASTER DEVELOPER

### O1. Rutas anidadas en projects

El plan especifica `POST /projects/:projectId/sprints` y `GET /projects/:projectId/sprints`. La lista de archivos modificados no incluye `projects.routes.js`.

**Recomendación:** Añadir explícitamente la modificación de `projects.routes.js` para incluir las rutas anidadas, o documentar en el prompt que el MASTER DEVELOPER debe modificar `projects.routes.js` para montar los controladores de sprint en `/:projectId/sprints`. Evitar ambigüedad.

### O2. onDelete para project_id

Definir explícitamente `ON DELETE RESTRICT` en la migración de sprints para `project_id`, alineado con la convención de features y releases.

### O3. loadModels — cachedModels

El plan indica "Cargar Sprint" y las asociaciones. El MASTER DEVELOPER debe asegurar que `cachedModels` incluya `...sprintModels` en el return de loadModels.

### O4. Alias en asociaciones User–Sprint

Para `Sprint.belongsTo(User, created_by)` y `Sprint.belongsTo(User, closed_by)`, usar alias distintos (ej. "creator", "closedByUser") para evitar conflictos, siguiendo el patrón de Feature (created_by/approver).

---

## IX. Criterios de bloqueo — No aplicados

No se detectan:

- Violación de arquitectura en capas
- Duplicación de lógica de dominio
- Cambios peligrosos en base de datos
- Rompimiento del Response Layer
- Acoplamientos fuertes entre módulos
- Introducción de deuda técnica estructural

---

## X. Evidencia de validación

| Elemento | Confirmado |
|----------|------------|
| Arquitectura intacta | Sí |
| Separación de capas respetada | Sí |
| Dominio correctamente encapsulado | Sí |
| Migraciones correctas | Sí (con observación O2) |
| Response Layer intacto | Sí |
| Auditoría estructural consistente | Sí |

---

## XI. Conclusión

**La ETAPA 2 — Gestión formal de Sprints está APROBADA para implementación** por el MASTER DEVELOPER.

Las observaciones O1–O4 son de clarificación y no bloquean la ejecución. El PO MASTER puede incorporarlas al prompt o comunicarlas al MASTER DEVELOPER antes de iniciar.

**Firma de validación:** SYSTEM ARCHITECT (NEXUS ARCHITECT) — 2026-03-05
