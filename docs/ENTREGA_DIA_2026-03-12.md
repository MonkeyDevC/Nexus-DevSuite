# Entrega del día — 12/03/2026

## Resumen para GitHub

### Sprints
- Filtro por **estado** y por **nombre** en dropdowns de la cabecera de la tabla (mismo patrón que Stories).
- Botón **"+ Nuevo sprint"** a la derecha del selector de proyecto.
- **Eliminar filtro**: botón que aparece cuando hay filtros activos; al pulsar limpia búsqueda y filtro de estado.
- **Breadcrumbs**: en detalle de sprint se muestra la ruta completa (Panel → Proyectos → [Proyecto] → Sprints → [Sprint]) y el enlace "Sprints" lleva a la lista con el proyecto seleccionado (`#/sprints?project=...`).

### Stories
- **Asignar sprint**: corrección de carga de sprints (limit 50, deduplicar por id, limpiar select antes de rellenar); proyecto obtenido desde la feature si hace falta.
- **Modal detalle**: edición de **criterios de aceptación** (textarea + Guardar criterios → PATCH `/stories/:id`).
- **Cierre de modal**: limpieza del backdrop y de clases al cerrar (Cancelar/Cerrar).
- **Nueva story**: campo **Sprint** en el formulario (select con sprints del proyecto); se envía `sprint_id` al crear.
- Backend: **PATCH `/stories/:id`** con `acceptance_criteria` opcional.

### Features
- **Cant. stories**: cálculo en backend (`getStoryCountsByFeatureIds`, `user_stories_count` en listado de features).
- **Búsqueda**: migrada al dropdown en la columna "Título de feature" (input + lista + Aplicar / Borrar filtro).
- **Eliminar filtro**: botón reutilizable que aparece cuando hay búsqueda o filtro por estado activos.

### Punto único: botón "Eliminar filtro"
- En **ux.js**: `window.renderClearFiltersButton({ show, id })` y `window.clearFiltersButtonIcon` para usar en cualquier tabla con filtros.
- Usado en **Sprints** y **Features**.

### Otros
- **Reports**: petición de sprints con `limit=50` (válido en API).
- **Modales (ux.js)**: en `openNexusFormModal`, `openNexusConfirmModal` y `openNexusAlertModal` se limpia backdrop y `modal-open` al cerrar.

---

## Archivos principales modificados

- `public/js/ux.js` — Botón eliminar filtro reutilizable; limpieza backdrop en modales.
- `public/js/views/sprints.js` — Filtros en columnas, breadcrumbs, uso de renderClearFiltersButton.
- `public/js/views/stories.js` — Sprint en modal y en nueva story; criterios de aceptación; fix sprints limit/dedup.
- `public/js/views/features.js` — Búsqueda por título en columna; cant. stories; eliminar filtro.
- `public/js/views/reports.js` — limit=50 en sprints.
- `src/modules/backlog/feature.service.js` — user_stories_count en listado.
- `src/modules/backlog/userStory.repository.js` — getStoryCountsByFeatureIds.
- `src/modules/backlog/userStory.service.js` — updateStory (acceptance_criteria).
- `src/modules/backlog/backlog.controller.js` — patchStoryController.
- `src/modules/backlog/backlog.validator.js` — patchStoryValidator.
- `src/modules/backlog/stories.routes.js` — PATCH /:id.
