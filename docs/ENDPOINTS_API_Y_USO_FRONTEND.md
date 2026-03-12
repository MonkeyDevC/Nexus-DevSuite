# Endpoints de la API y uso en el frontend — NEXUS DevSuite

**Base URL:** `/api/v1`  
**Prefijo en rutas:** Todas las rutas listadas van bajo `https://<origen>/api/v1/...`

**Referencia de auditoría:** Las nuevas implementaciones de UI y la conexión de endpoints siguen los tickets y criterios definidos en el documento de **auditoría funcional del frontend** (p. ej. `docs/AUDITORIA_FUNCIONAL_FRONTEND_2026-03.md`). Ese documento es la referencia principal para qué endpoints deben tener uso en frontend y con qué flujo. Tras implementar cada ticket derivado de la auditoría, este archivo debe actualizarse para reflejar el uso real.

---

## 1. Listado completo de endpoints existentes

### Health (sin autenticación)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/health` | Estado del servicio |

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Login (email, password) |
| POST | `/api/v1/auth/refresh` | Renovar access token con refresh_token |
| POST | `/api/v1/auth/logout` | Cerrar sesión (refresh_token) |
| GET | `/api/v1/auth/me` | Usuario actual (requiere token) |
| GET | `/api/v1/auth/roles` | Listar roles (MASTER) |
| GET | `/api/v1/auth/admin/test` | Test admin (MASTER) |

### Users
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/users` | Crear usuario (MASTER) |
| POST | `/api/v1/users/:id/photo` | Subir foto de usuario |
| GET | `/api/v1/users` | Listar usuarios (MASTER, EMPLOYEE) |
| GET | `/api/v1/users/:id` | Obtener usuario por id |
| PUT | `/api/v1/users/:id` | Actualizar usuario (MASTER) |
| DELETE | `/api/v1/users/:id` | Soft delete usuario (MASTER) |
| PATCH | `/api/v1/users/:id/password` | Cambiar contraseña |

### Organizations
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/organizations/current` | Organización actual |
| GET | `/api/v1/organizations/:id` | Organización por id |
| PATCH | `/api/v1/organizations/:id` | Actualizar organización (MASTER) |

### Projects (backlog)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/projects` | Crear proyecto (MASTER) |
| GET | `/api/v1/projects` | Listar proyectos |
| GET | `/api/v1/projects/:id` | Obtener proyecto por id |
| PATCH | `/api/v1/projects/:id` | Actualizar proyecto (MASTER) |
| DELETE | `/api/v1/projects/:id` | Eliminar proyecto (MASTER) |
| POST | `/api/v1/projects/bulk-delete` | Eliminar múltiples proyectos; body: `{ "ids": ["uuid1", "uuid2", ...] }` (MASTER, máx. 100) |
| PATCH | `/api/v1/projects/:id/archive` | Archivar proyecto (MASTER) |
| GET | `/api/v1/projects/:projectId/features` | Listar features del proyecto |
| POST | `/api/v1/projects/:projectId/features` | Crear feature en proyecto |
| GET | `/api/v1/projects/:projectId/sprints` | Listar sprints del proyecto |
| POST | `/api/v1/projects/:projectId/sprints` | Crear sprint en proyecto |
| GET | `/api/v1/projects/:projectId/incidents` | Listar incidentes del proyecto |
| POST | `/api/v1/projects/:projectId/incidents` | Crear incidente en proyecto |

### Features
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/features/:id` | Obtener feature por id |
| GET | `/api/v1/features/:featureId/stories` | Listar user stories de la feature |
| POST | `/api/v1/features/:featureId/stories` | Crear user story en feature |
| PATCH | `/api/v1/features/:id/status` | Cambiar estado de la feature |

### Stories (User Stories)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/stories/:id` | Obtener story por id |
| PATCH | `/api/v1/stories/:id/status` | Cambiar estado de la story |
| PATCH | `/api/v1/stories/:id/assign` | Asignar story |
| PATCH | `/api/v1/stories/:id/sprint` | Asignar/quitar sprint a la story (por ID) |
| PATCH | `/api/v1/stories/:id` | Actualizar story (título, descripción, prioridad, criterios, etc.) |

