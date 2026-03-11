# Lote de tickets técnicos — Etapas 18–22 (PO MASTER)

**Fecha de generación:** 2026-03  
**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Semana 2), docs/ENDPOINTS_API_Y_USO_FRONTEND.md, docs/plans/LISTA_ENDPOINTS_A_CONECTAR_ETAPA_20.md  
**Objetivo:** Aumentar madurez funcional del frontend conectando endpoints existentes y completando flujos.  
**Ejecutor:** MASTER DEVELOPER. **Validador:** QA ENGINEER.

Los tickets están ordenados por prioridad (P1 → P2 → P3). Cada uno debe implementarse en una sesión, sin refactorizaciones grandes y sin modificar backend.

---

## NEXUS-T18-001

**TÍTULO:** Alinear cierre de sprint con API (PATCH /sprints/:id/status)

**PRIORIDAD:** P1

**CONTEXTO**  
El frontend llama a `PATCH /sprints/:id/close`; el backend expone `PATCH /sprints/:id/status`. La acción "Cerrar sprint" puede fallar o estar desalineada. docs/ENDPOINTS_API_Y_USO_FRONTEND.md y LISTA_ENDPOINTS_A_CONECTAR_ETAPA_20.md lo indican como corrección necesaria (Etapa 21 o 20).

**OBJETIVO**  
Que el botón/acción de cerrar sprint en la UI use `PATCH /api/v1/sprints/:id/status` con el cuerpo que la API espera (ej. `{ "status": "CLOSED" }` o el valor definido en contrato), de modo que el cierre de sprint funcione correctamente.

**ENDPOINTS RELACIONADOS**  
- `PATCH /api/v1/sprints/:id/status`

**TAREAS TÉCNICAS**  
1. Localizar en el frontend dónde se invoca el cierre de sprint (vista sprints o detalle de sprint).  
2. Comprobar en backend/openapi el cuerpo esperado por `PATCH /sprints/:id/status`.  
3. Sustituir la llamada a `/close` por `PATCH /sprints/:id/status` con el body correcto.  
4. Probar el flujo: abrir detalle de sprint → cerrar → verificar que el estado se actualiza en lista/detalle.

**CRITERIOS DE ACEPTACIÓN**  
- No existe llamada a `/sprints/:id/close` en el código del frontend.  
- Al cerrar un sprint desde la UI, se llama a `PATCH /sprints/:id/status` y el sprint pasa a estado cerrado (visible en lista o detalle).  
- Manejo de error si la API devuelve 4xx (mensaje visible al usuario).

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- `public/js/views/sprints.js`  
- `public/js/api.js` (si hubiera wrapper de rutas)

---

## NEXUS-T18-002

**TÍTULO:** Dashboard — Alimentar tarjetas de métricas con datos reales de la API

**PRIORIDAD:** P1

**CONTEXTO**  
Etapa 19: el dashboard debe mostrar datos reales (proyectos activos, sprints activos, incidentes abiertos, releases activas). Actualmente puede haber literales o datos no conectados a la API. La meta es eliminar datos dummy y que todas las tarjetas/secciones provengan de endpoints existentes.

