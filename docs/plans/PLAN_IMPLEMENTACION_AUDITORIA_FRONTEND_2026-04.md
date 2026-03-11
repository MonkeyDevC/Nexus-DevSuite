# Plan de implementación — Auditoría funcional frontend 2026-04

**Origen:** docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-04.md (PO)  
**Objetivo:** Ordenar la ejecución de los 12 tickets (NEXUS-AUD-015 a 026) derivados de la auditoría de abril 2026 para el siguiente sprint de desarrollo, con fases por prioridad, dependencias y riesgos identificados.

---

# PARTE 1 — MAPA DE IMPACTO

## 1.1 Módulos afectados

| Módulo | Tickets | Impacto en frontend |
|--------|---------|----------------------|
| **Documents** | NEXUS-AUD-015, NEXUS-AUD-016 | documents.js: búsqueda por código, ver/editar contenido de versión |
| **Improvements** | NEXUS-AUD-017, NEXUS-AUD-022 | improvements.js: selector “Ver por página” (022 puede fusionarse con 017 si se hace todo en un ticket) |
| **Documents, Features, Incidents** | NEXUS-AUD-017 | documents.js, features.js, incidents.js: selector “Ver por página” |
| **Change Requests** | NEXUS-AUD-018 | change-requests.js: validación UUID, enlaces, showApiError |
| **Dashboard** | NEXUS-AUD-019 | dashboard.js, posiblemente stories.js |
| **Reports** | NEXUS-AUD-020 | reports.js: paginación/límite en tablas |
| **Incidents** | NEXUS-AUD-021 | incidents.js, router.js (query en hash si aplica) |
| **Transversal (formularios)** | NEXUS-AUD-023 | projects, features, stories, documents, improvements, releases, incidents, admin |
| **Organizations (Admin)** | NEXUS-AUD-024 | admin.js |
| **Releases, Documents, CR, Admin, Projects** | NEXUS-AUD-025 | releases.js, documents.js, change-requests.js, admin.js, projects.js |
| **Releases, Sprints, Features, Stories** | NEXUS-AUD-026 | releases.js, sprints.js, features.js, stories.js |

---

## 1.2 Tabla de tickets

| Ticket | Título | Módulo | Prioridad |
|--------|--------|--------|-----------|
| NEXUS-AUD-015 | Documents — Búsqueda por código y apertura a detalle | Documents | P1 |
| NEXUS-AUD-016 | Documents — Ver y editar contenido de una versión | Documents | P1 |
| NEXUS-AUD-017 | Consistencia — Selector “Ver por página” en listados | Improvements, Documents, Features, Incidents | P2 |
| NEXUS-AUD-018 | Change Requests — Validación UUID y enlace al ID creado | Change Requests | P2 |
| NEXUS-AUD-019 | Dashboard — Enlace desde “Mis asignaciones” a detalle de story | Dashboard | P2 |
| NEXUS-AUD-020 | Reports — Paginación o límite en tablas de resumen | Reports | P2 |
| NEXUS-AUD-021 | Incidents — Breadcrumb y “Volver” con contexto de proyecto | Incidents | P2 |
| NEXUS-AUD-022 | Improvements — Selector “Ver por página” en listado | Improvements | P3 |
| NEXUS-AUD-023 | Mensajes de éxito tras crear/actualizar en formularios | Transversal | P3 |
| NEXUS-AUD-024 | Admin Organización — Validación de campos y PATCH completo | Organizations | P3 |
| NEXUS-AUD-025 | Ocultar o deshabilitar acciones MASTER para rol EMPLOYEE | Varios | P2 |
| NEXUS-AUD-026 | Enlaces cruzados entre módulos | Releases, Sprints, Features, Stories | P3 |

**Nota:** NEXUS-AUD-022 queda como ticket propio por si se implementa “Ver por página” solo en Improvements en un primer paso; si se implementa NEXUS-AUD-017 en todos los listados (incluido Improvements), 022 puede cerrarse como duplicado o fusionado con 017.

