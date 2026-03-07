# Validación QA — ETAPA 13 Rediseño del Dashboard

**Documento:** Evidencia de validación independiente por QA ENGINEER  
**Referencia:** `docs/EVIDENCIA_ETAPA_13_REDISENO_DASHBOARD_2026-03-06.md`, `docs/PLAN_ETAPA_13_REDISENO_DASHBOARD.md`, `docs/PROMPT_MASTER_DEVELOPER_ETAPA_13_REDISENO_DASHBOARD.md`  
**Fecha de validación:** 2026-03-06  
**Estado:** **VALIDADO** — Checklist ejecutado; evidencia de código verificada.

---

## I. Resumen ejecutivo

El QA ENGINEER valida la implementación de la **ETAPA 13 — Rediseño del Dashboard** realizada por el MASTER DEVELOPER. Criterios: layout según wireframe (barra superior + sidebar), breadcrumb Home/Dashboard, título "Welcome, [User] | Dashboard", cuatro tarjetas de métricas, secciones My Assignments, Active Sprint Status, Project Health Overview, Recent Activity Feed, Recent Projects con empty state; design system Etapa 12; solo frontend; sin cambios en API.

**Resultado:** **APROBADO**

---

## II. Validación por modelo de QA (6 niveles)

Según el plan (sección 5), la etapa aplica QA en: Funcional, API, Diseño, Navegación, Empty state/placeholders, Regresión.

### 1️⃣ QA FUNCIONAL — ☑ CUMPLE

