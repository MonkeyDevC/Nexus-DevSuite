# Auditoría funcional del frontend — NEXUS DevSuite

**Rol:** PO MASTER  
**Fecha:** 2026-03  
**Referencia:** docs/ENDPOINTS_API_Y_USO_FRONTEND.md, docs/CHECKLIST_ETAPAS_PROYECTO.md, docs/plans/LISTA_ENDPOINTS_A_CONECTAR_ETAPA_20.md  
**Objetivo:** Identificar brechas entre la interfaz y la API, funcionalidades incompletas y oportunidades para aumentar la madurez del producto. Sin propuestas de código ni cambios de backend.

---

# SECCIÓN 1 — DIAGNÓSTICO GENERAL

## 1.1 Estimación de madurez del frontend

| Dimensión | Estimación | Comentario |
|-----------|------------|------------|
| **Madurez funcional global** | **~30–35%** | Muchos módulos permiten listar y crear pero no editar, cambiar estado o completar ciclos de vida. |
| **Cobertura de endpoints** | **~45–55%** | Aproximadamente 40–45 de ~78 rutas (método + ruta) tienen uso en la UI; el resto existen solo en API. |
| **Completitud de flujos** | **Baja en 6 de 10 módulos** | Solo Users y Projects tienen flujo completo (listar, crear, ver detalle, editar, estado/archivar). El resto tienen al menos una operación faltante. |
| **Consistencia frontend/API** | **Riesgo medio** | Al menos una inconsistencia conocida (sprints: /close vs /status); posibles rutas custom en stories (/sprint). |

**Conclusión:** El frontend está en fase de “esqueleto operativo”: navegación, listados y creación están presentes en la mayoría de los módulos, pero falta **conectar la mitad de los endpoints** y **completar flujos** (detalle, edición, cambio de estado, asignaciones). La prioridad actual (Etapas 18–22) es adecuada para subir madurez sin tocar backend.

---

## 1.2 Estimación de cobertura de endpoints

- **Total de endpoints considerados (por método y ruta):** ~78 (según docs/ENDPOINTS_API_Y_USO_FRONTEND.md sección 1: Health, Auth, Users, Organizations, Projects y subrecursos, Features, Stories, Releases, Change Requests, Sprints, Incidents, Improvements, Documents, Dashboard, Reports, System).
- **Con interfaz en frontend (uso confirmado o muy probable):** ~40–45.
- **Cobertura aproximada:** **45–55%**.
- **Sin uso en frontend (prioritarios para Etapa 20):** Organizations (3), Change Requests (5), Improvements (4), Incidents GET/PATCH (3), Stories GET/PATCH status/assign (3), Sprints PATCH status + stories (4), Releases PATCH status/features/hotfix/PATCH (4), Document versions (5+), Reports users/activity (1), Health (1), Auth admin/test (1). Total **~35 rutas** sin UI o con uso parcial.

---

## 1.3 Principales brechas detectadas

1. **Módulos sin pantalla:** Change Requests, Improvements, Organizations. La API está lista; la UI no existe.
2. **Flujos sin detalle ni edición:** Incidents (solo listar y crear por proyecto); no hay vista de detalle ni PATCH status/PATCH incident.
3. **Flujos sin gestión de estado o asignación:** Stories (no uso explícito de GET /stories/:id, PATCH status, PATCH assign en flujo estándar); Releases (no PATCH status, no asignar feature, no hotfix); Features (no PATCH /features/:id/status en la UI revisada).
4. **Sprints:** Cierre de sprint documentado como /close en el doc mientras el backend expone /status; en código se ha visto PATCH /sprints/:id/status con body `{ status: "CLOSED" }` — verificar alineación y completar asignar/quitar stories y listar stories del sprint.
5. **Documents:** Sin gestión de versiones (crear, listar, aprobar/archivar); solo listado, detalle y creación de documento.
6. **Dashboard:** Depende de GET /dashboard/summary; si ese endpoint no existe o devuelve poco, las tarjetas pueden usar datos agregados por el cliente o quedar con datos incompletos. Eliminar cualquier dato dummy restante.
7. **Reportes:** GET /reports/users/:userId/activity usado en dashboard (actividad reciente); falta, si se desea, una vista dedicada “Actividad por usuario” en Reportes o Admin.
8. **Consistencia:** Verificar que todas las llamadas usen rutas y cuerpos alineados con el backend (openapi/contrato); manejo uniforme de errores 4xx/5xx.

