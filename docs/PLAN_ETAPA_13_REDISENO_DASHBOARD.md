# Plan ETAPA 13 — Rediseño del Dashboard

**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Fase UX/UI), nexus-plan-maestro-etapas.mdc  
**Objetivo:** Aplicar wireframes al dashboard principal (#/dashboard): métricas visuales, tarjetas de resumen, actividad reciente, navegación visual clara.  
**Estado:** Diseñado por PO MASTER — ✅ Validado por SYSTEM ARCHITECT (docs/VALIDACION_ARQUITECTONICA_ETAPA_13_REDISENO_DASHBOARD.md, docs/AJUSTES_PO_ETAPA_13_SEGUN_ARCHITECT.md)

**Alcance:** Solo frontend (HTML, CSS, JS en `public/`). Sin cambios en API, backend ni rutas. Consumir design system de Etapa 12.

---

## 1. Contexto

- **Situación actual:** El dashboard (`public/js/views/dashboard.js`) muestra un título "Dashboard", lista de hasta 10 proyectos desde GET /projects (o empty state "No hay proyectos") y enlaces a Ver todos los proyectos, Features, Sprints, Releases. La navegación es la barra superior actual (navbar con Dashboard, Proyectos, Features, etc.). No hay breadcrumb, tarjetas de acceso rápido ni diseño alineado con wireframes.
- **Objetivo de la etapa:** Rediseñar la vista #/dashboard según wireframes y design system (Etapa 12): barra superior y/o sidebar coherentes, contenido con título, breadcrumb, tarjetas de acceso rápido (Projects, Features, Sprints, Releases con conteo y enlace), sección "Recent Projects" con badges y acciones rápidas, empty state claro. Opcional: métricas resumidas, My Assignments, Active Sprint Status, etc.
- **Referencia wireframes:** Wireframe oficial del dashboard: barra superior (logo NEXUS, búsqueda global "Search...", ícono notificaciones, usuario con dropdown, botón "+ New"); sidebar con fondo oscuro, ítems (Dashboard, Projects, Features, Stories, Sprints, Releases, Incidents, Documents, Reports, Administration) e ítem activo resaltado; área central con breadcrumb Home / Dashboard, título "Welcome, [User] | Dashboard", cuatro tarjetas de métricas (Active Projects, Open Stories, Sprint Progress, Critical Incidents), secciones My Assignments, Active Sprint Status, Project Health Overview y Recent Activity Feed. Opcional/complemento: lista "Recent Projects" con badges ACTIVE/ARCHIVED y empty state "No projects yet" / "Create project" (plan maestro).

---

## 2. Alcance (solo frontend)

| Elemento | Especificación |
|----------|----------------|
| **Backend / API** | Sin cambios. Endpoints existentes: GET /projects; usuario actual vía GET /api/v1/auth/me (ruta relativa /auth/me). Conteos derivados de listados o placeholders; sin endpoints nuevos. |
| **Frontend** | Vista `#/dashboard`: HTML generado en `public/js/views/dashboard.js` (o fragmentos reutilizables). Estilos desde `public/css/design-system.css`. Opcional: ajustes en `public/index.html` para barra superior y sidebar si se implementan en esta etapa. |
| **Stack** | HTML5, Bootstrap 5, JavaScript vanilla. Design system Etapa 12 (variables, clases de cards, badges, botones, empty state). |

---

## 3. Diseño objetivo (según wireframes)

### 3.1 Barra superior (según wireframe)

- Logo NEXUS (ej. "N NEXUS" o "NEXUS DevSuite") con enlace a #/dashboard.
- Búsqueda global con placeholder "Search..." (puede ser solo UI en Etapa 13; lógica en etapas posteriores).
- Ícono de notificaciones (campana).
- Usuario: nombre o email con dropdown (ej. "User Name" o dato de GET /me).
- Botón **"+ New"** (crear nuevo elemento; destino según contexto: #/projects o menú desplegable).
- Si se implementa layout con sidebar, la barra superior es esta fila compacta; si no, se mantiene navbar actual y se prioriza el contenido central.

### 3.2 Sidebar (según wireframe)

- Fondo gris oscuro; íconos distintivos por ítem.
- Ítems en orden: Dashboard, Projects, Features, Stories, Sprints, Releases, Incidents, Documents, Reports (solo MASTER), Administration (solo MASTER).
- Ítem activo (ej. Dashboard en #/dashboard) resaltado con fondo más oscuro y/o indicador visual (círculo sólido en el wireframe).
- El wireframe de referencia muestra este layout con sidebar; la implementación debe tender a este diseño. Si por alcance se mantiene solo navbar en Etapa 13, documentar y priorizar el contenido central.

### 3.3 Contenido del dashboard (según wireframe)

- **Breadcrumb:** Home / Dashboard (enlace Home a #/dashboard).
- **Título:** "Welcome, [User] | Dashboard" (nombre o email desde GET /me; ej. "Welcome, Jane Doe! | Dashboard").

- **Fila superior — Cuatro tarjetas de métricas (según wireframe):**
  1. **Active Projects:** número (ej. 36), opcional mini gráfico de línea; enlace o contexto a #/projects.
  2. **Open Stories:** número (ej. 10), opcional mini gráfico (dona/leyenda Status); enlace a #/stories o #/features.
  3. **Sprint Progress:** porcentaje (ej. 75%) y barra de progreso horizontal; enlace a #/sprints.
  4. **Critical Incidents:** número (ej. 1) e ícono de advertencia; enlace a #/incidents.
  Estilo: cards del design system. Datos desde API existente cuando exista; si no, placeholders.

- **Sección "My Assignments":**
  - Título "My Assignments".
  - Pestañas de filtro: All, My Stories, Bugs (pestaña activa resaltada).
  - Barra de búsqueda interna.
  - Tabla: columnas ID, Type, Title, Priority, Status, Due Date; filas de ejemplo o datos reales si la API expone asignaciones.
  - Paginación (< 1 2 3 ... >).
  Si no hay endpoint de asignaciones: estructura con placeholders o empty state.

- **Sección "Active Sprint Status":**
  - Título "Active Sprint Status".
  - Gráfico de área (progreso/carga en el tiempo).
  - Barras de progreso: "Remaining hours", "Team member" (o equivalente).
  Implementación con datos si la API lo permite; si no, placeholders.

- **Sección "Project Health Overview":**
  - Título "Project Health Overview".
  - Tabla: columnas Key project, Status, Progress.
  - Filas con nombre de proyecto, estado (ej. Healthy, At Risk), barra de progreso.
  Datos desde GET /projects y derivados (estado, avance) cuando sea posible.

- **Sección "Recent Activity Feed":**
  - Título "Recent Activity Feed".
  - Lista de actividades recientes: ícono de usuario + descripción (ej. "Implement new login flow", "1 month ago").
  Placeholder o integración si existe endpoint de actividad.

- **Complemento (plan maestro):** Opcionalmente, bloque **"Recent Projects"**: lista de proyectos recientes con nombre, badge ACTIVE/ARCHIVED, acciones Ver (#/projects/:id) y Archivar (MASTER); empty state "No projects yet" / "Create project". Puede integrarse junto a Project Health o como lista adicional para cubrir el empty state y la CTA de crear proyecto.

---

## 4. Criterios de aceptación

- Layout según wireframe: barra superior (logo, búsqueda, notificaciones, usuario, "+ New"), sidebar con ítems e ítem activo resaltado (o navbar actual si se pospone layout completo).
- Contenido: breadcrumb Home / Dashboard, título "Welcome, [User] | Dashboard", cuatro tarjetas de métricas (Active Projects, Open Stories, Sprint Progress, Critical Incidents), y al menos dos de las secciones: My Assignments, Active Sprint Status, Project Health Overview, Recent Activity Feed (el resto con placeholders o empty state si la API no lo soporta).
- Integración con API existente: GET /projects, GET /me; enlaces a #/projects, #/features, #/sprints, #/incidents; datos reales donde existan endpoints; placeholders en caso contrario.
- Consistencia con design system Etapa 12: cards, badges, botones, espaciados, tipografía.
- Opcional: bloque "Recent Projects" con badges ACTIVE/ARCHIVED y empty state "No projects yet" / "Create project".

---

## 5. Validación QA (6 niveles)

- **Nivel 1 — Funcional:** Acceso a #/dashboard muestra breadcrumb, título "Welcome, [User] | Dashboard", cuatro tarjetas de métricas y al menos My Assignments y/o Project Health Overview (o placeholders); enlaces y botón "+ New" coherentes.
- **Nivel 2 — API:** Uso solo de endpoints existentes (GET /projects, GET /me, etc.); sin errores en consola.
- **Nivel 3 — Diseño:** Layout y componentes alineados al wireframe; design system Etapa 12 (cards, badges, tipografía).
- **Nivel 4 — Navegación:** Sidebar o navbar con ítem Dashboard activo; breadcrumb Home / Dashboard.
- **Nivel 5 — Empty state / placeholders:** Secciones sin datos muestran empty state o placeholders; si se incluye Recent Projects, "No projects yet" + CTA "Create project".
- **Nivel 6 — Regresión:** Resto de rutas operativas; sin cambios en API.

---

## 6. Referencias

- **Wireframe de referencia:** Wireframe oficial del dashboard NEXUS (barra superior, sidebar, cuatro tarjetas de métricas, My Assignments, Active Sprint Status, Project Health Overview, Recent Activity Feed). Imagen disponible en assets del proyecto.
- Plan maestro: `.cursor/rules/nexus-plan-maestro-etapas.mdc` (ETAPA 13).
- Design system: `public/css/design-system.css`, `docs/DESIGN_SYSTEM_NEXUS.md` (si existe).
- Vista actual: `public/js/views/dashboard.js`.
- Layout/nav: `public/js/layout.js`, `public/index.html`.
