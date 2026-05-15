# Inventario de rutas backend — `/api/v1`

**Fuente:** [`src/routes/v1.routes.js`](../../src/routes/v1.routes.js) + routers montados (`*.routes.js`).  
**Prefijo API:** todas las rutas siguientes se sirven como `/api/v1` + path indicado.

## Convenciones

- `method` + `path` = plantilla Express (parámetros dinámicos como `:id`).
- **Duplicados / alternativas:** mismo dominio expuesto por dos paths (p. ej. features bajo proyecto vs `/features`).

## Rutas sueltas en `v1.routes.js`

| Method | Path (bajo /api/v1) | Notas |
|--------|---------------------|--------|
| GET | `/health` | Health check |
| ALL | `/*` | `tenantResolutionMiddleware` tras health |
| POST | `/ai/review` | Stub 400 `buildFeatureDisabledResponse` |

## Montajes por prefijo (resumen)

| Prefijo v1 | Archivo router | Observaciones |
|------------|----------------|---------------|
| `/auth` | `modules/auth/auth.routes.js` | login, refresh, logout, me, roles |
| `/organizations` | `modules/organizations/organization.routes.js` | current, :id, patch |
| `/users` | `modules/users/users.routes.js` | CRUD + photo |
| `/system` | `system/metrics/metrics.routes.js` | `/metrics` → ruta completa `/api/v1/system/metrics` |
| `/system/dev-tools` | `system/dev-tools/devTools.routes.js` | Solo `NODE_ENV=development` y `DEV_DATA_RESET_ENABLED` |
| `/projects` | `modules/backlog/projects.routes.js` | Proyecto + anidadas (features, sprints, incidents, stories, backlog, evidence) |
| `/features` | `modules/backlog/feature.routes.js` | Lista global + CRUD + stories bajo feature |
| `/stories` | `modules/backlog/stories.routes.js` | CRUD + sprint/release assign |
| `/releases` | `modules/releases/release.routes.js` | Ciclo release + features |
| `/change-requests` | `modules/changeRequests/changeRequest.routes.js` | |
| `/sprints` | `modules/sprints/sprint.routes.js` | Raíz + `:id` + stories |
| `/incidents` | `modules/incidents/incident.routes.js` | Raíz + transiciones |
| `/improvements` | `modules/improvements/improvement.routes.js` | |
| `/documents` | `modules/documents/document.routes.js` | ISO + versiones |
| `/documentation` | `modules/documentation/documentation.routes.js` | Contenido plataforma |
| `/docs` | `modules/docs-export/docsExport.routes.js` | Export |
| `/projects/:projectId/repository` | `modules/github-integration/github.routes.js` | |
| `/projects/:projectId/code-deliveries` | `modules/code-deliveries/codeDelivery.routes.js` | Incluye delivery-workspace |
| `/projects/:projectId/work-orders` | `modules/work-orders/workOrder.routes.js` | |
| `/projects/:projectId/tasks` | `modules/tasks/task.routes.js` | |
| `/projects/.../implementation-steps` | `modules/implementation-steps/implementationStep.routes.js` | |
| `/reports` | `modules/reports/report.routes.js` | |
| `/dashboard` | `modules/dashboard/dashboard.routes.js` | |
| `/automation` | `ai-automation/ai.rule.routes.js` **y** `automation/automation.rules.routes.js` | **Doble montaje** mismo prefijo |
| `/workflows` | `modules/workflow/workflow.routes.js` | |
| `/rules-engine` | `modules/rules-engine/rulesEngine.routes.js` | |

## Duplicados / riesgos detectados (governance)

1. **Features:** `GET/POST /projects/:projectId/features` vs `GET/POST /features` (+ `project_id` en query/body).
2. **Incidentes:** `GET/POST /projects/:projectId/incidents` vs `GET/POST /incidents`.
3. **Historias:** listados vía `/projects/:projectId/stories` y vía `/features/:featureId/stories`; detalle en `/stories/:id`.
4. **`/automation`:** dos routers distintos en el mismo prefijo — orden de montaje importa.

## Detalle `projects.routes.js` (referencia)

Ver archivo: POST `/`, POST `/import`, GET `/`, GET `/:projectId/features`, `/:projectId/sprints` (GET+POST), `/:projectId/incidents` (GET+POST), `/:projectId/stories`, `/:projectId/backlog`, POST `/:projectId/backlog/order`, POST `/:projectId/evidence-images`, GET|PUT|PATCH|DELETE `/:id`, PATCH `/:id/archive`, POST `/bulk-delete`, POST `/:projectId/features`.

*Para listado máquina-legible de todos los `router.METHOD`, ejecutar búsqueda en repo sobre `*.routes.js` o script interno.*
