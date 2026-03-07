# Pantallas pendientes de diseño y prompt para wireframes (ChatGPT → Gemini)

**Objetivo:** Tener claro qué pantallas de NEXUS DevSuite siguen sin un diseño unificado (como el login ya rediseñado en Etapa 11) y poder pedir a **ChatGPT** que genere un **prompt** para usar en **Gemini** y obtener **imágenes de wireframes** de esas pantallas.

---

## 1. Estado actual

- **Login:** ✅ Ya rediseñado (Etapa 11): tarjeta con sombra, dos columnas (formulario + bloque visual), fondo decorativo.
- **Resto de pantallas:** Siguen con layout y estilos básicos (Bootstrap por defecto, tablas y formularios funcionales pero sin una línea visual unificada). Conviene definir diseño (wireframes) para luego implementar una estética coherente.

---

## 2. Listado de pantallas que necesitan wireframe / diseño

A continuación, cada pantalla con su **ruta**, **contenido principal** y **elementos de UI** relevantes para describir en el prompt a Gemini.

| # | Pantalla | Ruta | Contenido principal | Elementos de UI clave |
|---|----------|------|---------------------|------------------------|
| 1 | **Dashboard** | `#/dashboard` | Página de inicio tras el login. Listado resumido de proyectos; enlaces rápidos a Proyectos, Features, Sprints, Releases. | Título "Dashboard", lista o tarjetas de proyectos (nombre, estado), botones/enlaces "Ver todos los proyectos", "Features", "Sprints", "Releases". Empty state si no hay proyectos. Barra de navegación superior ya existe (no rediseñar en el wireframe). |
| 2 | **Listado de proyectos** | `#/projects` | Tabla de proyectos: nombre, estado (ACTIVE/ARCHIVED), enlaces a Features y a detalle. Solo MASTER puede crear y archivar. | Título "Proyectos", botón "Nuevo proyecto" (MASTER), filtro por estado, búsqueda, tabla con columnas ordenables (nombre, estado, acciones), paginación, badges de estado. Empty state. |
| 3 | **Detalle de proyecto** | `#/projects/:id` | Vista de un proyecto: nombre, descripción, estado. Enlaces a Features, Sprints, Incidentes. Acción "Archivar" (MASTER). | Breadcrumb (Proyectos > [Nombre]). Datos del proyecto. Botones/enlaces: Features, Sprints, Incidentes. Botón Archivar (MASTER). |
| 4 | **Features** | `#/features` | Listado de features de un proyecto (selector de proyecto). Tabla: título, estado (DRAFT/IN_PROGRESS/DONE), enlace a Stories. Crear feature (MASTER). | Selector de proyecto. Título "Features". Botón "Nueva feature". Tabla (título, estado, Stories), filtros, búsqueda, paginación, breadcrumbs. |
| 5 | **Stories (User Stories)** | `#/stories` | Listado de user stories (contexto proyecto/feature). Tabla: título, estado. Crear story (MASTER). | Selector proyecto y feature. Título "Stories". Botón "Nueva story". Tabla, filtros, búsqueda, paginación, breadcrumbs (Proyectos > Proyecto > Features > Feature > Stories). |
| 6 | **Listado de Sprints** | `#/sprints` | Sprints de un proyecto. Tabla: nombre, estado (PLANNED/IN_PROGRESS/CLOSED), enlace a detalle. Crear sprint (MASTER). | Selector de proyecto. Título "Sprints". Botón "Nuevo sprint". Tabla con estados, enlace a detalle, paginación. |
| 7 | **Detalle de Sprint** | `#/sprints/:id` | Datos del sprint; stories asignadas si aplica. Acción "Cerrar sprint" (MASTER). | Breadcrumb. Datos del sprint. Lista de stories asignadas. Botón Cerrar (MASTER). |
| 8 | **Listado de Releases** | `#/releases` | Tabla de releases: versión (SemVer), estado (PLANNED/RELEASED/ARCHIVED). Crear release (MASTER). | Título "Releases". Botón "Nueva release". Tabla versión, estado, enlace a detalle. Filtros, paginación. |
| 9 | **Detalle de Release** | `#/releases/:id` | Datos de la release; features asociadas si aplica. | Breadcrumb. Versión, descripción, estado. Lista de features. Acciones según estado. |
| 10 | **Incidentes** | `#/incidents` | Listado de incidentes (opcional: por proyecto). Tabla: título, estado (OPEN/IN_PROGRESS/RESOLVED/CLOSED). Crear incidente. | Selector de proyecto (opcional). Título "Incidentes". Botón "Nuevo incidente". Tabla con estados, badges, filtros, paginación. |
| 11 | **Listado de Documentos** | `#/documents` | Tabla de documentos: código, título, enlace a detalle. Crear documento. | Título "Documentos". Botón "Nuevo documento". Tabla, búsqueda, paginación. |
| 12 | **Detalle de Documento** | `#/documents/:id` | Datos del documento; versiones (DRAFT/APPROVED/ARCHIVED). MASTER puede aprobar/archivar versiones. | Breadcrumb. Código, título. Lista de versiones con estado. Acciones Aprobar/Archivar (MASTER). |
| 13 | **Reportes** (solo MASTER) | `#/reports` | Resumen de proyecto, resumen de sprint, actividad de usuario, listado de auditoría con filtros. | Selectores (proyecto, sprint). Tarjetas o secciones: Resumen proyecto, Resumen sprint, Actividad usuario, Auditoría (tabla con filtros entidad, usuario, fechas, acción y paginación). |
| 14 | **Panel Administración (dashboard)** | `#/admin` | Entrada al panel admin: tres tarjetas/enlaces (Usuarios, Auditoría, Métricas). Solo MASTER. | Título "Administración". Tres tarjetas: Usuarios, Auditoría, Métricas (cada una con enlace a su subsección). |
| 15 | **Usuarios (Admin)** | `#/admin/users` | Listado de usuarios (email, rol, estado); filtros; crear, editar, eliminar usuario; cambiar contraseña. | Título "Usuarios". Botón "Nuevo usuario". Tabla (email, rol, estado, acciones). Filtros por email y rol. Paginación. Modales: crear/editar usuario, cambiar contraseña. |
| 16 | **Auditoría (Admin)** | `#/admin/audit` | Tabla de registros de auditoría. Filtros (entidad, usuario, fechas, acción); paginación. | Título "Auditoría". Filtros (entidad, user_id, from, to, action). Tabla de registros. Paginación. |
| 17 | **Métricas (Admin)** | `#/admin/metrics` | Tarjetas o panel con métricas: total_requests, total_errors, auth_failures, refresh_failures, scope. Botón Actualizar. | Título "Métricas del sistema". Tarjetas o tabla con las métricas. Botón "Actualizar". |

