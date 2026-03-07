# Evidencia ETAPA 8 — UX Operativa

**Fecha:** 2025-03-05  
**Referencia:** docs/PLAN_ETAPA_8_UX_OPERATIVA.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_8_UX_OPERATIVA.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_8_UX_OPERATIVA.md

---

## 1. Archivos creados o modificados

### Creados
- **public/js/ux.js** — Módulo de utilidades UX: `statusBadgeClass`, `renderBreadcrumbs`, `emptyState`, `sortArray`, `filterBySearch`, `filterByStatus`, `paginateClient`, `renderPagination`, `sortableTh`.

### Modificados
- **public/index.html** — Inclusión de `<script src="js/ux.js"></script>` (después de layout.js).
- **public/js/layout.js** — Resaltado del enlace activo en la barra de navegación según ruta actual (`getViewName`).
- **public/js/router.js** — Exposición de `window.getViewName` para uso en layout.
- **public/js/views/projects.js** — Tabla ordenable (nombre, estado), filtro por estado (API), búsqueda (cliente), paginación API, badges de estado, carga, empty state.
- **public/js/views/features.js** — Breadcrumbs (Proyectos > Proyecto > Features), tabla ordenable, filtro estado, búsqueda, paginación API, badges, carga, empty state.
- **public/js/views/stories.js** — Breadcrumbs (Proyectos > Proyecto > Features > Feature > Stories), tabla ordenable, filtro estado, búsqueda, paginación API, badges, carga, empty state; soporte `#/stories?feature=id` y `#/stories?project=id`.
- **public/js/views/sprints.js** — Tabla ordenable, filtro por estado, búsqueda, paginación API, badges, breadcrumb en detalle, carga, empty state.
- **public/js/views/releases.js** — Tabla ordenable, filtro por estado, búsqueda, paginación API, badges, breadcrumb en detalle, carga, empty state.
- **public/js/views/incidents.js** — Tabla ordenable, filtro por estado, búsqueda, paginación API, badges, carga, empty state.
- **public/js/views/documents.js** — Tabla ordenable, búsqueda, paginación API (data.data + data.meta), breadcrumb en detalle, carga, empty state.
- **public/js/views/reports.js** — Paginación en listado de auditoría (GET /reports/audit?page&limit) con controles Anterior/Siguiente y números de página.
- **public/js/views/dashboard.js** — Empty state cuando no hay proyectos.

---

## 2. Resumen por pantalla (ordenación, filtros, búsqueda, paginación, indicadores, breadcrumbs, carga, empty state)

| Pantalla    | Ordenación | Filtros | Búsqueda | Paginación | Indicadores estado | Breadcrumbs | Carga | Empty state |
|------------|------------|---------|----------|------------|--------------------|-------------|-------|-------------|
| Dashboard  | —          | —       | —        | —          | —                  | —           | Sí    | Sí          |
| Proyectos  | Sí (nombre, estado) | Sí (estado API) | Sí (cliente) | Sí (API) | Sí (ACTIVE/ARCHIVED) | — | Sí | Sí |
| Features   | Sí (título, estado) | Sí (estado API) | Sí (cliente) | Sí (API) | Sí (DRAFT/IN_PROGRESS/DONE) | Sí (Proyecto → Features) | Sí | Sí |
| Stories    | Sí (título, estado) | Sí (estado API) | Sí (cliente) | Sí (API) | Sí | Sí (Proyecto → Features → Feature → Stories) | Sí | Sí |
| Sprints    | Sí (nombre, estado) | Sí (estado API) | Sí (cliente) | Sí (API) | Sí (PLANNED/IN_PROGRESS/CLOSED) | Sí (detalle) | Sí | Sí |
| Releases   | Sí (versión, estado) | Sí (estado API) | Sí (cliente) | Sí (API) | Sí (PLANNED/RELEASED/ARCHIVED) | Sí (detalle) | Sí | Sí |
| Incidents  | Sí (título, estado) | Sí (estado API) | Sí (cliente) | Sí (API) | Sí (OPEN/IN_PROGRESS/RESOLVED/CLOSED) | — | Sí | Sí |
| Documents  | Sí (código, título) | —       | Sí (cliente) | Sí (API) | — (listado sin estado) | Sí (detalle) | Sí | Sí |
| Reports    | —          | —       | —        | Sí (audit list) | — | — | Sí | Sí (audit vacío) |

**Convención de badges:** `statusBadgeClass()` en ux.js: ACTIVE/RELEASED/RESOLVED/APPROVED/IMPLEMENTED → success; ARCHIVED/CLOSED/REJECTED → secondary; IN_PROGRESS/OPEN/SUBMITTED → warning; PLANNED/DRAFT → info.

---

## 3. Backend y regresión

- **Backend:** Sin cambios. No se han modificado endpoints, parámetros ni estructuras de respuesta. Se usan únicamente parámetros documentados: `page`, `limit`, `status` donde el contrato los expone.
- **Suite de tests del backend:** Ejecutada con `npm test -- --runInBand`. Resultado: **12 test suites passed, 79 tests passed**.

---

## 4. Verificación rápida (flujos)

- **Filtro + búsqueda:** En Proyectos, elegir estado "Archivado" y escribir en búsqueda; comprobar que se muestra "No hay resultados para tu búsqueda o filtro" si no hay coincidencias.
- **Paginación:** En Proyectos o Releases, si hay más de 10 ítems, comprobar controles "Anterior" / "Siguiente" y números de página; cambiar de página y ver que la lista se actualiza.
- **Breadcrumbs:** Ir a un proyecto → Features (o Features desde selector) y comprobar "Proyectos > [Nombre proyecto] > Features". En Stories, seleccionar proyecto y feature y comprobar la ruta completa.
- **Ordenación:** En cualquier listado con tabla, clic en cabecera "Nombre" o "Estado"; comprobar flecha ↑/↓ y que la lista se reordena.
- **Empty state:** En Documentos sin documentos, o en Features sin selección de proyecto, comprobar mensaje y estilo de empty state.

---

## 5. Referencia al plan

Implementación alineada con **docs/PLAN_ETAPA_8_UX_OPERATIVA.md** y con el orden y criterios de **docs/PROMPT_MASTER_DEVELOPER_ETAPA_8_UX_OPERATIVA.md**. Validación arquitectónica: docs/VALIDACION_ARQUITECTONICA_ETAPA_8_UX_OPERATIVA.md.
