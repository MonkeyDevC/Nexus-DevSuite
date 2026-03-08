# Endpoints de la API y uso en el frontend — NEXUS DevSuite

**Base URL:** `/api/v1`  
**Prefijo en rutas:** Todas las rutas listadas van bajo `https://<origen>/api/v1/...`

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
| **Features** | | |
| GET `/api/v1/features/:featureId/stories` | Stories | Listado de stories de una feature |
| POST `/api/v1/features/:featureId/stories` | Stories | Crear user story |
| **Releases** | | |
| GET `/api/v1/releases` | Releases | Listado de releases |
| GET `/api/v1/releases/:id` | Releases → detalle | Detalle de un release |
| POST `/api/v1/releases` | Releases | Crear release |
| **Sprints** | | |
| GET `/api/v1/sprints/:id` | Sprints → detalle | Detalle de un sprint |
| GET `/api/v1/projects/:projectId/sprints` | Sprints | Listado (véase Projects) |
| POST `/api/v1/projects/:projectId/sprints` | Sprints | Crear (véase Projects) |
| PATCH `/api/v1/sprints/:id/close` | Sprints → cerrar sprint | **Nota:** Backend expone `PATCH /sprints/:id/status`; si `/close` no existe, la UI podría estar desalineada. |
| **Documents** | | |
| GET `/api/v1/documents` | Documents | Listado de documentos |
| GET `/api/v1/documents/:id` | Documents → detalle | Detalle de un documento |
| POST `/api/v1/documents` | Documents | Crear documento |
| **Reports** | | |
| GET `/api/v1/reports/projects/:projectId/summary` | Reports | Resumen por proyecto |
| GET `/api/v1/reports/sprints/:sprintId/summary` | Reports | Resumen por sprint |
| GET `/api/v1/projects/:projectId/sprints` | Reports | Sprints del proyecto para selector |
| GET `/api/v1/reports/audit` | Admin → auditoría | Log de auditoría |
| **System** | | |
| GET `/api/v1/system/metrics` | Admin → métricas | Panel de métricas (MASTER) |

### No usados desde el frontend (solo API / tests)

- GET `/api/v1/health` — comprobación de servicio (no hay pantalla).
- GET `/api/v1/auth/admin/test` — test interno.
- **Organizations:** GET current, GET by id, PATCH — sin vistas que los llamen.
- **Stories (detalle/estado/asignación):** GET `/stories/:id`, PATCH status, PATCH assign — la UI lista y crea stories desde Features, pero no usa estos endpoints en las vistas revisadas.
- **Releases (avanzado):** PATCH status, POST features, POST hotfix, PATCH release — la UI lista, detalle y crea release; no hay flujo de cambio de estado, asignar feature ni hotfix.
- **Change Requests:** todos (POST, PATCH submit/approve/reject/implement) — sin pantalla.
- **Sprints (avanzado):** PATCH `/sprints/:id/status`, POST/DELETE stories en sprint, GET sprint stories — la UI usa listado y “cerrar” (ver nota sobre `/close`); el resto no está enlazado.
- **Incidents (detalle/estado):** GET by id, PATCH status, PATCH incident — la UI lista y crea por proyecto; no hay vista de detalle/edición de incidente.
- **Improvements:** todos — sin pantalla.
- **Documents (versiones):** GET by code, POST/GET/PATCH versions y status — la UI solo lista, detalle y crea documento; no gestiona versiones.
- **Reports:** GET `/reports/users/:userId/activity` — no encontrado en las vistas revisadas.

---

## 3. Resumen

- **Endpoints totales (por método y ruta):** los listados en la sección 1.
- **Con interfaz en frontend:** los de la tabla de la sección 2 (auth, users, projects, features, stories creación/listado, releases listado/detalle/crear, sprints listado/detalle/crear y “close”, documents listado/detalle/crear, reports summary/audit, system/metrics).
- **Solo API / tests:** health, auth admin/test, organizations, change-requests, improvements, y los endpoints avanzados de stories, releases, sprints, incidents, documents (versiones) y reports/users/activity indicados arriba.

**Nota sobre Sprints:** El frontend llama a `PATCH /sprints/:id/close`. El backend define `PATCH /sprints/:id/status`. Conviene comprobar si existe un alias `/close` o adaptar la UI a `/status` con el cuerpo adecuado.
