# Informe de estado y norte del proyecto — NEXUS DevSuite

**Rol:** PRODUCT OWNER  
**Fecha:** 2026  
**Propósito:** Documento de referencia para que otra IA o el equipo defina la dirección del producto a partir del estado actual. Incluye auditoría consolidada, backlog posible y opciones de norte.

---

# 1. QUÉ ES NEXUS DEVSUITE

| Campo | Valor |
|-------|--------|
| **Nombre** | NEXUS DevSuite (nexus-devsuite) |
| **Versión** | 0.1.0 (package.json) |
| **Descripción** | Plataforma de gestión empresarial orientada a proyectos, backlog (features, user stories), sprints, releases, incidentes, mejoras, documentos, change requests y reportes. Con panel administrativo (usuarios, organización, auditoría, métricas) y preparación para entornos certificables (ISO). |
| **Stack** | **Frontend:** HTML5 + JavaScript modular (sin framework), router por hash (#/view). **Backend:** Node.js, Express, Sequelize, MySQL. **Auth:** JWT (access + refresh). |

---

# 2. ESTADO ACTUAL CONSOLIDADO

## 2.1 Frontend (public/)

| Dimensión | Estado |
|-----------|--------|
| **Madurez funcional** | **Alta (~95%)** |
| **Cobertura de API** | **~99%** (solo GET /auth/admin/test sin uso en UI) |
| **Módulos con flujo completo** | Dashboard, Projects, Features, Stories, Sprints, Releases, Incidents, Improvements, Documents, Change Requests, Reports, Admin (Users, Organización, Auditoría, Métricas), Health, Settings |
| **Componentes reutilizables** | pageSizeSelector.js, permissions.js (nexusCanAccessMasterActions), notifications.js (showSuccessMessage) |
| **UX** | Paginación “Ver por página” en listados principales; toast de éxito; permisos por rol (MASTER/EMPLOYEE); búsqueda global en topbar (enlaces rápidos); enlaces cruzados entre módulos; mejoras de accesibilidad (aria-label, enlaces “Ver” con contexto). |

**Estructura relevante:**  
`public/js/views/` (dashboard, projects, features, stories, sprints, releases, incidents, improvements, documents, change-requests, reports, admin, settings, login), `public/js/components/`, `public/js/layout.js`, `public/js/api.js`, `public/js/ux.js`, `public/js/router.js`.

## 2.2 Backend (src/)

- **API REST** bajo `/api/v1`: Auth, Users, Organizations, Projects (y subrecursos: features, sprints, incidents), Features, Stories, Releases, Change Requests, Sprints, Incidents, Improvements, Documents (y versiones), Dashboard (summary), Reports (projects/sprints summary, users/activity, audit), System (metrics), Health.
- **Stack:** Express, Sequelize, MySQL, JWT, bcrypt, pino (logs), helmet, cors, rate-limit.
- **No se ha modificado** en los últimos sprints de auditoría; la evolución reciente ha sido solo frontend.

## 2.3 Documentación clave

| Documento | Uso |
|-----------|-----|
| **docs/ENDPOINTS_API_Y_USO_FRONTEND.md** | Listado de endpoints y uso actual en frontend. Fuente de verdad para “qué está conectado”. |
| **docs/project-logs/TICKETS_IMPLEMENTADOS.md** | Registro de todos los tickets de auditoría implementados (NEXUS-AUD-001 a 032). |
| **docs/AUDITORIA_FUNCIONAL_FRONTEND_ESTADO_ACTUAL_2026.md** | Última auditoría de estado; tickets 027-032 ya implementados. |
| **docs/plans/PLAN_SPRINT_AUDITORIA_ESTADO_ACTUAL_2026.md** | Plan del sprint de refinamiento (027-032). |
| **docs/AUDITORIA_REPOSITORIO_ESTADO_ACTUAL.md** | Estado del repositorio, arquitectura backend, estructura. |
| **docs/CHECKLIST_ETAPAS_PROYECTO.md** | Etapas 0-17 completadas; 18-22 listadas como pendientes (parte de su alcance se cubrió vía auditorías). |
| **docs/MODELO_BASE_DATOS_ERD.md** | Modelo de datos. |
| **docs/CONEXION_BASE_DATOS.md** | Conexión MySQL y onboarding. |

## 2.4 Tickets de auditoría realizados (resumen)

- **Auditoría 2026-03 (plan 2026-03):** NEXUS-AUD-001 a 014 (alineación sprint, dashboard sin dummy, detalle incidentes, organizations, improvements, sprints stories, stories estado/assign, features status, releases, documents versiones, change-requests, reports actividad, health, errores API).
- **Auditoría 2026-04 (plan 2026-04):** NEXUS-AUD-015 a 026 (documents código y contenido versión, “Ver por página”, CR validación/enlaces, dashboard enlace story, reports paginación, incidents breadcrumb/volver, mensajes éxito, admin organización, permisos MASTER, enlaces cruzados).
- **Sprint estado actual 2026:** NEXUS-AUD-027 a 032 (release→feature por id, projects CTA empty state, settings enlaces admin, búsqueda topbar, accesibilidad, reportes documentado).

**Total:** 32 tickets de auditoría implementados (001-026 + 027-032). No quedan tickets pendientes del backlog definido en las auditorías hasta la fecha.

---

# 3. QUÉ MÁS TICKETS PODEMOS HACER

Sin modificar backend ni crear endpoints nuevos, las siguientes líneas son candidatas a nuevos tickets (para priorizar por el PO o otra IA).

## 3.1 Refinamiento UX y consistencia

- **Búsqueda topbar con sugerencias:** Usar GET /projects (y opcionalmente GET /releases) para filtrar por nombre y mostrar sugerencias en el dropdown; al elegir un proyecto/release, navegar a #/projects/:id o #/releases/:id. Requiere definir si la API acepta parámetro `search` en listados.
- **Empty states unificados:** Revisar que todos los listados tengan el mismo patrón (icono, mensaje, CTA cuando aplique).
- **Loading y skeletons:** Sustituir “Cargando...” por skeletons en listados principales (opcional, impacto visual).
- **Responsive:** Revisar uso en móvil/tablet (sidebar, tablas, modales) y ajustar si hay puntos dolorosos.

## 3.2 Accesibilidad (segunda pasada)

- **Focus y teclado:** Asegurar orden de tabulación lógico y focus visible en todos los modales.
- **Landmarks y encabezados:** Revisar uso de `<main>`, `<nav>`, niveles h1/h2 en todas las vistas.
- **Lectores de pantalla:** Revisar mensajes dinámicos (toast, errores) y estados “live” (aria-live) donde aporte valor.

## 3.3 Producto y políticas

- **Reportes para todos:** Si el PO decide que “Reportes” (resumen proyecto/sprint, actividad por usuario) sea visible para todos los usuarios, mostrar el enlace en sidebar a todos y mantener “Auditoría” solo para MASTER (cambio ya documentado en layout.js).
- **Settings editables:** Si en el futuro la API permite editar parámetros (estados permitidos, etc.), conectar la vista Settings a esos endpoints.
- **Change Requests con listado:** Si el backend añade GET /change-requests (listado), conectar la vista para listar CRs en lugar de trabajar solo por ID.

## 3.4 Calidad y pruebas

- **Tests E2E o de integración frontend:** Flujos críticos (login, crear proyecto, crear story, cerrar sprint) con herramienta tipo Playwright/Cypress (o pruebas manuales documentadas).
- **Regresión visual:** Checklist de humo para cada release (lista de pantallas y acciones a comprobar).

## 3.5 Deuda técnica (opcional)

- **Documentación de componentes:** Comentar en código o en un README la API de pageSizeSelector, permissions, notifications y patrones de uso.
- **Router y rutas:** Si se añaden más rutas, mantener documentada la lista de hashes (#/dashboard, #/projects, etc.) en un solo lugar.

---

# 4. OPCIONES DE “NORTE” PARA EL PROYECTO

Para que otra IA o el equipo elija dirección, se resumen posibles nortes y qué implican.

| Norte | Descripción | Implicación principal |
|-------|-------------|------------------------|
| **Estabilización y entrega** | Considerar el producto “listo para uso interno o piloto”. Cerrar Etapas 18-22 en el checklist (testing humano, validación), documentar manual de usuario y criterios de aceptación. | Poco desarrollo nuevo; foco en QA, documentación y despliegue. |
| **Refinamiento continuo** | Seguir con tickets de UX, accesibilidad y consistencia (sección 3) en sprints cortos. | Sin cambios de arquitectura; mejoras incrementales. |
| **Nuevas funcionalidades (frontend)** | Añadir vistas o flujos que consuman endpoints ya existentes no usados (p. ej. GET /auth/admin/test no aplica; ya no hay endpoints sin uso relevante). Cualquier funcionalidad nueva que requiera datos no expuestos hoy implicaría **nuevos endpoints (backend)**. | Si se pide algo que la API no da, habría que extender backend. |
| **Nuevas funcionalidades (full-stack)** | Definir nuevas capacidades (notificaciones, comentarios en stories, adjuntos, etc.) que requieran modelo de datos y API nuevos. | Implica diseño de API, migraciones, y luego frontend. |
| **Escalabilidad y DevOps** | Foco en despliegue (Docker, CI/CD), variables de entorno, backups, monitoreo. | Poco cambio en funcionalidad; más en infra y procesos. |
| **Preparación multi-tenant / SaaS** | Si el producto debe soportar varias organizaciones de forma aislada (ya existe organización y roles). Revisar si el modelo actual (organización, roles MASTER/EMPLOYEE) basta o hace falta ampliación. | Puede requerir cambios en auth, datos y permisos. |

---

# 5. RESTRICCIONES Y DECISIONES PENDIENTES

- **Backend:** No se ha tocado en los sprints de auditoría; cualquier evolución que requiera nuevos datos o comportamientos debe planificarse con cambios en API y, si aplica, en base de datos.
- **Arquitectura frontend:** Router por hash y JS modular sin framework; se mantiene. Un cambio a SPA con framework sería un proyecto aparte.
- **Checklist etapas:** Las Etapas 18-22 figuran como pendientes; una parte importante de su alcance (conexión de endpoints, UX, consistencia) ya está cubierta por las auditorías. Conviene actualizar el checklist para reflejar el estado real y lo que queda por validar (p. ej. pruebas humanas).
- **Prioridad de nuevos tickets:** Debe fijarla el PO o quien defina el norte; este informe solo lista opciones.

---

# 6. RESUMEN EJECUTIVO PARA OTRA IA

1. **NEXUS DevSuite** es una aplicación full-stack (Express + MySQL + frontend HTML/JS) para gestión de proyectos, backlog, sprints, releases, incidentes, mejoras, documentos y change requests, con admin y reportes.
2. **Estado:** El frontend está muy avanzado: 32 tickets de auditoría implementados, casi todos los endpoints con uso en UI, permisos por rol, búsqueda global, accesibilidad mejorada. Backend estable sin cambios recientes.
3. **Documentos clave:** ENDPOINTS_API_Y_USO_FRONTEND.md, TICKETS_IMPLEMENTADOS.md, AUDITORIA_FUNCIONAL_FRONTEND_ESTADO_ACTUAL_2026.md, AUDITORIA_REPOSITORIO_ESTADO_ACTUAL.md, CHECKLIST_ETAPAS_PROYECTO.md.
4. **Más tickets posibles:** Refinamiento UX (búsqueda con sugerencias, empty states, responsive), segunda pasada de accesibilidad, políticas (reportes para todos), tests E2E/regresión, documentación de componentes. Cualquier funcionalidad nueva que exija datos no expuestos hoy implica extender el backend.
5. **Norte a elegir:** Estabilización y entrega, refinamiento continuo, nuevas funcionalidades (frontend o full-stack), escalabilidad/DevOps, o preparación multi-tenant/SaaS. Las restricciones (sin tocar backend en refinamiento, mantener arquitectura actual) deben respetarse salvo que se tome la decisión explícita de cambiar el norte.

Con este informe, otra IA o el equipo puede definir el siguiente paso (sprint, objetivos de producto o actualización del checklist) de forma alineada al estado real del proyecto.
