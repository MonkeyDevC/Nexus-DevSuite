# Inventario de consumo HTTP — `frontend-react`

**Base URL:** `/api/v1` (relativo) vía [`frontend-react/src/shared/http/requestConfig.js`](../../frontend-react/src/shared/http/requestConfig.js).

**Método de extracción:** revisión de `*Service*.js`, `projectApiClient.js`, `apiClient.js`, `shared/http`.

## Auth

| Method | Path relativo | Archivo |
|--------|---------------|---------|
| POST | `/auth/login` | `shared/http/apiClient.js` |
| POST | `/auth/refresh` | `apiClient.js` |
| GET | `/auth/me` | `apiClient.js` |
| GET | `/auth/roles` | `settings/settingsService.js` |

## Users

| Method | Path | Archivo |
|--------|------|---------|
| GET | `/users` (query page, limit) | `admin/adminService.js` |
| GET | `/users/{id}` | `users/usersService.js` |
| PUT | `/users/{id}` | `users/userProfileService.js` |
| POST | `/users/{id}/photo` | `users/userProfileService.js` |

## Projects / backlog / features / stories

| Method | Path | Archivo |
|--------|------|---------|
| GET | `/projects` | `projectApiClient.js` |
| GET | `/projects/{id}` | `projectApiClient`, `backlog/backlogService`, `sprintsService` |
| POST | `/projects` | `projectApiClient` |
| PUT | `/projects/{id}` | `projectApiClient` |
| PATCH | `/projects/{id}/archive` | `projectApiClient` |
| DELETE | `/projects/{id}` | `projectApiClient` |
| POST | `/projects/bulk-delete` | `projectApiClient` |
| POST | `/projects/import` | `projectApiClient` |
| GET | `/projects/{id}/features` | `backlogService`, `projectsExportImport` |
| GET | `/features` (query project_id, page, limit) | `features/featuresService` |
| GET/PUT/DELETE/PATCH | `/features/{id}`, `/features/{id}/status` | `featuresService` |
| POST | `/features` | `featuresService` |
| GET | `/features/{id}/stories` | `storiesService`, `backlogService`, `projectsExportImport` |
| POST | `/features/{id}/stories` | `storiesService` |
| GET/PUT/DELETE/PATCH | `/stories/{id}`, `/stories/{id}/status` | `storiesService` |
| POST | `/stories/{id}/assign-sprint`, `/remove-sprint` | `sprintsService` |
| POST | `/stories/{id}/assign-release`, `/remove-release` | `releasesService` |
| GET | `/projects/{id}/backlog` | implícito en navegación; datos vía otros endpoints según pantalla |
| GET | `/projects/{id}/stories` (query sprint_id, etc.) | `sprintsService.listReadyStoriesWithoutSprint` |

## Sprints

| Method | Path | Archivo |
|--------|------|---------|
| GET | `/projects/{id}/sprints` | `sprintsService` |
| POST | `/projects/{id}/sprints` | `sprintsService` |
| GET | `/sprints/{id}`, `/summary` | `sprintsService` |
| PUT | `/sprints/{id}` | `sprintsService` |
| DELETE | `/sprints/{id}` | `sprintsService` |
| POST | `/sprints/{id}/start`, `/close` | `sprintsService` |
| GET | `/sprints/{id}/stories` | `sprintsService` |

## Incidents

| Method | Path | Archivo |
|--------|------|---------|
| GET | `/projects/{id}/incidents` | `incidentsService` |
| POST | `/projects/{id}/incidents` | `incidentsService` |
| GET | `/incidents` (query project_id) | `incidentsService` |
| GET/PUT/DELETE/PATCH | `/incidents/{id}` | `incidentsService` |
| POST | `/incidents` | `incidentsService` |
| POST | `/incidents/{id}/start`, `/resolve`, `/close` | `incidentsService` |

## Releases

| Method | Path | Archivo |
|--------|------|---------|
| GET | `/releases` | `releasesService` |
| GET/PUT/PATCH/DELETE | `/releases/{id}` | `releasesService` |
| POST | `/releases` | `releasesService` |
| POST | `/releases/{id}/start`, `/release` | `releasesService` |
| PATCH | `/releases/{id}/status` | `releasesService` |

## Work orders

| Method | Path | Archivo |
|--------|------|---------|
| GET | `/projects/{id}/work-orders` | `work-orders/services/workOrders.service.js` |
| GET | `/projects/{id}/work-orders/{id}` | idem |
| POST | `/projects/{id}/work-orders` | idem |
| PATCH | `/projects/{id}/work-orders/{id}` | idem |

## Otros módulos React

| Method | Path | Archivo |
|--------|------|---------|
| GET | `/dashboard/summary` | `dashboard/dashboardService.js` |
| GET/POST/PATCH | `/documentation`, `/documentation/{id}` | `documents/platformDocumentationService.js` |
| GET/POST/PATCH | `/documents`, `/documents/{id}`, `/documents/code/{code}`, `/documents/{id}/versions` | `documents/isoDocumentsService.js` |
| GET | `/projects?page=1&limit=100` | `isoDocumentsService` (selector proyectos) |
| GET | `/reports/audit` | `admin/adminService.js` |
| GET | `/system/metrics` | `admin/adminService.js` |
| POST | `/projects/{id}/evidence-images` | `projects/services/evidenceUploadService.js` |

## Notas

- Rutas de **React Router** (`/projects/...`) no son API; solo las filas anteriores son llamadas a backend.
- **dev-tools** (`/system/dev-tools/...`) no figuran aquí salvo uso explícito en cliente de desarrollo.
