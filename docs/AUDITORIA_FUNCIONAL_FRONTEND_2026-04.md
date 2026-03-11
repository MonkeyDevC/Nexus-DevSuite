# Auditoría funcional del frontend — NEXUS DevSuite (Abril 2026)

**Rol:** PRODUCT OWNER — NEXUS DevSuite  
**Fecha:** 2026-04  
**Referencia:** docs/ENDPOINTS_API_Y_USO_FRONTEND.md, docs/project-logs/TICKETS_IMPLEMENTADOS.md, docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-03.md, docs/plans/PLAN_IMPLEMENTACION_AUDITORIA_FRONTEND_2026-03.md  
**Objetivo:** Auditar el estado actual del frontend tras la implementación de los 14 tickets (NEXUS-AUD-001 a 014), detectar gaps funcionales, inconsistencias y mejoras necesarias, y generar 12 nuevos tickets priorizados para el siguiente sprint.

---

# SECCIÓN 1 — DIAGNÓSTICO GENERAL (POST-IMPLEMENTACIÓN)

## 1.1 Comparación con auditoría anterior (2026-03)

| Dimensión | 2026-03 (antes) | 2026-04 (actual) |
|-----------|------------------|-------------------|
| **Madurez funcional global** | ~30–35% | **~75–80%** |
| **Cobertura de endpoints** | ~45–55% | **~90%** (solo auth/admin/test y Documents GET by code / GET-PATCH versión por id sin uso completo) |
| **Completitud de flujos** | Baja en 6 de 10 módulos | Alta: Incidents, Organizations, Improvements, Change Requests, Documents (versiones), Releases, Sprints, Stories, Features con flujos operativos |
| **Consistencia frontend/API** | Riesgo medio (/close vs /status) | **Alineada:** documentación y código usan PATCH /sprints/:id/status |

**Conclusión:** El frontend ha pasado de “esqueleto operativo” a **producto usable**. Los 14 tickets implementados han cerrado la mayoría de los flujos críticos. Quedan mejoras de **consistencia de UX**, **aprovechamiento de endpoints aún no usados** (Documents: código y contenido de versión), **paginación uniforme**, **navegación contextual** y **refuerzo por rol (MASTER vs EMPLOYEE)**.

---

## 1.2 Estimación de cobertura de endpoints (actual)

- **Total de endpoints (método + ruta):** según docs/ENDPOINTS_API_Y_USO_FRONTEND.md sección 1.
- **Con interfaz en frontend:** prácticamente todos excepto:
  - GET `/api/v1/auth/admin/test` (test interno).
  - **Documents:** GET `/api/v1/documents/code/:code`; GET y PATCH `/api/v1/documents/:documentId/versions/:versionId` (contenido de una versión concreta).
- **Cobertura aproximada:** **~90%**.

---

## 1.3 Principales brechas detectadas (nueva auditoría)

1. **Documents:** Falta búsqueda por código (GET by code) y vista/edición del contenido de una versión (GET/PATCH versión por versionId).
2. **Consistencia de listados:** Solo Projects y Releases tienen selector “Ver por página”; Improvements, Documents, Features, Incidents usan `limit` en estado pero no exponen selector al usuario.
3. **Change Requests:** Flujo por ID correcto; falta validación de UUID en entity_id y mejora de feedback (mostrar ID creado como enlace a feature/release si aplica).
4. **Dashboard:** Enlaces ya presentes en proyectos y sprint activo; “Mis asignaciones” enlaza a `#/stories?feature=…` pero no a detalle de story (modal o vista).
5. **Incidents:** Detalle implementado; falta breadcrumb con proyecto y “Volver” contextual (preservar proyecto en hash).
6. **Reports:** Tablas de resumen sin selector “Ver por página” o límite configurable cuando los conjuntos son grandes.
7. **Mensajes de éxito:** Tras crear/actualizar en modales, no hay patrón uniforme de “Guardado correctamente” antes de cerrar/recargar.
8. **Admin Organización:** Verificar validación de campos requeridos y envío completo en PATCH.
9. **Rol EMPLOYEE:** Revisar que acciones restringidas a MASTER estén ocultas o deshabilitadas en todas las vistas.
10. **Integración entre módulos:** Enlaces cruzados (release → feature, sprint → story, feature → story) a comprobar o completar.

---

# SECCIÓN 2 — HALLAZGOS POR MÓDULO

## 2.1 Dashboard

