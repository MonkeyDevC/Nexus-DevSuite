# Lista endpoints a conectar — ETAPA 20 (11-03-2026)

**Uso:** Guía para MASTER DEVELOPER el Día 3. Cada fila = endpoint que debe tener uso en frontend (pantalla o flujo).  
**Origen:** docs/ENDPOINTS_API_Y_USO_FRONTEND.md (sección "No usados desde el frontend").

---

## Tabla de implementación

| Prioridad | Endpoint(s) | Vista / flujo a implementar | ☐ |
|-----------|-------------|----------------------------|---|
| 1 | Organizations: GET current, GET :id, PATCH :id | Vista #/organization o sección en Admin: ver datos org, editar (MASTER). | |
| 2 | Change Requests: POST, PATCH submit/approve/reject/implement | Módulo #/change-requests: listar, crear, Submit, Approve/Reject/Implement (MASTER). | |
| 3 | Improvements: POST, GET list, GET :id, PATCH status | Módulo #/improvements: listar, crear, detalle, cambiar estado. | |
| 4 | Incidents: GET :id, PATCH status, PATCH :id | Vista detalle #/incidents/:id (o desde proyecto): ver, editar, cambiar estado. | |
| 5 | Sprints: PATCH :id/status, POST :id/stories/:storyId, DELETE :id/stories/:storyId, GET :id/stories | En detalle sprint: cambiar estado (reemplazar /close por /status si aplica), asignar/quitar stories, listar stories del sprint. | |
| 6 | Stories: GET :id, PATCH status, PATCH assign | En listado/detalle stories: cambiar estado, asignar usuario; vista detalle story. | |
| 7 | Releases: PATCH status, POST :id/features/:featureId, POST :id/hotfix, PATCH :id | En detalle release: cambiar estado, asignar feature, hotfix, editar release. | |
| 8 | Documents: GET code/:code, POST/GET/PATCH versions, PATCH version status | En detalle documento: sección Versiones; crear, listar, aprobar/archivar versión. | |
| 9 | Reports: GET /reports/users/:userId/activity | Reportes o Admin: selector usuario → mostrar actividad del usuario. | |
| 10 | GET /health | Opcional: Admin o footer "API: OK". | |
| 11 | GET /auth/admin/test | Opcional: solo si hay pantalla de test admin. | |

---

## Nota técnica (Etapa 21)

- **Sprints:** Backend usa `PATCH /sprints/:id/status`. Si la UI llama a `/close`, alinear en Etapa 21 o en esta misma etapa usando `/status` con body `{ status: "CLOSED" }` (o el valor que defina la API).

---

*Al completar cada fila, actualizar docs/ENDPOINTS_API_Y_USO_FRONTEND.md para marcar el endpoint como "usado en frontend".*
