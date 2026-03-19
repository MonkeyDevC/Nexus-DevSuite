# Análisis del sistema actual — Backlog profesional NEXUS DevSuite

**Rol:** MASTER DEVELOPER  
**Proyecto:** NEXUS DevSuite  
**Objetivo:** Elevar el backlog a nivel profesional (tipo Jira) manteniendo arquitectura y contratos actuales.

---

## FASE 1 — Análisis del sistema actual

### 1.1 Modelos de base de datos

| Tabla | Campos relevantes para backlog | Orden actual | Observaciones |
|-------|---------------------------------|-------------|---------------|
| **projects** | id, number, name, description, status, organization_id | — | Sin cambios necesarios. |
| **features** | id, project_id, title, description, status, priority, release_id | listByProject: `created_at DESC` | Falta **backlog_position** para orden manual. |
| **user_stories** | id, feature_id, number, title, status, priority, sprint_id, assigned_to | listByFeature / listByProject: `created_at DESC` | Falta **backlog_position**, **story_points**, **labels**. |
| **sprints** | id, project_id, name, goal, start_date, end_date, status | — | Sin cambios de esquema para métricas (se calculan). |
| **releases** | id, version, status, organization_id | — | Sin cambios. |

**Conclusiones:**
- No existe orden por prioridad en listados (solo `created_at DESC`).
- No hay campo de posición para ranking manual.
- No hay story points ni etiquetas en user stories.

---

### 1.2 Servicios backend

| Servicio | Listado de stories/features | Ordenación | Asignación a sprint |
|----------|-----------------------------|------------|----------------------|
| **feature.service.js** | listFeaturesByProject → featureRepository.listByProject | created_at DESC | — |
| **userStory.service.js** | listStoriesByProject → userStoryRepository.listByProject; listStoriesByFeature → listByFeature | created_at DESC | updateStorySprint, assignStory en sprint.service |
| **sprint.service.js** | listStoriesBySprintId (stories del sprint) | created_at DESC | assignStoryToSprint, unassignStoryFromSprint |

**Endpoints existentes:**
- `GET /projects/:projectId/features` — lista features del proyecto.
- `GET /projects/:projectId/stories` — lista stories del proyecto (filtros: status, feature_id, sprint_id).
- `GET /features/:featureId/stories` — lista stories de una feature.
- `GET /sprints/:id/stories` — lista stories del sprint.
- `POST /sprints/:id/stories/:storyId` — asigna story al sprint.
- `DELETE /sprints/:id/stories/:storyId` — quita story del sprint.
- `PATCH /stories/:id/status` — cambia estado.
- `PATCH /stories/:id/sprint` — asigna/desasigna sprint.

No existe un único endpoint **GET /projects/:id/backlog** que devuelva features + stories juntos ordenados por prioridad/posición.

---

### 1.3 Vistas frontend

| Vista | Cómo se listan stories/features | Filtros | Ordenación UI |
|-------|---------------------------------|---------|----------------|
| **projects.js** | Pestaña Backlog: GET /projects/:projectId/stories con filtros status y sprint_id. Carga por página. | Estado, En sprint | Paginación, sin drag-and-drop. |
| **features.js** | Listado de features por proyecto; detalle con enlace a stories. | Proyecto, estado | Tabla ordenable por columnas. |
| **stories.js** | Por feature: GET /features/:featureId/stories. Requiere proyecto + feature. | Estado, búsqueda | sortArray por título/fecha. |
| **sprints.js** | Detalle sprint: GET /sprints/:id/stories. Selector de stories READY por feature. | — | Lista plana, sin tablero Kanban. |

**Conclusiones:**
- No hay vista unificada “Product Backlog” con features y stories ordenados por prioridad.
- No hay ordenación manual (drag-and-drop) ni campo backlog_position.
- No hay story points en formularios ni métricas de puntos en sprint.
- No hay burndown ni tablero Kanban por columnas de estado.

---

### 1.4 Resumen de gaps

| Necesidad | Estado actual | Acción |
|-----------|----------------|--------|
| Product Backlog unificado | GET /projects/:id/stories existe; no hay GET /backlog con features + stories | Añadir GET /projects/:id/backlog y/o enriquecer respuesta con features y orden. |
| Orden por prioridad / ranking | Solo created_at DESC | Añadir backlog_position; ordenar por posición y prioridad. |
| Story points | No existe | Añadir story_points (migración + modelo + formularios). |
| Progreso de feature | No calculado | Calcular DONE/total y % en backend y mostrar en vistas. |
| Métricas de sprint (puntos) | No | Calcular suma story_points del sprint y completados. |
| Burndown chart | No | Calcular por closed_at de stories DONE y story_points. |
| Sprint board (Kanban) | No | Vista por columnas READY / IN_PROGRESS / IN_REVIEW / DONE con drag-and-drop. |
| Backlog por feature ordenado | listByFeature con created_at | Añadir backlog_position y orden en feature. |
| Etiquetas (labels) | No | Añadir labels (JSON o tabla) y filtros. |

---

## Plan de implementación (resumen)

1. **Migraciones:** story_points, backlog_position (features + user_stories), labels en user_stories.
2. **Modelos:** actualizar Feature y UserStory con los nuevos campos.
3. **Backend:** GET /projects/:id/backlog; PATCH reorder (backlog_position); incluir story_points y progress en respuestas.
4. **Frontend:** vista Product Backlog profesional; formularios story_points y labels; feature progress; sprint métricas; burndown; Sprint board; backlog por feature; filtros por labels.

Este documento se actualizará con el avance de cada fase.