**OBJETIVO**  
Que las tarjetas o bloques del dashboard (#/dashboard) que muestran métricas (proyectos, sprints, incidentes, releases) obtengan sus datos mediante llamadas a la API (GET /projects, GET /projects/:id/sprints, GET /projects/:id/incidents, GET /releases, etc.), con estados de carga y empty state cuando no haya datos.

**ENDPOINTS RELACIONADOS**  
- `GET /api/v1/projects` (filtrar por status si aplica)  
- `GET /api/v1/projects/:projectId/sprints`  
- `GET /api/v1/projects/:projectId/incidents`  
- `GET /api/v1/releases`  
- Los necesarios para "Recent Projects" y otras secciones ya definidas en el diseño del dashboard

**TAREAS TÉCNICAS**  
1. Revisar `public/js/views/dashboard.js` e identificar cada bloque que muestra números o listas.  
2. Para cada bloque, asignar el endpoint (o combinación) que debe alimentarlo.  
3. Implementar las llamadas a la API y reemplazar cualquier dato hardcodeado o placeholder.  
4. Añadir estado de carga (skeleton o spinner) mientras se obtienen los datos.  
5. Mostrar empty state o "0" cuando la respuesta sea vacía o no haya datos.

**CRITERIOS DE ACEPTACIÓN**  
- No quedan literales numéricos o arrays de ejemplo que simulen métricas.  
- Proyectos activos, sprints activos, incidentes abiertos y releases activas (o equivalentes) reflejan datos de la API.  
- Se muestran loading y empty state de forma coherente.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- `public/js/views/dashboard.js`

---

## NEXUS-T18-003

**TÍTULO:** Vista detalle de incidente con edición y cambio de estado

**PRIORIDAD:** P1

**CONTEXTO**  
La UI lista y crea incidentes por proyecto, pero no hay vista de detalle ni edición. Los endpoints GET /incidents/:id, PATCH /incidents/:id/status y PATCH /incidents/:id no tienen uso en el frontend (ENDPOINTS_API_Y_USO_FRONTEND.md, LISTA_ENDPOINTS_A_CONECTAR_ETAPA_20).

**OBJETIVO**  
Añadir vista de detalle de incidente (ej. #/incidents/:id o desde el detalle de proyecto) que permita ver el incidente, editar título/descripción/severidad (PATCH /incidents/:id) y cambiar estado (PATCH /incidents/:id/status). Enlace desde la listado de incidentes del proyecto.

**ENDPOINTS RELACIONADOS**  
- `GET /api/v1/incidents/:id`  
- `PATCH /api/v1/incidents/:id`  
- `PATCH /api/v1/incidents/:id/status`

**TAREAS TÉCNICAS**  
1. Definir ruta (hash) para detalle de incidente (ej. #/incidents/:id o #/projects/:projectId/incidents/:id).  
2. Crear vista que cargue el incidente con GET /incidents/:id.  
3. Mostrar campos: título, descripción, severidad, estado, reportado por, asignado a, fechas.  
4. Añadir formulario o controles para editar (PATCH /incidents/:id) y selector/botones para cambiar estado (PATCH /incidents/:id/status).  
5. Enlazar desde la lista de incidentes (por proyecto) a esta vista.  
6. Registrar la ruta en el router si hace falta.

**CRITERIOS DE ACEPTACIÓN**  
- Desde la lista de incidentes de un proyecto se puede abrir el detalle del incidente.  
- El detalle muestra datos reales del GET /incidents/:id.  
- Se puede editar el incidente y cambiar su estado; los cambios se persisten vía API y se reflejan en la UI.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- `public/js/views/incidents.js` (o nuevo `public/js/views/incident-detail.js` si se separa)  
- `public/js/router.js` (si se añade ruta nueva)  
- `public/index.html` (menú/sidebar si se añade enlace a Incidentes)

---

## NEXUS-T18-004

**TÍTULO:** Módulo Organizations — Vista o sección para ver y editar organización

**PRIORIDAD:** P1

**CONTEXTO**  
Los endpoints GET /organizations/current, GET /organizations/:id y PATCH /organizations/:id no tienen uso en el frontend. LISTA_ENDPOINTS_A_CONECTAR_ETAPA_20 prioriza esta conexión (vista #/organization o sección en Admin).

**OBJETIVO**  
Exponer en la UI la organización actual: vista o sección donde el usuario (MASTER) pueda ver datos de la organización (nombre, slug, etc.) y editarlos con PATCH /organizations/:id. Acceso desde menú (ej. #/organization o dentro de Admin).

**ENDPOINTS RELACIONADOS**  
- `GET /api/v1/organizations/current`  
- `GET /api/v1/organizations/:id`  
- `PATCH /api/v1/organizations/:id`

**TAREAS TÉCNICAS**  
1. Decidir ubicación: nueva ruta #/organization o sección dentro de #/admin.  
2. Obtener organización actual con GET /organizations/current (o por id si se conoce).  
3. Mostrar datos en formulario de solo lectura o editable según rol (PATCH solo MASTER).  
4. Implementar guardado con PATCH /organizations/:id y feedback de éxito/error.  
5. Añadir enlace en sidebar o menú Admin para acceder a la vista.

**CRITERIOS DE ACEPTACIÓN**  
- Existe una pantalla o sección que muestra los datos de la organización actual.  
- MASTER puede editar y guardar cambios; los datos se actualizan vía API.  
- GET /organizations/current y PATCH /organizations/:id tienen uso documentado en ENDPOINTS_API_Y_USO_FRONTEND.md.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- `public/js/views/admin.js` (si se integra en Admin) o nuevo archivo de vista organization  
- `public/js/router.js`  
- `public/index.html` (enlace en menú)

---

## NEXUS-T18-005

**TÍTULO:** Módulo Improvements — Listar, crear, detalle y cambiar estado

**PRIORIDAD:** P1

**CONTEXTO**  
Los endpoints de Improvements (POST, GET list, GET :id, PATCH status) no tienen pantalla. LISTA_ENDPOINTS_A_CONECTAR_ETAPA_20 los incluye como prioridad 3.

**OBJETIVO**  
Implementar módulo de Mejoras: lista de mejoras (GET /improvements), formulario de creación (POST /improvements), vista detalle (GET /improvements/:id) y cambio de estado (PATCH /improvements/:id/status). Enlace desde menú o dashboard.

**ENDPOINTS RELACIONADOS**  
- `GET /api/v1/improvements`  
- `POST /api/v1/improvements`  
- `GET /api/v1/improvements/:id`  
- `PATCH /api/v1/improvements/:id/status`

**TAREAS TÉCNICAS**  
1. Añadir ruta #/improvements y vista listado (GET /improvements).  
2. Formulario "Nueva mejora" que llame a POST /improvements (campos según API: title, description, project_id, incident_id si aplica).  
3. Vista detalle #/improvements/:id con GET /improvements/:id.  
4. Selector o botones para cambiar estado (PATCH /improvements/:id/status) con los valores que acepte la API.  
5. Enlace "Mejoras" en sidebar o menú.  
6. Registrar rutas en router.

**CRITERIOS DE ACEPTACIÓN**  
- Se puede listar mejoras, crear una nueva, abrir detalle y cambiar estado desde la UI.  
- Los cuatro endpoints de improvements tienen uso en frontend.  
- Empty state cuando no hay mejoras.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- Nuevo `public/js/views/improvements.js` (o equivalente)  
- `public/js/router.js`  
- `public/index.html` (ítem de menú)

---

## NEXUS-T18-006

**TÍTULO:** Sprints — Asignar y quitar stories en detalle de sprint; listar stories del sprint

**PRIORIDAD:** P2

**CONTEXTO**  
En el detalle de sprint no está conectado: PATCH /sprints/:id/status (ya cubierto en NEXUS-T18-001), POST /sprints/:id/stories/:storyId, DELETE /sprints/:id/stories/:storyId, GET /sprints/:id/stories. LISTA_ENDPOINTS_A_CONECTAR_ETAPA_20 prioridad 5.

**OBJETIVO**  
En la vista de detalle de sprint, mostrar la lista de stories del sprint (GET /sprints/:id/stories), permitir asignar una story al sprint (POST) y quitar una story del sprint (DELETE). UI clara para añadir/quitar sin salir de la vista.

**ENDPOINTS RELACIONADOS**  
- `GET /api/v1/sprints/:id/stories`  
- `POST /api/v1/sprints/:id/stories/:storyId`  
- `DELETE /api/v1/sprints/:id/stories/:storyId`

**TAREAS TÉCNICAS**  
1. En la vista detalle de sprint, añadir sección "Stories del sprint".  
2. Cargar lista con GET /sprints/:id/stories y mostrarla (tabla o lista).  
3. Añadir control para "Asignar story" (selector de story del proyecto/feature y botón o POST al elegir).  
4. Por cada story listada, botón/acción "Quitar del sprint" que llame a DELETE /sprints/:id/stories/:storyId.  
5. Actualizar la lista tras asignar o quitar (recargar o actualizar estado local).

**CRITERIOS DE ACEPTACIÓN**  
- En detalle de sprint se ve la lista de stories asignadas.  
- Se puede asignar una story al sprint y quitar una story del sprint desde la UI.  
- GET, POST y DELETE de stories en sprint tienen uso en frontend.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- `public/js/views/sprints.js`

---

## NEXUS-T18-007

**TÍTULO:** Stories — Vista detalle, cambiar estado y asignar usuario

**PRIORIDAD:** P2

**CONTEXTO**  
GET /stories/:id, PATCH /stories/:id/status y PATCH /stories/:id/assign no tienen uso en las vistas revisadas. La UI lista y crea stories desde Features pero no permite ver detalle, cambiar estado ni asignar. LISTA_ENDPOINTS_A_CONECTAR_ETAPA_20 prioridad 6.

**OBJETIVO**  
Permitir abrir detalle de una story (GET /stories/:id), cambiar su estado (PATCH /stories/:id/status) y asignar usuario (PATCH /stories/:id/assign) desde la UI, ya sea en listado de stories o en vista detalle.

**ENDPOINTS RELACIONADOS**  
- `GET /api/v1/stories/:id`  
- `PATCH /api/v1/stories/:id/status`  
- `PATCH /api/v1/stories/:id/assign`

**TAREAS TÉCNICAS**  
1. Añadir ruta de detalle de story (ej. #/stories/:id o desde features con #/features?project=...&story=...).  
2. Vista que cargue GET /stories/:id y muestre título, descripción, estado, prioridad, asignado a, feature, etc.  
3. Selector de estado que llame a PATCH /stories/:id/status con el valor elegido.  
4. Selector de usuario (GET /users si hace falta) y acción "Asignar" que llame a PATCH /stories/:id/assign.  
5. Enlazar desde listado de stories (en features o stories) a la vista detalle.

**CRITERIOS DE ACEPTACIÓN**  
- Se puede abrir el detalle de una story y ver sus datos.  
- Se puede cambiar el estado y asignar usuario; los cambios se persisten vía API.  
- Los tres endpoints de stories (GET, PATCH status, PATCH assign) tienen uso en frontend.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- `public/js/views/stories.js`  
- `public/js/router.js` (si se añade ruta #/stories/:id)

---

## NEXUS-T18-008

**TÍTULO:** Releases — En detalle: cambiar estado, asignar feature, hotfix y editar release

**PRIORIDAD:** P2

**CONTEXTO**  
La UI lista, crea y muestra detalle de release, pero PATCH status, POST features, POST hotfix y PATCH release no están conectados. LISTA_ENDPOINTS_A_CONECTAR_ETAPA_20 prioridad 7.

**OBJETIVO**  
En la vista de detalle de release, añadir: cambio de estado (PATCH /releases/:id/status), asignar feature al release (POST /releases/:id/features/:featureId), crear hotfix (POST /releases/:id/hotfix) y editar release (PATCH /releases/:id). Controles accesibles según rol (MASTER donde aplique).

**ENDPOINTS RELACIONADOS**  
- `PATCH /api/v1/releases/:id/status`  
- `POST /api/v1/releases/:id/features/:featureId`  
- `POST /api/v1/releases/:id/hotfix`  
- `PATCH /api/v1/releases/:id`

**TAREAS TÉCNICAS**  
1. En detalle de release, añadir selector o botones para cambiar estado (PATCH /releases/:id/status).  
2. Sección "Features del release": listar las ya asignadas (si la API las devuelve en GET /releases/:id) y control para asignar una feature (selector + POST /releases/:id/features/:featureId).  
3. Botón o formulario "Crear hotfix" que llame a POST /releases/:id/hotfix (campos según API).  
4. Formulario de edición (descripción, etc.) que llame a PATCH /releases/:id.  
5. Manejo de errores y actualización de la vista tras cada acción.

**CRITERIOS DE ACEPTACIÓN**  
- En detalle de release se puede cambiar estado, asignar feature, crear hotfix y editar datos del release.  
- PATCH status, POST features, POST hotfix y PATCH release tienen uso en frontend.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- `public/js/views/releases.js`

---

## NEXUS-T18-009

**TÍTULO:** Documents — En detalle: sección Versiones (crear, listar, aprobar/archivar)

**PRIORIDAD:** P2

**CONTEXTO**  
La UI lista documentos y muestra detalle, pero no gestiona versiones. Los endpoints POST/GET/PATCH de document_versions y PATCH status de versión no tienen uso. LISTA_ENDPOINTS_A_CONECTAR_ETAPA_20 prioridad 8.

**OBJETIVO**  
En la vista de detalle de documento (#/documents/:id), añadir sección "Versiones": listar versiones (GET /documents/:documentId/versions), crear versión (POST), y por cada versión opción de actualizar (PATCH) y cambiar estado (PATCH status: aprobar/archivar según API).

**ENDPOINTS RELACIONADOS**  
- `GET /api/v1/documents/:documentId/versions`  
- `POST /api/v1/documents/:documentId/versions`  
- `GET /api/v1/documents/:documentId/versions/:versionId`  
- `PATCH /api/v1/documents/:documentId/versions/:versionId`  
- `PATCH /api/v1/documents/:documentId/versions/:versionId/status`

**TAREAS TÉCNICAS**  
1. En la vista detalle de documento, añadir bloque "Versiones".  
2. Cargar lista con GET /documents/:documentId/versions y mostrarla.  
3. Botón "Nueva versión" y formulario que llame a POST /documents/:documentId/versions (campos según API: version_number, change_reason, content, etc.).  
4. Por cada versión: enlace a detalle si aplica, y acciones Aprobar/Archivar según PATCH .../status.  
5. Si la API lo permite, edición de versión con PATCH .../versions/:versionId.

**CRITERIOS DE ACEPTACIÓN**  
- En detalle de documento se listan las versiones y se puede crear una nueva.  
- Se puede cambiar estado de versión (aprobar/archivar) desde la UI.  
- Los endpoints de document versions tienen uso en frontend.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- `public/js/views/documents.js`

---

## NEXUS-T18-010

**TÍTULO:** Módulo Change Requests — Listar, crear, Submit, Approve/Reject/Implement (MASTER)

**PRIORIDAD:** P2

**CONTEXTO**  
Change Requests no tienen ninguna pantalla. Endpoints: POST, PATCH submit, approve, reject, implement. LISTA_ENDPOINTS_A_CONECTAR_ETAPA_20 prioridad 2. Requiere listado (si la API expone GET de change-requests; si no, al menos crear y transiciones desde una vista).

**OBJETIVO**  
Implementar módulo de Change Requests: pantalla que permita listar (si existe GET), crear (POST), y para cada CR acciones Submit (PATCH submit), Approve/Reject/Implement (PATCH approve/reject/implement, solo MASTER). Rutas y permisos según API.

**ENDPOINTS RELACIONADOS**  
- `POST /api/v1/change-requests`  
- `PATCH /api/v1/change-requests/:id/submit`  
- `PATCH /api/v1/change-requests/:id/approve`  
- `PATCH /api/v1/change-requests/:id/reject`  
- `PATCH /api/v1/change-requests/:id/implement`  
- GET de listado si la API lo expone (verificar en documentación o openapi)

**TAREAS TÉCNICAS**  
1. Verificar si existe GET para listar change requests; si sí, crear vista #/change-requests con listado.  
2. Formulario "Nuevo Change Request" (POST) con campos según API (code, title, description, type, impact_level, entity_type, entity_id, etc.).  
3. En listado o detalle: botón "Enviar" → PATCH submit; "Aprobar"/"Rechazar" → PATCH approve/reject (solo MASTER); "Marcar implementado" → PATCH implement (solo MASTER).  
4. Añadir enlace "Change Requests" en menú (visible según rol si aplica).  
5. Registrar ruta en router.

**CRITERIOS DE ACEPTACIÓN**  
- Se puede crear un change request y ejecutar las transiciones Submit, Approve/Reject, Implement desde la UI.  
- Acciones MASTER solo visibles o ejecutables para rol MASTER.  
- Endpoints de change-requests tienen uso en frontend.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- Nuevo `public/js/views/change-requests.js` (o equivalente)  
- `public/js/router.js`  
- `public/index.html` (menú)

---

## NEXUS-T18-011

**TÍTULO:** Reportes — Actividad por usuario (GET /reports/users/:userId/activity)

**PRIORIDAD:** P3

**CONTEXTO**  
El endpoint GET /reports/users/:userId/activity puede usarse para dashboard o reportes. LISTA_ENDPOINTS_A_CONECTAR_ETAPA_20 prioridad 9: "Reportes o Admin: selector usuario → mostrar actividad del usuario".

**OBJETIVO**  
Exponer en la UI la actividad por usuario: en Reportes o Admin, selector de usuario y visualización de los datos devueltos por GET /reports/users/:userId/activity (tabla o lista de actividad). Solo lectura.

**ENDPOINTS RELACIONADOS**  
- `GET /api/v1/reports/users/:userId/activity`  
- `GET /api/v1/users` (para selector de usuario si hace falta)

**TAREAS TÉCNICAS**  
1. Añadir en #/reports o #/admin una sección/pestaña "Actividad por usuario".  
2. Selector (dropdown o búsqueda) de usuario (datos de GET /users).  
3. Al elegir usuario, llamar a GET /reports/users/:userId/activity y mostrar el resultado (estructura según respuesta de la API).  
4. Empty state cuando no hay actividad o no se ha elegido usuario.

**CRITERIOS DE ACEPTACIÓN**  
- Se puede elegir un usuario y ver su actividad.  
- GET /reports/users/:userId/activity tiene uso en frontend documentado.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- `public/js/views/reports.js` o `public/js/views/admin.js`

---

## NEXUS-T18-012

**TÍTULO:** Indicador de estado de API (GET /health) en Admin o footer

**PRIORIDAD:** P3

**CONTEXTO**  
GET /health no tiene uso en la interfaz. LISTA_ENDPOINTS_A_CONECTAR_ETAPA_20 prioridad 10 (opcional): "Admin o footer API: OK".

**OBJETIVO**  
Mostrar en la UI el estado del servicio API: en footer de la aplicación o en panel Admin, indicador que llame a GET /api/v1/health y muestre "API: OK" o "API: Error" según respuesta. Opcionalmente con actualización periódica o al cargar.

**ENDPOINTS RELACIONADOS**  
- `GET /api/v1/health`

**TAREAS TÉCNICAS**  
1. Decidir ubicación (footer global o sección en Admin).  
2. Llamar a GET /health al cargar la vista (y opcionalmente en intervalo).  
3. Mostrar texto o ícono según respuesta (ej. "API: OK" en verde, "API: Error" en rojo si falla o no responde).  
4. No bloquear la aplicación si /health falla; solo mostrar estado.

**CRITERIOS DE ACEPTACIÓN**  
- Existe un indicador visible que refleja el resultado de GET /health.  
- GET /health tiene uso en frontend documentado.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- `public/js/views/dashboard.js` (footer) o `public/js/views/admin.js` o `public/js/layout.js`  
- `public/index.html` (contenedor del indicador si es en footer)

---

## Resumen del lote

| Prioridad | Cantidad | Tickets |
|-----------|----------|---------|
| P1        | 5        | NEXUS-T18-001 a 005 (sprint alignment, dashboard real, incidente detalle, organizations, improvements) |
| P2        | 5        | NEXUS-T18-006 a 010 (sprints stories, stories status/assign, releases avanzado, documents versiones, change requests) |
| P3        | 2        | NEXUS-T18-011, 012 (reportes actividad usuario, health indicator) |

**Total:** 12 tickets. Orden recomendado de ejecución: 001 → 002 → … → 012, o por prioridad P1 primero, luego P2, luego P3. Tras cada ticket, actualizar docs/ENDPOINTS_API_Y_USO_FRONTEND.md marcando los endpoints conectados.

---

*Documento generado por PO MASTER. No sustituye la validación del SYSTEM ARCHITECT cuando un ticket tenga impacto arquitectónico. QA ENGINEER valida cada implementación según criterios de aceptación del ticket.*