- [x] Acceso a #/dashboard muestra breadcrumb Home / Dashboard, título "Welcome, [User] | Dashboard" (dato desde `window.getMe()`), cuatro tarjetas de métricas (Active Projects, Open Stories, Sprint Progress, Critical Incidents) con valores o placeholders y enlaces a #/projects, #/stories, #/sprints, #/incidents.
- [x] Secciones My Assignments (tabs All / My Stories / Bugs, búsqueda, tabla, paginación), Active Sprint Status (placeholder + barras Remaining hours / Team member), Project Health Overview (tabla desde GET /projects), Recent Activity Feed (placeholder), Recent Projects (lista con badges o empty state). Enlaces y botón "+ New" (#/projects) presentes en topbar.
- [x] Vista registrada con `window.registerView("dashboard", ...)`; `showNav()` al entrar; contenido generado con design system (nexus-card, nexus-panel, nexus-page-title, nexus-section-spacing).

### 2️⃣ QA API — ☑ CUMPLE

- [x] Uso solo de endpoints existentes: GET /projects (lista y conteo Active Projects; Project Health y Recent Projects); usuario desde `window.getMe()` (GET /auth/me). Sin endpoints nuevos.
- [x] Open Stories, Sprint Progress y Critical Incidents con placeholders ("—", "75%") cuando no hay API específica; estructura preparada para datos futuros.
- [x] Sin cambios en backend ni contratos API (solo frontend).

### 3️⃣ QA DISEÑO — ☑ CUMPLE

- [x] Layout alineado al wireframe: barra superior (logo NEXUS DevSuite, búsqueda "Search...", notificaciones, usuario con dropdown, "+ New") y sidebar (fondo oscuro, ítems Dashboard, Proyectos, Features, Stories, Sprints, Releases, Incidentes, Documentos, Reportes, Administración).
- [x] Design system Etapa 12: `.nexus-card`, `.nexus-panel`, `.nexus-page-title`, `.nexus-section-spacing`, `.nexus-empty-state`, `.nexus-badge-active`, `.nexus-badge-archived`, `.nexus-table`, `.nexus-input`, clases de tipografía. Estilos de layout (Sección 9) en design-system.css: #app-layout, #app-sidebar, #app-topbar, .nexus-sidebar-*, .nexus-topbar-*, body.layout-login para ocultar sidebar/topbar en login.

### 4️⃣ QA NAVEGACIÓN — ☑ CUMPLE

- [x] Sidebar con ítem Dashboard activo en #/dashboard: `layout.js` aplica `.nexus-nav-item-active` al `.nexus-sidebar-link` cuyo `data-view` coincide con `window.getViewName()` (hash → dashboard).
- [x] Breadcrumb Home / Dashboard: renderizado con `window.renderBreadcrumbs` (ux.js) cuando existe; fallback con breadcrumb Bootstrap en dashboard.js.
- [x] Reportes y Administración visibles solo para MASTER (layout.js: nav-reports, nav-admin según user.role).

### 5️⃣ QA EMPTY STATE / PLACEHOLDERS — ☑ CUMPLE

- [x] Secciones sin datos muestran placeholders: My Assignments ("No hay asignaciones (placeholder)"), Active Sprint Status ("Gráfico de área (placeholder)"), Recent Activity Feed (ítems de ejemplo). Project Health con "No hay proyectos." cuando projects.length === 0.
- [x] Recent Projects: empty state "No projects yet" + texto "Create your first project to get started." + CTA "Create project" (#/projects). Clases `.nexus-empty-state`, `.nexus-empty-state-title`, `.btn-nexus-primary`. Con datos: lista con badge ACTIVE/ARCHIVED y enlace "Ver todos los proyectos".

### 6️⃣ QA REGRESIÓN — ☑ CUMPLE

- [x] Login: `hideNav()` añade `layout-login` al body; design-system.css oculta #app-sidebar y #app-topbar en `body.layout-login`; contenido a ancho completo. Rutas #/login y lógica de auth sin modificar en alcance de Etapa 13.
- [x] Resto de vistas (projects, features, stories, sprints, releases, incidents, documents, reports, admin) siguen llamando a `showNav()` y usando el mismo layout; no se eliminó la navbar anterior sino que se reemplazó por el layout wireframe (sidebar + topbar) en index.html.
- [x] Sin cambios en API ni en rutas backend.

---

## III. Verificación técnica de implementación

### Entregables (evidencia vs plan)

| Criterio | Archivo / verificación | Estado |
|----------|------------------------|--------|
| Layout barra superior + sidebar | index.html: #app-layout, #app-sidebar (nexus-sidebar-brand, nexus-sidebar-nav, nexus-sidebar-link con data-view), #app-topbar (logo, search, notificaciones, usuario dropdown, "+ New") | ☑ |
| Body layout-login por defecto | index.html: body class="layout-login"; design-system.css oculta sidebar/topbar en body.layout-login | ☑ |
| showNav / hideNav | layout.js: showNav quita layout-login, setea usuario desde getMe(), muestra/oculta Reportes y Admin por rol, aplica nexus-nav-item-active según getViewName(); hideNav añade layout-login | ☑ |
| Ítem activo en sidebar | layout.js: querySelectorAll .nexus-sidebar-link, toggle nexus-nav-item-active si data-view === getViewName(); router.js expone getViewName() desde hash | ☑ |
| Breadcrumb y título | dashboard.js: breadcrumb Home/Dashboard (renderBreadcrumbs o fallback); título "Welcome, [User] \| Dashboard" con nexus-page-title | ☑ |
| Cuatro tarjetas | dashboard.js: Active Projects (desde GET /projects), Open Stories, Sprint Progress (75% + progress bar), Critical Incidents; nexus-card, enlaces a #/projects, #/stories, #/sprints, #/incidents | ☑ |
| My Assignments | dashboard.js: buildMyAssignmentsSection — título, tabs All/My Stories/Bugs, búsqueda, tabla ID/Type/Title/Priority/Status/Due Date, placeholder, paginación; nexus-panel, nexus-table | ☑ |
| Active Sprint Status | dashboard.js: buildActiveSprintSection — título, placeholder gráfico, barras Remaining hours / Team member | ☑ |
| Project Health Overview | dashboard.js: buildProjectHealthSection(projects) — tabla Key project, Status, Progress; filas desde GET /projects con badge y progress; empty "No hay proyectos." | ☑ |
| Recent Activity Feed | dashboard.js: buildRecentActivitySection — título, lista con ícono y texto (placeholders) | ☑ |
| Recent Projects | dashboard.js: buildRecentProjectsSection(projects) — lista con badge ACTIVE/ARCHIVED, enlace a #/projects/:id; empty state "No projects yet" + "Create project"; nexus-badge-active, nexus-badge-archived, nexus-empty-state | ☑ |
| Design system Etapa 12 | dashboard.js y design-system.css: uso de nexus-card, nexus-panel, nexus-page-title, nexus-section-spacing, nexus-empty-state, nexus-badge-*, nexus-table, nexus-input; Sección 9 layout en design-system.css | ☑ |

### Integración con API existente

| Criterio | Verificación | Estado |
|----------|--------------|--------|
| GET /projects | dashboard.js: fetchApi("/projects"); usado para activeCount, totalCount, Project Health filas, Recent Projects lista | ☑ |
| GET /auth/me (getMe) | layout.js y dashboard.js: user desde window.getMe(); nombre en topbar y en título Welcome | ☑ |
| Sin endpoints nuevos | Ninguna llamada a rutas no existentes; placeholders donde no hay API | ☑ |

---

## IV. Criterios de aceptación (plan y prompt)

- [x] Layout según wireframe: barra superior (logo, búsqueda, notificaciones, usuario, "+ New") y sidebar con ítem Dashboard activo.
- [x] Breadcrumb Home / Dashboard y título "Welcome, [User] | Dashboard".
- [x] Cuatro tarjetas: Active Projects, Open Stories, Sprint Progress, Critical Incidents (número/porcentaje y enlace; placeholders donde no hay API).
- [x] Secciones My Assignments, Active Sprint Status, Project Health Overview, Recent Activity Feed (estructura según wireframe; placeholders donde no hay datos).
- [x] Recent Projects con badges ACTIVE/ARCHIVED y empty state "No projects yet" / "Create project".
- [x] Design system Etapa 12 (cards, badges, tipografía, espaciado).
- [x] Sin cambios en backend ni contratos API.

---

## V. Criterios de bloqueo

- [ ] Layout no implementado (falta barra superior o sidebar).
- [ ] Dashboard no muestra breadcrumb, título o cuatro tarjetas.
- [ ] Se introducen endpoints nuevos o se modifica la API.
- [ ] Login o resto de rutas dejan de funcionar por el nuevo layout.

**Ningún criterio de bloqueo aplicado.**

---

## VI. Conclusión

La implementación de la **ETAPA 13 — Rediseño del Dashboard** **cumple** con los criterios de cierre del plan y con el modelo de QA en 6 niveles (Funcional, API, Diseño, Navegación, Empty state/placeholders, Regresión).

**Recomendación al PO MASTER:** **APROBAR CIERRE** de la Etapa 13. El dashboard queda alineado al wireframe con barra superior, sidebar, métricas, secciones centrales y Recent Projects con empty state; listo para futuras integraciones de datos (asignaciones, actividad, etc.) cuando existan endpoints.

---

**Firma QA ENGINEER (NEXUS QA)** — Validación independiente de calidad.  
**Fecha:** 2026-03-06