---

# SECCIÓN 2 — HALLAZGOS POR MÓDULO

## 2.1 Auth

- **Estado actual:** Login, logout, refresh, GET /auth/me y GET /auth/roles tienen uso. Guard de rutas y obtención de usuario actual operativos.
- **Problemas:** GET /auth/admin/test sin uso en UI (baja prioridad). Ninguno bloqueante.
- **Impacto:** Bajo. Módulo suficiente para uso actual.

## 2.2 Users (Admin)

- **Estado actual:** Listar, crear, editar (PUT), eliminar (DELETE), cambiar contraseña (PATCH), subir foto (POST photo). Flujo completo.
- **Problemas:** Ninguno crítico.
- **Impacto:** Nulo. Referencia de “flujo completo”.

## 2.3 Projects

- **Estado actual:** Listar, crear, detalle, archivar (PATCH archive), editar (PATCH /projects/:id en modal), eliminar (DELETE), bulk-delete. Selector “ver por página”.
- **Problemas:** Ninguno crítico. Posible uso de PATCH /projects/:id para edición; confirmar que no queden literales o datos dummy en listado.
- **Impacto:** Bajo. Módulo maduro.

## 2.4 Features

- **Estado actual:** Listar por proyecto, crear feature, listar stories de la feature, crear story. Filtros por estado y búsqueda.
- **Problemas:** PATCH /features/:id/status (cambiar estado de la feature) no aparece usado en la UI revisada; no hay pantalla de “cambiar estado” de una feature desde la lista/detalle.
- **Impacto:** Medio. El usuario no puede mover una feature por estados (DRAFT → APPROVED → IN_PROGRESS → DONE) desde la interfaz.

## 2.5 Stories

- **Estado actual:** Listar por feature/proyecto, crear story. En stories.js hay uso de GET /stories/:id, PATCH /stories/:id (edición), y PATCH /stories/:id/sprint (asignación a sprint). Uso de GET /users y sprints para selectores.
- **Problemas:** La API documenta PATCH /stories/:id/assign (asignar usuario); el frontend usa PATCH /stories/:id/sprint. Verificar si el backend expone /sprint o si debe usarse otro recurso. Si solo existe /assign para “usuario”, falta UI para asignar “usuario” a la story. Flujo de “cambiar estado” de la story (PATCH /stories/:id/status) debe estar accesible y visible.
- **Impacto:** Medio. Riesgo de desalineación /assign vs /sprint; completar estado y asignación de usuario si aplica.

## 2.6 Sprints

- **Estado actual:** Listar por proyecto, crear sprint, detalle de sprint. En código se usa PATCH /sprints/:id/status con body { status: "CLOSED" } para cerrar. Existe PATCH /sprints/:id (edición) y DELETE /sprints/:id.
- **Problemas:** La documentación menciona /close; en implementación ya se usa /status — mantener documento al día. GET /sprints/:id/stories, POST/DELETE stories en sprint no están conectados en la UI: no se puede asignar ni quitar stories desde el detalle del sprint.
- **Impacto:** Alto. Sin gestión de stories en el sprint, el flujo de planificación de sprint queda incompleto.

## 2.7 Releases

- **Estado actual:** Listar, crear, detalle, eliminar (DELETE), bulk-delete.
- **Problemas:** PATCH /releases/:id/status, POST /releases/:id/features/:featureId, POST /releases/:id/hotfix, PATCH /releases/:id (edición) no tienen uso en la UI. No se puede cambiar estado del release, asignar features ni crear hotfix desde la interfaz.
- **Impacto:** Alto. Releases quedan como “contenedor estático” sin ciclo de vida ni gestión de features/hotfix.

## 2.8 Incidents

- **Estado actual:** Listar por proyecto (con filtros y búsqueda), crear incidente. Tabla con acciones pero sin vista de detalle real.
- **Problemas:** GET /incidents/:id, PATCH /incidents/:id/status, PATCH /incidents/:id no tienen uso. No hay pantalla de detalle de incidente ni edición ni cambio de estado.
- **Impacto:** Alto. Los incidentes no pueden seguirse ni cerrarse desde la UI.

## 2.9 Documents

- **Estado actual:** Listar, crear, detalle de documento.
- **Problemas:** GET por code, POST/GET/PATCH de document_versions y PATCH status de versión no tienen uso. No hay gestión de versiones (crear, listar, aprobar/archivar).
- **Impacto:** Alto para entornos que requieran control documental (ISO). Medio si solo se necesita documento único.

