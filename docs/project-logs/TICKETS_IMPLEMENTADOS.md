# Registro de tickets implementados — NEXUS DevSuite

**Propósito:** Trazabilidad de cada ticket derivado de la auditoría funcional una vez implementado. Permite rastrear qué archivos y endpoints se han tocado en cada cambio.

**Uso:** Tras cerrar un ticket, añadir **una entrada** con el formato indicado más abajo. No eliminar entradas anteriores.

**Referencia:** docs/process/PROTOCOLO_IMPLEMENTACION_TICKETS.md (Sección 4 — Trazabilidad).

---

## Formato de cada entrada

```
---
**Ticket ID:** NEXUS-AUD-XXX
**Fecha cierre:** YYYY-MM-DD
**Archivos modificados:**
- ruta/relativa/archivo1.js
- ruta/relativa/archivo2.md
**Endpoints utilizados:**
- PATCH /api/v1/recurso/:id/accion
- GET /api/v1/recurso
**Cambios funcionales realizados:** Descripción breve de lo que el usuario puede hacer tras el cambio.
---
```

---

## Registro de implementaciones

*(Las entradas se agregan debajo de esta línea. El primer ticket implementado será NEXUS-AUD-001 según el plan.)*

---
**Ticket ID:** NEXUS-AUD-001  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- docs/ENDPOINTS_API_Y_USO_FRONTEND.md  
**Endpoints utilizados:**
- PATCH /api/v1/sprints/:id/status (body: `{ "status": "CLOSED" }`)  
**Cambios funcionales realizados:** La acción "Cerrar sprint" en la vista de detalle de sprint ya utilizaba exclusivamente PATCH /sprints/:id/status con body { status: "CLOSED" }; no existían llamadas a /close en el frontend. Se actualizó la documentación para reflejar la ruta y uso reales: tabla de endpoints (fila "cerrar sprint"), lista de no usados, resumen y nota final. Criterios de aceptación del ticket cumplidos.
---

---
**Ticket ID:** NEXUS-AUD-002  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/dashboard.js  
**Endpoints utilizados:**
- GET /api/v1/dashboard/summary  
- GET /api/v1/projects  
- GET /api/v1/reports/users/:userId/activity  
**Cambios funcionales realizados:** Eliminados los únicos datos dummy del dashboard: (1) en "Estado de los proyectos", el progreso de cada proyecto usa solo el valor devuelto por la API (p.progress); cuando no viene, se muestra 0 en lugar del placeholder 50. (2) En la tarjeta "Progreso del sprint", el valor y la barra usan solo progressPercent cuando viene en activeSprint; si no viene, se muestra "—" y barra a 0, evitando "undefined%". Las tarjetas, mis asignaciones, sprint activo, proyectos y actividad reciente siguen alimentándose exclusivamente de GET /dashboard/summary, GET /projects y GET /reports/users/:userId/activity. Loading (showLoading) y empty states ya estaban implementados.
---

---
**Ticket ID:** NEXUS-AUD-003  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/incidents.js  
- docs/ENDPOINTS_API_Y_USO_FRONTEND.md  
**Endpoints utilizados:**
- GET /api/v1/incidents/:id  
- PATCH /api/v1/incidents/:id  
- PATCH /api/v1/incidents/:id/status  
- GET /api/v1/users (selector asignado a en detalle)  
- GET /api/v1/projects/:id (nombre proyecto en breadcrumb)  
**Cambios funcionales realizados:** Vista de detalle de incidente en #/incidents/:id: carga GET /incidents/:id, muestra título, descripción, severidad, estado, reportado por, asignado a, fechas y causa raíz. Selector para cambiar estado (OPEN, IN_PROGRESS, RESOLVED, CLOSED) con PATCH /incidents/:id/status; al cerrar (CLOSED) se envía root_cause_analysis si está rellenado. Edición de asignado a y causa raíz con PATCH /incidents/:id. Enlace "Ver" desde la lista de incidentes apunta a #/incidents/:id. Ruta manejada en la misma vista "incidents" mediante getHashSegments(); no se modificó router ni index.html.
---

