# Propuesta de sprint — Post auditoría frontend 2026-04

**Rol:** PRODUCT OWNER — NEXUS DevSuite  
**Fecha:** 2026-04  
**Referencia:** docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-04.md, docs/plans/PLAN_IMPLEMENTACION_AUDITORIA_FRONTEND_2026-04.md, docs/project-logs/TICKETS_IMPLEMENTADOS.md  

---

# SECCIÓN 1 — ESTADO ACTUAL DEL PRODUCTO

## 1.1 Sprint recién completado

Se han cerrado los siguientes tickets del plan de auditoría 2026-04:

| Ticket | Título | Fecha cierre |
|--------|--------|--------------|
| **NEXUS-AUD-015** | Documents — Búsqueda por código y apertura a detalle | 2026-03-03 |
| **NEXUS-AUD-016** | Documents — Ver y editar contenido de una versión | 2026-03-03 |
| **NEXUS-AUD-018** | Change Requests — Validación UUID y enlace al ID creado | 2026-03-03 |
| **NEXUS-AUD-019** | Dashboard — Enlace desde "Mis asignaciones" a detalle de story | 2026-03-03 |

**Verificación:** Las entradas correspondientes figuran en `docs/project-logs/TICKETS_IMPLEMENTADOS.md` con archivos modificados, endpoints utilizados y cambios funcionales descritos.

## 1.2 Estado del producto tras el sprint

- **Documents:** Cobertura completa del flujo documental: búsqueda por código (GET by code), ver y editar contenido de versiones (GET/PATCH por versionId).
- **Change Requests:** Validación de UUID en entity_id, enlaces a feature/release tras crear, errores con showApiError.
- **Dashboard:** Acceso directo desde "Mis asignaciones" al detalle de story vía #/stories?story=:id y apertura automática del modal.

Los tickets P1 de la auditoría 2026-04 (015, 016) están cerrados. Quedan pendientes tickets P2 y P3 para completar el plan.

---

# SECCIÓN 2 — TICKETS PENDIENTES

Todos los tickets que siguen están definidos en `docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-04.md`; no se inventan nuevos.

| Ticket | Título | Prioridad | Módulo(s) | Evaluación breve |
|--------|--------|-----------|-----------|-------------------|
| **NEXUS-AUD-017** | Consistencia — Selector "Ver por página" en listados | P2 | Improvements, Documents, Features, Incidents | Alto impacto en consistencia UX. Mismo patrón en 4 vistas; reutilizable. Sin dependencias. |
| **NEXUS-AUD-020** | Reports — Paginación o límite en tablas de resumen | P2 | Reports | Impacto medio. Un solo archivo. Depende del contrato de la API (page/limit o límite en cliente). |
| **NEXUS-AUD-021** | Incidents — Breadcrumb y "Volver" con contexto de proyecto | P2 | Incidents | Impacto medio en flujo. Pocos archivos. Sin dependencias. Mejora navegación tras ver detalle. |
| **NEXUS-AUD-022** | Improvements — Selector "Ver por página" en listado | P3 | Improvements | Subconjunto de 017; si se implementa 017, 022 se considera cubierto/duplicado. |
| **NEXUS-AUD-023** | Mensajes de éxito tras crear/actualizar en formularios | P3 | Transversal (8 vistas) | Transversal; muchos archivos. Evitar en sprint corto según reglas. |
| **NEXUS-AUD-024** | Admin Organización — Validación de campos y PATCH completo | P3 | Organizations (Admin) | Impacto bajo-medio. Un archivo. Sin dependencias. Rápido de implementar. |
| **NEXUS-AUD-025** | Ocultar o deshabilitar acciones MASTER para rol EMPLOYEE | P2 | Releases, Documents, CR, Admin, Projects | Alto impacto en seguridad y UX (evitar 403 y confusión). Revisión por vista; sin dependencias. |
| **NEXUS-AUD-026** | Enlaces cruzados entre módulos | P3 | Releases, Sprints, Features, Stories | Impacto medio en navegación. Cuatro archivos. Sin dependencias. |

**Resumen:** 8 tickets pendientes (017, 020, 021, 022, 023, 024, 025, 026). Se excluye 023 del próximo sprint por ser transversal y de sprint corto. El 022 puede omitirse como ticket independiente si se incluye 017.

---

# SECCIÓN 3 — SPRINT RECOMENDADO

## 3.1 Criterios de selección

- **Impacto funcional:** Prioridad a P2 sobre P3.
- **Sin dependencias no implementadas:** Ninguno de los pendientes depende de otro ticket aún no cerrado.
- **Sprint corto:** Se evita el ticket transversal 023; se eligen tickets acotados por módulo o por patrón repetible.
- **Cantidad:** Entre 3 y 5 tickets.

## 3.2 Tickets seleccionados para el siguiente sprint

