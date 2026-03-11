# Plan de implementación — Auditoría funcional frontend 2026-03

**Origen:** docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-03.md (PO)  
**Objetivo:** Ordenar la ejecución de los 14 tickets derivados de la auditoría para que el desarrollo siga un orden claro, con dependencias y riesgos identificados.

---

# PARTE 1 — MAPA DE IMPACTO TÉCNICO

A partir del documento de auditoría se identifican módulos afectados, endpoints implicados, flujos incompletos y partes del frontend/backend que podrían verse involucradas.

---

## 1.1 Módulos afectados

| Módulo | Estado actual (auditoría) | Tickets que lo afectan | Impacto en frontend |
|--------|----------------------------|-------------------------|----------------------|
| **Sprints** | Listar, crear, detalle, cerrar; doc menciona /close vs backend /status. Sin asignar/quitar stories en detalle. | NEXUS-AUD-001, NEXUS-AUD-006 | `public/js/views/sprints.js`, docs ENDPOINTS |
| **Dashboard** | Usa summary/projects; puede haber datos dummy. | NEXUS-AUD-002 | `public/js/views/dashboard.js` |
| **Incidents** | Solo listar y crear; sin detalle ni PATCH status/incident. | NEXUS-AUD-003 | `public/js/views/incidents.js`, router, posible nueva ruta #/incidents/:id |
| **Organizations** | Sin vista; endpoints sin uso. | NEXUS-AUD-004 | Nueva vista o sección en admin, `public/js/views/admin.js`, router, index.html |
| **Improvements** | Sin ninguna pantalla. | NEXUS-AUD-005 | **Nuevo** `public/js/views/improvements.js`, router, index.html (menú) |
| **Stories** | Detalle y PATCH en parte; verificar assign vs sprint, estado. | NEXUS-AUD-007 | `public/js/views/stories.js`, router si #/stories/:id |
| **Features** | PATCH status no usado en UI. | NEXUS-AUD-008 | `public/js/views/features.js` |
| **Releases** | Sin PATCH status, POST features, POST hotfix, PATCH release. | NEXUS-AUD-009 | `public/js/views/releases.js` |
| **Documents** | Sin gestión de versiones. | NEXUS-AUD-010 | `public/js/views/documents.js` |
| **Change Requests** | Sin pantalla. | NEXUS-AUD-011 | **Nuevo** `public/js/views/change-requests.js`, router, index.html |
| **Reports / Admin** | Falta vista “Actividad por usuario”. | NEXUS-AUD-012 | `public/js/views/reports.js` o `admin.js` |
| **Layout / Admin** | GET /health sin uso. | NEXUS-AUD-013 | `public/js/layout.js` o `views/admin.js`, index.html (footer) |
| **API / vistas** | Manejo de errores 4xx/5xx no uniforme. | NEXUS-AUD-014 | `public/js/api.js`, múltiples `public/js/views/*.js` |

---

## 1.2 Endpoints implicados por ticket

| Ticket | Endpoints principales |
|--------|------------------------|
| NEXUS-AUD-001 | PATCH /sprints/:id/status |
| NEXUS-AUD-002 | GET /dashboard/summary, GET /projects, métricas según diseño |
| NEXUS-AUD-003 | GET /incidents/:id, PATCH /incidents/:id, PATCH /incidents/:id/status |
| NEXUS-AUD-004 | GET /organizations/current, GET /organizations/:id, PATCH /organizations/:id |
| NEXUS-AUD-005 | GET /improvements, POST /improvements, GET /improvements/:id, PATCH /improvements/:id/status |
| NEXUS-AUD-006 | GET /sprints/:id/stories, POST /sprints/:id/stories/:storyId, DELETE /sprints/:id/stories/:storyId |
| NEXUS-AUD-007 | GET /stories/:id, PATCH /stories/:id/status, PATCH /stories/:id/assign (y asignación a sprint según API) |
| NEXUS-AUD-008 | PATCH /features/:id/status |
| NEXUS-AUD-009 | PATCH /releases/:id/status, POST /releases/:id/features/:featureId, POST /releases/:id/hotfix, PATCH /releases/:id |
| NEXUS-AUD-010 | GET/POST /documents/:documentId/versions, GET/PATCH /documents/.../versions/:versionId, PATCH .../versions/:versionId/status |
| NEXUS-AUD-011 | GET /change-requests (si existe), POST, PATCH submit/approve/reject/implement |
| NEXUS-AUD-012 | GET /reports/users/:userId/activity, GET /users |
| NEXUS-AUD-013 | GET /health |
| NEXUS-AUD-014 | Transversal (todas las llamadas) |

