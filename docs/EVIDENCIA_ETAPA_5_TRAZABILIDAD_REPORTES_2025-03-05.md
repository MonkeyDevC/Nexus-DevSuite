# Evidencia de implementación — ETAPA 5 Trazabilidad y reportes

**Documento:** Evidencia de cierre ETAPA 5  
**Nombre de etapa:** ETAPA 5 — Trazabilidad y reportes  
**Fecha de generación:** 2025-03-05  
**Referencia:** `docs/PLAN_ETAPA_5_TRAZABILIDAD_REPORTES.md`, `docs/PROMPT_MASTER_DEVELOPER_ETAPA_5_TRAZABILIDAD_REPORTES.md`, `docs/VALIDACION_ARQUITECTONICA_ETAPA_5_TRAZABILIDAD_REPORTES.md`

---

## 1. Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `src/modules/reports/report.repository.js` | getAuditLogs(filters, pagination), getProjectCounts(projectId), getSprintWithProjectAndStories(sprintId). Centralizado con getModels(); solo lecturas. |
| `src/modules/reports/report.service.js` | getProjectSummary, getSprintSummary, getUserActivity, getAuditLogs. RBAC: MASTER/EMPLOYEE proyecto y sprint; EMPLOYEE solo propia activity; solo MASTER en /reports/audit. Registro REPORT_AUDIT_ACCESS en audit_logs al acceder GET /reports/audit. |
| `src/modules/reports/report.controller.js` | GET handlers; buildSuccess, controllerUtils; sin lógica de negocio. |
| `src/modules/reports/report.validator.js` | Validación query params (page, limit, from, to, entity, entity_id, user_id, action) y params (projectId, sprintId, userId). |
| `src/modules/reports/report.routes.js` | GET /reports/projects/:projectId/summary, GET /reports/sprints/:sprintId/summary, GET /reports/users/:userId/activity, GET /reports/audit. |
| `src/tests/integration/reports/reports.negative.test.js` | Suite QA negativo (7 tests). |

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/routes/v1.routes.js` | `router.use("/reports", reportRoutes)`. |
| `docs/CONTRATO_API.md` | Sección "Reportes (ETAPA 5 — Trazabilidad)" con los cuatro endpoints y códigos reutilizados. |

---

## 3. Migraciones

- **Ninguna.** La etapa reutiliza modelos y tabla `audit_logs` existentes; no se crean tablas ni migraciones nuevas.

---

## 4. API implementada

| Método | Endpoint | Roles | Propósito |
|--------|----------|-------|-----------|
| GET | `/api/v1/reports/projects/:projectId/summary` | MASTER, EMPLOYEE | Resumen proyecto + conteos (features, userStories, sprints, incidents, improvements, documents) |
| GET | `/api/v1/reports/sprints/:sprintId/summary` | MASTER, EMPLOYEE | Resumen sprint + proyecto + stories (id, title, status) + storiesCount |
| GET | `/api/v1/reports/users/:userId/activity` | MASTER; EMPLOYEE solo propio | Actividad usuario (audit_logs paginado); query: page, limit, from, to, action |
| GET | `/api/v1/reports/audit` | Solo MASTER | Listado auditoría (filtros: entity, entity_id, user_id, from, to, action); paginación; registra REPORT_AUDIT_ACCESS en audit_logs |

---

## 5. Reglas de dominio y RBAC

- **Solo lecturas:** ningún endpoint de reportes escribe en entidades de dominio (solo se escribe en audit_logs el acceso a GET /reports/audit).
- **Conteo improvements:** `Improvement.count({ where: { project_id: projectId } })`; no se incluyen mejoras solo vinculadas por incident_id sin project_id.
- **getUserActivity:** no se exponen password_hash ni tokens; se devuelve usuario con id, email, role (toPlainUserSafe).
- **GET /reports/audit:** paginación obligatoria (default limit si no se envía); cada acceso crea registro en audit_logs (acción REPORT_AUDIT_ACCESS).
- **RBAC proyecto/sprint:** MASTER y EMPLOYEE pueden ver todos los reportes de proyecto y de sprint (documentado en report.service.js).
- **RBAC activity:** MASTER ve cualquier usuario; EMPLOYEE solo `userId === req.user.id` (si no → 403 AUTH_FORBIDDEN).
- **RBAC audit:** Solo MASTER; EMPLOYEE → 403 AUTH_FORBIDDEN.

---

## 6. Auditoría

- No se audita cada consulta a reportes de proyecto/sprint/usuario (evitar ruido).
- **Sí se audita:** cada acceso a GET /reports/audit (acción REPORT_AUDIT_ACCESS), con user_id, request_id, metadata (filters, page, limit, total), ip_address, user_agent.

---

## 7. Resultado de QA

- **reports.negative.test.js:** 7/7 pasando.
  - projectId inexistente → 404 PROJECT_NOT_FOUND
  - sprintId inexistente → 404 SPRINT_NOT_FOUND
  - userId inexistente → 404 NOT_FOUND
  - EMPLOYEE pide activity de otro usuario → 403 AUTH_FORBIDDEN
  - EMPLOYEE pide GET /reports/audit → 403 AUTH_FORBIDDEN
  - MASTER GET /reports/audit → 200
  - Sin token → 401

**Comando de verificación:**

```bash
$env:NODE_ENV="development"; npm test -- --testPathPattern="reports.negative" --runInBand --forceExit
```

---

## 8. Criterios de cierre

- [x] Cuatro endpoints implementados y documentados.
- [x] report.repository centralizado con getModels(); sin extender otros repos.
- [x] getSprintSummary con lista resumida de stories (id, title, status) + storiesCount.
- [x] GET /reports/audit registra acceso en audit_logs (REPORT_AUDIT_ACCESS).
- [x] RBAC: MASTER y EMPLOYEE ven reportes proyecto/sprint; EMPLOYEE solo propia activity; solo MASTER en /reports/audit.
- [x] Tests en verde; 0 respuestas 500 en flujos esperados; arquitectura intacta.
- [x] Response Layer v1 y controllerUtils en todos los endpoints.

---

**Nomenclatura del archivo:** `EVIDENCIA_ETAPA_5_TRAZABILIDAD_REPORTES_<YYYY-MM-DD>.md`