## 2.10 Change Requests

- **Estado actual:** Sin ninguna pantalla.
- **Problemas:** Todos los endpoints (POST, PATCH submit/approve/reject/implement) sin UI. Posiblemente sin GET de listado en API; si existe, conectar.
- **Impacto:** Crítico para gobernanza tipo ISO. Módulo inexistente en frontend.

## 2.11 Improvements

- **Estado actual:** Sin ninguna pantalla.
- **Problemas:** POST, GET list, GET :id, PATCH status sin UI.
- **Impacto:** Alto. Las mejoras no son accesibles para el usuario.

## 2.12 Organizations

- **Estado actual:** Sin vista ni sección que use los endpoints.
- **Problemas:** GET current, GET :id, PATCH :id sin uso. No hay forma de ver o editar la organización (tenant).
- **Impacto:** Alto en escenario multi-tenant; medio si hay una sola organización por entorno.

## 2.13 Reports

- **Estado actual:** Resumen por proyecto, resumen por sprint, auditoría (Admin). Dashboard usa GET /reports/users/:userId/activity para actividad reciente.
- **Problemas:** Falta una vista dedicada “Actividad por usuario” en Reportes o Admin (selector de usuario + visualización de actividad) si se desea explotar ese dato fuera del dashboard.
- **Impacto:** Bajo. Cobertura ya aceptable; mejora opcional.

## 2.14 Dashboard

- **Estado actual:** Usa GET /dashboard/summary y GET /projects; opcionalmente GET /reports/users/:userId/activity. Tarjetas y secciones definidas.
- **Problemas:** Si /dashboard/summary no existe o no devuelve toda la información, puede haber agregación en cliente o datos incompletos. Eliminar cualquier dato dummy restante (Etapa 19).
- **Impacto:** Medio. Afecta la primera impresión y la confianza en los datos.

## 2.15 System / Health

- **Estado actual:** GET /system/metrics usado en Admin. GET /health sin uso.
- **Problemas:** Ninguno crítico. Health puede exponerse en footer o Admin como indicador “API: OK”.
- **Impacto:** Bajo.

---

# SECCIÓN 3 — TICKETS RECOMENDADOS

Los siguientes tickets están priorizados (P1 = madurez funcional / cobertura, P2 = flujos, P3 = UX/consistencia) y son realizables sin cambios de backend ni nueva arquitectura.

---

## NEXUS-AUD-001

**TÍTULO:** Verificar y documentar alineación cierre de sprint (PATCH /sprints/:id/status)

**PRIORIDAD:** P1

**CONTEXTO**  
La documentación indica que el frontend usa `/close` mientras el backend expone `/status`. En el código se ha visto PATCH /sprints/:id/status con body { status: "CLOSED" }. Es necesario confirmar el comportamiento real y actualizar la documentación para evitar confusión y fallos en otros entornos.

**OBJETIVO**  
Garantizar que la acción “Cerrar sprint” usa exclusivamente PATCH /api/v1/sprints/:id/status con el cuerpo que la API espera, y actualizar docs/ENDPOINTS_API_Y_USO_FRONTEND.md para reflejar la ruta real.

**ENDPOINTS RELACIONADOS**  
- PATCH /api/v1/sprints/:id/status

**TAREAS TÉCNICAS**  
1. Revisar en public/js/views/sprints.js la llamada usada al cerrar sprint.  
2. Confirmar en backend/openapi el cuerpo esperado (ej. { status: "CLOSED" }).  
3. Si existiera alguna referencia a /close, eliminarla y usar solo /status.  
4. Actualizar ENDPOINTS_API_Y_USO_FRONTEND.md: en la fila de “cerrar sprint” indicar PATCH /sprints/:id/status (y quitar la nota sobre /close si ya no aplica).  
5. Probar el flujo cerrar sprint y verificar que el estado se actualiza.

**CRITERIOS DE ACEPTACIÓN**  
- No hay llamadas a /sprints/:id/close en el frontend.  
- Cerrar sprint desde la UI funciona y el estado se refleja correctamente.  
- La documentación describe la ruta y uso reales.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- public/js/views/sprints.js  
- docs/ENDPOINTS_API_Y_USO_FRONTEND.md  

---

## NEXUS-AUD-002

**TÍTULO:** Dashboard — Eliminar datos dummy y alimentar tarjetas solo con API

**PRIORIDAD:** P1

