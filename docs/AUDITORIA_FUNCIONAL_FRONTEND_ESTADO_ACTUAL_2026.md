# Auditoría funcional del frontend — Estado actual (2026)

**Rol:** PRODUCT OWNER — NEXUS DevSuite  
**Fecha:** 2026  
**Referencia:** docs/ENDPOINTS_API_Y_USO_FRONTEND.md, docs/project-logs/TICKETS_IMPLEMENTADOS.md, docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-04.md  
**Objetivo:** Conocer el estado actual del frontend tras la implementación completa del plan de auditoría 2026-04 (tickets 015-026) e identificar mejoras candidatas a nuevos tickets.

---

# SECCIÓN 1 — ESTADO ACTUAL DEL PRODUCTO

## 1.1 Resumen ejecutivo

| Dimensión | Valor |
|-----------|--------|
| **Madurez funcional** | **Alta (~90%)** |
| **Cobertura de endpoints** | **~99%** (solo GET /auth/admin/test sin uso en UI) |
| **Tickets auditoría 2026-04** | **12/12 implementados** (015 a 026) |
| **Componentes reutilizables** | pageSizeSelector, permissions (nexusCanAccessMasterActions), notifications (showSuccessMessage) |

El frontend dispone de flujos completos en todos los módulos documentados: Dashboard, Projects, Features, Stories, Sprints, Releases, Incidents, Improvements, Documents (incl. búsqueda por código y contenido de versiones), Change Requests, Reports, Admin (Users, Organización, Auditoría, Métricas), Health en footer, Ajustes (Settings) para MASTER. Los permisos por rol (MASTER vs EMPLOYEE) están centralizados y aplicados en las vistas afectadas. Los mensajes de éxito tras operaciones CRUD son uniformes (toast). La paginación con selector "Ver por página" es consistente en los listados principales.

## 1.2 Tickets ya implementados (plan 2026-04)

Todos los siguientes figuran cerrados en `docs/project-logs/TICKETS_IMPLEMENTADOS.md`:

- **NEXUS-AUD-015** — Documents: búsqueda por código (GET by code)  
- **NEXUS-AUD-016** — Documents: ver y editar contenido de versión (GET/PATCH versionId)  
- **NEXUS-AUD-017** — Selector "Ver por página" en Improvements, Documents, Features, Incidents  
- **NEXUS-AUD-018** — Change Requests: validación UUID y enlace al ID creado  
- **NEXUS-AUD-019** — Dashboard: enlace desde "Mis asignaciones" a detalle de story  
- **NEXUS-AUD-020** — Reports: paginación/límite en tabla de actividad por usuario  
- **NEXUS-AUD-021** — Incidents: breadcrumb y "Volver" con contexto de proyecto  
- **NEXUS-AUD-022** — Cerrado como cubierto por 017  
- **NEXUS-AUD-023** — Mensajes de éxito (toast) tras crear/actualizar  
- **NEXUS-AUD-024** — Admin Organización: validación y PATCH completo  
- **NEXUS-AUD-025** — Ocultar acciones MASTER para rol EMPLOYEE (permissions.js + vistas)  
- **NEXUS-AUD-026** — Enlaces cruzados (Story→Feature, Sprint→Story, Features por :id, Incident→Story, Document→Feature/Story)

## 1.3 Cobertura de API

Según `docs/ENDPOINTS_API_Y_USO_FRONTEND.md`:

- **En uso en frontend:** Auth (login, refresh, logout, me, roles), Users (CRUD, photo, password), Organizations (current, PATCH), Projects y subrecursos (features, sprints, incidents), Features (GET :id, stories, POST story, PATCH status), Stories (GET :id, PATCH status, assign, PATCH :id, PATCH sprint), Releases (CRUD, status, features, hotfix, bulk-delete), Sprints (GET :id, status, stories), Incidents (GET :id, PATCH, PATCH status), Improvements (list, POST, GET :id, PATCH status), Documents (list, code, GET :id, versions CRUD y status, GET/PATCH version por id), Change Requests (POST, PATCH submit/approve/reject/implement), Dashboard summary, Reports (projects/sprints summary, users/activity, audit), System metrics, Health.
- **No usado en UI:** GET `/api/v1/auth/admin/test` (test interno).

## 1.4 Estructura del frontend (public/)

- **Vistas:** dashboard, projects, features, stories, sprints, releases, incidents, improvements, documents, change-requests, reports, admin, settings, login.  
- **Componentes:** pageSizeSelector.js, permissions.js, notifications.js.  
- **Layout:** layout.js (showNav, health, permisos por rol).  
- **API:** api.js (fetchApi, showApiError, getApiErrorMessage, refresh en 401).  
- **Router:** hash-based; getHashSegments(), getViewName().