- **Estado actual:** GET /dashboard/summary, GET /projects, GET /reports/users/:userId/activity. Tarjetas, proyectos, sprint activo, mis asignaciones, actividad reciente. Sin datos dummy (NEXUS-AUD-002).
- **Hallazgos:** En “Mis asignaciones” el enlace es a `#/stories?feature=…`; no hay enlace directo a abrir la story en detalle (modal o vista). Las tarjetas y “Estado de los proyectos” / “Progreso del sprint” ya enlazan correctamente a #/projects/:id y #/sprints/:id.
- **Tipo:** UX, integración.
- **Impacto:** Bajo. Mejora deseable para acceso rápido a la story asignada.

## 2.2 Sprints

- **Estado actual:** Listar, crear, detalle, cerrar (PATCH status), listar/asignar/quitar stories (NEXUS-AUD-001, 006). Flujo completo.
- **Hallazgos:** Ninguno crítico. Posible mejora: en detalle, enlazar cada story del sprint a su detalle (modal o contexto en Stories).
- **Tipo:** Integración.
- **Impacto:** Bajo.

## 2.3 Incidents

- **Estado actual:** Listar por proyecto, crear, detalle #/incidents/:id con GET/PATCH y cambio de estado (NEXUS-AUD-003).
- **Hallazgos:** En detalle falta breadcrumb con nombre del proyecto; “Volver” va a #/incidents sin preservar projectId en el hash, lo que obliga a reseleccionar proyecto.
- **Tipo:** Flujo, UX.
- **Impacto:** Medio.

## 2.4 Organizations