| # | Ticket | Justificación técnica |
|---|--------|------------------------|
| 1 | **NEXUS-AUD-021** | Incidents: breadcrumb con proyecto y "Volver" preservando projectId. Mejora clara del flujo de navegación con pocos archivos (incidents.js, router si aplica). Complejidad baja. |
| 2 | **NEXUS-AUD-025** | Ocultar/deshabilitar acciones MASTER para EMPLOYEE en Releases, Documents, Change Requests, Admin, Projects. Alto impacto en seguridad y UX; cambios acotados por vista (condicional por rol). |
| 3 | **NEXUS-AUD-017** | Selector "Ver por página" en Improvements, Documents, Features, Incidents. Consistencia con Projects y Releases; patrón único en 4 archivos. Si se implementa 017, 022 se cierra como duplicado. |
| 4 | **NEXUS-AUD-020** | Reports: paginación o límite en tablas de resumen (proyecto/sprint). Un archivo; verificar contrato API y, si no hay paginación, límite en cliente. |
| 5 | **NEXUS-AUD-024** | Admin Organización: validación de campos requeridos y PATCH completo. Un archivo (admin.js), bajo riesgo, cierra integridad del flujo de organización. |

**No incluidos en este sprint:**  
- **NEXUS-AUD-022:** Cubierto por 017 (selector "Ver por página" en Improvements va dentro de 017).  
- **NEXUS-AUD-023:** Transversal; reservado para un sprint con más alcance.  
- **NEXUS-AUD-026:** Enlaces cruzados; P3, puede formar parte del siguiente bloque.

---

# SECCIÓN 4 — ORDEN DE IMPLEMENTACIÓN

Orden recomendado dentro del sprint:

| Orden | Ticket | Motivo |
|-------|--------|--------|
| 1 | **NEXUS-AUD-021** | Rápido, un módulo, sin dependencias. Mejora inmediata en Incidents. |
| 2 | **NEXUS-AUD-025** | Alto impacto; conviene tenerlo pronto para no mostrar acciones no permitidas a EMPLOYEE. |
| 3 | **NEXUS-AUD-017** | Patrón repetible en 4 vistas; puede hacerse por archivo (improvements → documents → features → incidents). |
| 4 | **NEXUS-AUD-020** | Un archivo; requiere comprobar API de reports antes de implementar (límite vs paginación). |
| 5 | **NEXUS-AUD-024** | Cierre rápido del bloque; un archivo, validación y PATCH en organización. |

No hay dependencias entre estos cinco tickets; el orden puede ajustarse por preferencia del equipo (por ejemplo, 024 antes si se prioriza Admin).

---

# SECCIÓN 5 — ESTIMACIÓN DE COMPLEJIDAD Y RIESGOS

## 5.1 Estimación de complejidad por ticket

| Ticket | Complejidad | Comentario |
|--------|-------------|------------|
| NEXUS-AUD-021 | **Baja** | Breadcrumb y query en "Volver"; lógica ya existe en otras vistas. |
| NEXUS-AUD-025 | **Media** | Revisar 5 vistas y listar acciones MASTER; condicional por rol ya usado (p. ej. Change Requests). |
| NEXUS-AUD-017 | **Media** | Mismo patrón en 4 archivos; referencia en projects.js y releases.js. |
| NEXUS-AUD-020 | **Baja–Media** | Depende de si la API de reports soporta page/limit; si no, solo límite en cliente. |
| NEXUS-AUD-024 | **Baja** | Validación en formulario y envío completo en PATCH; un archivo. |

**Complejidad global del sprint:** Media (mayormente por 025 y 017).

## 5.2 Riesgos técnicos

| Riesgo | Ticket(s) | Mitigación |
|--------|-----------|------------|
| **API de reports sin paginación** | NEXUS-AUD-020 | Confirmar en docs/ENDPOINTS_API_Y_USO_FRONTEND.md o en la API si GET /reports/projects/:id/summary y GET /reports/sprints/:id/summary aceptan parámetros de paginación. Si no, implementar solo límite en cliente (primeras N filas) o "Ver más". |
| **Hash con query en Incidents** | NEXUS-AUD-021 | La lista de incidentes debe leer el parámetro project del hash (p. ej. #/incidents?project=uuid) al cargar y preseleccionar el proyecto. Comprobar si el router o la vista ya interpretan query; si no, añadir la lectura sin cambiar arquitectura. |
| **Listado de acciones MASTER por vista** | NEXUS-AUD-025 | Definir checklist por vista (Releases: hotfix, bulk-delete, editar; Documents: aprobar/archivar versión; etc.) para no olvidar ninguna acción. Change Requests ya condiciona por isMaster; usar el mismo patrón. |

No se han identificado riesgos que bloqueen el sprint; las mitigaciones son de verificación de contrato API y de alcance por vista.

---

*Documento generado para definir el siguiente bloque de desarrollo a partir de la auditoría 2026-04 y del registro de tickets implementados. El Master Developer puede usar este documento como entrada al siguiente sprint.*
