# Plan de pruebas personales — Etapas 13 a 17 (Fase UX/UI)

**Objetivo:** Verificar manualmente, en tu entorno, que el dashboard (Etapa 13), los módulos operativos (14), el panel admin (15), los reportes (16) y el comportamiento responsive/accesibilidad (17) funcionan según lo implementado.  
**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md, docs/PLAN_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md  
**Duración estimada:** 30–45 minutos (según datos en BD y si pruebas con dos roles).

---

## 1. Prerrequisitos

Antes de empezar:

| # | Comprobación | Cómo |
|---|--------------|------|
| 1 | Servidor en marcha | En la raíz del proyecto: `npm run dev`. Debe responder sin error. |
| 2 | URL de la app | Abre en el navegador la URL del frontend (ej. `http://localhost:3000` o la que uses para servir `public/`). |
| 3 | Usuario MASTER | Necesitas al menos un usuario con rol **MASTER** para probar dashboard, módulos, admin y reportes. Inicia sesión con él. |
| 4 | (Opcional) Usuario EMPLOYEE | Para comprobar RBAC: que #/admin y #/reports no estén accesibles y que acciones tipo "Archivar", "Close Sprint", "Aprobar/Archivar" no se muestren o estén deshabilitadas. |

---

## 2. ETAPA 13 — Dashboard (#/dashboard)

**Ruta:** Ir a `#/dashboard` (o pulsar "Dashboard" en el menú).

| # | Qué comprobar | ☐ |
|---|----------------|---|
| 1 | Aparece el **breadcrumb** (ej. Home / Dashboard). | |
| 2 | El **título** incluye "Welcome" y tu usuario (nombre o email). | |
| 3 | Hay **cuatro tarjetas de métricas** (ej. Active Projects, Open Stories, Sprint Progress, Critical Incidents) con números o placeholders. | |
| 4 | Al menos una sección central visible: My Assignments, Project Health Overview, Recent Activity Feed o similar (pueden ser placeholders). | |
| 5 | **Sidebar** visible con ítems (Dashboard, Projects, Features, Stories, Sprints, etc.); el ítem **Dashboard** está resaltado. | |
| 6 | Barra superior con logo, usuario y botón "+ New" (o equivalente). | |
| 7 | Si hay proyectos: lista o tarjetas de "Recent Projects" con badges; si no hay: mensaje tipo "No projects yet" y enlace "Create project". | |
| 8 | Enlaces a #/projects, #/features, #/sprints, #/incidents (o equivalentes) funcionan. | |

**Consola del navegador:** Sin errores en rojo al cargar el dashboard.

---

## 3. ETAPA 14 — Módulos operativos

Probar cada pantalla en orden. En cada una: que cargue, que se vea el diseño (design system), breadcrumbs, filtros/tablas y que no haya errores en consola.

### 3.1 Projects

| # | Acción / qué comprobar | ☐ |
|---|-------------------------|---|
| 1 | Ir a **#/projects**. Título "Projects" (o "Proyectos"), breadcrumb (Home / Projects). | |
| 2 | Barra con búsqueda, "Filter by status" (All, ACTIVE, ARCHIVED), botón "+ New Project". | |
| 3 | Tabla con columnas Name, Status, Created date, Actions; badges en Status; paginación si hay muchos. | |
| 4 | Si no hay proyectos: mensaje "No projects yet" y CTA "Create project". | |
| 5 | Clic en un proyecto (si existe): va a #/projects/:id. Breadcrumb Dashboard/Projects/[nombre]. Datos del proyecto. Enlaces a Features, Sprints, Incidents. Si eres MASTER: botón "Archivar" visible. | |

### 3.2 Features

| # | Acción / qué comprobar | ☐ |
|---|-------------------------|---|
| 1 | Ir a **#/features**. Breadcrumb con proyecto; selector de proyecto; búsqueda; "Filter by status" (valores tipo DRAFT, IN_PROGRESS, DONE, etc.). | |
| 2 | Botón "+ New Feature"; tabla (Feature title, Status, Stories count, Actions). | |
| 3 | Empty state si no hay features. Navegar a detalle de una feature si existe. | |

