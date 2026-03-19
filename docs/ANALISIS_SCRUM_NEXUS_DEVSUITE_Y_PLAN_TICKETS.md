# Análisis Scrum — NEXUS DevSuite y plan de tickets

**Rol:** MASTER DEVELOPER + SCRUM SYSTEM ANALYST  
**Proyecto:** NEXUS DevSuite  
**Fecha:** 2026-03  
**Objetivo:** Alinear el funcionamiento del sistema con el flujo real de trabajo Scrum mediante análisis del flujo actual, detección de desviaciones y plan de mejoras (sin implementación en esta fase).

---

## 1. Análisis del flujo Scrum actual del sistema

### 1.1 Modelo de datos y relaciones

| Entidad   | Tabla          | Relaciones principales                                      |
|-----------|----------------|-------------------------------------------------------------|
| Project   | projects       | organization_id, created_by                                |
| Feature   | features       | project_id (obligatorio), release_id (opcional), created_by |
| UserStory | user_stories   | feature_id (obligatorio), sprint_id (opcional), assigned_to |
| Sprint    | sprints        | project_id (obligatorio), created_by, closed_by            |
| Release   | releases       | organization_id, created_by                                |

**Cadenas relevantes:**

- **Product Backlog (conceptual):** Project → Features → User Stories. Las stories se listan por feature (`GET /features/:featureId/stories`) y **también por proyecto** (`GET /projects/:projectId/stories` con filtros `status`, `feature_id`, `sprint_id`). El endpoint de backlog a nivel proyecto existe; la vista unificada en frontend es la que puede faltar.
- **Sprint Backlog:** UserStory.sprint_id apunta a un Sprint. Una story solo puede estar en un sprint (FK única). Asignación: `POST /sprints/:id/stories/:storyId` o `PATCH /stories/:id/sprint` con `sprint_id`.
- **Release:** Release tiene muchas Features (`Feature.release_id`). No hay relación directa Release ↔ UserStory ni Release ↔ Sprint. Las releases son a nivel organización, no por proyecto.

### 1.2 Flujo actual por concepto Scrum

#### Product Backlog

- **Features:** Se crean bajo proyecto con `POST /projects/:projectId/features`. Campos: title, description (priority aceptado por API pero no enviado por el formulario de crear feature).
- **User Stories:** Se crean solo bajo feature con `POST /features/:featureId/stories`. Campos: title, description, acceptance_criteria, priority, assigned_to. La relación Feature → UserStory es obligatoria en modelo y API; no hay creación de story sin feature.
- **Vista de backlog:** En el frontend, la vista “Stories” exige elegir **proyecto** y **feature** para cargar stories (usa `GET /features/:featureId/stories`). El endpoint `GET /projects/:projectId/stories` existe pero no se usa para una vista única “Product Backlog” del proyecto.

#### Sprint Planning

- **Creación de sprints:** `POST /projects/:projectId/sprints` (name, goal, start_date, end_date). Estado inicial: PLANNED.
- **Asignación de stories al sprint:**
  - Desde detalle del sprint: el frontend (`sprints.js`) carga solo stories en estado **READY** por feature (`/features/:id/stories?status=READY`) y muestra el mensaje “Solo se muestran stories en estado READY (listas para Sprint Planning)”.
  - Backend: `sprint.service.js` → `assignStoryToSprint` comprueba mismo proyecto, sprint no CLOSED y **exige estado READY** de la story.
  - `PATCH /stories/:id/sprint`: en `userStory.service.js` → `updateStorySprint` se valida sprint existente, **sprint no CLOSED** y **estado READY** de la story cuando se asigna a un sprint. Consistente con la ruta de sprints.
- **Estados de User Story:** DRAFT, READY, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE, ARCHIVED (alineado con el modelo de referencia, con BLOCKED y ARCHIVED adicionales).

#### Ejecución del sprint

- Transiciones de sprint: PLANNED → IN_PROGRESS → CLOSED (definidas en `sprint.workflow.constants.js`). No hay más estados.
- Cambio de estado de story: `PATCH /stories/:id/status`. No hay restricciones de transición por rol ni por pertenencia a sprint en la lógica revisada.
- Asignación de desarrollador: `PATCH /stories/:id/assign` (assigned_to).

#### Cierre del sprint

- Acción: `PATCH /sprints/:id/status` con `{ status: "CLOSED" }`.
- Reglas actuales (implementadas en `sprint.service.js`):
  - Solo usuario con rol MASTER puede cerrar.
  - No se puede modificar un sprint ya CLOSED.
  - **Se valida** el estado de las stories: no se permite cerrar si hay stories en **IN_PROGRESS** o **BLOCKED** (error `SPRINT_CLOSE_STORIES_IN_PROGRESS`).
  - Tras cerrar: las stories del sprint que **no** están en DONE se devuelven al Product Backlog (`sprint_id = null`) de forma automática. Las DONE conservan `sprint_id` para historial.
- Posible mejora UX: en frontend, mostrar resumen de stories por estado antes de cerrar y mensaje explicando la devolución al backlog.

#### Release

