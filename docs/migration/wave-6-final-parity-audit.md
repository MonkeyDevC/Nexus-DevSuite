# WAVE 6 — Auditoría final de paridad funcional (React vs backend)

**Fecha evidencia:** 2026-03-27  
**Método:** revisión estática de [`frontend-react/src/app/router.jsx`](../../frontend-react/src/app/router.jsx), páginas y servicios; contraste con [`src/routes/v1.routes.js`](../../src/routes/v1.routes.js). Sin mocks en `pages/` verificado por ausencia de `DASHBOARD_DATA` / `ADMIN_CONFIG_ROWS` / `fetch(` en páginas.

## Leyenda de estado

| Estado | Significado |
|--------|-------------|
| PARITY_OK | Pantalla + API + cap HTTP alineados; flujo principal ejecutable en React. |
| PARITY_WITH_NOTES | Cubierto en React con matices (UX parcial, copy distinto, paginación MVP, etc.). |
| GAP_PENDING | Backend y/o contrato existen; **no** hay pantalla React dedicada o flujo completo en UI. |
| LEGACY_ONLY | Experiencia principal aún en otro shell (no aplicable si entry es solo React). |
| UNKNOWN | No auditado en profundidad en esta ola. |

## Tabla de paridad

| Módulo | Capacidad | Pantalla React | API real | shared/http o service | Legacy residual | Brecha BE vs React | Estado | Evidencia (archivos / rutas) | Gap residual | Acción recomendada |
|--------|-----------|----------------|----------|------------------------|-----------------|-------------------|--------|------------------------------|--------------|---------------------|
| Auth | Login / sesión | Sí (`Login.jsx`) | Sí | Sí (`AuthContext` → `apiClient` → `shared/http`) | No | No | PARITY_OK | `frontend-react/src/pages/Login.jsx`, `context/AuthContext.jsx` | — | Mantener |
| Auth | Rutas protegidas | Sí | Sí | Sí | No | No | PARITY_OK | `routes/ProtectedRoute.jsx` | — | Mantener |
| Projects | Lista / CRUD / detalle | Sí | Sí | Sí (`projectApiClient` sobre `shared/http`) | No | No | PARITY_OK | `Projects.jsx`, `ProjectDetail.jsx`, `ProjectContext.jsx` | — | Mantener |
| Features | Lista / detalle / crear | Sí | Sí | Sí (`featuresService`) | No | No | PARITY_OK | `Features.jsx`, `FeatureDetail.jsx` | — | Mantener |
| Stories | Detalle / flujo historia | Sí | Sí | Sí (`storiesService`, `featuresService`) | No | No | PARITY_WITH_NOTES | `StoryDetail.jsx` | copy mensajes error puede diferir de expectativas E2E antiguas | Alinear tests o copy si se exige contrato de texto |
| Sprints | Lista / detalle / editor | Sí | Sí | Sí (`sprintsService`) | No | No | PARITY_OK | `Sprints.jsx`, `SprintDetail.jsx`, `SprintEditor.jsx` | — | Mantener |
| Incidents | Lista / detalle / editor | Sí | Sí | Sí (`incidentsService`) | No incircuito legacy UI | No | PARITY_OK | `Incidents.jsx`, `IncidentDetail.jsx`, `IncidentEditor.jsx` | — | Mantener |
| Releases | Lista / detalle / editor / story assign | Sí | Sí | Sí (`releasesService` — `assignStoryToRelease`, `removeStoryFromRelease`, etc.) | Backend aún expone `POST/DELETE /releases/:id/features/:featureId` usado por tests y `public/js` **si** se cargara | Parcial: React no usa rutas assign-feature legacy | PARITY_WITH_NOTES | `Releases.jsx`, `ReleaseDetail.jsx`, `ReleaseEditor.jsx`, `releasesService.js` | Asignación canónica por historia en React; rutas feature-release siguen vivas en API | Documentar política; deprecación en ola cleanup |
| Dashboard | Resumen | Sí | Sí | Sí (`dashboardService` → `GET /dashboard/summary`) | No | No | PARITY_OK | `Dashboard.jsx`, `modules/dashboard/dashboardService.js` | sin `project_id` en “mis asignaciones” para deep link | Opcional: ampliar API summary |
| Admin | Usuarios / audit / métricas | Sí | Sí | Sí (`adminService` + `getMe`) | No | No | PARITY_OK | `Admin.jsx`, `modules/admin/adminService.js` | E2E antiguos buscan `admin-table` / `admin-card` (eliminados en WAVE 5) | Actualizar `react-microapp-integration.spec.js` |
| Backlog | Vista proyecto | Sí | Sí | Sí (`backlogService`) | No | No | PARITY_OK | `Backlog.jsx`, `modules/backlog/backlogService.js` | — | Mantener |
| **Change Requests** | Listado / gestión CR | **No** (sin ruta en `router.jsx`) | Sí (backend `changeRequest` rutas) | N/A en pantalla dedicada | N/A | **Sí** | **GAP_PENDING** | Solo uso: `ReleaseEditor.jsx` + `releasesService` exigen `change_request_id` UUID manual para start/publish | Sin UI para crear/listar/aprobar CR | WAVE futura o convivir con API/Postman |
| Backlog (producto) | Reports no-admin | No en React | Sí (`/reports/...`) | — | — | Sí | GAP_PENDING | No hay `Reports.jsx` en React | Reportes proyecto/sprint fuera de SPA React | Scope futuro |
| Documents | Gestión documentos | No en React | Sí | — | `public/js/views/documents.js` existe sin entry HTML | Sí | GAP_PENDING | Sin ruta en `router.jsx` | Módulo no migrado a React en router | Inventario legacy |
| Improvements | Mejoras | No en React | Sí | — | `public/js/views/improvements.js` | Sí | GAP_PENDING | Sin ruta React | — | Inventario legacy |
| Delivery / Work orders | Tareas operativas | No en React (en scope router) | Sí (API bajo proyecto) | — | `public/js/modules/...` | Sí | UNKNOWN / GAP_PENDING | No auditado exhaustivo | — | Decidir producto |

## Síntesis crítica

1. **Change Requests:** backend completo; **UI React no tiene módulo CR** → **GAP_PENDING** (crítico para gobierno de cambios si el producto lo exige en pantalla).
2. **Releases en React:** flujo canónico por **historias** en `releasesService`; **paridad con notas** respecto a rutas legacy assign-feature.
3. **Dashboard / Admin:** sin mocks en código fuente revisado; Admin usa secciones `admin-section-*` (WAVE 5).

## Referencias cruzadas

- [`wave-5-dashboard-admin.md`](wave-5-dashboard-admin.md)  
- [`wave4.5-canonical-alignment-inventory.md`](wave4.5-canonical-alignment-inventory.md)
