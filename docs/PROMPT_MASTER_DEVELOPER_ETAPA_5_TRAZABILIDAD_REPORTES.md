# Prompt de implementación — ETAPA 5 Trazabilidad y reportes

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_5_TRAZABILIDAD_REPORTES.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_5_TRAZABILIDAD_REPORTES.md  
**Estructura:** nexus-engineering-execution.mdc

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 5 — Trazabilidad y reportes** siguiendo el plan `docs/PLAN_ETAPA_5_TRAZABILIDAD_REPORTES.md`.

**Propósito:** Endpoints de solo lectura (GET) para reportes por proyecto, sprint y usuario, y listado de auditoría con filtros. Preparación para auditoría externa. No se crean nuevas entidades ni migraciones; se reutilizan modelos y `audit_logs` existentes.

---

## 2️⃣ REGLAS INNEGOCIABLES

- No romper arquitectura controller → service → repository.
- No crear nuevas tablas ni migraciones (salvo índices opcionales en audit_logs si se requiere).
- No modificar migraciones previas.
- Solo endpoints GET; ninguna escritura en entidades de dominio desde reportes.
- No introducir lógica de negocio en controllers.
- Cero respuestas 500 en flujos esperados.
- Response Layer v1 (buildSuccess), controllerUtils (buildContext, assertRequestValid).
- Sin exponer datos sensibles (password_hash, tokens) en respuestas de usuario.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Repository

1. Crear `src/modules/reports/report.repository.js`. **Centralizar todas las consultas de reportes en este módulo usando `getModels()`** para acceder a AuditLog, Project, Feature, UserStory, Sprint, Incident, Improvement, Document. No extender repositorios de otros módulos con lógica de reportes; mantener el módulo reports autocontenido.
2. Implementar `getAuditLogs(filters, pagination)` con filtros: user_id, entity, entity_id, from, to (fechas); paginación page, limit; orden created_at DESC; devolver lista + total.
3. Implementar helpers de conteo/lectura para getProjectSummary y getSprintSummary (conteos por projectId, sprint con proyecto y stories). Evitar N+1; usar count/aggregation y consultas optimizadas; opcionalmente ejecutar conteos en paralelo.

### FASE 2 — Service

4. Crear `src/modules/reports/report.service.js`: getProjectSummary(projectId, user), getSprintSummary(sprintId, user), getUserActivity(userId, user, filters, pagination), getAuditLogs(user, filters, pagination).
5. **getProjectSummary:** Validar proyecto exista (404 PROJECT_NOT_FOUND). Conteos: features, userStories (vía features del proyecto), sprints, incidents, **improvements** con `where: { project_id: projectId }` (no incluir mejoras solo vinculadas vía incident), documents con project_id = projectId. **lastActivity:** opcional para esta etapa; si se implementa, consultar último evento en audit_logs con entity = PROJECT y entity_id = projectId, considerando coste de la consulta.
6. **getSprintSummary:** Validar sprint exista (404 SPRINT_NOT_FOUND). Devolver sprint, proyecto, **lista resumida de stories** (id, title, status por cada user story del sprint) y storiesCount. Definición: incluir array `stories` con campos id, title, status (lista resumida, no solo conteo).
7. **getUserActivity:** Validar usuario exista (404 NOT_FOUND). **RBAC:** si user.role !== MASTER y userId !== req.user.id → 403 AUTH_FORBIDDEN. Obtener metadatos básicos del usuario (id, email, role) sin datos sensibles. Llamar a report.repository.getAuditLogs({ user_id: userId, ...filters }, pagination).
8. **getAuditLogs:** Solo MASTER; si EMPLOYEE → 403 AUTH_FORBIDDEN. Paginación obligatoria (limit por defecto si no se envía). **Registrar acceso:** al ejecutar GET /reports/audit, crear un registro en audit_logs (acción ej. REPORT_AUDIT_ACCESS o AUDIT_REPORT_VIEWED) con user_id, request_id, metadata opcional, para trazabilidad de quién accedió al listado de auditoría. Definición: **obligatorio** registrar este acceso.
9. **RBAC proyecto/sprint:** Por defecto, **MASTER y EMPLOYEE pueden ver todos los reportes de proyecto y de sprint** (sin restricción por proyecto). Documentar esta decisión en código o comentario.

### FASE 3 — Controller, Validator, Routes

