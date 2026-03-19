# FASE 1 — Análisis del sistema actual (Backlog profesional)

**Proyecto:** NEXUS DevSuite  
**Objetivo:** Identificar cómo se listan, ordenan y asignan stories; cómo se cargan features y stories en la UI.

---

## Modelos de base de datos

| Tabla | Campos relevantes para backlog |
|-------|--------------------------------|
| **projects** | id, number, name, status, organization_id |
| **features** | id, project_id, title, status, priority, release_id, **backlog_position** |
| **user_stories** | id, feature_id, number, title, status, priority, assigned_to, sprint_id, **story_points**, **backlog_position**, **labels** (JSON) |
| **sprints** | id, project_id, name, goal, start_date, end_date, status |
| **releases** | id, version, status, organization_id |

Migración `20260316100001-add-backlog-professional-fields.js` añade: story_points, backlog_position, labels (user_stories); backlog_position (features).

---

## Servicios backend

- **feature.service.js:** toPlain incluye backlog_position. updateFeature acepta backlog_position.
- **userStory.service.js:** toPlain incluye story_points, backlog_position, labels. createStory/updateStory aceptan story_points, labels, backlog_position. listStoriesByFeature y listStoriesByProject usan repositorio que ordena por backlog_position y priority.
- **sprint.service.js:** assignStoryToSprint, unassignStoryFromSprint, listStoriesBySprintId. No calcula story points totales ni burndown.
- **backlog.service.js:** getProjectBacklog(projectId, options) devuelve features (con stories_total, stories_done, progress_pct) y stories (con filtros status, feature_id, sprint_id, assigned_to, labels). Orden por backlog_position y prioridad vía repositorios.

---

## Repositorios – ordenación

- **feature.repository.listByProject:** orden `(backlog_position IS NULL) ASC`, `backlog_position ASC`, `FIELD(priority,...) DESC`, `created_at DESC`.
- **userStory.repository.listByFeature / listByProject:** mismo criterio (backlog_position, priority, created_at).

---

## Endpoints relevantes

| Método | Ruta | Uso |
|--------|------|-----|
| GET | /projects/:projectId/backlog | Product Backlog (features + stories, filtros) |
| GET | /projects/:projectId/stories | Listado plano de stories del proyecto |
| GET | /features/:featureId/stories | Stories de una feature |
| PATCH | /stories/:id | Actualizar story (incluye story_points, labels, backlog_position) |
| PATCH | /features/:id | Actualizar feature (incluye backlog_position) |
| POST | /sprints/:id/stories/:storyId | Asignar story al sprint |
| DELETE | /sprints/:id/stories/:storyId | Quitar story del sprint |

---

## Vistas frontend

- **projects.js:** Listado de proyectos; detalle con pestañas Vista, Edición, Evidencia, **Backlog** (carga GET /projects/:id/stories con filtros).
- **features.js:** Listado por proyecto; detalle de feature (no se verifica si muestra progreso stories DONE/total).
- **stories.js:** Listado por proyecto + feature (GET /features/:id/stories); modal de detalle con story_points y labels.
- **sprints.js:** Listado por proyecto; detalle del sprint con stories (GET /sprints/:id/stories). No muestra story points totales ni burndown ni tablero Kanban.
- **backlog.js:** Vista Product Backlog (GET /projects/:projectId/backlog); filtros Proyecto, Feature, Estado, En sprint, Etiquetas; tabla Features con barra de progreso; tabla Stories con Puntos y Etiquetas. Enlace en sidebar.

---

## Resumen

- **Listado de stories:** Por feature (/features/:id/stories), por proyecto (/projects/:id/stories o /projects/:id/backlog). Orden por backlog_position y prioridad.
- **Ordenación:** Backend ya ordena por backlog_position y priority. No hay reordenación por drag and drop en la UI del backlog.
- **Asignación al sprint:** POST /sprints/:id/stories/:storyId y PATCH /stories/:id/sprint. UI en detalle del sprint (dropdown READY).
- **Carga en UI:** Product Backlog usa /backlog; detalle proyecto usa /stories; stories por feature en stories.js y en feature detail.
- **Ya implementado:** story_points, labels, backlog_position en modelo y API; progreso de feature en backlog; vista Product Backlog con filtros y progreso. Pendiente: reordenación drag and drop, filtro Asignado en backlog, story points en formulario de creación, métricas de sprint (story points, burndown), Sprint board Kanban, progreso en vista de feature.