**CONTEXTO**  
Etapa 19 exige dashboard con datos reales. Puede haber literales, placeholders o agregación insuficiente. El dashboard debe apoyarse en GET /dashboard/summary y/o en endpoints concretos (projects, sprints, incidents, releases) según diseño.

**OBJETIVO**  
Que todas las tarjetas y bloques del dashboard obtengan datos exclusivamente de la API (dashboard/summary y/o endpoints por recurso), con estados de carga y empty state, sin datos hardcodeados.

**ENDPOINTS RELACIONADOS**  
- GET /api/v1/dashboard/summary  
- GET /api/v1/projects  
- Los que definan métricas (sprints, incidents, releases) según diseño

**TAREAS TÉCNICAS**  
1. Revisar public/js/views/dashboard.js e identificar cada bloque que muestra números o listas.  
2. Asignar a cada bloque el endpoint o combinación que debe alimentarlo.  
3. Eliminar literales y placeholders; implementar o completar llamadas a la API.  
4. Añadir loading y empty state coherentes.  
5. Comprobar que no queden datos dummy en el archivo.

**CRITERIOS DE ACEPTACIÓN**  
- No hay datos numéricos o listas hardcodeadas para simular métricas.  
- Las tarjetas reflejan datos de la API.  
- Loading y empty state funcionan correctamente.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- public/js/views/dashboard.js  

---

## NEXUS-AUD-003

**TÍTULO:** Vista detalle de incidente con edición y cambio de estado

**PRIORIDAD:** P1

**CONTEXTO**  
Incidents solo permite listar y crear por proyecto. No hay vista de detalle ni uso de GET /incidents/:id, PATCH status ni PATCH incident. Los usuarios no pueden abrir un incidente, editarlo ni cambiar su estado.

