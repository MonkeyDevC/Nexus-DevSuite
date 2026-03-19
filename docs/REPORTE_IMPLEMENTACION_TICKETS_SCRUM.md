# Reporte de implementación — Tickets Scrum NEXUS DevSuite

**Rol:** MASTER DEVELOPER  
**Proyecto:** NEXUS DevSuite  
**Fecha:** 2026-03  
**Documento de referencia:** Análisis Scrum — NEXUS DevSuite y plan de tickets

---

## 1. Resumen ejecutivo

Se ha realizado la **Fase 1 (análisis del código)** y la implementación de los tickets en el orden indicado. Los tickets **T3, T1, T2, T4, T5 y T6** estaban **ya cubiertos** por el código actual; se ha verificado su comportamiento y no se ha modificado lógica existente. Se han implementado **T7** (Vista Product Backlog en frontend) y **T8** (Validación de estado de features al publicar release).

---

## 2. Tickets implementados / verificados

| Orden | Ticket | Descripción | Estado | Acción |
|-------|--------|-------------|--------|--------|
| 1 | **T3** | Unificar validación de sprint CLOSED al asignar story | Verificado | Ya implementado en `sprint.service.js` (assignStoryToSprint) y en `userStory.service.js` (updateStorySprint). Ambas rutas rechazan sprint en estado CLOSED. |
| 2 | **T1** | Validar estado de stories al cerrar sprint | Verificado | Ya implementado en `sprint.service.js` → updateSprintStatus: no permite cerrar si hay stories en IN_PROGRESS o BLOCKED (error `SPRINT_CLOSE_STORIES_IN_PROGRESS`). |
| 3 | **T2** | Devolver stories no DONE al Product Backlog al cerrar sprint | Verificado | Ya implementado en `sprint.service.js`: tras cerrar, se ejecuta `UserStory.update({ sprint_id: null }, { where: { sprint_id: sprintId, status: { [Op.ne]: "DONE" } } })`. |
| 4 | **T4** | Validar estado READY al asignar story a sprint | Verificado | Ya implementado en `sprint.service.js` (assignStoryToSprint) y en `userStory.service.js` (updateStorySprint): exigen story.status === "READY". |
| 5 | **T5** | Filtrar stories READY en UI del sprint | Verificado | Ya implementado en `public/js/views/sprints.js`: al cargar stories para el dropdown "Asignar story" se usa `status=READY` y se muestra el mensaje correspondiente. |
| 6 | **T6** | API Product Backlog por proyecto | Verificado | El endpoint `GET /projects/:projectId/stories` existe en `projects.routes.js` y el controller `listProjectStoriesController` pasa filtros `page`, `limit`, `status`, `feature_id`, `sprint_id`. No se modificó. |
| 7 | **T7** | Vista Product Backlog en frontend | **Implementado** | Añadida pestaña "Backlog" en el detalle del proyecto con lista de user stories del proyecto, filtros por estado y por sprint, paginación y enlaces a cada story. |
| 8 | **T8** | Validación de estado de features al publicar release | **Implementado** | Al transicionar una release a RELEASED se valida que todas las features asociadas estén en estado DONE; en caso contrario se rechaza con error `RELEASE_FEATURES_NOT_DONE`. |

---

## 3. Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `public/js/views/projects.js` | Nueva pestaña "Backlog" en el detalle del proyecto; panel con filtros (estado, sprint), tabla de stories, paginación y carga vía `GET /projects/:projectId/stories`. Sincronización de visibilidad de acciones (Vista/Backlog). |
| `src/modules/releases/release.service.js` | En `updateStatus`, cuando `nextStatus === "RELEASED"`: se obtienen las features de la release y se comprueba que todas tengan `status === "DONE"`; si no, se lanza `AppError` con código `RELEASE_FEATURES_NOT_DONE`. |
| `src/shared/errors/errorCodes.js` | Nuevo código de error: `RELEASE_FEATURES_NOT_DONE`. |

---

## 4. Validaciones añadidas

- **Backend (T8):** Al publicar una release (transición a RELEASED), se exige que todas las features asociadas estén en estado **DONE**. Si alguna no lo está, se devuelve HTTP 400 con mensaje indicando las features no completadas y código `RELEASE_FEATURES_NOT_DONE`.

---

## 5. Cambios en UI

- **Detalle de proyecto (T7):**  
  - Nueva pestaña **"Backlog"** (icono list-checks) junto a Vista, Edición y Evidencia.  
  - Al seleccionarla se cargan las user stories del proyecto con `GET /projects/:projectId/stories`.  
  - Filtros: **Estado** (DRAFT, READY, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE, ARCHIVED) y **En sprint** (Todos, Sin asignar, o un sprint concreto del proyecto).  
  - Tabla con columnas: ID, Título (enlace a detalle de story), Feature, Estado, Sprint, Asignado.  
  - Paginación (20 por página) con botones Anterior/Siguiente.  
  - Botón "Actualizar" para recargar con los filtros actuales.  
  - Los enlaces "Features", "Sprints", "Incidentes" del detalle del proyecto siguen visibles cuando la pestaña activa es Backlog.

---

## 6. Pruebas realizadas (validación del sistema)

- **Análisis estático:** Revisión de `sprint.service.js`, `userStory.service.js`, `release.service.js`, `sprints.js`, `stories.js`, `projects.js` para confirmar flujos de cierre de sprint, asignación de stories y carga de backlog.  
- **Contratos de API:** No se han eliminado ni cambiado endpoints existentes; la respuesta de `GET /projects/:projectId/stories` se mantiene (items + meta).  
- **Linter:** Sin errores en los archivos modificados.

**Recomendación:** Ejecutar en entorno local o de pruebas:

1. Crear proyecto → feature → user stories; refinar algunas a READY.  
2. Crear sprint y asignar stories READY; cambiar estados; cerrar sprint (comprobar bloqueo si hay IN_PROGRESS/BLOCKED y devolución al backlog de las no DONE).  
3. Abrir detalle de proyecto → pestaña Backlog; comprobar listado, filtros y paginación.  
4. Crear release, asignar features; intentar publicar con una feature no DONE (debe fallar con RELEASE_FEATURES_NOT_DONE).

---

## 7. Validación Scrum (flujo completo)

Tras la implementación, el sistema queda alineado con el flujo indicado:

- **Project → Feature → User Story:** Respeta jerarquía y creación desde proyecto/feature.  
- **Sprint Planning:** Solo stories READY pueden asignarse al sprint; no se puede asignar a un sprint CLOSED.  
- **Cierre de sprint:** No se puede cerrar si hay stories IN_PROGRESS o BLOCKED; las no DONE vuelven al Product Backlog (`sprint_id = null`).  
- **Release:** No se puede publicar una release si alguna feature asociada no está en estado DONE.  
- **Product Backlog:** Disponible en la pestaña Backlog del detalle del proyecto, con filtros por estado y sprint.

---

## 8. Riesgos u observaciones

- **T8 (RELEASE_FEATURES_NOT_DONE):** Las releases que hoy se publican con features en estado distinto de DONE pasarán a ser rechazadas. Si en algún entorno se depende de ese comportamiento, conviene comunicar el cambio y, si se desea, valorar una ventana de transición o un parámetro opcional (no implementado en esta fase).  
- **Arquitectura y contratos:** No se ha modificado la arquitectura SPA, ni modelos de BD, ni autenticación JWT; no se han eliminado endpoints ni alterado respuestas existentes de la API.

---

**Fin del reporte.**