---

## 1.3 Endpoints utilizados por ticket

| Ticket | Endpoints |
|--------|-----------|
| NEXUS-AUD-015 | GET /api/v1/documents/code/:code |
| NEXUS-AUD-016 | GET /api/v1/documents/:documentId/versions/:versionId, PATCH /api/v1/documents/:documentId/versions/:versionId |
| NEXUS-AUD-017 | GET /improvements, GET /documents, GET /projects/:id/features, GET /projects/:id/incidents (todos con page, limit) |
| NEXUS-AUD-018 | POST /change-requests, PATCH /change-requests/:id/submit, approve, reject, implement |
| NEXUS-AUD-019 | GET /dashboard/summary, GET /stories/:id (si se abre modal) |
| NEXUS-AUD-020 | GET /reports/projects/:projectId/summary, GET /reports/sprints/:sprintId/summary |
| NEXUS-AUD-021 | GET /incidents/:id, GET /projects/:id |
| NEXUS-AUD-022 | GET /improvements (page, limit) |
| NEXUS-AUD-023 | Ninguno nuevo (transversal) |
| NEXUS-AUD-024 | GET /organizations/current, GET /organizations/:id, PATCH /organizations/:id |
| NEXUS-AUD-025 | Ninguno nuevo (condicional por rol) |
| NEXUS-AUD-026 | GET /releases/:id, GET /projects/:id/features, GET /features/:id, GET /features/:featureId/stories, GET /sprints/:id/stories, GET /stories/:id |

---

## 1.4 Archivos frontend implicados

| Ticket | Archivos |
|--------|----------|
| NEXUS-AUD-015 | public/js/views/documents.js |
| NEXUS-AUD-016 | public/js/views/documents.js |
| NEXUS-AUD-017 | public/js/views/improvements.js, documents.js, features.js, incidents.js |
| NEXUS-AUD-018 | public/js/views/change-requests.js |
| NEXUS-AUD-019 | public/js/views/dashboard.js, public/js/views/stories.js (si aplica) |
| NEXUS-AUD-020 | public/js/views/reports.js |
| NEXUS-AUD-021 | public/js/views/incidents.js, public/js/router.js (si aplica) |
| NEXUS-AUD-022 | public/js/views/improvements.js |
| NEXUS-AUD-023 | public/js/views/projects.js, features.js, stories.js, documents.js, improvements.js, releases.js, incidents.js, admin.js |
| NEXUS-AUD-024 | public/js/views/admin.js |
| NEXUS-AUD-025 | public/js/views/releases.js, documents.js, change-requests.js, admin.js, projects.js |
| NEXUS-AUD-026 | public/js/views/releases.js, sprints.js, features.js, stories.js |

---

# PARTE 2 — ORDEN DE IMPLEMENTACIÓN Y FASES

## FASE 1 — Tickets críticos (P1)

| Orden | Ticket | Justificación |
|-------|--------|----------------|
| 1 | **NEXUS-AUD-015** | Documents: aprovecha endpoint GET by code sin uso; mejora descubribilidad de documentos. |
| 2 | **NEXUS-AUD-016** | Documents: cierra el flujo de versiones (ver/editar contenido); endpoints ya existentes. |

---

## FASE 2 — Tickets funcionales (P2)

| Orden | Ticket | Justificación |
|-------|--------|----------------|
| 3 | **NEXUS-AUD-017** | Consistencia de listados: “Ver por página” en cuatro módulos; mejora UX en listas largas. |
| 4 | **NEXUS-AUD-018** | Change Requests: validación y enlaces; reduce errores de uso y mejora trazabilidad. |
| 5 | **NEXUS-AUD-021** | Incidents: breadcrumb y “Volver” con proyecto; mejora flujo de navegación. |
| 6 | **NEXUS-AUD-025** | Seguridad/UX por rol: acciones MASTER no visibles para EMPLOYEE; evita 403 y confusión. |
| 7 | **NEXUS-AUD-019** | Dashboard: enlace a detalle de story desde asignaciones; depende de contrato myAssignments. |
| 8 | **NEXUS-AUD-020** | Reports: límite/paginación en tablas; depende de contrato de API de reports. |

