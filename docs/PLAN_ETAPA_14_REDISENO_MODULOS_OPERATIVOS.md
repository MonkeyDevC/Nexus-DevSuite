# Plan ETAPA 14 — Rediseño de módulos operativos

**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Fase UX/UI), nexus-plan-maestro-etapas.mdc  
**Objetivo:** Aplicar wireframes a las pantallas de gestión: projects, features, stories, sprints, releases, incidents y documents (listados y detalles).  
**Estado:** Diseñado por PO MASTER — Pendiente validación SYSTEM ARCHITECT y ajustes PO tras validación.

**Alcance:** Solo frontend (HTML, CSS, JS en `public/`). Sin cambios en API, backend ni rutas. Consumir design system Etapa 12. Misma barra superior y sidebar que Etapa 13 (dashboard).

---

## 1. Contexto

- **Situación actual:** Las vistas en `public/js/views/` (projects, features, stories, sprints, releases, incidents, documents) son funcionales pero con layout y estilos básicos. No hay diseño unificado con wireframes ni aplicación sistemática del design system en estas pantallas.
- **Objetivo de la etapa:** Rediseñar cada pantalla según wireframes y design system: títulos, breadcrumbs, barras de búsqueda/filtros, botones "+ New", tablas con columnas definidas, badges de estado, paginación, empty states y vistas de detalle con breadcrumb y acciones (Archivar, Cerrar Sprint, Aprobar/Archivar versiones según rol).
- **Referencia wireframes:** docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md; plan maestro nexus-plan-maestro-etapas.mdc (ETAPA 14). Wireframes oficiales NEXUS para listados y detalles cuando existan.

---

## 2. Alcance (solo frontend)

| Elemento | Especificación |
|----------|----------------|
| **Backend / API** | Sin cambios. Usar únicamente endpoints existentes (GET/POST/PUT/DELETE según rutas actuales). |
| **Frontend** | Vistas en `public/js/views/`: projects.js, features.js, stories.js, sprints.js, releases.js, incidents.js, documents.js. Estilos desde `public/css/design-system.css`. Layout (barra superior, sidebar) ya implementado en Etapa 13; mantener coherencia. |
| **Stack** | HTML5, Bootstrap 5, JavaScript vanilla. Design system Etapa 12. |

---

## 3. Diseño objetivo por pantalla (según wireframes y plan maestro)

### 3.1 Projects

- **#/projects (listado):** Título "Projects" (o "Proyectos"). Barra superior de la vista: búsqueda (input), "Filter by status" (dropdown ACTIVE/ARCHIVED/All), botón "+ New Project". Tabla: columnas Name, Status, Created date, Actions (edit, delete). Badges ACTIVE/ARCHIVED. Paginación (Previous, números, Next). Empty state: "No projects yet" / "Create project".
- **#/projects/:id (detalle):** Breadcrumb: Dashboard / Projects / [Project name]. Datos del proyecto (nombre, descripción, estado). Enlaces: Features, Sprints, Incidentes. Botón "Archivar" visible solo para rol MASTER.

### 3.2 Features

- **#/features:** Breadcrumb: Dashboard / Projects / [Project] / Features. Selector de proyecto (dropdown). Búsqueda. "Filter by status" (PLANNED, IN PROGRESS, DONE). Botón "+ New Feature". Tabla: Feature title, Status, Stories count, Actions (menú: ver, editar, eliminar). Paginación. Empty state si no hay features. Badges por estado.

### 3.3 Stories

- **#/stories:** Breadcrumb: Dashboard / Projects / [Project] / [Feature] / Stories. Selector de proyecto y feature. Botón "+ New Story". Tabla: Story ID, Story Title, Status, Assigned Sprint, Priority, Assignee, Actions (ver, editar, eliminar). Paginación. Empty state: "No stories created yet" / "Create first story". Estados: TODO, IN PROGRESS, BLOCKED, DONE (badges).