- **Estado actual:** Vista Admin → Organización (#/admin/organization) con GET current, PATCH (NEXUS-AUD-004).
- **Hallazgos:** Verificar que todos los campos editables tengan validación (nombre obligatorio, etc.) y que el PATCH envíe correctamente todos los campos soportados por la API.
- **Tipo:** Integridad, UX.
- **Impacto:** Bajo.

## 2.5 Improvements

- **Estado actual:** Listado (#/improvements) con paginación y filtro por estado, crear, detalle #/improvements/:id, cambio de estado (NEXUS-AUD-005).
- **Hallazgos:** El listado usa `state.limit` pero no hay selector “Ver por página” en la UI; solo paginación por página. Inconsistente con Projects y Releases.
- **Tipo:** Consistencia.
- **Impacto:** Bajo.

## 2.6 Stories

- **Estado actual:** Listar por feature/proyecto, crear, detalle en modal con GET /stories/:id, PATCH status, PATCH assign, PATCH :id (NEXUS-AUD-007).
- **Hallazgos:** Ninguno crítico. Comprobar que desde Releases (features asignadas) y Sprints (stories del sprint) existan enlaces a abrir la story (modal o vista).
- **Tipo:** Integración.
- **Impacto:** Bajo.

## 2.7 Features

- **Estado actual:** Listar por proyecto, crear, selector de estado por fila (PATCH status) (NEXUS-AUD-008).
- **Hallazgos:** Listado tiene state.limit pero no selector “Ver por página”. En detalle de Release, las features asignadas deberían enlazar a #/features/:id.
- **Tipo:** Consistencia, integración.
- **Impacto:** Bajo.

## 2.8 Releases

- **Estado actual:** Listar, crear, detalle con estado, asignar feature, hotfix, editar descripción, eliminar y bulk-delete (NEXUS-AUD-009). Selector “Ver por página” presente.
- **Hallazgos:** En la sección Features del detalle, cada feature listada debería ser enlace a #/features/:id para navegación cruzada.
- **Tipo:** Integración.
- **Impacto:** Bajo.

## 2.9 Documents

- **Estado actual:** Listado, crear, detalle con sección Versiones: listar, crear versión, PATCH status (aprobar/archivar) (NEXUS-AUD-010).
- **Hallazgos:** (1) No se usa GET /documents/code/:code — no hay forma de abrir un documento por código desde el listado. (2) No se usa GET/PATCH de una versión por versionId: no se puede ver ni editar el contenido de una versión concreta (solo listar y cambiar estado).
- **Tipo:** Endpoint no utilizado, flujo incompleto.
- **Impacto:** Medio para entornos con control documental por código y revisión de contenido de versiones.

## 2.10 Change Requests

- **Estado actual:** Crear (POST), transiciones por ID (submit, approve, reject, implement) (NEXUS-AUD-011). Sin GET list (API no lo expone).
- **Hallazgos:** entity_id es obligatorio pero no se valida formato UUID; el mensaje tras crear muestra el ID pero no como enlace a la entidad (feature/release). Errores de API podrían mostrarse con showApiError de forma uniforme.
- **Tipo:** UX, integridad.
- **Impacto:** Bajo.

## 2.11 Reports

- **Estado actual:** Resumen por proyecto, por sprint, actividad por usuario (NEXUS-AUD-012), auditoría en Admin.
- **Hallazgos:** Las tablas de resumen (proyecto, sprint) no tienen selector “Ver por página” ni límite configurable; si la API devuelve muchos ítems, la tabla puede ser larga.
- **Tipo:** Consistencia, UX.
- **Impacto:** Bajo.

## 2.12 Health / Integración API

- **Estado actual:** GET /health en footer (NEXUS-AUD-013), manejo uniforme de errores en api.js (NEXUS-AUD-014).
- **Hallazgos:** Ninguno crítico.
- **Impacto:** Nulo.

---

# SECCIÓN 3 — IDENTIFICACIÓN DE GAPS (RESUMEN)

| # | Módulo | Tipo | Impacto | Recomendación técnica |
|---|--------|------|---------|------------------------|
| G1 | Documents | Endpoint | Medio | Usar GET /documents/code/:code para búsqueda por código y redirigir a detalle. |
| G2 | Documents | Flujo | Medio | Usar GET/PATCH /documents/:documentId/versions/:versionId para ver y editar contenido de versión (DRAFT). |
| G3 | Improvements, Documents, Features, Incidents | UX | Bajo | Añadir selector “Ver por página” (10, 25, 50) donde la API soporte limit. |
| G4 | Change Requests | Integridad/UX | Bajo | Validar entity_id como UUID; mostrar ID creado como enlace a #/features/:id o #/releases/:id según entity_type. |
| G5 | Dashboard | UX | Bajo | En “Mis asignaciones”, enlazar a detalle de story (modal o #/stories con story pre-seleccionada) cuando se disponga de story_id. |
| G6 | Reports | UX | Bajo | Añadir paginación o límite en tablas de resumen cuando la API lo soporte. |
| G7 | Incidents | Flujo | Medio | Breadcrumb con proyecto en detalle; “Volver” a #/incidents preservando projectId en hash. |
| G8 | Admin Organización | Integridad | Bajo | Validación HTML5/JS de campos requeridos; asegurar envío completo en PATCH. |
| G9 | Varios (Releases, Documents, CR, Admin, Projects) | Integridad | Medio | Ocultar o deshabilitar acciones solo MASTER para rol EMPLOYEE. |
| G10 | Releases, Sprints, Features | Integración | Bajo | Enlaces cruzados: release → feature, sprint → story, feature → story. |
| G11 | Varios (formularios) | UX | Bajo | Mensaje de éxito breve (“Guardado correctamente”) tras POST/PATCH exitoso en modales. |

---

# SECCIÓN 4 — TICKETS TÉCNICOS (NEXUS-AUD-015 a NEXUS-AUD-026)

---

## NEXUS-AUD-015

**Título:** Documents — Búsqueda por código y apertura a detalle

**Módulo:** Documents

**Descripción técnica:** En el listado de documentos, añadir un control (campo “Buscar por código” o uso del código en la búsqueda existente) que permita, cuando el usuario introduzca un código exacto y pulse Enter o un botón “Ir”, llamar a GET /api/v1/documents/code/:code. Si la respuesta es correcta y devuelve un documento, redirigir a #/documents/:id (id del documento devuelto). Si no existe, mostrar mensaje claro (sin datos dummy). No inventar endpoints; solo usar GET /documents/code/:code según API.

**Endpoints involucrados:** GET /api/v1/documents/code/:code

**Archivos de frontend permitidos:** public/js/views/documents.js

**Criterios de aceptación:**  
- En listado de documentos existe forma de buscar por código exacto que use GET /documents/code/:code.  
- Si el documento existe, se redirige a #/documents/:id.  
- Si no existe, se muestra un mensaje claro al usuario.  
- docs/ENDPOINTS_API_Y_USO_FRONTEND.md actualizado con uso de GET by code.

---

## NEXUS-AUD-016

**Título:** Documents — Ver y editar contenido de una versión

**Módulo:** Documents

**Descripción técnica:** En la vista de detalle de documento, en la tabla de versiones, permitir “Ver contenido” (o similar) por versión. Al pulsar, cargar GET /api/v1/documents/:documentId/versions/:versionId y mostrar el contenido (p. ej. en modal o sección expandida). Si la versión tiene status DRAFT y el usuario tiene rol MASTER, permitir editar el contenido y guardar con PATCH /api/v1/documents/:documentId/versions/:versionId (body con content). No añadir campos que la API no soporte.

**Endpoints involucrados:** GET /api/v1/documents/:documentId/versions/:versionId, PATCH /api/v1/documents/:documentId/versions/:versionId

**Archivos de frontend permitidos:** public/js/views/documents.js

**Criterios de aceptación:**  
- Desde la tabla de versiones se puede abrir el contenido de una versión concreta vía GET por versionId.  
- Para versiones DRAFT y usuario MASTER se puede editar y guardar con PATCH por versionId.  
- docs/ENDPOINTS_API_Y_USO_FRONTEND.md actualizado con uso de GET/PATCH versión por id.

---

## NEXUS-AUD-017

**Título:** Consistencia — Selector “Ver por página” en listados

**Módulo:** Improvements, Documents, Features, Incidents

**Descripción técnica:** Añadir el selector “Ver por página” (opciones 10, 25, 50) en los listados que ya usan paginación con parámetro `limit` en la API: Improvements, Documents, Features, Incidents. Reutilizar el patrón ya existente en Projects y Releases (label “Ver por página”, select que actualice state.limit, recarga de datos). No cambiar la arquitectura de paginación ni inventar parámetros; solo exponer el limit actual como selector.

**Endpoints involucrados:** GET /api/v1/improvements (page, limit), GET /api/v1/documents (page, limit), GET /api/v1/projects/:projectId/features (page, limit), GET /api/v1/projects/:projectId/incidents (page, limit)

**Archivos de frontend permitidos:** public/js/views/improvements.js, public/js/views/documents.js, public/js/views/features.js, public/js/views/incidents.js

**Criterios de aceptación:**  
- En listado de Mejoras, Documentos, Features e Incidentes aparece el selector “Ver por página” con opciones coherentes (p. ej. 10, 25, 50).  
- Al cambiar el valor se recarga el listado con el nuevo limit y la paginación se recalcula correctamente.

---

## NEXUS-AUD-018

**Título:** Change Requests — Validación UUID y enlace al ID creado

**Módulo:** Change Requests

**Descripción técnica:** (1) Validar que el campo “ID de entidad” tenga formato UUID (regex o validación equivalente) antes de enviar POST; mostrar mensaje claro si no es válido. (2) Tras crear un CR con éxito, además de mostrar el ID devuelto, ofrecer un enlace a la entidad cuando sea posible: si entity_type es FEATURE, enlace a #/features/:entity_id (o a listado de features del proyecto si no hay ruta directa por id); si es RELEASE, enlace a #/releases/:entity_id. (3) Usar showApiError(body) para errores de API en crear y en transiciones. No inventar endpoints.

**Endpoints involucrados:** POST /api/v1/change-requests, PATCH /api/v1/change-requests/:id/submit, approve, reject, implement

**Archivos de frontend permitidos:** public/js/views/change-requests.js

**Criterios de aceptación:**  
- entity_id se valida como UUID antes de enviar; se muestra mensaje si el formato es incorrecto.  
- Tras crear, se muestra el ID y un enlace a la entidad (feature o release) cuando aplica.  
- Los errores de API se muestran con el patrón uniforme (showApiError).

---

## NEXUS-AUD-019

**Título:** Dashboard — Enlace desde “Mis asignaciones” a detalle de story

**Módulo:** Dashboard

**Descripción técnica:** En la sección “Mis asignaciones” del dashboard, si el objeto de asignación incluye un identificador de story (id o story_id), hacer que la fila o un botón “Ver” permita abrir el detalle de esa story. Opciones aceptables: (a) enlace a #/stories con query que permita abrir el modal de la story (si el router/vista lo soporta); (b) enlace a #/stories?feature=:feature_id y documentar que el usuario puede localizar la story en la lista. La implementación debe usar solo datos que devuelva la API (dashboard/summary o myAssignments). No inventar campos en la API.

**Endpoints involucrados:** GET /api/v1/dashboard/summary (myAssignments), GET /api/v1/stories/:id si se abre modal

**Archivos de frontend permitidos:** public/js/views/dashboard.js, public/js/views/stories.js (solo si se añade soporte para abrir modal por id vía hash/query)

**Criterios de aceptación:**  
- Desde “Mis asignaciones” el usuario puede acceder al detalle de la story cuando la API proporcione el identificador necesario.  
- No se usan datos inventados; el flujo es coherente con el contrato del dashboard/summary.

---

## NEXUS-AUD-020

**Título:** Reports — Paginación o límite en tablas de resumen

**Módulo:** Reports

**Descripción técnica:** En la vista Reportes (#/reports), en las tablas que muestran resumen por proyecto y resumen por sprint, añadir control de “Ver por página” o límite de filas (p. ej. 10, 25, 50) si la API de reports acepta parámetros de paginación o límite. Si la API no acepta parámetros, implementar límite en cliente (mostrar solo las N primeras filas y opción “Ver más” o paginación en cliente). Documentar en el ticket la decisión según contrato real de GET /reports/projects/:projectId/summary y GET /reports/sprints/:sprintId/summary.

**Endpoints involucrados:** GET /api/v1/reports/projects/:projectId/summary, GET /api/v1/reports/sprints/:sprintId/summary

**Archivos de frontend permitidos:** public/js/views/reports.js

**Criterios de aceptación:**  
- Las tablas de resumen de proyecto y sprint tienen control de cantidad de filas mostradas (selector o límite en cliente).  
- No se inventan parámetros en la API; si la API no soporta paginación, el límite es en cliente.

---

## NEXUS-AUD-021

**Título:** Incidents — Breadcrumb y “Volver” con contexto de proyecto

**Módulo:** Incidents

**Descripción técnica:** En la vista de detalle de incidente (#/incidents/:id), (1) añadir breadcrumb que incluya “Panel”, “Incidentes”, nombre del proyecto (si se conoce) y título del incidente. El nombre del proyecto puede obtenerse con GET /projects/:id si el incidente devuelve project_id. (2) El botón “Volver” debe llevar a #/incidents y, si el incidente tiene project_id, preservar el proyecto en el hash (p. ej. #/incidents?project=:projectId) para que la lista se cargue ya filtrada por ese proyecto. Comprobar si el router o la vista de listado ya interpretan query project; si no, añadir la lectura de ese parámetro al cargar la lista.

**Endpoints involucrados:** GET /api/v1/incidents/:id, GET /api/v1/projects/:id (para nombre en breadcrumb)

**Archivos de frontend permitidos:** public/js/views/incidents.js, public/js/router.js (solo si es necesario leer query en hash)

**Criterios de aceptación:**  
- En detalle de incidente se muestra breadcrumb con proyecto cuando hay project_id.  
- “Volver” lleva a la lista de incidentes con el proyecto preseleccionado cuando aplica.

---

## NEXUS-AUD-022

**Título:** Improvements — Selector “Ver por página” en listado

**Módulo:** Improvements

**Descripción técnica:** Añadir en el listado de mejoras (#/improvements) el selector “Ver por página” (10, 25, 50) siguiendo el mismo patrón que en Projects y Releases. El estado ya incluye state.limit; conectar el select al limit y recargar GET /improvements con page=1 y el nuevo limit. No modificar la API.

**Endpoints involucrados:** GET /api/v1/improvements (page, limit)

**Archivos de frontend permitidos:** public/js/views/improvements.js

**Criterios de aceptación:**  
- En listado de Mejoras aparece “Ver por página” con opciones 10, 25, 50.  
- Al cambiar, el listado se recarga con el nuevo limit.

---

## NEXUS-AUD-023

**Título:** Mensajes de éxito tras crear/actualizar en formularios

**Módulo:** Transversal (Projects, Features, Stories, Documents, Improvements, Releases, Incidents, Admin)

**Descripción técnica:** Establecer un patrón uniforme para feedback de éxito tras POST o PATCH exitoso en modales o formularios: mostrar un mensaje breve (“Guardado correctamente”, “Creado correctamente”, etc.) antes de cerrar el modal y/o recargar la vista. Opciones: (a) texto en el propio modal que se muestra 1–2 segundos antes de cerrar; (b) toast o barra de notificación si existe en el diseño; (c) mensaje inline junto al botón. Aplicar en los flujos de crear/editar que aún no muestren este feedback (revisar projects, features, stories, documents, improvements, releases, incidents, admin organización). No cambiar la lógica de cierre/recarga; solo añadir el mensaje de éxito.

**Endpoints involucrados:** Ninguno nuevo; todos los POST/PATCH usados en formularios de los módulos citados.

**Archivos de frontend permitidos:** public/js/views/projects.js, public/js/views/features.js, public/js/views/stories.js, public/js/views/documents.js, public/js/views/improvements.js, public/js/views/releases.js, public/js/views/incidents.js, public/js/views/admin.js

**Criterios de aceptación:**  
- Tras crear o actualizar con éxito en los flujos revisados, el usuario ve un mensaje de éxito claro antes de que se cierre el modal o se recargue la vista.  
- El patrón es reutilizable y coherente entre módulos.

---

## NEXUS-AUD-024

**Título:** Admin Organización — Validación de campos y PATCH completo

**Módulo:** Organizations (Admin)

**Descripción técnica:** En la vista #/admin/organization, (1) asegurar que los campos obligatorios (según API) tengan validación HTML5 (required) o JS antes de enviar PATCH. (2) Verificar que el body del PATCH incluya todos los campos editables que la API acepta (nombre, plan, billing_email, next_billing_date según docs). (3) Mostrar mensaje de error claro si la API devuelve error (showApiError). No inventar campos ni endpoints.

**Endpoints involucrados:** GET /api/v1/organizations/current, GET /api/v1/organizations/:id, PATCH /api/v1/organizations/:id

**Archivos de frontend permitidos:** public/js/views/admin.js

**Criterios de aceptación:**  
- Los campos requeridos no permiten enviar el formulario vacíos (validación en cliente).  
- El PATCH envía correctamente los campos documentados.  
- Los errores de API se muestran al usuario.

---

## NEXUS-AUD-025

**Título:** Ocultar o deshabilitar acciones MASTER para rol EMPLOYEE

**Módulo:** Releases, Documents, Change Requests, Admin, Projects

**Descripción técnica:** Revisar todas las vistas donde existan acciones restringidas a MASTER (bulk-delete, hotfix, aprobar/rechazar CR, aprobar/archivar versión de documento, editar organización, eliminar proyecto/release, etc.) y asegurar que para usuarios con rol EMPLOYEE esas acciones no se muestren o estén deshabilitadas con indicación clara. Usar el mismo criterio que ya se aplica en Change Requests (botones Aprobar, Rechazar, Marcar implementado solo si isMaster). Comprobar: Releases (hotfix, bulk-delete, editar descripción), Documents (aprobar/archivar versión), Change Requests (ya implementado), Admin (organización, usuarios, auditoría, métricas), Projects (editar, archivar, eliminar, bulk-delete).

**Endpoints involucrados:** Ninguno nuevo; solo uso de getMe()/role para condicionar la UI.

**Archivos de frontend permitidos:** public/js/views/releases.js, public/js/views/documents.js, public/js/views/change-requests.js, public/js/views/admin.js, public/js/views/projects.js

**Criterios de aceptación:**  
- Un usuario EMPLOYEE no ve (o ve deshabilitadas) las acciones que solo MASTER puede ejecutar en las vistas revisadas.  
- No se exponen botones que lleven a error 403 sin razón.

---

## NEXUS-AUD-026

**Título:** Enlaces cruzados entre módulos (Release → Feature, Sprint → Story, Feature → Story)

**Módulo:** Releases, Sprints, Features, Stories

**Descripción técnica:** (1) En detalle de Release, en la lista de features asignadas al release, hacer que cada feature sea un enlace a #/features/:id (o a la vista de features con proyecto preseleccionado si la ruta de detalle de feature no existe por id). (2) En detalle de Sprint, en la lista de stories del sprint, añadir enlace por story a la vista de Stories donde se pueda abrir el detalle (modal o navegación); usar #/stories?feature=:feature_id o el mecanismo existente para abrir la story. (3) En detalle de Feature, en la lista de stories, asegurar que cada story tenga enlace o acción “Ver” que abra el modal de detalle de story. Verificar que las rutas y parámetros existentes (#/features, #/stories, #/releases, #/sprints) permitan estas navegaciones sin inventar nuevas rutas de backend.

**Endpoints involucrados:** GET /api/v1/releases/:id, GET /api/v1/projects/:projectId/features, GET /api/v1/features/:id, GET /api/v1/features/:featureId/stories, GET /api/v1/sprints/:id/stories, GET /api/v1/stories/:id

**Archivos de frontend permitidos:** public/js/views/releases.js, public/js/views/sprints.js, public/js/views/features.js, public/js/views/stories.js

**Criterios de aceptación:**  
- Desde un release se puede navegar a la feature asignada.  
- Desde un sprint se puede navegar a la story (lista o detalle).  
- Desde una feature se puede abrir el detalle de cada story.  
- No se añaden rutas de backend ni endpoints nuevos.

---

*Fin de la auditoría y de la lista de tickets. El plan de implementación se define en docs/plans/PLAN_IMPLEMENTACION_AUDITORIA_FRONTEND_2026-04.md.*
