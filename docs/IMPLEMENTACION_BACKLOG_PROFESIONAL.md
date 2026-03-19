# Implementación — Backlog profesional NEXUS DevSuite

**Proyecto:** NEXUS DevSuite  
**Objetivo:** Elevar el sistema de backlog a nivel profesional (tipo Jira) sin cambiar la arquitectura SPA ni romper endpoints.

---

## FASE 1 — Análisis (completado)

Documento: `docs/ANALISIS_BACKLOG_PROFESIONAL_FASE1.md`

- Modelos: `story_points`, `backlog_position`, `labels` en user_stories; `backlog_position` en features (ya existían en BD y modelos).
- Servicios y repositorios ya ordenaban por `backlog_position` y prioridad.
- Endpoint `GET /projects/:projectId/backlog` y vista Product Backlog ya existían.

---

## FASE 2 — Product Backlog profesional (completado)

- **Filtro Asignado:** Añadido en la vista Product Backlog (`backlog.js`). El backend ya filtraba por `assigned_to`; se añadió el filtro en repositorio (`listByProject` con `assigned_to`) y en la UI (dropdown de usuarios).
- **Vista Product Backlog:** Ya existía con filtros Feature, Estado, En sprint, Etiquetas; ahora también Asignado. Muestra features con barra de progreso (stories DONE/total) y stories con Puntos y Etiquetas.

**Archivos modificados:** `userStory.repository.js`, `backlog.service.js`, `public/js/views/backlog.js`.

---

## FASE 3 — Priorización del backlog (completado)

- **Endpoint:** `POST /projects/:projectId/backlog/order` con body `{ feature_ids?: string[], story_ids?: string[] }`. Actualiza `backlog_position` (0, 1, 2, …) para cada feature y cada story del proyecto.
- **Drag and drop:** En la vista Product Backlog, las filas de la tabla de Features y de User Stories son arrastrables. Al soltar, se calcula el nuevo orden y se llama al endpoint de reordenación; se recarga la vista.

**Archivos modificados:** `backlog.service.js` (función `reorderProjectBacklog`), `backlog.controller.js`, `backlog.validator.js`, `projects.routes.js`, `public/js/views/backlog.js`.

---

## FASE 4 — Story points (completado)

- **Modelo y API:** El campo `story_points` ya existía en user_stories y en la API (crear/editar story). Valores típicos: 1, 2, 3, 5, 8, 13, 21.
- **Formulario de creación:** En la vista Stories, el modal "Nueva story" incluye un desplegable "Story points" con opciones —, 1, 2, 3, 5, 8, 13, 21. El payload de creación envía `story_points` cuando se elige un valor.
- **Edición:** El modal de detalle de story ya permitía ver y editar story points y etiquetas.

**Archivos modificados:** `public/js/views/stories.js` (formulario crear story y fallback).

---

## FASE 5 — Feature progress (completado)

- **Backend:** `getProjectBacklog` ya devolvía por cada feature `stories_total`, `stories_done`, `progress_pct`.
- **Vista Product Backlog:** La tabla de Features muestra una barra de progreso y el texto "X/Y (Z%)" por feature.
- **Vista Features:** La lista de features ya mostraba progreso (stories_done, progress_pct) donde se usa ese dato.

No se requirieron cambios adicionales en esta fase.

---

## FASE 6 — Sprint Backlog con métricas (completado)

- **Backend:** El endpoint `GET /sprints/:id/summary` ya existía y devuelve `stories_count`, `stories_done_count`, `total_story_points`, `completed_story_points`.
- **Vista detalle del sprint:** Se carga el summary en paralelo al cargar el sprint. Se muestra un bloque "Resumen del sprint" con Stories (DONE/total) y Story points (completados/total). La tabla de stories del sprint incluye la columna "Puntos" (`story_points` por story).

**Archivos modificados:** `public/js/views/sprints.js` (carga de summary, bloque de resumen, columna Puntos en la tabla).

---

## FASE 7 — Burndown chart (pendiente)

- Requeriría registrar históricamente cuándo cada story pasó a DONE (por ejemplo con `closed_at` o con registros en `audit_log`) y exponer un endpoint que devuelva puntos completados por día del sprint para dibujar línea ideal vs real.
- No implementado en esta iteración para mantener el alcance acotado.

---

## FASE 8 — Sprint board Kanban (pendiente)

- Tablero con columnas READY, IN_PROGRESS, IN_REVIEW, DONE y tarjetas arrastrables que actualicen el estado de la story vía `PATCH /stories/:id/status`.
- No implementado en esta iteración.

---

## FASE 9 — Backlog por Feature (ya cubierto)

- Las stories de una feature se listan con `GET /features/:featureId/stories` ordenadas por `backlog_position` y prioridad.
- La vista de features y el Product Backlog ya muestran progreso por feature. No se añadieron cambios adicionales.

---

## FASE 10 — Etiquetas (labels) (ya cubierto)

- Campo `labels` (JSON array) en user_stories, soportado en crear/editar story y en el modal de detalle.
- Filtro "Etiquetas" en la vista Product Backlog (y parámetro `labels` en `GET /projects/:projectId/backlog`).
- No se requirieron cambios adicionales.

---

## Resumen de archivos tocados

| Archivo | Cambios |
|---------|---------|
| `src/modules/backlog/userStory.repository.js` | Filtro `assigned_to` en `listByProject`. |
| `src/modules/backlog/backlog.service.js` | `reorderProjectBacklog`; uso de `assigned_to` en listado. |
| `src/modules/backlog/backlog.controller.js` | `reorderProjectBacklogController`. |
| `src/modules/backlog/backlog.validator.js` | `reorderBacklogValidator`. |
| `src/modules/backlog/projects.routes.js` | `POST /:projectId/backlog/order`. |
| `public/js/views/backlog.js` | Filtro Asignado; drag-and-drop en tablas Features y Stories; reordenación vía API. |
| `public/js/views/stories.js` | Campo Story points en formulario de creación (y fallback) de story. |
| `public/js/views/sprints.js` | Carga de summary; bloque "Resumen del sprint"; columna Puntos en tabla de stories; eliminación de placeholder duplicado. |
| `docs/ANALISIS_BACKLOG_PROFESIONAL_FASE1.md` | Nuevo: análisis del sistema actual. |
| `docs/IMPLEMENTACION_BACKLOG_PROFESIONAL.md` | Este documento. |

---

## Seguridad arquitectónica

- No se ha modificado la arquitectura SPA ni la estructura de rutas existentes.
- No se han eliminado endpoints ni alterado contratos de respuestas de la API actual.
- No se han eliminado campos de base de datos; solo se usan campos ya existentes y el nuevo endpoint de reordenación.

---

## Validación sugerida

1. **Product Backlog:** Seleccionar proyecto, aplicar filtros (Feature, Estado, Sprint, Asignado, Etiquetas), reordenar arrastrando filas de Features y de Stories, comprobar que el orden se mantiene al recargar.
2. **Stories:** Crear una story con Story points (p. ej. 5); editar story y ver/editar puntos y etiquetas.
3. **Sprint:** Abrir un sprint con stories; comprobar resumen (Stories DONE/total, Story points completados/total) y columna Puntos en la tabla.
4. **Flujo completo:** Crear proyecto → feature → stories con puntos → sprint → asignar stories → cerrar sprint; comprobar que el sistema sigue funcionando correctamente.
