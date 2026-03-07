# Plan ETAPAS 14 A 17 — Fase UX/UI completa (unificado)

**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Fase UX/UI), nexus-plan-maestro-etapas.mdc  
**Objetivo:** Cubrir en un solo ciclo de diseño, validación e implementación las **Etapas 14, 15, 16 y 17**: rediseño de módulos operativos, panel administrativo UI, reportes y analítica visual, y hardening UX/responsive.  
**Estado:** Diseñado por PO MASTER — ✅ Validado por SYSTEM ARCHITECT (docs/VALIDACION_ARQUITECTONICA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md); ajustes PO incorporados (docs/AJUSTES_PO_ETAPAS_14_A_17_SEGUN_ARCHITECT.md).

**Alcance:** Solo frontend (HTML, CSS, JS en `public/`). Sin cambios en API, backend ni rutas. Design system Etapa 12. Layout (barra superior, sidebar) coherente con Etapa 13. Una sola validación arquitectónica y un solo prompt de ejecución para el MASTER DEVELOPER; una sola evidencia de cierre que cubra las cuatro etapas.

---

## 1. Contexto

- **Situación actual:** Tras Etapa 13 (dashboard), las vistas de módulos operativos (projects, features, stories, sprints, releases, incidents, documents), el panel admin (admin, users, audit, metrics), reportes y el comportamiento responsive/accesibilidad no están unificados con wireframes ni con un único estándar de cierre.
- **Objetivo del plan unificado:** Definir en un solo documento el alcance completo de las Etapas 14–17 para que (1) el SYSTEM ARCHITECT valide una vez el conjunto y (2) el MASTER DEVELOPER ejecute en orden 14 → 15 → 16 → 17 con un único prompt, entregando una única evidencia que acredite el cumplimiento de las cuatro etapas.
- **Referencias:** docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md; nexus-plan-maestro-etapas.mdc (ETAPAS 14, 15, 16, 17); docs/PLAN_ETAPA_14_REDISENO_MODULOS_OPERATIVOS.md, PLAN_ETAPA_15_..., PLAN_ETAPA_16_..., PLAN_ETAPA_17_... (detalle por etapa).

---

## 2. Alcance global (solo frontend)

| Elemento | Especificación |
|----------|----------------|
| **Backend / API** | Sin cambios. Solo consumo de endpoints existentes en todas las pantallas. |
| **Frontend** | `public/index.html`, `public/js/layout.js`, `public/css/design-system.css`, `public/js/views/` (dashboard, projects, features, stories, sprints, releases, incidents, documents, admin, reports). |
| **Stack** | HTML5, Bootstrap 5, JavaScript vanilla. Design system Etapa 12. |
| **Entrega** | Un ciclo: validación arquitecto → ajustes PO → implementación 14→15→16→17 → evidencia única → QA → cierre PO para las cuatro etapas. |

---

## 3. Bloque 1 — ETAPA 14: Rediseño de módulos operativos

**Pantallas:** Projects (listado + detalle), Features, Stories, Sprints (listado + detalle), Releases (listado + detalle), Incidents, Documents (listado + detalle).

**Por pantalla:**