---

## 3. Meta-prompt para ChatGPT (copiar y pegar)

Usa el siguiente texto en **ChatGPT**. ChatGPT generará un **prompt optimizado** que tú luego podrás usar en **Gemini** (o en otra herramienta de generación de imágenes) para pedir wireframes de cada pantalla.

---

**INICIO DEL TEXTO PARA CHATGPT**

Necesito que me generes un **prompt detallado** que yo pueda usar en **Gemini** (o en un modelo de generación de imágenes que acepte descripciones largas) para obtener **wireframes en imagen** de varias pantallas de una aplicación web.

**Contexto:**  
La aplicación se llama **NEXUS DevSuite**. Es un SaaS para equipos de desarrollo: gestión de proyectos, features, user stories, sprints, releases, incidentes, documentos, reportes y panel de administración (usuarios, auditoría, métricas). Ya tenemos el **Login** rediseñado (tarjeta con sombra, dos columnas, estilo moderno). Ahora queremos **wireframes** para el resto de pantallas, con un estilo **moderno, limpio y coherente** (dashboard de producto, tablas con filtros y acciones, breadcrumbs donde aplique, badges de estado).

**Pantallas para las que necesito wireframes** (una imagen de wireframe por pantalla, o un prompt por pantalla si es mejor):

1. **Dashboard** — Página de inicio tras login: listado resumido de proyectos (tarjetas o lista), enlaces rápidos a Proyectos, Features, Sprints, Releases. Empty state si no hay proyectos.
2. **Listado de Proyectos** — Título "Proyectos", botón "Nuevo proyecto", filtro por estado, búsqueda, tabla con columnas (nombre, estado, acciones), paginación, badges (ACTIVE/ARCHIVED).
3. **Detalle de Proyecto** — Breadcrumb, datos del proyecto, enlaces a Features, Sprints, Incidentes, botón Archivar.
4. **Features** — Selector de proyecto, título "Features", botón "Nueva feature", tabla (título, estado, enlace Stories), filtros, breadcrumbs.
5. **Stories** — Selector proyecto/feature, título "Stories", botón "Nueva story", tabla con estados, breadcrumbs anidados.
6. **Listado de Sprints** — Selector proyecto, tabla de sprints (nombre, estado), botón "Nuevo sprint", enlace a detalle.
7. **Detalle de Sprint** — Breadcrumb, datos del sprint, lista de stories asignadas, botón Cerrar.
8. **Listado de Releases** — Tabla de releases (versión, estado), botón "Nueva release", filtros, paginación.
9. **Detalle de Release** — Breadcrumb, versión, descripción, estado, features asociadas.
10. **Incidentes** — Listado con selector de proyecto (opcional), tabla de incidentes (título, estado), botón "Nuevo incidente", filtros y paginación.
11. **Listado de Documentos** — Tabla (código, título), botón "Nuevo documento", búsqueda, paginación.
12. **Detalle de Documento** — Breadcrumb, datos del documento, lista de versiones con estados (DRAFT/APPROVED/ARCHIVED), acciones Aprobar/Archivar.
13. **Reportes** — Pantalla con selectores (proyecto, sprint), secciones: Resumen proyecto, Resumen sprint, Actividad usuario, Auditoría (tabla con filtros y paginación). Solo para rol administrador.
14. **Panel Administración (inicio)** — Tres tarjetas: Usuarios, Auditoría, Métricas (cada una con enlace).
15. **Usuarios (Admin)** — Tabla de usuarios (email, rol, estado), botón "Nuevo usuario", filtros, paginación, acciones Editar / Cambiar contraseña / Eliminar.
16. **Auditoría (Admin)** — Filtros (entidad, usuario, fechas, acción), tabla de registros, paginación.
17. **Métricas (Admin)** — Tarjetas o panel con métricas (total_requests, total_errors, auth_failures, refresh_failures), botón Actualizar.

