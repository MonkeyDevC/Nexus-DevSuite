# Prompt de ejecución — ETAPAS 14 A 17 Fase UX/UI completa (unificado)

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md, docs/VALIDACION_ARQUITECTONICA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md, docs/AJUSTES_PO_ETAPAS_14_A_17_SEGUN_ARCHITECT.md, docs/CHECKLIST_ETAPAS_PROYECTO.md, nexus-plan-maestro-etapas.mdc (ETAPAS 14–17), docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md  
**Estructura:** nexus-engineering-execution.mdc  
**Estado:** ✅ Validado por SYSTEM ARCHITECT; ajustes PO incorporados. Listo para ejecución.

---

## 1️⃣ OBJETIVO

Implementar **en un solo ciclo** las **ETAPAS 14, 15, 16 y 17** siguiendo estrictamente el plan unificado `docs/PLAN_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md`.

**Propósito:**  
- **Etapa 14:** Rediseño de módulos operativos (projects, features, stories, sprints, releases, incidents, documents — listados y detalles) con wireframes y design system.  
- **Etapa 15:** Panel administrativo UI (#/admin, #/admin/users, #/admin/audit, #/admin/metrics).  
- **Etapa 16:** Reportes y analítica visual (#/reports).  
- **Etapa 17:** Hardening UX y responsive (sidebar colapsable, tablas responsive, accesibilidad, consistencia, microinteracciones, navegación).

Solo frontend; cero cambios en API ni backend. Ejecutar en orden **14 → 15 → 16 → 17**. Entregar **una sola evidencia** que acredite el cumplimiento de las cuatro etapas.

---

## 2️⃣ REGLAS INNEGOCIABLES

- **Solo frontend:** Modificar únicamente archivos bajo `public/`: `public/index.html`, `public/js/layout.js`, `public/css/design-system.css`, `public/js/views/*.js`. No tocar `src/`, controllers, services, repositories ni migraciones.
- **Design system Etapa 12:** Usar clases y variables de `public/css/design-system.css` (cards, badges, botones, tablas, empty state, espaciados). No introducir estilos que contradigan el design system.
- **Layout existente:** Mantener barra superior y sidebar de Etapa 13; en Etapa 17 se añade comportamiento responsive (sidebar colapsable). Resaltar ítem activo del sidebar según ruta.
- **API existente:** Consumir solo endpoints ya expuestos. No crear endpoints nuevos ni modificar contratos.
- **RBAC:** Acciones MASTER (Archivar, Close Sprint, Aprobar/Archivar, acceso admin/reports) según rol; no cambiar lógica de autorización en backend.
- **Stack:** HTML5, Bootstrap 5, JavaScript vanilla. Convención de vistas: `window.registerView`, `window.setContent`, hash routing existente.
- **Regresión:** Tras todas las fases, #/dashboard, #/login, #/projects, #/features, #/stories, #/sprints, #/releases, #/incidents, #/documents, #/admin, #/reports deben funcionar sin errores de consola.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN (QUIRÚRGICO)

Ejecutar **en este orden**: primero toda la ETAPA 14, luego toda la ETAPA 15, luego ETAPA 16, luego ETAPA 17. No saltar ni invertir etapas.

---

### ETAPA 14 — Rediseño de módulos operativos

**Archivos:** `public/js/views/projects.js`, `features.js`, `stories.js`, `sprints.js`, `releases.js`, `incidents.js`, `documents.js`.

1. **Projects (#/projects):** Título "Projects"; breadcrumb Home/Projects; barra: búsqueda, "Filter by status" (All/ACTIVE/ARCHIVED), "+ New Project"; tabla Name, Status, Created date, Actions (edit, delete); badges ACTIVE/ARCHIVED; paginación; empty state "No projects yet" / "Create project".
2. **Project detalle (#/projects/:id):** Breadcrumb Dashboard/Projects/[name]; datos; enlaces Features, Sprints, Incidents; "Archivar" solo MASTER.
3. **Features (#/features):** Breadcrumb Dashboard/Projects/[Project]/Features; selector proyecto; búsqueda; "Filter by status" (valores API: DRAFT, APPROVED, IN_PROGRESS, DONE, ARCHIVED); "+ New Feature"; tabla Feature title, Status, Stories count, Actions; paginación; empty state.
4. **Stories (#/stories):** Breadcrumb con proyecto/feature; selectores; "+ New Story"; tabla Story ID, Title, Status, Assigned Sprint, Priority, Assignee, Actions; estados según API: DRAFT, READY, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE, ARCHIVED; empty state "No stories created yet" / "Create first story".
5. **Sprints listado (#/sprints):** Selector proyecto; "+ New Sprint"; tabla name, start/end date, status, actions; estados según API: PLANNED, IN_PROGRESS, CLOSED (no "ACTIVE"); paginación; empty state.
6. **Sprint detalle (#/sprints/:id):** Breadcrumb; tarjeta name, dates, status; tabla stories asignadas (title, status, assignee); "Close Sprint" solo MASTER.
7. **Releases listado (#/releases):** Título "Releases"; "+ New Release"; tabla version, status, actions; filtros; paginación.
8. **Release detalle (#/releases/:id):** Breadcrumb; datos; features asociadas.
9. **Incidents (#/incidents):** Selector proyecto; búsqueda; status filter; "+ New Incident"; tabla Title, Severity, Status, Created date, Actions; badges; paginación; empty state.
10. **Documents listado (#/documents):** Título "Documents"; búsqueda; "+ New Document"; tabla Code, Title, Latest version, Status, Actions; paginación; empty state.
11. **Document detalle (#/documents/:id):** Breadcrumb; código, título; versiones con estados DRAFT/APPROVED/ARCHIVED; Aprobar/Archivar solo MASTER.
12. **Verificación Etapa 14:** Sidebar ítem activo en cada ruta de módulos; breadcrumbs y enlaces listado/detalle correctos; sin errores consola.

---

### ETAPA 15 — Panel administrativo UI

**Archivo:** `public/js/views/admin.js`.

13. **#/admin:** Título "Administration"; tres tarjetas: Users (icono + "Open" → #/admin/users), Audit Logs (→ #/admin/audit), Metrics (→ #/admin/metrics). Sidebar Administration con Users Management, Audit Logs, Metrics; ítem activo por ruta.
14. **#/admin/users:** Breadcrumb Administration/Users Management; título "Users"; búsqueda; "filter by role" (All, MASTER, EMPLOYEE); "+ New User"; tabla Email, Role, Status, Actions (edit, lock/password, delete); paginación; mantener modales CRUD y cambio de contraseña existentes.
15. **#/admin/audit:** Breadcrumb Administration/Audit Logs; filtros entidad, usuario, fechas, acción; tabla registros; paginación.
16. **#/admin/metrics:** Breadcrumb Administration/Metrics; tarjetas total_requests, total_errors, auth_failures, refresh_failures; botón "Refresh metrics"; sección "Metric Details" (GET /system/metrics).
17. **Verificación Etapa 15:** Guard MASTER; rutas admin sin errores consola; regresión dashboard y projects.

---

### ETAPA 16 — Reportes y analítica visual

**Archivo:** `public/js/views/reports.js`.

18. Título "Reports"; breadcrumb Dashboard/Reports.
19. Selectores: proyecto, sprint (carga según API).
20. Secciones: Resumen proyecto, Resumen sprint, Actividad usuario (si API), Auditoría (tabla con filtros entidad/usuario/fechas/acción, paginación; estilos coherentes con #/admin/audit).
21. Opcional: gráficos si design system y API lo permiten; si no, tarjetas y tablas.
22. **Verificación Etapa 16:** Sidebar Reports activo en #/reports; solo endpoints existentes; regresión.

---

### ETAPA 17 — Hardening UX y responsive

**Archivos:** `public/index.html`, `public/js/layout.js`, `public/css/design-system.css`, y vistas según necesidad.

23. **Responsive sidebar:** Viewport &lt; 992px: sidebar colapsable (hamburger, drawer/overlay); contenido no tapado permanentemente; poder cerrar sidebar.
24. **Contenedor y tablas:** Sin scroll horizontal no deseado en body; en &lt; 768px tablas principales con overflow-x: auto y opcionalmente vista tarjetas (una fila por tarjeta).
25. **Accesibilidad:** Contraste 4.5:1 texto normal / 3:1 texto grande; inputs con label o aria-label; botones icono con aria-label; :focus-visible visible en enlaces/botones/inputs; orden tabulación lógico; modales cerrar con Escape; sidebar y breadcrumbs navegables por teclado.
26. **Consistencia visual:** Revisar todas las vistas (dashboard, módulos, admin, reports): tipografía, espaciados, componentes según design system; empty states con misma clase (.nexus-empty-state o equivalente).
27. **Microinteracciones:** Botones con hover/active; acciones API con estado loading (spinner o "Loading..."); mensajes éxito/error con mismo patrón (toast/alert); listados con skeleton o spinner mientras cargan.
28. **Navegación:** Breadcrumbs correctos en todas las vistas; ítem activo en sidebar en #/dashboard, #/projects, #/features, #/stories, #/sprints, #/releases, #/incidents, #/documents, #/admin, #/admin/users, #/admin/audit, #/admin/metrics, #/reports; búsqueda global usable si existe (si no, documentar en evidencia).
29. **Verificación final:** Probar escritorio (≥1200px) y móvil (375px o 768px); todas las rutas sin errores consola; login, dashboard, listados, detalles, admin y reportes operativos; sin regresión.

---

## 4️⃣ CRITERIOS DE ACEPTACIÓN (ETAPAS 14–17)

**Etapa 14:**  
- [ ] Projects, Features, Stories, Sprints, Releases, Incidents, Documents (listado y detalle donde aplique) con título, breadcrumb, búsqueda/filtros, "+ New", tablas y columnas indicadas en el plan, badges, paginación, empty state; acciones MASTER solo para MASTER.

**Etapa 15:**  
- [ ] #/admin: tres tarjetas (Users, Audit Logs, Metrics) con enlaces.  
- [ ] #/admin/users: breadcrumb, búsqueda, filter by role, "+ New User", tabla, CRUD y cambio de contraseña.  
- [ ] #/admin/audit: filtros, tabla, paginación.  
- [ ] #/admin/metrics: tarjetas, Refresh, Metric Details. Guard MASTER.

**Etapa 16:**  
- [ ] #/reports: título, breadcrumb, selectores proyecto/sprint, al menos tres secciones (resumen proyecto, resumen sprint, actividad usuario, auditoría); coherencia con admin.

**Etapa 17:**  
- [ ] Sidebar colapsable en &lt; 992px; tablas responsive (scroll o tarjetas en pequeño); contraste, etiquetas, foco visible, teclado (WCAG AA objetivo); consistencia visual y empty states unificados; microinteracciones (hover, loading, mensajes); breadcrumbs y sidebar activo correctos.

**Global:**  
- [ ] Design system aplicado en todas las pantallas.  
- [ ] Sin cambios en backend, API ni contratos.

---

## 5️⃣ QA (6 NIVELES) — APLICABLE AL CONJUNTO 14–17

- **Funcional:** Todas las rutas cargan; tablas, filtros, paginación, acciones y empty states operativos; en escritorio y móvil (Etapa 17).
- **API:** Solo endpoints existentes; sin errores en consola.
- **Diseño:** Layout y componentes alineados a wireframes y design system en cada etapa.
- **Navegación:** Breadcrumbs correctos; sidebar ítem activo por ruta.
- **Seguridad/RBAC:** Acciones MASTER solo para MASTER; guard admin/reports.
- **Regresión:** #/dashboard, #/login y resto de rutas operativas; API intacta.

---

## 6️⃣ CRITERIO DE CIERRE

- Etapas 14, 15, 16 y 17 implementadas en orden según este prompt y el plan unificado.
- Criterios de aceptación de la sección 4️⃣ cumplidos.
- QA en 6 niveles ejecutada y sin bloqueos.
- Cero cambios en `src/`, migraciones o contratos API.
- **Una sola evidencia** generada: `docs/EVIDENCIA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA_YYYY-MM-DD.md`.

---

## 7️⃣ ENTREGABLES Y EVIDENCIA

- **Código:** Archivos modificados en `public/` (index.html, layout.js, design-system.css, views: projects, features, stories, sprints, releases, incidents, documents, admin, reports). Sin cambios en `src/`.
- **Evidencia (única para 14–17):** Crear `docs/EVIDENCIA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA_YYYY-MM-DD.md` (reemplazar YYYY-MM-DD por fecha real) con contenido mínimo:
  1. **Archivos creados o modificados** (lista completa).
  2. **Migraciones aplicadas:** N/A (solo frontend).
  3. **Arquitectura intacta:** No se modificaron controllers, services ni repositories.
  4. **Reglas de dominio:** N/A para UI; acciones condicionadas por rol según backend existente.
  5. **QA funcional:** Resumen por etapa (14: pantallas módulos; 15: admin; 16: reports; 17: responsive/a11y/consistencia/microinteracciones).
  6. **QA negativa:** Filtros/búsqueda vacíos; acciones sin permiso; regresión.
  7. **Auditoría:** N/A (sin cambios backend).
  8. **Errores 500:** Confirmación de ausencia en flujos usados desde las vistas.
  9. **Contrato API / Response Layer:** Sin cambios; solo consumo de endpoints actuales.
- **Checklist:** Tras implementación, marcar en docs/CHECKLIST_ETAPAS_PROYECTO.md el paso "MASTER DEVELOPER implementa" para **ETAPA 14, ETAPA 15, ETAPA 16 y ETAPA 17** y referenciar el archivo de evidencia única.

---

## 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (incorporar en implementación)

1. **Valores de estado (filtros y badges):** Usar **exactamente** los valores que devuelve la API en filtros "Filter by status" y en clases de badge. No usar etiquetas que no existan en la API:
   - **Sprint:** PLANNED, **IN_PROGRESS**, CLOSED (no "ACTIVE"; si se muestra "Active" como texto visible, el valor enviado a la API debe ser IN_PROGRESS).
   - **Feature:** DRAFT, APPROVED, IN_PROGRESS, DONE, ARCHIVED (no "PLANNED" como valor de filtro; usar DRAFT y/o APPROVED según criterio de negocio).
   - **Story:** DRAFT, READY, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE, ARCHIVED (no "TODO"; usar DRAFT y/o READY si se desea un grupo "por hacer").
   Las clases del design system (ej. `.nexus-badge-in-progress`) deben mapear 1:1 con estos valores.

2. **Módulo Improvements:** La pantalla #/improvements **no está en el alcance** de este ciclo (Etapas 14–17). No implementar rediseño de la vista de Improvements en este prompt; si ya existe una vista básica, mantenerla sin rediseño hasta ciclo posterior. Documentar en evidencia si aplica.

3. **Rutas y endpoints:** Consumir solo endpoints documentados (p. ej. CONTRATO_API.md o docs/openapi.yaml). Para reportes: GET /reports/projects/:projectId/summary, GET /reports/sprints/:sprintId/summary, GET /reports/users/:userId/activity, GET /reports/audit (MASTER). No inventar rutas ni query params no documentados.

---

*Documento generado para ejecución unificada de ETAPAS 14 A 17. Plan: docs/PLAN_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md. Validación: docs/VALIDACION_ARQUITECTONICA_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md. Ajustes PO: docs/AJUSTES_PO_ETAPAS_14_A_17_SEGUN_ARCHITECT.md.*
