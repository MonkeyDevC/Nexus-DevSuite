# WAVE 3 — Incidents — Evidencia de migración

**Fecha:** 2026-03-27  
**Alcance:** modelo `priority` + `story_id`, API raíz `/incidents`, PUT canónico, POST transiciones, validación story/proyecto, UI React con `shared/http`, QA.

## Endpoints (contrato Response Layer v1)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/incidents?project_id=&page=&limit=&status=` | Lista por proyecto ( `project_id` obligatorio ) |
| POST | `/api/v1/incidents` | Crear (body incluye `project_id`, `title`, `severity`, `priority`, `story_id` opcional) |
| GET | `/api/v1/incidents/:id` | Detalle |
| PUT | `/api/v1/incidents/:id` | Actualización canónica |
| PATCH | `/api/v1/incidents/:id` | Compatibilidad (delega a PUT) |
| DELETE | `/api/v1/incidents/:id` | Solo `OPEN`; respuesta `{ success, data: { id }, meta: {} }` |
| POST | `/api/v1/incidents/:id/start` | → `IN_PROGRESS` |
| POST | `/api/v1/incidents/:id/resolve` | → `RESOLVED` |
| POST | `/api/v1/incidents/:id/close` | → `CLOSED` (body `root_cause_analysis`) |

Anidado legacy (conservado): `GET/POST /api/v1/projects/:projectId/incidents`.

## Reglas ISO / dominio

- Transiciones válidas: `OPEN → IN_PROGRESS → RESOLVED → CLOSED`. Cierre: `root_cause_analysis` obligatorio; solo rol **MASTER** puede pasar a `CLOSED` (`INCIDENT_ROOT_CAUSE_REQUIRED`, `INCIDENT_CLOSE_MASTER_ONLY`).
- `story_id`: si no es null debe existir y la historia debe pertenecer al mismo proyecto (`STORY_NOT_FOUND`, `STORY_PROJECT_MISMATCH`). PUT permite asignar, cambiar o limpiar con `null`.
- DELETE solo en `OPEN` (`INCIDENT_INVALID_STATE` en otro caso).

## Frontend

- Módulo: `frontend-react/src/modules/incidents/` (`incidentDto.js`, `errorPresentation.js`, `incidentsService.js`).
- Sin `fetch` / axios directo: solo `get`, `post`, `put`, `del` desde `shared/http`.
- Páginas: `Incidents.jsx` (filtro estado, badges severidad/prioridad), `IncidentDetail.jsx` (transiciones, modal cierre, eliminar), `IncidentEditor.jsx` (creación vía `POST /incidents`, edición vía `PUT`).

## Comandos de validación ejecutados

```bash
npm test -- --testPathPattern=incidents
```

**Resultado:** PASS (16 tests) — suites `incidents.wave3.integration.test.js`, `incidents.negative.test.js`.

E2E (servidor con API + SPA en `FRONTEND_URL`, típicamente `http://localhost:3000`). Antes, construir el micro-frontend en `public/react-app`:

```bash
cd frontend-react && npm run build && cd ..
npx playwright test tests/e2e/wave3-incidents.spec.js --project=chromium
```

**Resultado local (2026-03-27):** PASS — 1 test Chromium tras `vite build`.

## Archivos tocados (entrega)

- Backend: `incident.validator.js` (`story_id` null-safe con `optional({ values: "null" })`), tests integración y negativos.
- Frontend: `router.jsx`, `Incidents.jsx`, `IncidentDetail.jsx`, `IncidentEditor.jsx`.
- E2E: `tests/e2e/wave3-incidents.spec.js`.
- DB: migración `20260327120000-wave3-incidents-priority-story` (ya referenciada en repo).

## Auditoría breve

- **Arquitectura:** capas controller → service → repository; HTTP core sin cambios.
- **Calidad:** validación centralizada de story; PUT/PATCH alineados.
- **Seguridad:** autorización MASTER en cierre; validación entrada en validators.
- **ISO:** causa raíz exigida y auditable en transición a `CLOSED`.