- **#/projects:** Título "Projects"; búsqueda; "Filter by status" (ACTIVE/ARCHIVED); "+ New Project"; tabla (Name, Status, Created date, Actions); badges; paginación; empty state "No projects yet" / "Create project".
- **#/projects/:id:** Breadcrumb; datos del proyecto; enlaces Features, Sprints, Incidents; "Archivar" (solo MASTER).
- **#/features:** Breadcrumb Dashboard/Projects/[Project]/Features; selector proyecto; búsqueda; "Filter by status" (valores API: DRAFT, APPROVED, IN_PROGRESS, DONE, ARCHIVED); "+ New Feature"; tabla (Feature title, Status, Stories count, Actions); paginación; empty state.
- **#/stories:** Breadcrumb con proyecto/feature; selectores; "+ New Story"; tabla (Story ID, Title, Status, Assigned Sprint, Priority, Assignee, Actions); estados según API: DRAFT, READY, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE, ARCHIVED; empty state "No stories created yet" / "Create first story".
- **#/sprints:** Selector proyecto; "+ New Sprint"; tabla (name, start/end date, status, actions); estados según API: PLANNED, IN_PROGRESS, CLOSED (no "ACTIVE"). **#/sprints/:id:** Breadcrumb; tarjeta de info; tabla de stories asignadas; "Close Sprint" (MASTER).
- **#/releases:** Listado: tabla versión, estado, acciones; "+ New Release"; filtros y paginación. Detalle: breadcrumb; datos; features asociadas.
- **#/incidents:** Selector proyecto; búsqueda; status filter; "+ New Incident"; tabla (Title, Severity, Status, Created date, Actions); badges; paginación; empty state.
- **#/documents:** Listado: búsqueda; "+ New Document"; tabla (Code, Title, Latest version, Status, Actions); paginación. Detalle: breadcrumb; versiones con estados; Aprobar/Archivar (MASTER).

**Alineación con API (observaciones SYSTEM ARCHITECT):** Los filtros "Filter by status" y los badges deben usar los **valores exactos** que devuelve la API. La etiqueta visible puede ser distinta (ej. "Active" para IN_PROGRESS) pero el valor enviado a la API y la clase de badge deben coincidir con la API: **Sprint:** PLANNED, IN_PROGRESS, CLOSED; **Feature:** DRAFT, APPROVED, IN_PROGRESS, DONE, ARCHIVED; **Story:** DRAFT, READY, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE, ARCHIVED.