### 3.4 Sprints

- **#/sprints (listado):** Selector de proyecto. Botón "+ New Sprint". Tabla: Sprint name, Start date, End date, Status, Actions (ver, editar). Paginación. Estados: PLANNED, ACTIVE, CLOSED (badges).
- **#/sprints/:id (detalle):** Breadcrumb: Dashboard / Projects / [Project] / Sprints / [Sprint name]. Tarjeta de información: name, start date, end date, status. Tabla de stories asignadas: story title, status, assignee. Botón "Close Sprint" visible solo MASTER.

### 3.5 Releases

- **#/releases (listado):** Título "Releases". Botón "+ New Release". Tabla: versión (SemVer), estado, acciones (ver, editar). Filtros por estado. Paginación.
- **#/releases/:id (detalle):** Breadcrumb: Dashboard / Projects / [Project] / Releases / [version]. Datos de la release (versión, descripción, estado). Lista de features asociadas.

### 3.6 Incidents

- **#/incidents:** Selector de proyecto. Búsqueda. "Status filter" (OPEN, IN_PROGRESS, RESOLVED, CLOSED). Botón "+ New Incident". Tabla: Title, Severity, Status, Created date, Actions. Badges de severidad y estado. Paginación. Empty state.

### 3.7 Documents

- **#/documents (listado):** Título "Documents". Búsqueda. Botón "+ New Document". Tabla: Code, Title, Latest version, Status, Actions. Paginación.
- **#/documents/:id (detalle):** Breadcrumb. Código, título. Lista de versiones con estado (DRAFT, APPROVED, ARCHIVED). Acciones Aprobar / Archivar por versión, solo MASTER.

---

## 4. Criterios de aceptación

- Todas las pantallas listadas (projects, features, stories, sprints, releases, incidents, documents — listado y detalle donde aplique) presentan: título, breadcrumb cuando corresponda, barra de búsqueda/filtros según especificación, botón "+ New" (o equivalente), tabla con columnas indicadas, badges de estado, paginación y empty state unificado.
- Detalles: breadcrumb, datos principales, enlaces a entidades hijas, acciones condicionadas por rol (MASTER) sin cambiar lógica de API.
- Consistencia con design system Etapa 12 (cards, badges, botones, tablas, empty state).
- Integración con API y RBAC existentes sin regresión; sin nuevos endpoints.

---

## 5. Validación QA (6 niveles)

- **Nivel 1 — Funcional:** Cada ruta carga correctamente; tablas muestran datos o empty state; filtros, búsqueda y paginación operativos; botones "+ New" y acciones (edit, delete, Archivar, Close Sprint, Aprobar/Archivar) según permisos.
- **Nivel 2 — API:** Solo uso de endpoints existentes; sin errores en consola por llamadas incorrectas.
- **Nivel 3 — Diseño:** Layout y componentes alineados a wireframes y design system en todas las pantallas de la etapa.
- **Nivel 4 — Navegación:** Breadcrumbs correctos; sidebar con ítem activo según ruta; enlaces entre listado y detalle operativos.
- **Nivel 5 — Empty state y RBAC:** Empty states con mensaje y CTA; acciones restringidas a MASTER no visibles o deshabilitadas para EMPLOYEE.
- **Nivel 6 — Regresión:** Resto de rutas (#/dashboard, #/login, #/admin, #/reports) operativas; sin cambios en API ni contratos.

---

## 6. Referencias

- **Wireframes:** docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md (tabla de pantallas 2–12).
- **Plan maestro:** .cursor/rules/nexus-plan-maestro-etapas.mdc (ETAPA 14).
- **Design system:** public/css/design-system.css; Etapa 12.
- **Vistas actuales:** public/js/views/projects.js, features.js, stories.js, sprints.js, releases.js, incidents.js, documents.js.
- **Layout/nav:** public/js/layout.js, public/index.html (coherencia con Etapa 13).
