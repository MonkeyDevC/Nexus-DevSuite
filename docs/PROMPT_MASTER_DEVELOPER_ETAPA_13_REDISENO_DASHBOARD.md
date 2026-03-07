# Prompt de implementación — ETAPA 13 Rediseño del Dashboard

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_13_REDISENO_DASHBOARD.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_13_REDISENO_DASHBOARD.md, docs/AJUSTES_PO_ETAPA_13_SEGUN_ARCHITECT.md, docs/CHECKLIST_ETAPAS_PROYECTO.md, nexus-plan-maestro-etapas.mdc  
**Estructura:** nexus-engineering-execution.mdc

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 13 — Rediseño del Dashboard** siguiendo el plan `docs/PLAN_ETAPA_13_REDISENO_DASHBOARD.md`.

**Propósito:** Aplicar el wireframe oficial del dashboard (#/dashboard): barra superior (logo, búsqueda "Search...", notificaciones, usuario, botón "+ New"), sidebar con ítems e ítem activo resaltado; contenido: breadcrumb Home / Dashboard, título "Welcome, [User] | Dashboard", cuatro tarjetas de métricas (Active Projects, Open Stories, Sprint Progress, Critical Incidents), secciones My Assignments, Active Sprint Status, Project Health Overview y Recent Activity Feed. Opcional: bloque "Recent Projects" con badges y empty state. Design system Etapa 12. Solo frontend; sin cambios en API.

---

## 2️⃣ REGLAS INNEGOCIABLES

- **Solo frontend:** Cambios únicamente en `public/`: principalmente `public/js/views/dashboard.js` y uso de `public/css/design-system.css`. Opcionalmente ajustes en `public/index.html` si se introduce barra superior/sidebar en esta etapa; si no, mantener navbar actual y centrarse en el **contenido** del área principal.
- **Design system Etapa 12:** Usar variables y clases de `design-system.css`: cards (`.nexus-card` o equivalente), badges (`.nexus-badge-active`, `.nexus-badge-archived`), botones, empty state (`.nexus-empty-state`), espaciados. No inventar estilos nuevos que contradigan el design system.
- **Sin tocar API:** Consumir solo endpoints existentes: GET /projects (lista de proyectos); usuario actual vía GET /api/v1/auth/me (ruta relativa típica: /auth/me). En el frontend, `window.getMe()` debe apuntar a ese endpoint para el título "Welcome, [User]". Conteos derivados de listados o placeholders; no crear endpoints nuevos.
- **Stack:** HTML5, Bootstrap 5, JavaScript vanilla. Misma estructura de vistas que el resto del proyecto (window.registerView, window.setContent, etc.).
- **Regresión:** Tras los cambios, #/dashboard debe cargar correctamente; #/projects, #/features, #/sprints, #/releases y el resto de rutas deben seguir funcionando sin errores de consola.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Layout: barra superior y sidebar (según wireframe)

1. **Barra superior:** Logo NEXUS (enlace #/dashboard), búsqueda con placeholder "Search...", ícono notificaciones, usuario (nombre/email desde GET /me) con dropdown si aplica, botón "+ New" (ej. enlace a #/projects o menú). Si se mantiene navbar actual, añadir al menos el botón "+ New" y asegurar usuario visible.
2. **Sidebar:** Fondo oscuro; ítems: Dashboard, Projects, Features, Stories, Sprints, Releases, Incidents, Documents, Reports (MASTER), Administration (MASTER); ítem activo (Dashboard en #/dashboard) resaltado. Si por alcance se pospone, dejar navegación actual y priorizar contenido.

### FASE 2 — Contenido: breadcrumb, título y cuatro tarjetas de métricas

3. **Breadcrumb y título:** "Home / Dashboard" (Home → #/dashboard). Título: "Welcome, [User] | Dashboard" con dato de `window.getMe()`.
4. **Cuatro tarjetas (según wireframe):** (1) **Active Projects** — número (desde GET /projects o placeholder), opcional mini gráfico, enlace #/projects; (2) **Open Stories** — número (si API lo permite o placeholder), enlace #/stories/#/features; (3) **Sprint Progress** — porcentaje + barra de progreso, enlace #/sprints; (4) **Critical Incidents** — número + ícono advertencia, enlace #/incidents. Usar cards del design system. Sin API nueva: placeholders o conteos derivados de listados existentes.

### FASE 3 — Secciones centrales (wireframe)

5. **My Assignments:** Título, pestañas (All, My Stories, Bugs), búsqueda, tabla (ID, Type, Title, Priority, Status, Due Date), paginación. Datos reales si hay endpoint; si no, estructura + placeholders o empty state.
6. **Active Sprint Status:** Título, gráfico de área (o placeholder), barras "Remaining hours" y "Team member". Placeholders si no hay API.
7. **Project Health Overview:** Título, tabla (Key project, Status, Progress); filas desde GET /projects con estado (Healthy/At Risk) y progreso cuando se pueda derivar; si no, placeholders.
8. **Recent Activity Feed:** Título, lista de actividades (ícono + texto). Placeholder o integración si existe endpoint.

### FASE 4 — Opcional y empty state

9. **Recent Projects (complemento):** Lista de proyectos recientes (GET /projects): nombre, badge ACTIVE/ARCHIVED, acción Ver (#/projects/:id). Empty state "No projects yet" + CTA "Create project" (#/projects). Clases `.nexus-badge-active`, `.nexus-badge-archived`, `.nexus-empty-state`.
10. **Ítem activo:** Dashboard resaltado en #/dashboard (layout.js ya aplica `active` en nav-link; verificar con sidebar si se implementa).

### FASE 5 — Verificación

11. **Funcional:** #/dashboard muestra breadcrumb, título, 4 tarjetas, y al menos My Assignments y Project Health Overview (o placeholders); enlaces y "+ New" operativos.
12. **API:** Solo endpoints existentes; sin errores en consola.
13. **Regresión:** #/projects, #/features, #/login sin roturas.

---

## 4️⃣ CRITERIOS DE ACEPTACIÓN

- [ ] Layout según wireframe: barra superior (logo, búsqueda, notificaciones, usuario, "+ New") y/o sidebar con ítem Dashboard activo.
- [ ] Breadcrumb Home / Dashboard y título "Welcome, [User] | Dashboard".
- [ ] Cuatro tarjetas de métricas: Active Projects, Open Stories, Sprint Progress, Critical Incidents (con número/porcentaje y enlace; placeholders si no hay API).
- [ ] Al menos dos secciones: My Assignments, Active Sprint Status, Project Health Overview, Recent Activity Feed (estructura según wireframe; placeholders si no hay datos).
- [ ] Design system Etapa 12 (cards, badges, tipografía).
- [ ] Opcional: "Recent Projects" con badges ACTIVE/ARCHIVED y empty state "No projects yet" / "Create project".
- [ ] Sin cambios en backend ni contratos API.

---

## 5️⃣ ENTREGABLES Y EVIDENCIA

- **Código:** Cambios en `public/js/views/dashboard.js` (y en `public/index.html` / CSS solo si se añade sidebar o barra superior).
- **Evidencia:** Capturas o descripción en `docs/EVIDENCIA_ETAPA_13_REDISENO_DASHBOARD_YYYY-MM-DD.md`: dashboard con barra superior/sidebar, cuatro tarjetas de métricas, My Assignments y/o Project Health Overview (y resto de secciones); verificación de enlaces y regresión. Referencia al wireframe oficial del dashboard.
- **Checklist:** Tras implementación, marcar en docs/CHECKLIST_ETAPAS_PROYECTO.md el paso 3 (MASTER DEVELOPER implementa) y adjuntar enlace a la evidencia.

---

*Documento generado para ETAPA 13 — Rediseño del Dashboard. Plan: docs/PLAN_ETAPA_13_REDISENO_DASHBOARD.md.*