### Releases
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/releases` | Crear release (MASTER) |
| GET | `/api/v1/releases` | Listar releases |
| GET | `/api/v1/releases/:id` | Obtener release por id |
| PATCH | `/api/v1/releases/:id/status` | Cambiar estado del release |
| POST | `/api/v1/releases/:id/features/:featureId` | Asignar feature al release |
| POST | `/api/v1/releases/:id/hotfix` | Crear hotfix en release |
| PATCH | `/api/v1/releases/:id` | Actualizar release (descripción, etc.) (MASTER) |
| DELETE | `/api/v1/releases/:id` | Eliminar release (MASTER); las features quedan desasociadas |
| POST | `/api/v1/releases/bulk-delete` | Eliminar múltiples releases; body: `{ "ids": ["uuid1", "uuid2", ...] }` (MASTER, máx. 100) |

### Change Requests
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/change-requests` | Crear change request |
| PATCH | `/api/v1/change-requests/:id/submit` | Enviar a revisión |
| PATCH | `/api/v1/change-requests/:id/approve` | Aprobar (MASTER) |
| PATCH | `/api/v1/change-requests/:id/reject` | Rechazar (MASTER) |
| PATCH | `/api/v1/change-requests/:id/implement` | Marcar implementado (MASTER) |

### Sprints
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/sprints/:id` | Obtener sprint por id |
| PATCH | `/api/v1/sprints/:id` | Actualizar sprint (campos permitidos) |
| DELETE | `/api/v1/sprints/:id` | Eliminar sprint (según reglas de dominio) |
| PATCH | `/api/v1/sprints/:id/status` | Cambiar estado del sprint |
| POST | `/api/v1/sprints/:id/stories/:storyId` | Asignar story al sprint |
| DELETE | `/api/v1/sprints/:id/stories/:storyId` | Quitar story del sprint |
| GET | `/api/v1/sprints/:id/stories` | Listar stories del sprint |

### Incidents
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/incidents/:id` | Obtener incidente por id |
| PATCH | `/api/v1/incidents/:id/status` | Cambiar estado del incidente |
| PATCH | `/api/v1/incidents/:id` | Actualizar incidente |

### Improvements
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/improvements` | Crear mejora |
| GET | `/api/v1/improvements` | Listar mejoras |
| GET | `/api/v1/improvements/:id` | Obtener mejora por id |
| PATCH | `/api/v1/improvements/:id/status` | Cambiar estado de la mejora |

### Documents
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/documents` | Crear documento |
| GET | `/api/v1/documents` | Listar documentos |
| GET | `/api/v1/documents/code/:code` | Obtener documento por código |
| GET | `/api/v1/documents/:id` | Obtener documento por id |
| POST | `/api/v1/documents/:documentId/versions` | Crear versión |
| GET | `/api/v1/documents/:documentId/versions` | Listar versiones |
| GET | `/api/v1/documents/:documentId/versions/:versionId` | Obtener versión |
| PATCH | `/api/v1/documents/:documentId/versions/:versionId` | Actualizar versión |
| PATCH | `/api/v1/documents/:documentId/versions/:versionId/status` | Cambiar estado de versión |

### Dashboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/dashboard/summary` | Resumen del panel (proyectos, stories, sprint activo, incidentes críticos, mis asignaciones). Requiere autenticación. |

### Reports
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/reports/projects/:projectId/summary` | Resumen del proyecto |
| GET | `/api/v1/reports/sprints/:sprintId/summary` | Resumen del sprint |
| GET | `/api/v1/reports/users/:userId/activity` | Actividad del usuario |
| GET | `/api/v1/reports/audit` | Log de auditoría (MASTER) |

### System (métricas)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/system/metrics` | Métricas del sistema (MASTER) |

---

## 2. Endpoints usados desde el frontend (interfaz)

En la carpeta `public/` (HTML + JS) estos son los endpoints que se llaman desde la UI. El resto existen en la API pero **no** tienen pantalla/acción que los use todavía.

### Usados en frontend

