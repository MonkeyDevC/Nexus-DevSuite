# Prompt de ejecución — ETAPA 14 Rediseño de módulos operativos

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_14_REDISENO_MODULOS_OPERATIVOS.md, docs/CHECKLIST_ETAPAS_PROYECTO.md, nexus-plan-maestro-etapas.mdc (ETAPA 14), docs/PROMPT_WIREFRAMES_PANTALLAS_PENDIENTES_DISENO.md  
**Estructura:** nexus-engineering-execution.mdc  
**Estado:** Pendiente validación SYSTEM ARCHITECT y ajustes PO; no ejecutar hasta aprobación.

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 14 — Rediseño de módulos operativos** siguiendo estrictamente el plan `docs/PLAN_ETAPA_14_REDISENO_MODULOS_OPERATIVOS.md`.

**Propósito:** Aplicar wireframes y design system (Etapa 12) a las pantallas: Projects (listado + detalle), Features, Stories, Sprints (listado + detalle), Releases (listado + detalle), Incidents, Documents (listado + detalle). Incluir en cada pantalla: título, breadcrumb, búsqueda/filtros, botón "+ New", tablas con columnas especificadas, badges de estado, paginación, empty state; en detalles: breadcrumb, datos, enlaces y acciones condicionadas por rol (MASTER). Solo frontend; cero cambios en API ni backend.

---

## 2️⃣ REGLAS INNEGOCIABLES

- **Solo frontend:** Modificar únicamente archivos bajo `public/`: `public/js/views/projects.js`, `features.js`, `stories.js`, `sprints.js`, `releases.js`, `incidents.js`, `documents.js` y, si hace falta, estilos en `public/css/` (preferir `design-system.css`). No tocar `src/`, rutas API, controllers, services, repositories ni migraciones.
- **Design system Etapa 12:** Usar clases y variables de `public/css/design-system.css`: cards, badges (`.nexus-badge-*` o equivalente por estado), botones, tablas, empty state (`.nexus-empty-state`), espaciados. No introducir estilos que contradigan el design system.
- **Layout existente:** Mantener barra superior y sidebar implementados en Etapa 13; no cambiar estructura de `public/index.html` ni de `public/js/layout.js` salvo ajustes menores de clase o texto. Resaltar ítem activo del sidebar según ruta actual.
- **API existente:** Consumir solo endpoints ya expuestos por la aplicación (listados, detalle, crear, editar, eliminar según rutas actuales). No crear endpoints nuevos ni modificar contratos.
- **RBAC:** Mostrar u ocultar acciones (Archivar proyecto, Close Sprint, Aprobar/Archivar documento) según rol (MASTER). No cambiar lógica de autorización en backend.
- **Stack:** HTML5, Bootstrap 5, JavaScript vanilla. Misma convención de vistas: `window.registerView`, `window.setContent`, hash routing existente.
- **Regresión:** Tras los cambios, #/dashboard, #/projects, #/features, #/stories, #/sprints, #/releases, #/incidents, #/documents, #/login y #/admin deben seguir funcionando sin errores de consola.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN (QUIRÚRGICO)

Ejecutar las fases en este orden. Dentro de cada fase, implementar los pasos en la secuencia indicada.

---

### FASE 1 — Projects (listado y detalle)

**Archivo principal:** `public/js/views/projects.js`

1. **Listado #/projects**
   - Título de página: "Projects" o "Proyectos".
   - Breadcrumb: Home (o Dashboard) / Projects.
   - Barra de herramientas: input de búsqueda (placeholder "Search..."), dropdown "Filter by status" (All, ACTIVE, ARCHIVED), botón "+ New Project" (enlace o acción existente a crear proyecto; visible según RBAC).
   - Tabla: columnas **Name**, **Status**, **Created date**, **Actions**. En Status usar badges (ACTIVE/ARCHIVED) con clases del design system. En Actions: botones/enlaces Edit y Delete (según API existente).
   - Paginación: controles Previous, números de página, Next.
   - Empty state: cuando no haya proyectos, mensaje "No projects yet" y CTA "Create project" (enlace a misma vista o modal existente).