**Lo que te pido:**  
Genera un **prompt único** (o un prompt por pantalla, si lo consideras mejor para Gemini) que describa con claridad el **layout**, los **componentes** (tablas, botones, filtros, breadcrumbs, badges) y el **estilo** (wireframe limpio, moderno, coherente con un SaaS de gestión de desarrollo) para que Gemini pueda devolver **imágenes de wireframes** de estas pantallas. Indica si conviene pedir una imagen por pantalla o agrupar algunas (por ejemplo, listado + detalle). El prompt debe ser autocontenido para pegarlo en Gemini y obtener las imágenes.

**FIN DEL TEXTO PARA CHATGPT**

---

## 4. Uso del flujo

1. **Copia** el bloque "INICIO DEL TEXTO PARA CHATGPT" hasta "FIN DEL TEXTO PARA CHATGPT" (sección 3).
2. **Pega** ese texto en ChatGPT.
3. **ChatGPT** te devolverá un (o varios) prompt(s) listos para usar en **Gemini**.
4. **Pega** el prompt generado en Gemini (o en la herramienta que uses para generar imágenes) para obtener los **wireframes**.
5. Usa las imágenes como **referencia visual** para que el Master Developer (o tú) apliquéis el diseño en las vistas correspondientes de NEXUS DevSuite (`public/js/views/`, `public/css/`).

---

## 5. Referencias en el proyecto

- **Manual de pruebas (contenido de cada pantalla):** `docs/MANUAL_PRUEBAS_FUNCIONALIDADES_WEB.md`
- **Login ya rediseñado:** Etapa 11 — `public/css/login.css`, `public/js/views/login.js`
- **Vistas actuales:** `public/js/views/` (dashboard.js, projects.js, features.js, stories.js, sprints.js, releases.js, incidents.js, documents.js, reports.js, admin.js)

---

*Documento para definir pantallas pendientes de diseño y obtener wireframes vía ChatGPT → Gemini.*