| Endpoint | Vista / flujo | Uso |
|----------|----------------|-----|
| **Auth** | | |
| POST `/api/v1/auth/login` | Login (`#/login`) | Inicio de sesión |
| POST `/api/v1/auth/refresh` | `api.js` (automático) | Renovar token en 401 |
| POST `/api/v1/auth/logout` | Cerrar sesión (auth.js) | Logout |
| GET `/api/v1/auth/me` | Dashboard, Admin, guard de rutas | Usuario actual |
| GET `/api/v1/dashboard/summary` | Dashboard (#/dashboard) | Tarjetas métricas, sprint activo, mis asignaciones |
| GET `/api/v1/auth/roles` | Admin → usuarios | Listado de roles al crear/editar usuario |
| **Users** | | |
| GET `/api/v1/users` | Admin → usuarios | Listado de usuarios |
| GET `/api/v1/users/:id` | Admin → editar usuario | Detalle usuario |
| POST `/api/v1/users` | Admin → crear usuario | Alta de usuario |
| PUT `/api/v1/users/:id` | Admin → editar usuario | Actualizar usuario |
| DELETE `/api/v1/users/:id` | Admin → eliminar usuario | Baja de usuario |
| PATCH `/api/v1/users/:id/password` | Admin → cambiar contraseña | Cambio de contraseña (admin y propio) |
| POST `/api/v1/users/:id/photo` | Admin → foto de usuario | Subir avatar |
| **Projects** | | |
| GET `/api/v1/projects` | Dashboard, Projects, Features, Stories, Sprints, Reports, Incidents | Listado de proyectos |
| GET `/api/v1/projects/:id` | Projects → detalle | Detalle de un proyecto |
| POST `/api/v1/projects` | Projects → crear | Crear proyecto |
| PATCH `/api/v1/projects/:id/archive` | Projects → archivar | Archivar proyecto |
| GET `/api/v1/projects/:projectId/features` | Features, Stories | Listado de features de un proyecto |
| POST `/api/v1/projects/:projectId/features` | Features | Crear feature |
| GET `/api/v1/projects/:projectId/sprints` | Sprints, Reports | Listado de sprints de un proyecto |
| POST `/api/v1/projects/:projectId/sprints` | Sprints | Crear sprint |
| GET `/api/v1/projects/:projectId/incidents` | Incidents | Listado de incidentes de un proyecto |
| POST `/api/v1/projects/:projectId/incidents` | Incidents | Crear incidente |
| GET `/api/v1/incidents/:id` | Incidents → detalle | Detalle de incidente (#/incidents/:id) |
| PATCH `/api/v1/incidents/:id` | Incidents → detalle | Actualizar asignado a y causa raíz |
| PATCH `/api/v1/incidents/:id/status` | Incidents → detalle | Cambiar estado (OPEN, IN_PROGRESS, RESOLVED, CLOSED) |
| **Features** | | |
| GET `/api/v1/features/:id` | Features, Stories | Detalle de feature (breadcrumb, proyecto) |
| GET `/api/v1/features/:featureId/stories` | Stories | Listado de stories de una feature |
| POST `/api/v1/features/:featureId/stories` | Stories | Crear user story |
| PATCH `/api/v1/features/:id/status` | Features → lista | Cambiar estado de la feature (dropdown por fila). Cuerpo: `{ "status": "..." }`. |
| **Stories** | | |
| GET `/api/v1/stories/:id` | Stories → detalle (modal) | Cargar detalle de la story al hacer clic en Ver. |
| PATCH `/api/v1/stories/:id/status` | Stories → detalle | Cambiar estado desde pestaña Vista o Edición. |
| PATCH `/api/v1/stories/:id/assign` | Stories → detalle | Asignar usuario (dropdown "Asignado a" en Edición). Cuerpo: `{ "assigned_to": "userId" }`. |
| PATCH `/api/v1/stories/:id` | Stories → detalle | Editar título, descripción, prioridad, criterios. |
| **Releases** | | |
| GET `/api/v1/releases` | Releases | Listado de releases (contador de registros para todos los perfiles) |
| GET `/api/v1/releases/:id` | Releases → detalle | Detalle de un release |
| POST `/api/v1/releases` | Releases | Crear release |
| PATCH `/api/v1/releases/:id/status` | Releases → detalle | Cambiar estado del release (PLANNED, IN_PROGRESS, QA, RELEASED, ARCHIVED). |
| POST `/api/v1/releases/:id/features/:featureId` | Releases → detalle | Asignar feature al release (selector proyecto + feature + botón). |
| POST `/api/v1/releases/:id/hotfix` | Releases → detalle | Crear hotfix (MASTER); redirige al nuevo release. Solo desde release en RELEASED. |
| PATCH `/api/v1/releases/:id` | Releases → detalle | Editar descripción del release (MASTER). |
| DELETE `/api/v1/releases/:id` | Releases → fila | Eliminar un release (MASTER) |
| POST `/api/v1/releases/bulk-delete` | Releases → eliminación múltiple | Eliminación múltiple (MASTER) |
| **Sprints** | | |
| GET `/api/v1/sprints/:id` | Sprints → detalle | Detalle de un sprint |
| GET `/api/v1/projects/:projectId/sprints` | Sprints | Listado (véase Projects) |
| POST `/api/v1/projects/:projectId/sprints` | Sprints | Crear (véase Projects) |
| PATCH `/api/v1/sprints/:id/status` | Sprints → cerrar sprint | Cuerpo: `{ "status": "CLOSED" }`. La acción "Cerrar sprint" en el detalle del sprint usa exclusivamente esta ruta. |
| GET `/api/v1/sprints/:id/stories` | Sprints → detalle | Listar stories del sprint (sección "Stories del sprint"). |
| POST `/api/v1/sprints/:id/stories/:storyId` | Sprints → detalle | Asignar story al sprint (selector + botón "Asignar"). |
| DELETE `/api/v1/sprints/:id/stories/:storyId` | Sprints → detalle | Quitar story del sprint (botón "Quitar del sprint"). |
| **Organizations** | | |
| GET `/api/v1/organizations/current` | Admin → Organización (#/admin/organization) | Mostrar datos de la organización actual. |
| GET `/api/v1/organizations/:id` | Admin → Organización | Detalle al editar (si aplica). |
| PATCH `/api/v1/organizations/:id` | Admin → Organización | Editar nombre, plan, billing_email, next_billing_date (MASTER). |
| **Improvements** | | |
| GET `/api/v1/improvements` | Mejoras (#/improvements) | Listado con paginación y filtro por estado. |
| POST `/api/v1/improvements` | Mejoras → Nueva mejora | Crear mejora (título, descripción). |
| GET `/api/v1/improvements/:id` | Mejoras → detalle (#/improvements/:id) | Detalle de la mejora. |
| PATCH `/api/v1/improvements/:id/status` | Mejoras → detalle | Cambiar estado (DRAFT, PROPOSED, APPROVED, REJECTED, IMPLEMENTED). |
| **Documents** | | |
| GET `/api/v1/documents` | Documents | Listado de documentos |
| GET `/api/v1/documents/code/:code` | Documents | Búsqueda por código exacto (control "Buscar por código" + Ir); redirección a #/documents/:id. |
| GET `/api/v1/documents/:id` | Documents → detalle | Detalle de un documento |
| POST `/api/v1/documents` | Documents | Crear documento |
| GET `/api/v1/documents/:documentId/versions` | Documents → detalle | Listar versiones del documento (sección Versiones). |
| GET `/api/v1/documents/:documentId/versions/:versionId` | Documents → detalle | Obtener versión (botón "Ver contenido"; modal con contenido; edición si DRAFT y MASTER). |
| PATCH `/api/v1/documents/:documentId/versions/:versionId` | Documents → detalle | Actualizar contenido de versión (modal "Ver contenido" → Guardar cuando versión DRAFT y usuario MASTER). |
| POST `/api/v1/documents/:documentId/versions` | Documents → detalle | Crear nueva versión (Nueva versión; change_reason, content opcionales). |
| PATCH `/api/v1/documents/:documentId/versions/:versionId/status` | Documents → detalle | Aprobar (APPROVED) o Archivar (ARCHIVED) versión. |
| **Change Requests** | | |
| POST `/api/v1/change-requests` | Change Requests (#/change-requests) | Crear CR (entity_type, entity_id obligatorios; title, description, type, impact_level opcionales). |
| PATCH `/api/v1/change-requests/:id/submit` | Change Requests | Enviar a revisión (acciones por ID). |
| PATCH `/api/v1/change-requests/:id/approve` | Change Requests | Aprobar (MASTER). |
| PATCH `/api/v1/change-requests/:id/reject` | Change Requests | Rechazar (MASTER). |
| PATCH `/api/v1/change-requests/:id/implement` | Change Requests | Marcar implementado (MASTER). |
| **Reports** | | |
| GET `/api/v1/reports/projects/:projectId/summary` | Reports | Resumen por proyecto |
| GET `/api/v1/reports/sprints/:sprintId/summary` | Reports | Resumen por sprint |
| GET `/api/v1/projects/:projectId/sprints` | Reports | Sprints del proyecto para selector |
| GET `/api/v1/reports/users/:userId/activity` | Dashboard, Reportes → Actividad por usuario | Actividad reciente (dashboard) y vista dedicada en Reportes (selector usuario + Ver actividad). |
| GET `/api/v1/reports/audit` | Admin → auditoría | Log de auditoría |
| **System** | | |
| GET `/api/v1/system/metrics` | Admin → métricas | Panel de métricas (MASTER) |
| GET `/api/v1/health` | Footer (layout) | Indicador de estado de la API (API: OK / API: Error). Llamada al cargar la navegación; no bloquea la app si falla. |

### No usados desde el frontend (solo API / tests)

- GET `/api/v1/auth/admin/test` — test interno.
- (Documents: GET by code y GET/PATCH versión por versionId pasan a usarse desde el frontend; ver tabla Documents.)

---

## 3. Resumen

- **Endpoints totales (por método y ruta):** los listados en la sección 1.
- **Con interfaz en frontend:** los de la tabla de la sección 2 (auth, users, projects, features, stories, releases, sprints, organizations, improvements, incidents, documents con versiones, change-requests, reports con actividad por usuario, system/metrics).
- **Solo API / tests:** auth admin/test.

**Nota sobre Sprints:** El frontend usa `PATCH /sprints/:id/status` con cuerpo `{ "status": "CLOSED" }` para "Cerrar sprint". En el detalle del sprint se usan GET `/sprints/:id/stories`, POST y DELETE `/sprints/:id/stories/:storyId` para listar, asignar y quitar stories. No se utiliza la ruta `/close`.