---

# SECCIÓN 2 — REVISIÓN POR MÓDULO (ESTADO ACTUAL)

| Módulo | Estado | Observaciones |
|--------|--------|----------------|
| **Dashboard** | Completo | Summary, proyectos, sprint activo, mis asignaciones con "Ver" a story, actividad reciente. Enlaces a #/projects/:id, #/sprints/:id, #/stories?story=:id. |
| **Projects** | Completo | Listado, crear, detalle, editar (PATCH), archivar, eliminar, bulk-delete. "Ver por página". Permisos MASTER. |
| **Features** | Completo | Listado por proyecto, crear, PATCH status por fila. "Ver por página". Resolución #/features/:id para enlaces desde CR/Documents. Empty state. |
| **Stories** | Completo | Listado por feature/proyecto, crear, detalle en modal (estado, asignar, PATCH :id, sprint). Apertura por #/stories?story=:id. Enlace a feature. |
| **Sprints** | Completo | Listado por proyecto, crear, detalle (stories, asignar/quitar), cerrar sprint. "Ver por página" (si aplica). Permisos MASTER para cerrar/editar. |
| **Releases** | Completo | Listado, crear, detalle (estado, features, hotfix, editar descripción), eliminar, bulk-delete. Features del release enlazan a #/features?project= (no a #/features/:id). |
| **Incidents** | Completo | Listado por proyecto, crear, detalle (#/incidents/:id) con breadcrumb, "Volver" a #/incidents?project=:id. Estado y PATCH. |
| **Improvements** | Completo | Listado, crear, detalle, PATCH status. "Ver por página". Empty state. |
| **Documents** | Completo | Listado, buscar por código, crear, detalle, versiones (listar, crear, aprobar/archivar, ver y editar contenido). "Ver por página". |
| **Change Requests** | Completo | Crear (UUID validado), transiciones por ID. Enlaces "Ver feature" / "Ver release" tras crear. Sin listado (API no expone GET list). |
| **Reports** | Completo | Resumen proyecto/sprint, actividad por usuario con "Ver por página", auditoría (MASTER). |
| **Admin** | Completo | Usuarios, Organización (validación y PATCH), Auditoría, Métricas. Acceso denegado para no MASTER. |
| **Health** | Completo | Indicador en footer (API: OK / Error). |
| **Settings** | Completo | Solo MASTER; roles y parámetros en solo lectura. Sin edición de configuración. |

---

# SECCIÓN 3 — MEJORAS DETECTADAS (CANDIDATAS A TICKETS)

Las siguientes mejoras no están cubiertas por los tickets 015-026 y pueden convertirse en nuevos tickets para el backlog. No se inventan endpoints; el alcance es UX, consistencia y aprovechamiento de datos ya devueltos por la API.

---

## 3.1 Release → Feature: enlace directo a #/features/:id

**Módulo:** Releases  
**Tipo:** UX, integración  
**Descripción:** En el detalle de un release, la lista de features asignadas muestra enlaces a `#/features?project=:projectId`. Si la API devuelve `id` (o equivalente) en cada feature del release, usar `#/features/:id` permite abrir directamente la vista de Features con esa feature en contexto (la vista Features ya resuelve #/features/:id con GET /features/:id).  
**Impacto:** Bajo. Navegación más directa desde un release a una feature concreta.  
**Archivos:** public/js/views/releases.js  
**Endpoints:** Ninguno nuevo; solo uso de `f.id` en `r.features` si existe.

---

## 3.2 Búsqueda global (topbar)

**Módulo:** Layout  
**Tipo:** UX  
**Descripción:** El input de búsqueda del header (`.nexus-topbar-search`) no tiene lógica asociada en JS. Conectar el input para que, al escribir, ofrezca sugerencias y/o navegación. Alcance posible sin nuevos endpoints: (a) búsqueda sobre proyectos (GET /projects ya usado en layout/dashboard) o (b) desplegable con "Ir a Proyectos", "Ir a Releases", "Ir a Documentos" y un campo que filtre o redirija con hash (p. ej. #/projects con query de búsqueda). Definir alcance (solo enlaces rápidos vs. búsqueda real con sugerencias).  
**Impacto:** Medio si se implementa búsqueda con sugerencias; bajo si solo enlaces rápidos.  
**Archivos:** public/js/layout.js, public/index.html (mantener input); opcionalmente un componente search o reutilizar listados.  
**Endpoints:** Ninguno nuevo; GET /projects y/o GET /releases con parámetros existentes si se desea filtrar.

---

## 3.3 Ajustes (Settings): enlaces rápidos a Admin

**Módulo:** Settings  
**Tipo:** UX  
**Descripción:** La vista #/settings muestra roles y parámetros en solo lectura. Añadir en la misma vista, para MASTER, enlaces rápidos a "Organización" (#/admin/organization) y "Usuarios" (#/admin/users) para no depender solo del menú de aplicaciones.  
**Impacto:** Bajo. Mejora el acceso a Admin desde Ajustes.  
**Archivos:** public/js/views/settings.js  
**Endpoints:** Ninguno.

---

## 3.4 Accesibilidad (a11y) en vistas principales

**Módulo:** Transversal  
**Tipo:** UX, accesibilidad  
**Descripción:** Revisar vistas principales (dashboard, listados, detalle de proyecto/release/incident) y asegurar: (a) botones de acción con `aria-label` cuando el texto no sea suficiente; (b) enlaces "Ver" con texto contextual (p. ej. "Ver story X"); (c) focus visible en modales y en el primer foco al abrir; (d) encabezados y landmarks coherentes. No cambiar flujos ni endpoints.  
**Impacto:** Medio para usuarios con lectores de pantalla y teclado.  
**Archivos:** Varios (public/js/views/*.js, componentes modales).  
**Endpoints:** Ninguno.

---

## 3.5 Reportes: visibilidad en sidebar según política

**Módulo:** Layout / Reportes  
**Tipo:** Configuración / UX  
**Descripción:** Actualmente el enlace "Reportes" en el sidebar (`#nav-reports`) se muestra solo si el usuario es MASTER (`layout.js`). Si la política de producto es que todos los usuarios vean Reportes (resumen proyecto/sprint, actividad por usuario), cambiar la condición para mostrar el enlace a todos; si solo MASTER debe ver también "Auditoría", mantener la lógica actual y documentarla. Este ítem es de verificación/alineación con política, no de nuevo desarrollo salvo cambio de criterio.  
**Impacto:** Bajo. Clarifica visibilidad del menú.  
**Archivos:** public/js/layout.js  
**Endpoints:** Ninguno.

---

## 3.6 Empty state en Projects: botón de acción

**Módulo:** Projects  
**Tipo:** Consistencia  
**Descripción:** En el empty state de Projects se muestra "Aún no hay proyectos" y texto "Cree su primer proyecto para comenzar."; en otros módulos (p. ej. Stories, Dashboard) el empty state incluye un botón "Crear primera story" / "Crear proyecto". Verificar si en la vista de listado de Projects existe botón "Crear proyecto" visible cuando la lista está vacía; si no, añadir un CTA claro en el empty state para mantener consistencia.  
**Impacto:** Muy bajo.  
**Archivos:** public/js/views/projects.js  
**Endpoints:** Ninguno.

---

# SECCIÓN 4 — TICKETS PROPUESTOS (BACKLOG)

A partir de las mejoras anteriores se proponen los siguientes tickets para incluir en el backlog. Son opcionales y priorizables por el PO.

---

## NEXUS-AUD-027 — Release: enlace a feature por id en lista de features del release

| Campo | Valor |
|-------|--------|
| **Módulo** | Releases |
| **Prioridad sugerida** | P3 |
| **Descripción técnica** | En la vista de detalle de release (#/releases/:id), en la lista de features asignadas (`r.features`), si cada ítem tiene `id` (o `feature_id`), generar el enlace como `#/features/:id` en lugar de solo `#/features?project=:projectId`. Si el backend no devuelve id de feature en el release, dejar el enlace actual por proyecto. |
| **Endpoints** | Ninguno nuevo. |
| **Archivos** | public/js/views/releases.js |
| **Criterios de aceptación** | Cuando el release devuelva feature con id, el enlace lleva a #/features/:id y la vista Features muestra el contexto correcto. En caso contrario, se mantiene el enlace a #/features?project=. |

---

## NEXUS-AUD-028 — Búsqueda global en topbar

| Campo | Valor |
|-------|--------|
| **Módulo** | Layout |
| **Prioridad sugerida** | P3 |
| **Descripción técnica** | Conectar el input de búsqueda del header (id o clase del topbar search). Alcance mínimo: al hacer foco o al escribir, mostrar un panel/dropdown con enlaces rápidos (Proyectos, Releases, Documentos, etc.) y opcionalmente filtrar proyectos por nombre usando GET /projects (parámetro search si la API lo soporta) y enlazar a #/projects o #/projects/:id. No inventar endpoints; si la API no tiene búsqueda global, limitar a enlaces rápidos o búsqueda en cliente sobre datos ya cargados. |
| **Endpoints** | GET /projects (y opcionalmente GET /releases) con parámetros actuales. |
| **Archivos** | public/js/layout.js; opcional public/js/components/globalSearch.js o similar, public/index.html. |
| **Criterios de aceptación** | El input de búsqueda del topbar tiene comportamiento definido (enlaces y/o sugerencias) y no queda sin uso. |

---

## NEXUS-AUD-029 — Settings: enlaces a Organización y Usuarios

| Campo | Valor |
|-------|--------|
| **Módulo** | Settings |
| **Prioridad sugerida** | P3 |
| **Descripción técnica** | En la vista #/settings (solo MASTER), añadir una sección o bloque con enlaces: "Gestionar organización" → #/admin/organization, "Gestionar usuarios" → #/admin/users. Solo visible para MASTER (la vista ya restringe acceso). |
| **Endpoints** | Ninguno. |
| **Archivos** | public/js/views/settings.js |
| **Criterios de aceptación** | Desde Ajustes se puede ir directamente a Organización y a Usuarios mediante enlaces visibles. |

---

## NEXUS-AUD-030 — Accesibilidad en vistas principales

| Campo | Valor |
|-------|--------|
| **Módulo** | Transversal (dashboard, projects, releases, incidents, listados) |
| **Prioridad sugerida** | P3 |
| **Descripción técnica** | Revisar y, donde falte: (1) añadir aria-label a botones que solo tienen icono o texto poco descriptivo; (2) asegurar que enlaces "Ver" incluyan contexto (título o id del recurso) para lectores de pantalla; (3) comprobar focus visible en modales (Bootstrap ya aporta parte); (4) encabezados (h1, h2) y estructura coherente en las vistas principales. No modificar flujos ni endpoints. |
| **Endpoints** | Ninguno. |
| **Archivos** | public/js/views/dashboard.js, projects.js, releases.js, incidents.js, features.js, stories.js, sprints.js; componentes de modal si aplica. |
| **Criterios de aceptación** | Las vistas revisadas mejoran en soporte de teclado y lector de pantalla según las pautas anteriores. |

---

## NEXUS-AUD-031 — Reportes en sidebar: documentar o ajustar visibilidad

| Campo | Valor |
|-------|--------|
| **Módulo** | Layout |
| **Prioridad sugerida** | P3 |
| **Descripción técnica** | Documentar en el proyecto que el enlace "Reportes" en el sidebar se muestra solo para rol MASTER (layout.js). Si el PO decide que Reportes (resumen proyecto/sprint, actividad por usuario) debe ser visible para todos los usuarios y solo "Auditoría" restringido a MASTER, ajustar la lógica para mostrar "Reportes" en sidebar a todos y restringir solo la sección o vista de Auditoría. Si no hay cambio de política, cerrar como "verificado y documentado". |
| **Endpoints** | Ninguno. |
| **Archivos** | public/js/layout.js; opcional docs (p. ej. ENDPOINTS o README) para documentar visibilidad. |
| **Criterios de aceptación** | La visibilidad del menú Reportes está alineada con la política de producto y, si aplica, documentada. |

---

## NEXUS-AUD-032 — Projects: CTA en empty state del listado

| Campo | Valor |
|-------|--------|
| **Módulo** | Projects |
| **Prioridad sugerida** | P3 |
| **Descripción técnica** | En el listado de proyectos, cuando no hay proyectos (o no hay resultados de búsqueda), el empty state debe incluir un botón o enlace claro "Crear proyecto" que dispare el mismo flujo que el botón habitual de crear (modal o navegación). Comprobar si ya existe y, si no, añadirlo para consistencia con otros módulos. |
| **Endpoints** | Ninguno nuevo. |
| **Archivos** | public/js/views/projects.js |
| **Criterios de aceptación** | Con lista vacía de proyectos, el usuario ve un CTA evidente para crear el primer proyecto. |

---

# SECCIÓN 5 — RESUMEN

- **Estado actual:** Frontend en estado maduro; todos los tickets de la auditoría 2026-04 (015-026) están implementados; cobertura de API ~99%.
- **Mejoras identificadas:** 6 (enlace release→feature por id, búsqueda topbar, enlaces en Settings, accesibilidad, visibilidad Reportes, CTA empty state Projects).
- **Tickets propuestos para backlog:** NEXUS-AUD-027 a NEXUS-AUD-032 (todos P3, opcionales). Ninguno requiere nuevos endpoints; alcance acotado por módulo o transversal (a11y).

El PO puede priorizar y agrupar estos tickets en el siguiente sprint o en backlog según capacidad y objetivos del producto.

**Plan del siguiente sprint:** Los tickets NEXUS-AUD-027 a 032 están incluidos en **docs/plans/PLAN_SPRINT_AUDITORIA_ESTADO_ACTUAL_2026.md**, con orden de implementación, archivos, dependencias y riesgos.