**OBJETIVO**  
Añadir vista de detalle de incidente (ruta única, ej. #/incidents/:id o desde proyecto) que cargue GET /incidents/:id, muestre los datos y permita editar (PATCH /incidents/:id) y cambiar estado (PATCH /incidents/:id/status). Enlace desde la lista de incidentes.

**ENDPOINTS RELACIONADOS**  
- GET /api/v1/incidents/:id  
- PATCH /api/v1/incidents/:id  
- PATCH /api/v1/incidents/:id/status  

**TAREAS TÉCNICAS**  
1. Definir ruta (hash) para detalle de incidente y registrarla en el router.  
2. Crear vista que cargue GET /incidents/:id y muestre título, descripción, severidad, estado, reportado por, asignado a, fechas.  
3. Añadir formulario/controles para editar (PATCH /incidents/:id) y para cambiar estado (PATCH /incidents/:id/status).  
4. Enlazar desde la lista de incidentes (columna Acciones) a esta vista.  
5. Manejar errores de API y actualizar la vista tras guardar.

**CRITERIOS DE ACEPTACIÓN**  
- Desde la lista de incidentes se puede abrir el detalle.  
- El detalle muestra datos reales del GET.  
- Se puede editar el incidente y cambiar estado; los cambios se persisten y se reflejan en la UI.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- public/js/views/incidents.js (o nuevo archivo para detalle)  
- public/js/router.js  
- public/index.html (enlaces si aplica)  

---

## NEXUS-AUD-004

**TÍTULO:** Módulo Organizations — Vista o sección para ver y editar organización

**PRIORIDAD:** P1

**CONTEXTO**  
Los endpoints de Organizations (GET current, GET :id, PATCH :id) no tienen uso en el frontend. En escenarios multi-tenant o configuración, el usuario MASTER debe poder ver y editar la organización.

**OBJETIVO**  
Exponer en la UI la organización actual: vista o sección (ej. #/organization o dentro de Admin) que cargue GET /organizations/current (o por id), muestre los datos y permita editar con PATCH /organizations/:id (MASTER).

**ENDPOINTS RELACIONADOS**  
- GET /api/v1/organizations/current  
- GET /api/v1/organizations/:id  
- PATCH /api/v1/organizations/:id  

**TAREAS TÉCNICAS**  
1. Decidir ubicación (ruta #/organization o sección en #/admin).  
2. Obtener organización con GET /organizations/current (o por id).  
3. Mostrar datos en formulario; edición y guardado con PATCH (solo MASTER).  
4. Añadir enlace en menú/sidebar para acceder.  
5. Registrar ruta en router si es nueva.

**CRITERIOS DE ACEPTACIÓN**  
- Existe pantalla o sección que muestra la organización actual.  
- MASTER puede editar y guardar; los cambios se persisten vía API.  
- Los tres endpoints de organizations tienen uso documentado en ENDPOINTS_API_Y_USO_FRONTEND.md.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- public/js/views/admin.js o nuevo archivo de vista  
- public/js/router.js  
- public/index.html  

---

## NEXUS-AUD-005

**TÍTULO:** Módulo Improvements — Listar, crear, detalle y cambiar estado

**PRIORIDAD:** P1

**CONTEXTO**  
Improvements no tiene ninguna pantalla. Los cuatro endpoints (POST, GET list, GET :id, PATCH status) están sin uso en el frontend.

**OBJETIVO**  
Implementar módulo de Mejoras: listado (GET /improvements), crear (POST), detalle (GET /improvements/:id), cambiar estado (PATCH /improvements/:id/status). Incluir enlace en menú y rutas en router.

**ENDPOINTS RELACIONADOS**  
- GET /api/v1/improvements  
- POST /api/v1/improvements  
- GET /api/v1/improvements/:id  
- PATCH /api/v1/improvements/:id/status  

**TAREAS TÉCNICAS**  
1. Añadir ruta #/improvements y vista de listado con GET /improvements.  
2. Formulario “Nueva mejora” con POST /improvements (campos según API).  
3. Vista detalle #/improvements/:id con GET /improvements/:id.  
4. Selector o botones para cambiar estado (PATCH status).  
5. Enlace “Mejoras” en sidebar y registro en router.  
6. Empty state cuando no hay mejoras.

**CRITERIOS DE ACEPTACIÓN**  
- Se puede listar, crear, abrir detalle y cambiar estado desde la UI.  
- Los cuatro endpoints de improvements tienen uso en frontend.  
- docs/ENDPOINTS_API_Y_USO_FRONTEND.md actualizado.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- Nuevo public/js/views/improvements.js (o equivalente)  
- public/js/router.js  
- public/index.html  

---

## NEXUS-AUD-006

**TÍTULO:** Sprints — Asignar y quitar stories en detalle; listar stories del sprint

**PRIORIDAD:** P2

**CONTEXTO**  
En el detalle de sprint no están conectados GET /sprints/:id/stories, POST /sprints/:id/stories/:storyId ni DELETE /sprints/:id/stories/:storyId. No se puede gestionar la composición del sprint desde la UI.

**OBJETIVO**  
En la vista de detalle de sprint, mostrar la lista de stories del sprint (GET /sprints/:id/stories), permitir asignar una story (POST) y quitar una story (DELETE), con actualización de la lista tras cada acción.

**ENDPOINTS RELACIONADOS**  
- GET /api/v1/sprints/:id/stories  
- POST /api/v1/sprints/:id/stories/:storyId  
- DELETE /api/v1/sprints/:id/stories/:storyId  

**TAREAS TÉCNICAS**  
1. En la vista detalle de sprint, añadir sección “Stories del sprint”.  
2. Cargar lista con GET /sprints/:id/stories.  
3. Control para asignar story al sprint (selector de story + POST).  
4. Por cada story listada, acción “Quitar del sprint” (DELETE).  
5. Refrescar lista tras asignar o quitar.

**CRITERIOS DE ACEPTACIÓN**  
- En detalle de sprint se ve la lista de stories asignadas.  
- Se puede asignar y quitar stories desde la UI.  
- GET, POST y DELETE de stories en sprint tienen uso en frontend.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- public/js/views/sprints.js  

---

## NEXUS-AUD-007

**TÍTULO:** Stories — Vista detalle, cambiar estado y asignar usuario (alinear con API)

**PRIORIDAD:** P2

**CONTEXTO**  
La API documenta GET /stories/:id, PATCH /stories/:id/status y PATCH /stories/:id/assign. El frontend ya usa GET /stories/:id y PATCH en parte; hay uso de PATCH /stories/:id/sprint. Verificar contrato real del backend (assign = usuario vs sprint) y asegurar que el usuario pueda cambiar estado y asignar usuario desde la UI.

**OBJETIVO**  
Garantizar que existe vista o panel de detalle de story con datos de GET /stories/:id, cambio de estado (PATCH /stories/:id/status) y asignación de usuario (PATCH /stories/:id/assign si el backend lo expone). Si el backend solo tiene “assign” para usuario, la asignación a sprint debe usar el endpoint correcto (ej. PATCH /stories/:id con sprint_id o el que defina la API).

**ENDPOINTS RELACIONADOS**  
- GET /api/v1/stories/:id  
- PATCH /api/v1/stories/:id/status  
- PATCH /api/v1/stories/:id/assign  
- (y el que corresponda para asignar story a sprint si es distinto)

**TAREAS TÉCNICAS**  
1. Verificar en backend/openapi el contrato de assign (usuario vs sprint).  
2. Asegurar que la vista de detalle/edición de story muestra datos de GET /stories/:id.  
3. Implementar o completar selector de estado y llamada a PATCH /stories/:id/status.  
4. Implementar o completar asignación de usuario con PATCH /stories/:id/assign (y asignación a sprint con el endpoint correcto).  
5. Enlazar desde listado de stories al detalle.

**CRITERIOS DE ACEPTACIÓN**  
- Se puede abrir detalle de story y ver datos actualizados.  
- Se puede cambiar estado y asignar usuario (y sprint si aplica) desde la UI; cambios persisten.  
- Rutas y cuerpos alineados con la API documentada.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- public/js/views/stories.js  
- public/js/router.js (si se añade ruta explícita #/stories/:id)  

---

## NEXUS-AUD-008

**TÍTULO:** Features — Conectar PATCH /features/:id/status en la UI

**PRIORIDAD:** P2

**CONTEXTO**  
PATCH /features/:id/status existe en la API pero no se ha detectado su uso en la vista de features. El usuario no puede cambiar el estado de una feature (DRAFT → APPROVED → IN_PROGRESS → DONE, etc.) desde la interfaz.

**OBJETIVO**  
Permitir cambiar el estado de una feature desde la lista o desde una vista de detalle/modal: selector de estado y llamada a PATCH /api/v1/features/:id/status con el valor elegido.

**ENDPOINTS RELACIONADOS**  
- PATCH /api/v1/features/:id/status  

**TAREAS TÉCNICAS**  
1. En la lista de features o en detalle/modal de feature, añadir control para “Estado” (dropdown o botones).  
2. Al elegir nuevo estado, llamar a PATCH /features/:id/status con body según API (ej. { status: "IN_PROGRESS" }).  
3. Actualizar la fila o vista tras respuesta exitosa.  
4. Mostrar mensaje de error si la API devuelve 4xx.

**CRITERIOS DE ACEPTACIÓN**  
- Desde la UI se puede cambiar el estado de una feature.  
- PATCH /features/:id/status tiene uso documentado en ENDPOINTS_API_Y_USO_FRONTEND.md.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- public/js/views/features.js  

---

## NEXUS-AUD-009

**TÍTULO:** Releases — En detalle: cambiar estado, asignar feature, hotfix y editar

**PRIORIDAD:** P2

**CONTEXTO**  
En detalle de release no están conectados PATCH status, POST features, POST hotfix ni PATCH release. No se puede gestionar el ciclo de vida ni el contenido del release desde la UI.

**OBJETIVO**  
En la vista de detalle de release, añadir: cambio de estado (PATCH /releases/:id/status), asignar feature (POST /releases/:id/features/:featureId), crear hotfix (POST /releases/:id/hotfix), editar release (PATCH /releases/:id). Controles visibles según rol (MASTER donde aplique).

**ENDPOINTS RELACIONADOS**  
- PATCH /api/v1/releases/:id/status  
- POST /api/v1/releases/:id/features/:featureId  
- POST /api/v1/releases/:id/hotfix  
- PATCH /api/v1/releases/:id  

**TAREAS TÉCNICAS**  
1. En detalle de release, añadir selector o botones para estado (PATCH status).  
2. Sección para features del release: listar si la API lo devuelve en GET /releases/:id; control para asignar feature (selector + POST).  
3. Botón o formulario “Crear hotfix” (POST hotfix) con campos según API.  
4. Formulario de edición (descripción, etc.) con PATCH /releases/:id.  
5. Manejo de errores y actualización de la vista tras cada acción.

**CRITERIOS DE ACEPTACIÓN**  
- En detalle de release se puede cambiar estado, asignar feature, crear hotfix y editar datos.  
- Los cuatro tipos de llamada tienen uso en frontend.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- public/js/views/releases.js  

---

## NEXUS-AUD-010

**TÍTULO:** Documents — En detalle: sección Versiones (crear, listar, aprobar/archivar)

**PRIORIDAD:** P2

**CONTEXTO**  
La UI de documentos solo lista, crea y muestra detalle de documento. No hay gestión de versiones: crear versión, listar versiones, ni cambiar estado de versión (aprobar/archivar).

**OBJETIVO**  
En la vista de detalle de documento, añadir sección “Versiones”: listar (GET /documents/:documentId/versions), crear versión (POST), y por cada versión opción de actualizar (PATCH) y cambiar estado (PATCH status) según API.

**ENDPOINTS RELACIONADOS**  
- GET /api/v1/documents/:documentId/versions  
- POST /api/v1/documents/:documentId/versions  
- GET /api/v1/documents/:documentId/versions/:versionId  
- PATCH /api/v1/documents/:documentId/versions/:versionId  
- PATCH /api/v1/documents/:documentId/versions/:versionId/status  

**TAREAS TÉCNICAS**  
1. En detalle de documento, añadir bloque “Versiones”.  
2. Cargar lista con GET /documents/:documentId/versions.  
3. Botón “Nueva versión” y formulario POST (version_number, change_reason, content, etc. según API).  
4. Por cada versión: acciones Aprobar/Archivar vía PATCH .../status.  
5. Si la API lo permite, edición de versión con PATCH .../versions/:versionId.

**CRITERIOS DE ACEPTACIÓN**  
- En detalle de documento se listan las versiones y se puede crear una nueva.  
- Se puede cambiar estado de versión (aprobar/archivar) desde la UI.  
- Endpoints de document versions tienen uso en frontend.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- public/js/views/documents.js  

---

## NEXUS-AUD-011

**TÍTULO:** Módulo Change Requests — Listar (si existe GET), crear y transiciones Submit/Approve/Reject/Implement

**PRIORIDAD:** P2

**CONTEXTO**  
Change Requests no tiene ninguna pantalla. La API expone POST y PATCH submit, approve, reject, implement. Si existe GET de listado en la API, debe conectarse; si no, al menos crear y transiciones desde una vista.

**OBJETIVO**  
Implementar módulo Change Requests: pantalla que permita listar (si la API expone GET), crear (POST), y para cada CR acciones Submit (PATCH submit), Approve/Reject/Implement (PATCH approve/reject/implement, MASTER). Enlace en menú y rutas en router.

**ENDPOINTS RELACIONADOS**  
- GET /api/v1/change-requests (si existe)  
- POST /api/v1/change-requests  
- PATCH /api/v1/change-requests/:id/submit  
- PATCH /api/v1/change-requests/:id/approve  
- PATCH /api/v1/change-requests/:id/reject  
- PATCH /api/v1/change-requests/:id/implement  

**TAREAS TÉCNICAS**  
1. Comprobar si existe GET para listar change requests en la API.  
2. Si existe: vista #/change-requests con listado; si no: vista centrada en “Crear” y posible listado por otra vía o mensaje “No hay listado”.  
3. Formulario “Nuevo Change Request” (POST) con campos según API.  
4. En cada CR (listado o detalle): botones Enviar (PATCH submit), Aprobar/Rechazar (PATCH approve/reject, MASTER), Marcar implementado (PATCH implement, MASTER).  
5. Añadir enlace “Change Requests” en menú y registrar ruta.

**CRITERIOS DE ACEPTACIÓN**  
- Se puede crear un change request y ejecutar las transiciones Submit, Approve/Reject, Implement desde la UI.  
- Acciones MASTER restringidas a rol MASTER.  
- Endpoints de change-requests tienen uso documentado.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- Nuevo public/js/views/change-requests.js (o equivalente)  
- public/js/router.js  
- public/index.html  

---

## NEXUS-AUD-012

**TÍTULO:** Reportes — Vista “Actividad por usuario” (GET /reports/users/:userId/activity)

**PRIORIDAD:** P3

**CONTEXTO**  
GET /reports/users/:userId/activity se usa en el dashboard para actividad reciente. No existe una vista dedicada en Reportes o Admin donde elegir un usuario y ver su actividad completa.

**OBJETIVO**  
Añadir en Reportes o Admin una sección “Actividad por usuario”: selector de usuario (GET /users) y visualización de los datos de GET /reports/users/:userId/activity (tabla o lista). Solo lectura.

**ENDPOINTS RELACIONADOS**  
- GET /api/v1/reports/users/:userId/activity  
- GET /api/v1/users (para selector)  

**TAREAS TÉCNICAS**  
1. Añadir en #/reports o #/admin sección o pestaña “Actividad por usuario”.  
2. Selector de usuario (dropdown o búsqueda con GET /users).  
3. Al elegir usuario, llamar a GET /reports/users/:userId/activity y mostrar el resultado.  
4. Empty state cuando no hay actividad o no se ha elegido usuario.

**CRITERIOS DE ACEPTACIÓN**  
- Se puede elegir un usuario y ver su actividad en una vista dedicada.  
- GET /reports/users/:userId/activity queda documentado como usado en frontend (ya en dashboard; esta vista añade uso explícito en Reportes/Admin).

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- public/js/views/reports.js o public/js/views/admin.js  

---

## NEXUS-AUD-013

**TÍTULO:** Indicador de estado de API (GET /health) en Admin o footer

**PRIORIDAD:** P3

**CONTEXTO**  
GET /health no tiene uso en la interfaz. Sirve para mostrar al usuario que el servicio API está disponible.

**OBJETIVO**  
Mostrar en la UI el estado del servicio: en footer global o en panel Admin, indicador que llame a GET /api/v1/health y muestre “API: OK” o “API: Error” según respuesta. No bloquear la app si /health falla.

**ENDPOINTS RELACIONADOS**  
- GET /api/v1/health  

**TAREAS TÉCNICAS**  
1. Decidir ubicación (footer o Admin).  
2. Llamar a GET /health al cargar (y opcionalmente en intervalo).  
3. Mostrar texto o ícono según respuesta (OK en verde, Error en rojo si falla).  
4. Manejar fallo sin romper la aplicación.

**CRITERIOS DE ACEPTACIÓN**  
- Existe un indicador visible que refleja el resultado de GET /health.  
- GET /health tiene uso documentado en ENDPOINTS_API_Y_USO_FRONTEND.md.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- public/js/layout.js o public/js/views/admin.js  
- public/index.html  

---

## NEXUS-AUD-014

**TÍTULO:** Manejo uniforme de errores HTTP (4xx/5xx) en llamadas a la API

**PRIORIDAD:** P3

**CONTEXTO**  
La auditoría debe asegurar que las respuestas de error de la API se muestran de forma consistente al usuario (mensaje claro, no solo consola). No se ha verificado de forma sistemática que todas las vistas manejen 400, 401, 403, 404, 422, 500.

**OBJETIVO**  
Revisar la capa de llamadas a la API (api.js y vistas) y garantizar que ante 4xx/5xx se muestra un mensaje al usuario (toast, alert en formulario o bloque de error) de forma coherente, sin depender solo de console o alert genérico.

**ENDPOINTS RELACIONADOS**  
- No aplica (es transversal a todas las llamadas).

**TAREAS TÉCNICAS**  
1. Revisar public/js/api.js: en respuestas no OK, ¿se rechaza con mensaje o se deja que cada vista lo maneje?  
2. Definir patrón único (ej. mostrar mensaje del body.error o texto por código).  
3. Revisar al menos: login, projects, incidents, releases, admin y aplicar el patrón donde falte.  
4. Asegurar que 401 dispara refresh o redirección a login según flujo actual.

**CRITERIOS DE ACEPTACIÓN**  
- Ante 4xx/5xx el usuario recibe un mensaje visible (no solo consola).  
- El comportamiento es coherente entre módulos revisados.

**ARCHIVOS POSIBLEMENTE AFECTADOS**  
- public/js/api.js  
- public/js/views/*.js (donde se hagan fetch y no se muestre error)  

---

## Resumen de tickets recomendados

| Prioridad | Cantidad | IDs |
|-----------|----------|-----|
| P1 | 5 | NEXUS-AUD-001 a 005 (alineación sprint, dashboard real, incidente detalle, organizations, improvements) |
| P2 | 6 | NEXUS-AUD-006 a 011 (sprints stories, stories estado/assign, features status, releases avanzado, documents versiones, change requests) |
| P3 | 3 | NEXUS-AUD-012 a 014 (reportes actividad usuario, health, manejo errores HTTP) |

**Total:** 14 tickets. Orden sugerido: P1 primero, luego P2, luego P3. Tras cada implementación, actualizar docs/ENDPOINTS_API_Y_USO_FRONTEND.md y, si aplica, docs/project-logs/checklist-change-log.md.

---

*Auditoría realizada por PO MASTER. No incluye implementación de código ni cambios en backend. Los tickets deben ser validados por SYSTEM ARCHITECT cuando tengan impacto arquitectónico y por QA ENGINEER tras su implementación.*