---
**Ticket ID:** NEXUS-AUD-004  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/admin.js  
- public/index.html  
**Endpoints utilizados:**
- GET /api/v1/organizations/current  
- GET /api/v1/organizations/:id (opcional)  
- PATCH /api/v1/organizations/:id  
**Cambios funcionales realizados:** Vista Admin → Organización (#/admin/organization): se muestra la organización actual (nombre, slug, plan, billing_email, next_billing_date). Usuarios con rol MASTER pueden editar nombre, plan, billing_email y next_billing_date mediante formulario y PATCH /organizations/:id. Card "Organización" en el dashboard de admin con enlace a #/admin/organization; enlace en el menú de aplicaciones (nav-apps-organization).
---

---
**Ticket ID:** NEXUS-AUD-005  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/improvements.js (nuevo)  
- public/index.html  
**Endpoints utilizados:**
- GET /api/v1/improvements  
- POST /api/v1/improvements  
- GET /api/v1/improvements/:id  
- PATCH /api/v1/improvements/:id/status  
**Cambios funcionales realizados:** Módulo Mejoras: listado en #/improvements con paginación y filtro por estado; modal para crear mejora (título, descripción) con POST /improvements; vista detalle #/improvements/:id con GET /improvements/:id y selector de estado con PATCH /improvements/:id/status (DRAFT, PROPOSED, APPROVED, REJECTED, IMPLEMENTED). Enlace "Mejoras" en sidebar y script improvements.js en index.html.
---

---
**Ticket ID:** NEXUS-AUD-006  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/sprints.js  
**Endpoints utilizados:**
- GET /api/v1/sprints/:id  
- GET /api/v1/sprints/:id/stories  
- POST /api/v1/sprints/:id/stories/:storyId  
- DELETE /api/v1/sprints/:id/stories/:storyId  
- GET /api/v1/projects/:projectId/features  
- GET /api/v1/features/:featureId/stories  
**Cambios funcionales realizados:** En la vista de detalle de sprint se listan las stories del sprint con GET /sprints/:id/stories en la sección fija "Stories del sprint". Si el sprint no está CLOSED y tiene project_id, se muestra selector de story (candidatas del proyecto vía features + stories, excluyendo ya asignadas) y botón "Asignar" (POST /sprints/:id/stories/:storyId). Por cada story, botón "Quitar del sprint" con confirmación y DELETE /sprints/:id/stories/:storyId; tras asignar o quitar se recarga el detalle.
---

---
**Ticket ID:** NEXUS-AUD-007  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/stories.js  
**Endpoints utilizados:**
- GET /api/v1/stories/:id  
- PATCH /api/v1/stories/:id/status  
- PATCH /api/v1/stories/:id/assign  
**Cambios funcionales realizados:** En el modal de detalle de story (desde lista con "Ver"): selector de estado en pestaña Vista y Edición que llama a PATCH /stories/:id/status al cambiar; asignación de usuario con PATCH /stories/:id/assign al cambiar el dropdown "Asignado a" en Edición. Los datos del detalle siguen cargándose con GET /stories/:id; la asignación a sprint se mantiene con PATCH /stories/:id/sprint. No se añadió ruta #/stories/:id en router (detalle vía modal).
---

---
**Ticket ID:** NEXUS-AUD-008  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/features.js  
**Endpoints utilizados:**
- PATCH /api/v1/features/:id/status  
**Cambios funcionales realizados:** En la lista de features, la columna Estado pasó de badge estático a un <select> por fila con estados DRAFT, APPROVED, IN_PROGRESS, DONE, ARCHIVED. Al cambiar el valor se llama a PATCH /features/:id/status con body { status } y se refresca la lista. Mensaje de error en modal si la API devuelve error.
---

---
**Ticket ID:** NEXUS-AUD-009  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/releases.js  
**Endpoints utilizados:**
- PATCH /api/v1/releases/:id/status  
- POST /api/v1/releases/:id/features/:featureId  
- POST /api/v1/releases/:id/hotfix  
- PATCH /api/v1/releases/:id  
- GET /api/v1/projects (selector para asignar feature)  
- GET /api/v1/projects/:projectId/features (features candidatas)  
**Cambios funcionales realizados:** En la vista de detalle de release (#/releases/:id): selector de estado con PATCH /releases/:id/status (PLANNED, IN_PROGRESS, QA, RELEASED, ARCHIVED); sección Features con lista y control para asignar feature (selector proyecto + feature + botón) vía POST /releases/:id/features/:featureId; botón "Crear hotfix" (MASTER) con POST /releases/:id/hotfix y redirección al nuevo release; edición de descripción (MASTER) con formulario y PATCH /releases/:id.
---

---
**Ticket ID:** NEXUS-AUD-010  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/documents.js  
**Endpoints utilizados:**
- GET /api/v1/documents/:id  
- GET /api/v1/documents/:documentId/versions  
- POST /api/v1/documents/:documentId/versions  
- PATCH /api/v1/documents/:documentId/versions/:versionId/status  
**Cambios funcionales realizados:** En la vista de detalle de documento se añadió la sección Versiones: carga con GET /documents/:id/versions (independiente del documento); botón "Nueva versión" y modal con change_reason y content (opcionales) que llama a POST /documents/:id/versions; por cada versión botones Aprobar (PATCH status APPROVED) y Archivar (PATCH status ARCHIVED), solo MASTER. Tras crear versión o cambiar estado se recarga el detalle.
---

---
**Ticket ID:** NEXUS-AUD-011  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/change-requests.js (nuevo)  
- public/index.html  
**Endpoints utilizados:**
- POST /api/v1/change-requests  
- PATCH /api/v1/change-requests/:id/submit  
- PATCH /api/v1/change-requests/:id/approve  
- PATCH /api/v1/change-requests/:id/reject  
- PATCH /api/v1/change-requests/:id/implement  
**Cambios funcionales realizados:** Módulo Change Requests en #/change-requests: la API no expone GET list, por lo que la vista permite crear (formulario con entity_type, entity_id obligatorios; title, description, type, impact_level opcionales) con POST y ejecutar transiciones por ID (campo UUID + botones Enviar, Aprobar, Rechazar, Marcar implementado). Aprobar, Rechazar e Implement solo visibles para MASTER. Enlace "Change Requests" en sidebar y script change-requests.js en index.html. No se modificó router.js (el hash #/change-requests se resuelve por el primer segmento).
---

---
**Ticket ID:** NEXUS-AUD-012  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/reports.js  
**Endpoints utilizados:**
- GET /api/v1/users  
- GET /api/v1/reports/users/:userId/activity  
**Cambios funcionales realizados:** En Reportes (#/reports) se añadió la sección "Actividad por usuario": selector de usuario (GET /users) y botón "Ver actividad" que llama a GET /reports/users/:userId/activity y muestra el resultado en tabla (fecha, acción, entidad, detalle). Empty state cuando no hay actividad o no se ha elegido usuario.
---

---
**Ticket ID:** NEXUS-AUD-013  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/layout.js  
- public/index.html  
**Endpoints utilizados:**
- GET /api/v1/health  
**Cambios funcionales realizados:** Indicador de estado de la API en el footer de la aplicación (visible cuando la navegación está activa): al ejecutar showNav() se llama a GET /health con fetch (sin auth). Se muestra "API: OK" en verde o "API: Error" en rojo según la respuesta. El fallo de /health no bloquea la aplicación. Footer añadido en index.html (app-footer, app-health-status); lógica en layout.js.
---

---
**Ticket ID:** NEXUS-AUD-014  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/api.js  
**Endpoints utilizados:**
- Ninguno (transversal a todas las llamadas)  
**Cambios funcionales realizados:** Patrón único para errores HTTP: (1) getApiErrorMessage(body) devuelve el mensaje a mostrar a partir de body.error.message; (2) showApiError(body) muestra el error en modal (openNexusAlertModal) o alert como respaldo; (3) fetchApi envuelve el fetch en try/catch para que los fallos de red devuelvan { success: false, error: { message: "Error de conexión..." } } en lugar de rechazar la promesa, de modo que las vistas puedan comprobar body.success y mostrar mensaje al usuario. Se mantiene el flujo 401 (refresh y redirección a login). Las vistas que ya mostraban error (login, projects, incidents, releases, admin) siguen haciéndolo; las nuevas pueden usar showApiError(body) o getApiErrorMessage(body).
---

---
**Ticket ID:** NEXUS-AUD-015  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/documents.js  
**Endpoints utilizados:**
- GET /api/v1/documents/code/:code  
**Cambios funcionales realizados:** En el listado de Documentos se añadió el control "Buscar por código" (input + botón "Ir"). Al pulsar Ir o Enter se llama a GET /documents/code/:code; si hay documento se redirige a #/documents/:id; si no, se muestra mensaje "No se encontró ningún documento con ese código".
---

---
**Ticket ID:** NEXUS-AUD-016  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/documents.js  
**Endpoints utilizados:**
- GET /api/v1/documents/:documentId/versions/:versionId  
- PATCH /api/v1/documents/:documentId/versions/:versionId  
**Cambios funcionales realizados:** En la tabla de versiones del detalle de documento, cada fila tiene el botón "Ver contenido". Al pulsarlo se obtiene la versión con GET por versionId y se muestra el contenido en un modal. Si la versión es DRAFT y el usuario es MASTER, el contenido es editable y se puede guardar con PATCH (body: content).
---

---
**Ticket ID:** NEXUS-AUD-018  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/change-requests.js  
**Endpoints utilizados:**
- POST /api/v1/change-requests  
- PATCH /api/v1/change-requests/:id/submit  
- PATCH /api/v1/change-requests/:id/approve  
- PATCH /api/v1/change-requests/:id/reject  
- PATCH /api/v1/change-requests/:id/implement  
**Cambios funcionales realizados:** (1) Validación de entity_id como UUID antes del POST; si no es válido se muestra mensaje claro. (2) Tras crear con éxito se muestra el ID del CR y un enlace a la entidad: "Ver feature" (#/features/:entity_id) o "Ver release" (#/releases/:entity_id) según entity_type. (3) En errores de API al crear y en transiciones (submit/approve/reject/implement) se usa window.showApiError(body).
---

---
**Ticket ID:** NEXUS-AUD-019  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/dashboard.js  
- public/js/views/stories.js  
**Endpoints utilizados:**
- GET /api/v1/dashboard/summary (myAssignments)  
- GET /api/v1/stories/:id  
**Cambios funcionales realizados:** En "Mis asignaciones" del dashboard se añadió una columna con botón "Ver" cuando la asignación tiene id (story). El enlace apunta a #/stories?story=:id. La vista Stories, al cargar con ese query, abre automáticamente el modal de detalle de la story (GET /stories/:id) y luego normaliza el hash a #/stories.
---

---
**Ticket ID:** NEXUS-AUD-021  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- (Verificado: public/js/views/incidents.js ya tenía breadcrumb con proyecto y Volver a #/incidents?project=:id; el listado ya lee ?project= del hash.)  
**Endpoints utilizados:**
- GET /api/v1/incidents/:id  
- GET /api/v1/projects/:id  
**Cambios funcionales realizados:** Verificado: en detalle de incidente (#/incidents/:id) el breadcrumb incluye Panel, Proyectos, nombre del proyecto, Incidentes (enlace con ?project=) y título del incidente. El botón "Volver" lleva a #/incidents?project=:projectId. El listado de incidentes lee el parámetro project del hash y preselecciona el proyecto y carga los incidentes. Comportamiento ya implementado; ticket considerado cerrado.
---

---
**Ticket ID:** NEXUS-AUD-024  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/admin.js  
**Endpoints utilizados:**
- GET /api/v1/organizations/current  
- PATCH /api/v1/organizations/:id  
**Cambios funcionales realizados:** En #/admin/organization: (1) Campo nombre marcado como obligatorio (required, maxlength 255) y validación JS antes de enviar; mensaje claro si falta. (2) El PATCH envía todos los campos editables: name, plan, billing_email, next_billing_date. (3) En error de API se usa showApiError(r) y mensaje en el div de error.
---

---
**Ticket ID:** NEXUS-AUD-020  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/reports.js  
**Endpoints utilizados:**
- GET /api/v1/reports/users/:userId/activity  
**Cambios funcionales realizados:** En Reportes, sección "Actividad por usuario": selector "Ver por página" (10, 25, 50) que limita las filas mostradas en cliente. Se muestra "Mostrando N de M registros" cuando hay más datos. El resumen por proyecto y por sprint no exponen tablas con filas paginables en la UI actual; el límite se aplica a la tabla de actividad.
---

---
**Ticket ID:** NEXUS-AUD-017  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/components/pageSizeSelector.js (nuevo)  
- public/index.html  
- public/js/views/improvements.js  
- public/js/views/documents.js  
- public/js/views/features.js  
- public/js/views/incidents.js  
**Endpoints utilizados:**
- GET /api/v1/improvements (page, limit)  
- GET /api/v1/documents (page, limit)  
- GET /api/v1/projects/:projectId/features (page, limit)  
- GET /api/v1/projects/:projectId/incidents (page, limit)  
**Cambios funcionales realizados:** Componente reutilizable renderPageSizeSelector() en public/js/components/pageSizeSelector.js (opciones 10, 25, 50). Integrado en listados de Mejoras, Documentos, Features e Incidentes: el selector actualiza state.limit, reinicia página a 1 y recarga datos. Consistencia con Proyectos y Releases.
---

---
**Ticket ID:** NEXUS-AUD-025  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/components/permissions.js (nuevo)  
- public/index.html  
- public/js/layout.js  
- public/js/views/admin.js  
- public/js/views/releases.js  
- public/js/views/projects.js  
- public/js/views/documents.js  
- public/js/views/change-requests.js  
- public/js/views/reports.js  
**Endpoints utilizados:**
- Ninguno nuevo; uso de getMe()/rol para condicionar la UI.  
**Cambios funcionales realizados:** Centralización de permisos en nexusCanAccessMasterActions(user). Admin: acceso a #/admin denegado para no MASTER (mensaje "No tiene permisos..."). Layout: enlace "Organización" en menú de aplicaciones oculto para no MASTER (junto a Usuarios, Auditoría, Métricas). Vistas Releases, Projects, Documents, Change Requests y Reports usan el helper para ocultar acciones MASTER (hotfix, bulk-delete, editar, aprobar/archivar, etc.) cuando el usuario es EMPLOYEE.
---

---
**Ticket ID:** NEXUS-AUD-022  
**Fecha cierre:** 2026-03-03  
**Estado:** Cerrado (cubierto por NEXUS-AUD-017)  
**Archivos modificados:** Ninguno (verificación únicamente).  
**Endpoints utilizados:** Los mismos que NEXUS-AUD-017.  
**Cambios funcionales realizados:** Se verificó que el selector "Ver por página" del ticket NEXUS-AUD-017 está implementado en el módulo Improvements (imp-per-page, renderPageSizeSelector, onchange en bind). El ticket se cierra como cubierto por NEXUS-AUD-017.
---

---
**Ticket ID:** NEXUS-AUD-023  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/components/notifications.js (nuevo)
- public/index.html
- public/js/views/documents.js
- public/js/views/features.js
- public/js/views/stories.js
- public/js/views/improvements.js
- public/js/views/incidents.js
- public/js/views/change-requests.js
- public/js/views/releases.js
- public/js/views/admin.js
**Endpoints utilizados:** Ninguno nuevo; uso en puntos de éxito de operaciones CRUD existentes.  
**Cambios funcionales realizados:** Componente reutilizable showSuccessMessage(message) en public/js/components/notifications.js: toast de éxito que se oculta automáticamente (2,5 s). Integrado en Documents (crear doc, crear/aprobar/archivar versión, guardar contenido), Features (crear feature, cambiar estado), Stories (crear story, guardar criterios/título/prioridad/asignado, cambiar sprint/estado), Improvements (crear mejora, cambiar estado), Incidents (crear incidente, guardar, cambiar estado), Change Requests (crear CR, submit/approve/reject/implement), Releases (crear release, eliminar, bulk-delete, guardar descripción, hotfix, asignar feature), Admin Organización (PATCH guardar). Mensajes consistentes tipo "Guardado correctamente", "Creado correctamente", etc.
---

---
**Ticket ID:** NEXUS-AUD-026  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/stories.js
- public/js/views/features.js
- public/js/views/sprints.js
- public/js/views/incidents.js
- public/js/views/documents.js
**Endpoints utilizados:** GET /api/v1/features/:id (resolución de #/features/:id en vista Features).  
**Cambios funcionales realizados:** Enlaces cruzados entre módulos: (1) Story → Feature: en el modal de detalle de story se muestra la fila "Feature" con enlace a #/features?project=:projectId cuando la story tiene feature_id. (2) Sprint → Story: en la lista de stories del sprint, el título de cada story es enlace a #/stories?story=:id. (3) Vista Features: cuando la ruta es #/features/:id (UUID), se resuelve con GET /features/:id y se usa project_id para cargar el listado del proyecto, permitiendo enlaces desde Change Requests "Ver feature" y desde Documentos "Ver feature". (4) Incident → Story: en detalle de incidente se muestra "Story relacionada: Ver story" con enlace a #/stories?story=:id cuando inc.story_id existe. (5) Document → Feature/Story: en detalle de documento se muestran "Feature relacionada" y "Story relacionada" con enlaces cuando d.feature_id o d.story_id existen. Change Requests ya mostraba "Ver feature" / "Ver release" tras crear; las rutas #/features/:id y #/releases/:id funcionan correctamente.
---

---
**Ticket ID:** NEXUS-AUD-027  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/releases.js  
**Endpoints utilizados:** Ninguno nuevo.  
**Cambios funcionales realizados:** En el detalle de release (#/releases/:id), la lista de features asignadas enlaza a #/features/:id cuando el objeto feature tiene id; en caso contrario se mantiene el enlace #/features?project=:projectId. Navegación directa a la feature cuando la API lo permite.
---

---
**Ticket ID:** NEXUS-AUD-032  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/projects.js  
**Endpoints utilizados:** Ninguno nuevo.  
**Cambios funcionales realizados:** En el empty state del listado de proyectos se mantiene el botón "Crear proyecto" (id btn-create-project-2) para usuarios MASTER; se añade clase mt-3 y aria-label="Crear proyecto" para mayor visibilidad y accesibilidad. El botón activa el mismo flujo de creación (doNew) que el botón principal.
---

---
**Ticket ID:** NEXUS-AUD-029  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/views/settings.js  
**Endpoints utilizados:** Ninguno.  
**Cambios funcionales realizados:** En la vista #/settings (solo MASTER) se añadió la sección "Administración" con enlaces: "Gestionar organización" → #/admin/organization y "Gestionar usuarios" → #/admin/users. Acceso rápido a administración sin depender solo del menú de aplicaciones.
---

---
**Ticket ID:** NEXUS-AUD-028  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/index.html  
- public/js/layout.js  
**Endpoints utilizados:** Ninguno nuevo.  
**Cambios funcionales realizados:** Búsqueda global en topbar: se añadió id nexus-topbar-search-input al input y un dropdown (nexus-topbar-search-dropdown) con enlaces rápidos "Ir a": Proyectos, Releases, Documentos, Features. Al enfocar o escribir en el campo se muestra el dropdown; al hacer clic en un enlace se navega al hash correspondiente. Lógica en layout.js (initTopbarSearch). Sin nuevos endpoints.
---

---
**Ticket ID:** NEXUS-AUD-030  
**Fecha cierre:** 2026-03-03  
**Archivos modificados:**
- public/js/ux.js (renderTableActions: soporte view.ariaLabel)
- public/js/views/dashboard.js  
- public/js/views/stories.js  
- public/js/views/incidents.js  
- public/js/views/improvements.js  
- public/js/views/projects.js  
- public/js/views/releases.js  
- public/js/views/documents.js  
- public/js/views/sprints.js  
**Endpoints utilizados:** Ninguno.  
**Cambios funcionales realizados:** Mejoras de accesibilidad: (1) renderTableActions acepta opts.view.ariaLabel y lo aplica al enlace "Ver". (2) Enlaces "Ver" con contexto: dashboard (Ver story + título), stories (Ver story + título), incidents/improvements/projects/releases/documents con ariaLabel descriptivo. (3) Botones "Volver" en releases, sprints e incidents con aria-label. (4) Dashboard: "Ver sprints" y "Ver detalle del sprint" con aria-label. No se modificó lógica funcional.
---

---
**Ticket ID:** NEXUS-AUD-031  
**Fecha cierre:** 2026-03-03  
**Estado:** Verificado y documentado  
**Archivos modificados:**
- public/js/layout.js  
**Endpoints utilizados:** Ninguno.  
**Cambios funcionales realizados:** Se confirmó que el enlace "Reportes" en el sidebar (nav-reports) se muestra solo para rol MASTER (layout.js). Se añadió un comentario en código (NEXUS-AUD-031) documentando la decisión: si el PO decide que Reportes (resumen proyecto/sprint, actividad por usuario) sea visible para todos, cambiar la condición; la sección "Auditoría" sigue restringida a MASTER.
---