---

## 1.3 Flujos de usuario incompletos (resumen auditoría)

- **Incidents:** No hay detalle ni edición ni cambio de estado.
- **Organizations:** No hay forma de ver/editar la organización.
- **Improvements:** Módulo inexistente en frontend.
- **Sprints:** No se puede asignar ni quitar stories desde el detalle.
- **Stories:** Cambio de estado y asignación de usuario (y alineación assign/sprint) deben estar visibles y funcionando.
- **Features:** No se puede cambiar estado desde la UI.
- **Releases:** No se puede cambiar estado, asignar feature, hotfix ni editar desde detalle.
- **Documents:** No hay gestión de versiones (crear, listar, aprobar/archivar).
- **Change Requests:** Sin pantalla; no se pueden crear ni ejecutar transiciones.

---

## 1.4 Partes de frontend y backend involucradas

| Área | Archivos / componentes típicos |
|------|---------------------------------|
| **Vistas (existentes)** | incidents.js, sprints.js, stories.js, features.js, releases.js, documents.js, dashboard.js, admin.js, reports.js |
| **Vistas (nuevas)** | improvements.js, change-requests.js (y posible detalle incidente en incidents.js o ruta dedicada) |
| **Router** | public/js/router.js (rutas #/improvements, #/improvements/:id, #/change-requests, #/incidents/:id, #/organization si aplica) |
| **Navegación / layout** | public/index.html (menú, enlaces), layout.js o equivalente para footer/health |
| **Capa API** | public/js/api.js (errores 4xx/5xx, posible patrón único de mensajes) |
| **Backend** | No se modifican endpoints ni arquitectura; solo se **usan** los ya existentes. Si algún contrato (assign vs sprint) difiere, se alinea la UI al contrato real. |
| **Documentación** | docs/ENDPOINTS_API_Y_USO_FRONTEND.md (actualizar tras cada ticket que toque endpoints) |

---

# PARTE 2 — PLAN DE EJECUCIÓN

---

## 2.1 Agrupación de tickets por módulo

| Grupo | Módulo | Tickets |
|-------|--------|---------|
| **A** | Sprints (documentación y alineación) | NEXUS-AUD-001 |
| **B** | Dashboard | NEXUS-AUD-002 |
| **C** | Incidents | NEXUS-AUD-003 |
| **D** | Organizations | NEXUS-AUD-004 |
| **E** | Improvements (módulo nuevo) | NEXUS-AUD-005 |
| **F** | Sprints (stories en detalle) | NEXUS-AUD-006 |
| **G** | Stories | NEXUS-AUD-007 |
| **H** | Features | NEXUS-AUD-008 |
| **I** | Releases | NEXUS-AUD-009 |
| **J** | Documents | NEXUS-AUD-010 |
| **K** | Change Requests (módulo nuevo) | NEXUS-AUD-011 |
| **L** | Reports / Admin (actividad usuario) | NEXUS-AUD-012 |
| **M** | Health (indicador API) | NEXUS-AUD-013 |
| **N** | Transversal (errores HTTP) | NEXUS-AUD-014 |

---

## 2.2 Orden lógico de implementación

**Criterio:** P1 primero, luego P2, luego P3. Dentro de cada prioridad, orden que reduzca bloqueos y rework (documentación y datos antes que flujos que dependan de ellos).

### Fase 1 — P1 (madurez / cobertura)

| Orden | Ticket | Justificación breve |
|-------|--------|----------------------|
| 1 | **NEXUS-AUD-001** | Alineación cierre de sprint y documentación; rápido y desbloquea certeza en sprints. |
| 2 | **NEXUS-AUD-002** | Dashboard sin datos dummy; afecta primera impresión y confianza en datos. |
| 3 | **NEXUS-AUD-003** | Vista detalle incidente + edición + estado; cierra flujo crítico de incidentes. |
| 4 | **NEXUS-AUD-004** | Organizations: vista o sección para ver/editar organización (multi-tenant). |
| 5 | **NEXUS-AUD-005** | Módulo Improvements completo (listar, crear, detalle, estado); módulo nuevo. |

### Fase 2 — P2 (flujos)

| Orden | Ticket | Justificación breve |
|-------|--------|----------------------|
| 6 | **NEXUS-AUD-006** | Sprints: asignar/quitar stories en detalle; depende de que sprints esté alineado (AUD-001). |
| 7 | **NEXUS-AUD-007** | Stories: detalle, estado, asignar usuario; alinear con API (assign/sprint). |
| 8 | **NEXUS-AUD-008** | Features: PATCH status en la UI. |
| 9 | **NEXUS-AUD-009** | Releases: estado, asignar feature, hotfix, editar en detalle. |
| 10 | **NEXUS-AUD-010** | Documents: sección Versiones (crear, listar, aprobar/archivar). |
| 11 | **NEXUS-AUD-011** | Change Requests: listar (si existe GET), crear, transiciones Submit/Approve/Reject/Implement. |

### Fase 3 — P3 (UX / consistencia)

| Orden | Ticket | Justificación breve |
|-------|--------|----------------------|
| 12 | **NEXUS-AUD-012** | Reportes: vista “Actividad por usuario”. |
| 13 | **NEXUS-AUD-013** | Indicador GET /health en Admin o footer. |
| 14 | **NEXUS-AUD-014** | Manejo uniforme de errores HTTP en api.js y vistas. |

---

## 2.3 Dependencias entre tickets

| Ticket | Depende de | Notas |
|--------|------------|-------|
| NEXUS-AUD-001 | — | Ninguna. |
| NEXUS-AUD-002 | — | Ninguna. |
| NEXUS-AUD-003 | — | Ninguna. |
| NEXUS-AUD-004 | — | Ninguna. |
| NEXUS-AUD-005 | — | Ninguna. |
| NEXUS-AUD-006 | NEXUS-AUD-001 (recomendado) | Mismo módulo; tener documentación y cierre de sprint alineados antes de añadir gestión de stories. |
| NEXUS-AUD-007 | — | Verificar contrato backend (assign vs sprint) antes o durante implementación. |
| NEXUS-AUD-008 | — | Ninguna. |
| NEXUS-AUD-009 | — | Ninguna. |
| NEXUS-AUD-010 | — | Ninguna. |
| NEXUS-AUD-011 | — | Comprobar si existe GET list en API. |
| NEXUS-AUD-012 | — | Ninguna. |
| NEXUS-AUD-013 | — | Ninguna. |
| NEXUS-AUD-014 | — | Puede aplicarse de forma incremental; recomendable después de tener varios flujos estables. |

---

## 2.4 Riesgos técnicos

| Riesgo | Mitigación |
|--------|------------|
| **Assign vs sprint (Stories)** | Auditoría indica posible desalineación PATCH /stories/:id/assign (usuario) vs asignación a sprint. Verificar contrato real en backend/OpenAPI antes de implementar NEXUS-AUD-007; adaptar UI al contrato existente. |
| **Change Requests: no hay GET list** | Si la API no expone GET para listar change requests, la UI se centrará en “Crear” y transiciones desde detalle o lista obtenida por otro medio; documentar en el ticket. |
| **Document versions: complejidad** | Varios endpoints (list, create, PATCH, status); implementar por sub-pasos (listar → crear → estado) para no bloquear. |
| **Errores 4xx/5xx (NEXUS-AUD-014)** | Transversal; definir un único patrón en api.js y aplicar por módulos para no romper comportamiento actual. |
| **Nuevos módulos (Improvements, Change Requests)** | Añadir rutas y menú; asegurar que router e index.html estén actualizados y que no se dupliquen nombres de rutas. |

---

## 2.5 Cierre tras cada ticket

- Actualizar **docs/ENDPOINTS_API_Y_USO_FRONTEND.md** si el ticket implica uso nuevo o cambio de uso de endpoints.
- Si se modifican checklists o tareas, registrar en **docs/project-logs/checklist-change-log.md**.
- Registrar la implementación en **docs/project-logs/TICKETS_IMPLEMENTADOS.md** (véase docs/process/PROTOCOLO_IMPLEMENTACION_TICKETS.md).
- QA valida según criterios de aceptación del ticket en el documento de auditoría.

---

## Notas técnicas del desarrollador

- **NEXUS-AUD-002 (Dashboard):** En el plan se indica “métricas según diseño”. Los endpoints concretos son GET /dashboard/summary y GET /projects; si el summary no devuelve todas las métricas mostradas en la UI, confirmar con el diseño o el PO si se usan además otros endpoints (p. ej. listados de sprints, incidents, releases) para alimentar tarjetas. Evitar datos hardcodeados.
- **NEXUS-AUD-007 (Stories):** La auditoría menciona posible desalineación entre PATCH /stories/:id/assign (usuario) y asignación a sprint. Antes de implementar, verificar en el backend (rutas, OpenAPI o código) el contrato real: si existe un endpoint distinto para “asignar story a sprint” (p. ej. POST en módulo sprints), usarlo; si assign incluye o no sprint_id, adaptar la UI a ese contrato.
- **NEXUS-AUD-011 (Change Requests):** Si la API no expone GET para listar change requests, la lista de “archivos permitidos” del ticket puede incluir solo la vista de creación y detalle/transiciones; documentar en el registro del ticket que no hay listado o que se obtiene por otro medio.
- **NEXUS-AUD-014 (Errores HTTP):** Es transversal (api.js + múltiples vistas). Definir la lista de “archivos permitidos” por fases (primero api.js y un conjunto acotado de vistas) para no abrir alcance a todo el proyecto en un solo ticket; o desglosar en sub-tickets por módulo si el equipo lo prefiere.

---

## 2.6 Primer ticket preparado para desarrollo

El primer ticket a implementar según el plan es **NEXUS-AUD-001**. A continuación se resume la información necesaria para iniciar la implementación (sin implementar todavía).

| Campo | Valor |
|-------|--------|
| **Ticket ID** | NEXUS-AUD-001 |
| **Título** | Verificar y documentar alineación cierre de sprint (PATCH /sprints/:id/status) |
| **Módulo** | Sprints (documentación y alineación) |
| **Prioridad** | P1 |
| **Endpoints** | PATCH /api/v1/sprints/:id/status (body según API, ej. `{ "status": "CLOSED" }`) |
| **Archivos permitidos a modificar** | |
| | • public/js/views/sprints.js |
| | • docs/ENDPOINTS_API_Y_USO_FRONTEND.md |

**Objetivo (resumen):** Garantizar que la acción “Cerrar sprint” usa solo PATCH /sprints/:id/status (no /close), que la documentación refleja la ruta real y que el flujo funciona correctamente.

**Criterios de aceptación (resumen):** No hay llamadas a /sprints/:id/close; cerrar sprint desde la UI funciona; la documentación describe la ruta y uso reales.

**Origen completo del ticket:** docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-03.md, sección NEXUS-AUD-001.

---

*Este plan es de preparación y orden de ejecución. No incluye implementación de código ni cambios de arquitectura. Las implementaciones se harán según docs/process/PROTOCOLO_IMPLEMENTACION_TICKETS.md y los criterios de aceptación de docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-03.md.*