- Releases: organización. Creación `POST /releases` (version, description). Asignación de features: `POST /releases/:id/features/:featureId`. Una feature no puede estar en dos releases a la vez.
- Publicar release (RELEASED): se exige al menos una feature asociada. No se valida que las features estén DONE ni que sus stories estén DONE.
- No existe vinculación directa Release ↔ User Story ni Release ↔ Sprint; el modelo es “Release agrupa Features”.

---

## 2. Desviaciones detectadas

Cada ítem sigue el formato: **Desviación | Impacto en flujo Scrum | Módulos afectados | Criticidad**.

**Estado actual (post-revisión de código):** Las desviaciones D1–D4 están **ya resueltas** en backend y, en su caso, en frontend. Se mantienen en la tabla como “Resuelta” para trazabilidad. Las que siguen abiertas son D5–D8.

| # | Desviación | Impacto | Módulos | Criticidad | Estado |
|---|------------|--------|---------|------------|--------|
| D1 | **Cierre de sprint sin validar estado de las stories.** | — | — | — | **Resuelta:** Backend no permite cerrar si hay IN_PROGRESS o BLOCKED (`sprint.service.js`). |
| D2 | **Stories incompletas permanecen en sprint cerrado.** | — | — | — | **Resuelta:** Al cerrar, las no DONE pasan a `sprint_id = null` automáticamente. |
| D3 | **Asignación a sprint sin exigir READY.** | — | — | — | **Resuelta:** Backend exige READY en `assignStoryToSprint` y en `updateStorySprint`. |
| D4 | **PATCH /stories/:id/sprint con sprint CLOSED.** | — | — | — | **Resuelta:** `updateStorySprint` rechaza sprint en estado CLOSED. |
| D5 | **Product Backlog a nivel proyecto:** El endpoint **sí existe** (`GET /projects/:projectId/stories`). Falta una **vista unificada** en frontend que use ese endpoint para mostrar “todas las stories del proyecto” con filtros. | Dificulta ver el backlog completo del proyecto en una sola pantalla. | Frontend (Stories/Projects) | **MEDIUM** | Abierta |
| D6 | **Release no valida que las features (o sus stories) estén DONE.** Se puede publicar una release con features en estado no DONE. | La release podría incluir funcionalidad no completada. | Releases (backend) | **MEDIUM** | Abierta |
| D7 | **Vista Stories exige feature seleccionada** para listar. No hay modo “todas las stories del proyecto” en la misma vista. | Planificación y refinamiento sin vista unificada de backlog. | Frontend (stories.js, projects.js) | **MEDIUM** | Abierta |
| D8 | **Estados BLOCKED, ARCHIVED** no están en el modelo de referencia. | No es desviación negativa; documentar política READY/DRAFT y uso de BLOCKED. | Docs / modelo | **LOW** | Abierta |

---

## 3. Propuesta de alineación con Scrum

### 3.1 Nivel 1 — Reglas de negocio

- **R1.1** Una User Story debe pertenecer obligatoriamente a una Feature (ya cumplido en modelo y API).
- **R1.2** Al cerrar un sprint, las stories que no estén en DONE vuelven al Product Backlog (`sprint_id = null`). **Implementado** en `sprint.service.js` al cerrar.
- **R1.3** Una User Story no puede pertenecer a más de un Sprint (ya cumplido por FK).
- **R1.4** Solo se pueden asignar al Sprint Planning stories en estado READY. **Implementado** en `sprint.service.js` y `userStory.service.js`.
- **R1.5** No se puede asignar una story a un sprint en estado CLOSED. **Implementado** en ambas rutas (sprint y PATCH story/sprint).

### 3.2 Nivel 2 — Validaciones del sistema

- **V2.1** No permitir cerrar un sprint si hay stories en IN_PROGRESS o BLOCKED. **Implementado** en `sprint.service.js` (error `SPRINT_CLOSE_STORIES_IN_PROGRESS`).
- **V2.2** Al cerrar el sprint, poner `sprint_id = null` a las stories no DONE. **Implementado** en la misma operación de cierre.
- **V2.3** Al asignar una story a un sprint, comprobar que el sprint no esté CLOSED. **Implementado** en ambas rutas.
- **V2.4** Al asignar una story a un sprint, comprobar que la story esté en estado READY. **Implementado** en ambas rutas.
- **V2.5** Al publicar una release (transición a RELEASED), validar o advertir que las features asociadas estén en estado DONE. **Pendiente** (desviación D6).

### 3.3 Nivel 3 — Mejoras de interfaz

- **UI3.1** En la pantalla de detalle del sprint, mostrar solo stories READY en el selector “Asignar story”. **Implementado** en `sprints.js` (filtro `status=READY` y mensaje al usuario).
- **UI3.2** Vista “Product Backlog” a nivel proyecto usando `GET /projects/:projectId/stories`: lista unificada con filtros (feature, estado, sin sprint / en sprint). **Pendiente** (desviaciones D5, D7).
- **UI3.3** Al pulsar “Cerrar sprint”, mostrar resumen de stories por estado y mensaje que explique el bloqueo (IN_PROGRESS/BLOCKED) o la devolución al backlog de las no DONE. **Pendiente** (mejora UX).
- **UI3.4** En releases, al asignar una feature, mostrar estado de la feature y resumen de stories DONE/total. Al publicar (RELEASED), advertir o validar si hay features no DONE. **Pendiente** (relacionado con D6).