**Alcance Improvements:** El módulo Improvements (#/improvements) queda **fuera del alcance** de Etapas 14–17; se abordará en ciclo posterior. No incluir rediseño de #/improvements en este plan.

**Criterios de aceptación Etapa 14:** Todas las pantallas con título, breadcrumb cuando aplique, búsqueda/filtros, "+ New", tablas y columnas indicadas, badges (valores API), paginación, empty state; detalles con breadcrumb, datos, enlaces y acciones por rol; design system; sin cambios API.

---

## 4. Bloque 2 — ETAPA 15: Panel administrativo UI

**Pantallas:** #/admin, #/admin/users, #/admin/audit, #/admin/metrics. Solo MASTER.

- **#/admin:** Título "Administration"; tres tarjetas: Users (icono, "Open" → #/admin/users), Audit Logs (→ #/admin/audit), Metrics (→ #/admin/metrics). Sidebar con Administration: Users Management, Audit Logs, Metrics; ítem activo según ruta.
- **#/admin/users:** Breadcrumb Administration / Users Management; título "Users"; búsqueda; "filter by role"; "+ New User"; tabla (Email, Role, Status, Actions: edit, lock/password, delete); paginación; CRUD y cambio de contraseña (API existente).
- **#/admin/audit:** Breadcrumb Administration / Audit Logs; filtros (entidad, usuario, fechas, acción); tabla de registros; paginación.
- **#/admin/metrics:** Breadcrumb Administration / Metrics; tarjetas total_requests, total_errors, auth_failures, refresh_failures; botón "Refresh metrics"; sección "Metric Details" (GET /system/metrics).

**Criterios de aceptación Etapa 15:** Dashboard admin con tres tarjetas; Users, Audit y Metrics con breadcrumb, filtros/tablas según especificación; guard MASTER sin regresión; design system.

---

## 5. Bloque 3 — ETAPA 16: Reportes y analítica visual

**Pantalla:** #/reports. Solo MASTER.

- Título "Reports"; breadcrumb Dashboard / Reports.
- Selectores: proyecto, sprint (según API).
- Secciones: Resumen proyecto, Resumen sprint, Actividad usuario (si API lo expone), Auditoría (tabla con filtros entidad/usuario/fechas/acción y paginación; coherente con #/admin/audit).
- Opcional: gráficos (barras, líneas, donut) si design system y API lo permiten; si no, tarjetas y tablas.

**Criterios de aceptación Etapa 16:** #/reports con selectores y al menos tres secciones (resumen proyecto, resumen sprint, actividad usuario, auditoría); coherencia con Etapa 15; solo endpoints existentes; guard MASTER.

---

## 6. Bloque 4 — ETAPA 17: Hardening UX y responsive

**Alcance transversal:** Todas las pantallas tocadas en Etapas 13–16.

- **Responsive:** Sidebar colapsable/drawer en viewport &lt; 992px; tablas con scroll horizontal o vista tarjetas en &lt; 768px; sin scroll horizontal no deseado en body.
- **Accesibilidad (WCAG AA objetivo):** Contraste (4.5:1 texto normal, 3:1 texto grande); etiquetas en inputs/controles; foco visible (`:focus-visible`); navegación por teclado (tabulación lógica, modales con Escape, sin trampas de foco).
- **Consistencia visual:** Tipografía, espaciado y componentes unificados según design system; empty states con misma clase/estilo.
- **Microinteracciones:** Hover/active en botones; loading en acciones API (spinner o "Loading..."); mensajes éxito/error claros (toast/alert unificado); estados de carga en listados (skeleton/spinner).
- **Navegación:** Breadcrumbs correctos en todas las vistas; ítem activo en sidebar por ruta; búsqueda global usable si existe.

**Criterios de aceptación Etapa 17:** Layout responsive; mejoras a11y; consistencia y microinteracciones; breadcrumbs y sidebar activo; sin regresión ni cambios API.

---

## 7. Criterios de aceptación globales (Etapas 14–17)

- **Etapa 14:** Projects, Features, Stories, Sprints, Releases, Incidents, Documents (listados y detalles) según wireframes y design system; tablas, filtros, breadcrumbs, badges, paginación, empty state; acciones por rol (MASTER).
- **Etapa 15:** #/admin, #/admin/users, #/admin/audit, #/admin/metrics según wireframes; guard MASTER.
- **Etapa 16:** #/reports con selectores y secciones de resumen/auditoría; coherencia con admin.
- **Etapa 17:** Responsive, accesibilidad, consistencia visual, microinteracciones, navegación correcta en todas las pantallas.
- **Global:** Cero cambios en `src/`, API ni contratos; design system Etapa 12 aplicado; RBAC respetado.

---

## 8. Validación QA (6 niveles) — aplicable al conjunto 14–17

- **Funcional:** Todas las rutas (módulos, admin, reports) cargan; tablas, filtros, paginación, acciones y empty states operativos; en móvil y escritorio donde aplique Etapa 17.
- **API:** Solo endpoints existentes; sin errores en consola por llamadas incorrectas.
- **Diseño:** Layout y componentes alineados a wireframes y design system en las pantallas de cada etapa.
- **Navegación:** Breadcrumbs correctos; sidebar con ítem activo; enlaces listado/detalle operativos.
- **Seguridad/RBAC:** Acciones MASTER solo para MASTER; guard de rutas admin/reports sin regresión.
- **Regresión:** #/dashboard, #/login y resto de rutas operativas; sin cambios en API ni contratos.

---

## 9. Referencias

- **Validación y ajustes:** docs/VALIDACION_ARQUITECTONICA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md, docs/AJUSTES_PO_ETAPAS_14_A_17_SEGUN_ARCHITECT.md.
- Planes por etapa (detalle): docs/PLAN_ETAPA_14_REDISENO_MODULOS_OPERATIVOS.md, docs/PLAN_ETAPA_15_PANEL_ADMINISTRATIVO_UI.md, docs/PLAN_ETAPA_16_REPORTES_ANALITICA_VISUAL.md, docs/PLAN_ETAPA_17_HARDENING_UX_RESPONSIVE.md.
- Wireframes: docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md.
- Plan maestro: .cursor/rules/nexus-plan-maestro-etapas.mdc (ETAPAS 14–17).
- Design system: public/css/design-system.css; Etapa 12.
- Vistas: public/js/views/*.js; layout: public/js/layout.js, public/index.html.

---

*Plan unificado. Validado por SYSTEM ARCHITECT; ajustes PO incorporados. Prompt de ejecución: docs/PROMPT_MASTER_DEVELOPER_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md.*