---

## FASE 3 — Mejoras (P3)

| Orden | Ticket | Justificación |
|-------|--------|----------------|
| 9 | **NEXUS-AUD-022** | Improvements: “Ver por página” (o considerado cubierto por 017 si se incluyó Improvements ahí). |
| 10 | **NEXUS-AUD-023** | Mensajes de éxito en formularios; transversal, aplicar de forma incremental. |
| 11 | **NEXUS-AUD-024** | Admin Organización: validación y PATCH completo; bajo riesgo. |
| 12 | **NEXUS-AUD-026** | Enlaces cruzados; mejora navegación entre Release/Feature/Sprint/Story. |

---

# PARTE 3 — DEPENDENCIAS ENTRE TICKETS

| Ticket | Depende de | Notas |
|--------|------------|-------|
| NEXUS-AUD-015 | — | Ninguna. |
| NEXUS-AUD-016 | — | Ninguna. |
| NEXUS-AUD-017 | — | Ninguna. Si se implementa 017 en Improvements, 022 puede cerrarse como duplicado. |
| NEXUS-AUD-018 | — | Ninguna. |
| NEXUS-AUD-019 | — | Requiere que dashboard/summary (myAssignments) devuelva identificador de story si se quiere enlace directo. |
| NEXUS-AUD-020 | — | Verificar contrato de API de reports (límite/paginación). |
| NEXUS-AUD-021 | — | Ninguna. |
| NEXUS-AUD-022 | — | Redundante con 017 si 017 incluye Improvements. |
| NEXUS-AUD-023 | — | Ninguna. Puede aplicarse por módulos. |
| NEXUS-AUD-024 | — | Ninguna. |
| NEXUS-AUD-025 | — | Ninguna. |
| NEXUS-AUD-026 | — | Ninguna. |

---

# PARTE 4 — RIESGOS TÉCNICOS

| Riesgo | Mitigación |
|--------|------------|
| **Documents GET by code** | Confirmar en API que GET /documents/code/:code devuelve el documento con id para redirigir a #/documents/:id. |
| **Documents GET/PATCH versión** | Confirmar contrato de GET y PATCH por versionId (campos content, etc.). |
| **Dashboard myAssignments** | Si la API no devuelve story_id en myAssignments, NEXUS-AUD-019 se limita a enlace a #/stories?feature=… (ya existente) o a documentar la limitación. |
| **Reports paginación** | Si la API no soporta page/limit en summary, implementar solo límite en cliente (primeras N filas + “Ver más” o paginación en cliente). |
| **NEXUS-AUD-023 (transversal)** | Aplicar por módulos para no abrir alcance excesivo en un solo ticket; o desglosar en sub-tareas por vista. |
| **NEXUS-AUD-025 (vistas múltiples)** | Revisar vista por vista con lista de acciones MASTER; asegurar que getMe()/role esté disponible en cada vista. |

---

# PARTE 5 — CIERRE TRAS CADA TICKET

- Actualizar **docs/ENDPOINTS_API_Y_USO_FRONTEND.md** si el ticket implica uso nuevo o cambio de uso de endpoints.
- Registrar la implementación en **docs/project-logs/TICKETS_IMPLEMENTADOS.md** (formato indicado en ese documento).
- QA valida según criterios de aceptación del ticket en docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-04.md.

---

*Este plan es de preparación y orden de ejecución para el siguiente sprint. Las implementaciones las realizará el Master Developer según los criterios de aceptación de la auditoría 2026-04 y el protocolo de trazabilidad del proyecto.*