---

## 4. Plan de tickets (priorizado)

Los tickets se implementarán en una fase posterior. Solo se genera el plan.

**Nota:** T1–T5 del plan original están **ya cubiertos** por el código actual (validación al cerrar sprint, devolución al backlog, READY y sprint no CLOSED en backend y frontend). El plan siguiente solo incluye trabajo pendiente.

### CRITICAL

*Ninguno.* Las desviaciones críticas (cierre de sprint y asignación a sprint) están resueltas en el código actual.

### HIGH

| Id | Título | Descripción | Módulo | Archivos potencialmente afectados | Impacto |
|----|--------|-------------|--------|-----------------------------------|---------|
| T1 | Vista Product Backlog a nivel proyecto | Añadir vista o modo que use `GET /projects/:projectId/stories` para listar todas las stories del proyecto con filtros (feature_id, status, sprint_id / sin sprint). Permite Sprint Planning y refinamiento con visión unificada del backlog. | Frontend | `public/js/views/stories.js` o `projects.js`, router/hash | Frontend: nueva vista o pestaña “Backlog” en detalle de proyecto. |
| T2 | Validar o advertir features DONE al publicar release | Al transicionar release a RELEASED, validar que las features asociadas estén en estado DONE (bloquear o advertir en UI). Opcional: comprobar que las stories de la feature estén DONE. | Releases | `release.service.js` (updateReleaseStatus / patchReleaseStatus), `release.controller.js`; opcional `public/js/views/releases.js` | Backend: regla en transición QA → RELEASED. Frontend: mensaje de error o confirmación. |

### MEDIUM

| Id | Título | Descripción | Módulo | Archivos potencialmente afectados | Impacto |
|----|--------|-------------|--------|-----------------------------------|---------|
| T3 | Resumen y mensaje al cerrar sprint (UX) | Al pulsar “Cerrar sprint”, cargar resumen de stories del sprint por estado y mostrar mensaje: si hay IN_PROGRESS/BLOCKED, indicar que debe completarse o moverse; si no, indicar que las no DONE se devolverán al backlog. | Sprints (frontend) | `public/js/views/sprints.js` | Frontend: modal o panel de confirmación con resumen. |
| T4 | Estado de features en asignación a release | En la vista de release, al asignar una feature mostrar su estado (DONE, IN_PROGRESS, etc.) y opcionalmente resumen de stories DONE/total de esa feature. | Releases (frontend) | `public/js/views/releases.js` | Frontend. |

### LOW

| Id | Título | Descripción | Módulo | Archivos potencialmente afectados | Impacto |
|----|--------|-------------|--------|-----------------------------------|---------|
| T5 | Documentar estados de story y política READY | Documentar en `docs/` que BLOCKED y ARCHIVED son extensiones al flujo estándar y que “listas para Sprint Planning” = READY. | Docs | `docs/` (ej. guía Scrum o README de módulo backlog) | Documentación. |

---

## 5. Evaluación de impacto técnico

- **Arquitectura:** No se modifica la arquitectura SPA, ni JWT, ni la estructura de rutas. El trabajo pendiente es principalmente frontend (vista Product Backlog, UX de cierre de sprint, estado de features en releases) y una validación de negocio en releases (features DONE al publicar).
- **Base de datos:** No se prevén cambios de esquema. El endpoint `GET /projects/:projectId/stories` ya existe; la vista unificada de backlog solo consume ese endpoint.
- **Compatibilidad:** Las validaciones de sprint (cierre con IN_PROGRESS/BLOCKED, devolución al backlog, READY, sprint no CLOSED) ya están en producción. Los nuevos cambios (T1–T5 del plan actual) son aditivos: nueva vista, mejoras UX y regla opcional en releases.
- **Riesgo:** Bajo. T2 (validar features DONE al publicar release) puede rechazar publicaciones que hoy se permiten; conviene definir si es bloqueo estricto o advertencia y documentarlo.
- **Orden sugerido:** T1 (vista Product Backlog) → T2 (validar/advertir features DONE en release) → T3 (resumen al cerrar sprint) → T4 (estado features en release en UI) → T5 (documentación).

---

**Resumen:** El sistema ya respeta la jerarquía Project → Feature → User Story, la unicidad de story en un sprint, la validación al cerrar sprint (IN_PROGRESS/BLOCKED), la devolución al backlog de las no DONE y la exigencia de READY y sprint no CLOSED al asignar stories. Las desviaciones abiertas son de experiencia de usuario (vista unificada de backlog, mensajes al cerrar sprint) y de consistencia en releases (validar o advertir features DONE). El plan de tickets priorizado anterior refleja solo el trabajo pendiente y mantiene la alineación con Scrum sin cambiar la arquitectura ni romper contratos de API.