2. **Detalle #/projects/:id**
   - Breadcrumb: Dashboard / Projects / [nombre del proyecto].
   - Bloque de datos: nombre, descripción, estado (badge).
   - Enlaces o botones: "Features" (#/features con projectId), "Sprints" (#/sprints con projectId), "Incidents" (#/incidents con projectId).
   - Botón "Archivar": solo visible si usuario tiene rol MASTER; misma lógica de API existente.

---

### FASE 2 — Features

**Archivo principal:** `public/js/views/features.js`

3. **Listado #/features**
   - Breadcrumb: Dashboard / Projects / [Project name] / Features. Si no hay proyecto seleccionado, mostrar "Select a project" o primer proyecto por defecto.
   - Selector de proyecto: dropdown que carga features del proyecto seleccionado.
   - Barra: búsqueda (placeholder "Search features"), "Filter by status" (All, PLANNED, IN PROGRESS, DONE), botón "+ New Feature".
   - Tabla: **Feature title**, **Status**, **Stories count**, **Actions** (menú o botones: ver, editar, eliminar). Badges por estado.
   - Paginación si la lista es larga.
   - Empty state: "No features yet" / "Create first feature".

---

### FASE 3 — Stories

**Archivo principal:** `public/js/views/stories.js`

4. **Listado #/stories**
   - Breadcrumb: Dashboard / Projects / [Project] / [Feature] / Stories. Selectores de proyecto y feature.
   - Botón "+ New Story".
   - Tabla: **Story ID**, **Story Title**, **Status**, **Assigned Sprint**, **Priority**, **Assignee**, **Actions** (ver, editar, eliminar). Estados: TODO, IN PROGRESS, BLOCKED, DONE (badges).
   - Paginación.
   - Empty state: "No stories created yet" / "Create first story".

---

### FASE 4 — Sprints (listado y detalle)

**Archivo principal:** `public/js/views/sprints.js`

5. **Listado #/sprints**
   - Selector de proyecto (dropdown).
   - Botón "+ New Sprint".
   - Tabla: **Sprint name**, **Start date**, **End date**, **Status**, **Actions** (ver, editar). Estados: PLANNED, ACTIVE, CLOSED (badges).
   - Paginación.
   - Empty state coherente con design system.

6. **Detalle #/sprints/:id**
   - Breadcrumb: Dashboard / Projects / [Project] / Sprints / [Sprint name].
   - Tarjeta de información: nombre del sprint, start date, end date, status (badge).
   - Tabla de stories asignadas: **Story title**, **Status**, **Assignee** (datos desde API existente).
   - Botón "Close Sprint": solo visible para rol MASTER; misma API existente.

---

### FASE 5 — Releases (listado y detalle)

**Archivo principal:** `public/js/views/releases.js`

7. **Listado #/releases**
   - Título "Releases". Botón "+ New Release".
   - Tabla: **Version** (SemVer), **Status**, **Actions** (ver, editar). Filtro por estado si aplica. Paginación.

8. **Detalle #/releases/:id**
   - Breadcrumb: Dashboard / Projects / [Project] / Releases / [version].
   - Datos: versión, descripción, estado.
   - Lista de features asociadas (según API existente).

---

### FASE 6 — Incidents

**Archivo principal:** `public/js/views/incidents.js`

9. **Listado #/incidents**
   - Selector de proyecto (dropdown). Búsqueda. "Status filter" (OPEN, IN_PROGRESS, RESOLVED, CLOSED).
   - Botón "+ New Incident".
   - Tabla: **Title**, **Severity**, **Status**, **Created date**, **Actions**. Badges de severidad y estado.
   - Paginación. Empty state.

---

### FASE 7 — Documents (listado y detalle)

**Archivo principal:** `public/js/views/documents.js`

10. **Listado #/documents**
    - Título "Documents". Búsqueda. Botón "+ New Document".
    - Tabla: **Code**, **Title**, **Latest version**, **Status**, **Actions**. Paginación. Empty state.

11. **Detalle #/documents/:id**
    - Breadcrumb: Dashboard / Documents / [Code] o equivalente.
    - Código y título del documento.
    - Lista de versiones: para cada versión, estado (DRAFT, APPROVED, ARCHIVED) y acciones "Aprobar" / "Archivar" solo visibles para MASTER (misma API existente).

---

### FASE 8 — Verificación y regresión

12. **Sidebar:** Verificar que en cada ruta (#/projects, #/features, #/stories, #/sprints, #/releases, #/incidents, #/documents) el ítem correspondiente del sidebar quede resaltado (clase activa).
13. **Navegación:** Comprobar que todos los breadcrumbs y enlaces entre listado y detalle funcionan.
14. **Consola:** Recorrer las rutas de la etapa y confirmar que no hay errores en consola (llamadas API correctas, sin 404/500 inesperados).
15. **Regresión:** Abrir #/dashboard, #/login, #/admin (si aplica) y #/reports y confirmar que cargan sin errores.

---

## 4️⃣ CRITERIOS DE ACEPTACIÓN

- [ ] Projects: listado con título, breadcrumb, búsqueda, filter by status, "+ New Project", tabla (Name, Status, Created date, Actions), badges, paginación, empty state; detalle con breadcrumb, datos, enlaces a Features/Sprints/Incidents, Archivar (MASTER).
- [ ] Features: breadcrumb, selector proyecto, búsqueda, filter by status, "+ New Feature", tabla (Feature title, Status, Stories count, Actions), paginación, empty state.
- [ ] Stories: breadcrumb, selectores proyecto/feature, "+ New Story", tabla (Story ID, Title, Status, Assigned Sprint, Priority, Assignee, Actions), empty state "No stories created yet" / "Create first story".
- [ ] Sprints: listado con selector proyecto, "+ New Sprint", tabla (name, start/end date, status, actions), paginación; detalle con breadcrumb, tarjeta de info, tabla de stories asignadas, "Close Sprint" (MASTER).
- [ ] Releases: listado con "+ New Release", tabla (version, status, actions), filtros, paginación; detalle con breadcrumb, datos, features asociadas.
- [ ] Incidents: selector proyecto, búsqueda, status filter, "+ New Incident", tabla (Title, Severity, Status, Created date, Actions), badges, paginación, empty state.
- [ ] Documents: listado con búsqueda, "+ New Document", tabla (Code, Title, Latest version, Status, Actions), paginación; detalle con breadcrumb, versiones y acciones Aprobar/Archivar (MASTER).
- [ ] Design system aplicado en todas las pantallas (cards, badges, botones, empty state).
- [ ] Sin cambios en backend, API ni contratos.

---

## 5️⃣ QA (6 NIVELES) — VERIFICACIÓN OBLIGATORIA

- **Funcional:** Cada ruta carga; tablas, filtros, paginación y acciones operan; empty states y CTAs correctos.
- **Dominio:** No aplica cambio de reglas de negocio en frontend; solo presentación.
- **Negativa:** Filtros y búsqueda con valores vacíos o inválidos no rompen la vista; acciones no permitidas (sin rol) no visibles o deshabilitadas.
- **Regresión:** #/dashboard, #/login, #/admin, #/reports y resto de rutas operativas; sin errores de consola.
- **Seguridad:** No exponer datos sensibles en UI; RBAC respetado (acciones MASTER solo para MASTER).
- **Contrato API:** No modificar requests/responses; usar solo endpoints existentes.

---

## 6️⃣ CRITERIO DE CIERRE

- Todas las pantallas de la Etapa 14 (projects, features, stories, sprints, releases, incidents, documents — listado y detalle) implementadas según este prompt y el plan.
- Criterios de aceptación de la sección 4️⃣ cumplidos.
- QA en 6 niveles ejecutada y sin bloqueos.
- Cero cambios en `src/`, migraciones o contratos API.
- Evidencia generada en `docs/EVIDENCIA_ETAPA_14_REDISENO_MODULOS_OPERATIVOS_YYYY-MM-DD.md`.

---

## 7️⃣ ENTREGABLES Y EVIDENCIA

- **Código:** Solo archivos modificados en `public/js/views/` (projects.js, features.js, stories.js, sprints.js, releases.js, incidents.js, documents.js) y, si aplica, `public/css/` (preferir design-system.css).
- **Evidencia:** Crear archivo `docs/EVIDENCIA_ETAPA_14_REDISENO_MODULOS_OPERATIVOS_YYYY-MM-DD.md` (reemplazar YYYY-MM-DD por fecha real) con contenido mínimo:
  1. Lista de archivos creados o modificados.
  2. Migraciones aplicadas: N/A (etapa solo frontend).
  3. Confirmación de arquitectura intacta: no se modificaron controllers, services ni repositories.
  4. Reglas de dominio: N/A para UI; acciones condicionadas por rol según backend existente.
  5. Resultado de QA funcional: resumen por pantalla (carga, tabla, filtros, acciones).
  6. Resultado de QA negativa: filtros/búsqueda vacíos; acciones sin permiso.
  7. Auditoría: N/A (sin cambios backend).
  8. Confirmación de ausencia de errores 500 en flujos usados desde las vistas (llamadas API existentes).
  9. Response Layer / contrato API: sin cambios; solo consumo de endpoints actuales.
- **Checklist:** Tras implementación, el MASTER DEVELOPER marcará en docs/CHECKLIST_ETAPAS_PROYECTO.md el paso "MASTER DEVELOPER implementa" para ETAPA 14 y referenciará el archivo de evidencia.

---

**No ejecutar este prompt hasta que el SYSTEM ARCHITECT haya validado el plan y el PO MASTER haya incorporado los ajustes correspondientes.**

---

*Documento generado para ETAPA 14 — Rediseño de módulos operativos. Plan: docs/PLAN_ETAPA_14_REDISENO_MODULOS_OPERATIVOS.md.*
