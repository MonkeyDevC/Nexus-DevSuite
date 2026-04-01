# WAVE 5 — Dashboard + Admin (React)

## Resumen

- **Dashboard:** consume `GET /dashboard/summary` vía `frontend-react/src/modules/dashboard/dashboardService.js`. KPIs de negocio (proyectos, historias, incidentes críticos, sprint, salud por proyecto, mis asignaciones). Estados vacíos parciales explícitos (sin sprint, sin asignaciones, tabla salud vacía). Sin métricas técnicas de `/system/metrics` en esta vista.
- **Admin (MASTER):** `frontend-react/src/modules/admin/adminService.js` — `listUsersNormalized` → `{ items, pagination }`; `listAuditLogsNormalized` → `{ logs, pagination }`; `getSystemMetricsSnapshot` para snapshot técnico. Tres secciones con carga y error independientes.
- **RBAC:** Admin solo `MASTER` (gate con `getMe` + redirect). Enlace **Admin** en sidebar solo si `user.role === "MASTER"`.

## Endpoints

| Vista | Método | Ruta |
|--------|--------|------|
| Dashboard | GET | `/dashboard/summary` |
| Admin usuarios | GET | `/users?page=&limit=` |
| Admin auditoría | GET | `/reports/audit?page=&limit=` |
| Admin métricas técnicas | GET | `/system/metrics` |

## Fuera del MVP

- Paginación avanzada en Admin (solo primera página mostrada con texto de totales).
- Filtros de auditoría / usuarios desde UI.
- CRUD usuarios desde Admin (solo listado lectura).
- Enlace directo a detalle de historia desde "Mis asignaciones" (el resumen API no expone `project_id` por fila).

## Deuda opcional

- Enriquecer `myAssignments` en backend con `project_id` para navegación a `StoryDetail`.
- Sustituir `JSON.stringify` de métricas por tabla clave-valor si se prefiere UX.
