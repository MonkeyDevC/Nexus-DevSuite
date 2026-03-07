# Evidencia ETAPAS 14 A 17 — Fase UX/UI completa

**Fecha:** 2026-03-06  
**Referencia:** docs/PLAN_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md, docs/PROMPT_MASTER_DEVELOPER_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md

---

## 1. Archivos creados o modificados

| Archivo | Cambio |
|---------|--------|
| public/js/ux.js | Helper `nexusBadgeClass(status)` para design system (estado API → clase nexus-badge-*). |
| public/js/views/projects.js | ETAPA 14: breadcrumb Home/Projects, título "Projects", barra búsqueda + Filter by status (All/ACTIVE/ARCHIVED), "+ New Project", tabla Name, Status, Created date, Actions; detalle breadcrumb Dashboard/Projects/[name], Features/Sprints/Incidents, Archivar MASTER. Design system. |
| public/js/views/features.js | ETAPA 14: breadcrumb Dashboard/Projects/[Project]/Features, selector proyecto, búsqueda, Filter by status (DRAFT, APPROVED, IN_PROGRESS, DONE, ARCHIVED), "+ New Feature", tabla Feature title, Status, Stories count, Actions. |
| public/js/views/stories.js | ETAPA 14: breadcrumb, selectores proyecto/feature, Filter by status (DRAFT, READY, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE, ARCHIVED), "+ New Story", tabla Story ID, Title, Status, Assigned Sprint, Priority, Assignee, Actions; empty state "No stories created yet" / "Create first story". |
| public/js/views/sprints.js | ETAPA 14: breadcrumb, selector proyecto, "+ New Sprint", Filter by status (PLANNED, IN_PROGRESS, CLOSED), tabla name, start/end date, status, actions; detalle breadcrumb, tarjeta info, tabla stories asignadas, "Close Sprint" MASTER. |
| public/js/views/releases.js | ETAPA 14: breadcrumb, título "Releases", Filter by status (PLANNED, RELEASED, ARCHIVED), "+ New Release", tabla version, status, actions; detalle breadcrumb, features asociadas. |
| public/js/views/incidents.js | ETAPA 14: breadcrumb, selector proyecto, búsqueda, Filter by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED), "+ New Incident", tabla Title, Severity, Status, Created date, Actions. |
| public/js/views/documents.js | ETAPA 14: breadcrumb, título "Documents", búsqueda, "+ New Document", tabla Code, Title, Latest version, Status, Actions; detalle versiones DRAFT/APPROVED/ARCHIVED, Aprobar/Archivar MASTER. |
| public/js/views/admin.js | ETAPA 15: #/admin tres tarjetas (Users, Audit Logs, Metrics) con "Open"; #/admin/users breadcrumb Administration/Users Management, búsqueda, filter by role, "+ New User", tabla Email, Role, Status, Actions; #/admin/audit filtros y tabla; #/admin/metrics tarjetas total_requests, total_errors, auth_failures, refresh_failures, "Refresh metrics", Metric Details. |
| public/js/views/reports.js | ETAPA 16: título "Reports", breadcrumb Dashboard/Reports, selectores proyecto y sprint, secciones Project summary, Sprint summary, Auditoría (MASTER) con tabla y paginación. |
| public/css/design-system.css | ETAPA 17: sección 10 — sidebar colapsable en &lt;992px (fixed, translateX, clase .nexus-sidebar-open), overlay, tablas .table-responsive overflow-x en &lt;768px, :focus-visible para a/button/input/select. |
| public/index.html | Overlay sidebar, botón hamburguesa "Abrir menú" en topbar (visible en &lt;992px), aria-label en sidebar. |
| public/js/layout.js | initSidebarToggle: toggle clase nexus-sidebar-open en #app-sidebar y #app-layout, cierre con overlay. |

**Migraciones aplicadas:** N/A (solo frontend).  
**Arquitectura:** No se modificaron controllers, services ni repositories en `src/`.

---

## 2. Reglas de dominio

N/A para UI. Acciones condicionadas por rol (MASTER): Archivar proyecto, Close Sprint, Aprobar/Archivar documento, acceso #/admin y #/reports según backend existente.

---

## 3. QA funcional por etapa

- **Etapa 14:** Projects, Features, Stories, Sprints, Releases, Incidents, Documents (listados y detalle donde aplica) con título, breadcrumb, búsqueda/filtros (valores API), "+ New", tablas y columnas indicadas, badges nexus-badge-*, paginación, empty state; ítem activo en sidebar por ruta.
- **Etapa 15:** #/admin con tres tarjetas y enlaces; #/admin/users con CRUD y cambio de contraseña; #/admin/audit con filtros y tabla; #/admin/metrics con tarjetas, Refresh y Metric Details. Guard MASTER.
- **Etapa 16:** #/reports con selectores proyecto/sprint, Project summary, Sprint summary, Auditoría (MASTER).
- **Etapa 17:** Sidebar colapsable en viewport &lt;992px (botón hamburguesa, overlay para cerrar); tablas con scroll horizontal en pequeño; :focus-visible en controles; consistencia design system.

---

## 4. QA negativa / regresión

- Filtros y búsqueda vacíos no rompen vistas.
- Acciones MASTER solo visibles/operativas para rol MASTER (guard en router para #/admin).
- Rutas #/dashboard, #/login, #/projects, #/features, #/stories, #/sprints, #/releases, #/incidents, #/documents, #/admin, #/reports verificadas sin errores de consola esperados.

---

## 5. Contrato API / Response Layer

Sin cambios; solo consumo de endpoints actuales (GET/POST/PATCH/DELETE según documentación). Mejoras (#/improvements) no rediseñadas en este ciclo (fuera de alcance según ajustes Architect).

---

## 6. Criterios de aceptación (resumen)

- [x] Etapa 14: Módulos operativos con design system, breadcrumbs, filtros por estado API, tablas, empty states, acciones MASTER.
- [x] Etapa 15: Admin dashboard, Users, Audit, Metrics con design system; guard MASTER.
- [x] Etapa 16: Reports con selectores y secciones; coherencia con admin.
- [x] Etapa 17: Sidebar responsive, tablas responsive, foco visible, consistencia visual.
- [x] Cero cambios en backend ni contratos API.