### 3.3 Stories

| # | Acción / qué comprobar | ☐ |
|---|-------------------------|---|
| 1 | Ir a **#/stories**. Selectores de proyecto y feature; "+ New Story". | |
| 2 | Tabla con Story ID, Title, Status, Assigned Sprint, Priority, Assignee, Actions; estados con badges. | |
| 3 | Empty state "No stories created yet" / "Create first story" si aplica. | |

### 3.4 Sprints

| # | Acción / qué comprobar | ☐ |
|---|-------------------------|---|
| 1 | Ir a **#/sprints**. Selector de proyecto; "+ New Sprint"; tabla (name, start/end date, status, actions); estados PLANNED, IN_PROGRESS, CLOSED. | |
| 2 | Clic en un sprint: #/sprints/:id. Breadcrumb; tarjeta con datos del sprint; tabla de stories asignadas. Si eres MASTER: botón "Close Sprint". | |

### 3.5 Releases

| # | Acción / qué comprobar | ☐ |
|---|-------------------------|---|
| 1 | Ir a **#/releases**. Título "Releases"; "+ New Release"; tabla versión, estado, acciones; filtros si existen. | |
| 2 | Clic en una release: breadcrumb; datos; features asociadas. | |

### 3.6 Incidents

| # | Acción / qué comprobar | ☐ |
|---|-------------------------|---|
| 1 | Ir a **#/incidents**. Selector de proyecto; búsqueda; "Status filter"; "+ New Incident". | |
| 2 | Tabla Title, Severity, Status, Created date, Actions; badges. Paginación y empty state si aplica. | |

### 3.7 Documents

| # | Acción / qué comprobar | ☐ |
|---|-------------------------|---|
| 1 | Ir a **#/documents**. Título "Documents"; búsqueda; "+ New Document"; tabla Code, Title, Latest version, Status, Actions. | |
| 2 | Clic en un documento: breadcrumb; código, título; lista de versiones con estados; si eres MASTER: acciones Aprobar/Archivar. | |

**Resumen Etapa 14:** Todas las rutas cargan, diseño coherente, sin errores en consola. Sidebar con ítem activo correcto en cada vista.

---

## 4. ETAPA 15 — Panel administrativo (solo MASTER)

Si no tienes usuario MASTER, salta esta sección y anota "No probado (requiere MASTER)".

| # | Acción / qué comprobar | ☐ |
|---|-------------------------|---|
| 1 | Ir a **#/admin**. Título "Administration"; **tres tarjetas**: Users, Audit Logs, Metrics, cada una con enlace "Open" a #/admin/users, #/admin/audit, #/admin/metrics. | |
| 2 | Sidebar: sección Administration con ítems Users Management, Audit Logs, Metrics; ítem activo según la ruta. | |
| 3 | **#/admin/users:** Breadcrumb Administration / Users Management; búsqueda; "filter by role"; "+ New User"; tabla Email, Role, Status, Actions. Probar (si quieres) crear/editar usuario o cambio de contraseña. | |
| 4 | **#/admin/audit:** Breadcrumb Administration / Audit Logs; filtros (entidad, usuario, fechas, acción); tabla de registros; paginación. | |
| 5 | **#/admin/metrics:** Breadcrumb Administration / Metrics; tarjetas (total_requests, total_errors, auth_failures, refresh_failures); botón "Refresh metrics"; sección "Metric Details". | |

**RBAC:** Con usuario **EMPLOYEE**, intentar abrir #/admin: debe redirigir (ej. a login o dashboard) y no mostrar el panel admin.

---

## 5. ETAPA 16 — Reportes (solo MASTER)

| # | Acción / qué comprobar | ☐ |
|---|-------------------------|---|
| 1 | Ir a **#/reports**. Título "Reports"; breadcrumb Dashboard / Reports. | |
| 2 | **Selectores** de proyecto y sprint (cambian datos al seleccionar). | |
| 3 | Sección **Project summary** (o equivalente) al elegir proyecto. | |
| 4 | Sección **Sprint summary** (o equivalente) al elegir sprint. | |
| 5 | Sección **Auditoría** (Load audit log, tabla con filtros/paginación); solo visible si eres MASTER. | |
| 6 | Estilo coherente con el panel admin (mismo design system). | |