10. Crear report.controller.js (GET handlers; buildSuccess, controllerUtils; sin lógica de negocio), report.validator.js (query params: page, limit, from, to, entity, action según endpoints), report.routes.js.
11. Rutas: GET /reports/projects/:projectId/summary, GET /reports/sprints/:sprintId/summary, GET /reports/users/:userId/activity, GET /reports/audit. Montar en v1.routes.js con `router.use("/reports", reportRoutes)`. Proteger con authenticateMiddleware; autorización (MASTER/EMPLOYEE) validada en service.

### FASE 4 — Documentación y QA

12. Reutilizar error codes: PROJECT_NOT_FOUND, SPRINT_NOT_FOUND, NOT_FOUND, AUTH_FORBIDDEN. Actualizar CONTRATO_API.md y openapi.yaml con los cuatro endpoints.
13. Crear `src/tests/integration/reports/reports.negative.test.js`: projectId inexistente 404, sprintId inexistente 404, userId inexistente 404, EMPLOYEE pide activity de otro usuario 403, EMPLOYEE pide GET /reports/audit 403, MASTER GET /reports/audit 200, sin token 401.
14. Verificar regresión: backlog, releases, changeRequests, sprints, incidents, improvements, documents, security, contract en verde.

---

## 4️⃣ REGLAS DE DOMINIO CRÍTICAS

- Solo lecturas; no modificar datos desde los endpoints de reportes.
- Conteo de improvements por proyecto: `Improvement.count({ where: { project_id: projectId } })`. No incluir mejoras vinculadas solo por incident_id sin project_id.
- getUserActivity: no exponer password_hash ni tokens; usar método que devuelva solo id, email, role (o equivalente).
- GET /reports/audit: paginación obligatoria; registrar en audit_logs cada acceso (trazabilidad para auditoría externa).

---

## 5️⃣ AUDITORÍA

- No auditar cada consulta a reportes de proyecto/sprint/usuario (evitar ruido).
- **Sí auditar:** cada acceso a GET /reports/audit (acción ej. REPORT_AUDIT_ACCESS), con user_id, request_id, metadata opcional.

---

## 6️⃣ QA OBLIGATORIA (6 niveles)

- **Funcional:** Los cuatro endpoints devuelven datos coherentes; paginación en audit y activity.
- **Dominio:** Solo lecturas; conteos correctos; RBAC respetado.
- **Negativa:** 404, 403, 401 según casos del plan.
- **Regresión:** Todas las suites existentes en verde.
- **Seguridad:** EMPLOYEE no accede a /reports/audit; EMPLOYEE solo ve su actividad en /reports/users/:userId.
- **Contrato:** X-Response-Version, envelope Response Layer v1.

---

## 7️⃣ CRITERIO DE CIERRE

- Cuatro endpoints implementados y documentados.
- report.repository centralizado con getModels(); sin extender otros repos.
- getSprintSummary con lista resumida de stories (id, title, status) + storiesCount.
- GET /reports/audit registra acceso en audit_logs.
- RBAC: MASTER y EMPLOYEE ven reportes proyecto/sprint; EMPLOYEE solo propia activity; solo MASTER en /reports/audit.
- Tests en verde; 0 respuestas 500; arquitectura intacta.

---

## 8️⃣ EVIDENCIA OBLIGATORIA

**Entrega en archivo:** `docs/EVIDENCIA_ETAPA_5_TRAZABILIDAD_REPORTES_<YYYY-MM-DD>.md`

Contenido mínimo: lista archivos creados/modificados, confirmación de solo lecturas y RBAC, resultado QA y regresión, Response Layer v1.

---

## 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (incorporadas)

| Id | Observación | Aplicación en el prompt |
|----|-------------|-------------------------|
| O1 | Origen de datos report.repository | FASE 1: centralizar consultas en report.repository usando getModels(); módulo reports autocontenido. |
| O2 | Política RBAC proyecto/sprint | FASE 2 paso 9: por defecto MASTER y EMPLOYEE pueden ver todos los reportes de proyecto/sprint; documentar decisión. |
| O3 | lastActivity en getProjectSummary | FASE 2 paso 5: opcional; si se implementa, considerar coste; puede dejarse para iteración futura. |
| O4 | Estructura stories en getSprintSummary | FASE 2 paso 6: devolver lista resumida de stories (id, title, status) + storiesCount. |
| O5 | Auditoría de acceso GET /reports/audit | FASE 2 paso 8: obligatorio registrar en audit_logs cada acceso a GET /reports/audit. |

**Conteo improvements (validación IX):** Solo `project_id = projectId`; no incluir mejoras vinculadas solo vía incident.

---

**Validación:** APROBADO CON OBSERVACIONES — SYSTEM ARCHITECT. Ver docs/VALIDACION_ARQUITECTONICA_ETAPA_5_TRAZABILIDAD_REPORTES.md.