**RBAC:** Con usuario EMPLOYEE, la sección de auditoría no debe mostrarse o la ruta #/reports debe estar restringida según implementación.

---

## 6. ETAPA 17 — Responsive y accesibilidad

### 6.1 Responsive

| # | Acción / qué comprobar | ☐ |
|---|-------------------------|---|
| 1 | Reducir el ancho de la ventana por debajo de ~992px (o usar herramientas de desarrollador → modo responsive). | |
| 2 | La **sidebar** se oculta y aparece un **botón de menú** (hamburguesa, ej. "Abrir menú"). | |
| 3 | Al pulsar el botón, la sidebar se abre (drawer/overlay). Al pulsar fuera (overlay) o de nuevo el botón, se cierra. | |
| 4 | En pantalla pequeña, las **tablas** tienen scroll horizontal o se ven sin desbordar la pantalla (sin scroll horizontal en toda la página). | |
| 5 | Volver a ampliar la ventana: sidebar visible de nuevo; nada roto. | |

### 6.2 Accesibilidad básica

| # | Acción / qué comprobar | ☐ |
|---|-------------------------|---|
| 1 | Con **Tab** puedes mover el foco entre enlaces, botones e inputs; el **foco visible** (outline o ring) se ve claramente. | |
| 2 | En una vista con filtros o búsqueda, los campos tienen etiqueta o aria-label (inspeccionar si quieres). | |
| 3 | Navegar solo con teclado por el sidebar y breadcrumbs (Tab + Enter). | |

### 6.3 Consistencia rápida

| # | Acción / qué comprobar | ☐ |
|---|-------------------------|---|
| 1 | Recorrer de nuevo #/dashboard, #/projects, #/reports: **breadcrumbs** correctos en cada una. | |
| 2 | En cada ruta, el **ítem activo del sidebar** corresponde a la pantalla actual. | |
| 3 | No hay errores en la **consola** del navegador en ninguna de las rutas probadas. | |

---

## 7. Checklist final

| # | Comprobación | ☐ |
|---|--------------|---|
| 1 | Etapa 13 (Dashboard): breadcrumb, título, tarjetas, sidebar, enlaces. | |
| 2 | Etapa 14 (Módulos): projects, features, stories, sprints, releases, incidents, documents — listados y detalles. | |
| 3 | Etapa 15 (Admin): #/admin, #/admin/users, #/admin/audit, #/admin/metrics (con usuario MASTER). | |
| 4 | Etapa 16 (Reports): #/reports con selectores y secciones (con usuario MASTER). | |
| 5 | Etapa 17: sidebar colapsable en pantalla estrecha; foco visible; breadcrumbs y ítem activo correctos. | |
| 6 | (Opcional) Con usuario EMPLOYEE: sin acceso a #/admin; acciones MASTER no visibles o no accesibles. | |
| 7 | Sin errores en consola en las rutas probadas. | |

---

## 8. Si algo falla

- **Error en consola:** Anota el mensaje y la ruta en la que ocurre. Revisa que el servidor esté levantado y que la URL del API sea la correcta (variables de entorno).
- **Ruta no carga o pantalla en blanco:** Revisa que el hash sea el correcto (#/dashboard, #/projects, etc.) y que estés logueado si la ruta lo requiere.
- **Admin o Reports no accesibles:** Confirma que el usuario tenga rol MASTER (o que el guard esté aplicado y que con EMPLOYEE no deba entrar).
- **Datos vacíos (tablas, resúmenes):** Puede ser normal si no hay datos en la BD; comprueba que al menos se vean los empty states y la estructura (títulos, breadcrumbs, botones).

---

**Documento de referencia.** Puedes imprimir o seguir este plan en una sesión y marcar los ☐ según vayas probando.  
**Referencias:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Etapas 13–17), docs/PLAN_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md, docs/QA_VALIDACION_ETAPAS_14_A_17_FASE_UX_UI_COMPLETA.md.
