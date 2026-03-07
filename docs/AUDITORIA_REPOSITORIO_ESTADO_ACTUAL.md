# Auditoría completa del estado actual del repositorio — NEXUS DevSuite

**Fecha de auditoría:** 2026-03-03  
**Objetivo:** Informe técnico preciso para que otra IA pueda continuar el desarrollo sin conocimiento previo del proyecto.  
**Base:** Análisis exclusivo del código y archivos existentes en el repositorio.

---

## 1. IDENTIFICACIÓN DEL PROYECTO

| Campo | Valor |
|-------|--------|
| **Nombre del proyecto** | nexus-devsuite |
| **Versión estimada del sistema** | 0.1.0 (en `package.json`) |
| **Descripción** | Base operativa de Nexus DevSuite para gestión empresarial certificable. |

**Stack tecnológico completo detectado:**

| Categoría | Tecnología |
|-----------|------------|
| **Backend** | Node.js (CommonJS), Express ^4.21.2 |
| **Base de datos** | MySQL 8.0 (driver mysql2 ^3.11.4) |
| **ORM** | Sequelize ^6.37.5 |
| **Autenticación** | JWT (jsonwebtoken ^9.0.2), bcryptjs ^2.4.3 |
| **Infraestructura** | dotenv, cors, helmet, express-rate-limit, pino/pino-http (logging) |
| **Herramientas de desarrollo** | Jest ^29.7.0, supertest ^7.0.0, sequelize-cli ^6.6.2, nodemon ^3.1.7, eslint ^10.0.2 |

---

## 2. ARQUITECTURA DEL REPOSITORIO

Estructura real de carpetas principales bajo `src/`:

```
src/
├── config/           # env.js, database.js, logger.js
├── infrastructure/
│   ├── db/           # loadModels.js, sequelize-cli.config.js, migrations/, seeders/
│   ├── repositories/ # .gitkeep (vacío)
│   └── integrations/
│       └── nexusCore/ # .gitkeep (vacío)
├── middlewares/      # authenticate, authorize, auditLogger, errorHandler, notFound,
│                     # requestContext, responseVersion, shutdownGuard, metrics
├── modules/
│   ├── auth/         # login, refresh, logout, JWT, roles, refresh tokens, audit log model
│   ├── backlog/      # projects, features, user stories (controllers, services, repos, routes)
│   ├── changeRequests/
│   ├── health/       # health controller
│   ├── releases/     # release CRUD, status, assign features, hotfix, SemVer
│   ├── users/        # CRUD usuarios, change password
│   ├── projects/     # .gitkeep (lógica bajo backlog)
│   ├── roles/        # .gitkeep
│   ├── audit/        # .gitkeep
│   └── (users models en auth/models)
├── routes/           # index.js (monta /api/v1), v1.routes.js
├── shared/
│   ├── errors/       # AppError, errorCodes.js
│   ├── responses/    # responseLayer.js (buildSuccess, buildError)
│   ├── shutdownState.js
│   ├── constants/    # .gitkeep
│   ├── utils/        # .gitkeep
│   └── validators/   # schemas/.gitkeep
├── system/
│   └── metrics/      # metrics.routes, metrics.controller, metrics.store, metrics.middleware
├── app.js
└── server.js
```

**Módulos con implementación real:**

| Módulo | Ubicación | Propósito |
|--------|-----------|-----------|
| **auth** | `src/modules/auth/` | Login, refresh, logout, JWT, roles, RefreshToken, AuditLog (modelo) |
| **backlog** | `src/modules/backlog/` | Projects, Features, UserStories (rutas: projects, feature, stories) |
| **changeRequests** | `src/modules/changeRequests/` | Change Request (CR) ciclo de vida, workflow, integración con Release/Feature |
| **health** | `src/modules/health/` | GET /health |
| **releases** | `src/modules/releases/` | Releases SemVer, estados, asignación features, hotfix |
| **users** | `src/modules/users/` | CRUD usuarios, cambio de contraseña |
| **system/metrics** | `src/system/metrics/` | Métricas HTTP y contadores, GET /system/metrics |

**Módulos solo placeholder (.gitkeep):** `projects/`, `roles/`, `audit/`, `infrastructure/repositories/`, `infrastructure/integrations/nexusCore/`.

---

## 3. BASE DE DATOS

Tablas detectadas por migraciones (orden de creación):

| Tabla | Propósito | Campos principales | Relaciones |
|-------|-----------|--------------------|------------|
| **roles** | Roles RBAC | id (UUID), name (unique), description | — |
| **users** | Usuarios del sistema | id, email (unique), password_hash, role_id, is_active, created_at, updated_at | role_id → roles. Índice uq_users_email. |
| **refresh_tokens** | Tokens de refresco JWT (una sesión por usuario) | id, user_id, token_hash, expires_at, revoked → luego revoked_at (migración single-session) | user_id → users. Índice uq_refresh_tokens_user_id (una fila por usuario). |
| **audit_logs** | Registro de auditoría append-only | id, user_id, action, entity, entity_id, metadata (JSON), ip_address, user_agent, request_id (añadido en migración), created_at | user_id → users. Índices user_id, created_at, request_id. |
| **projects** | Proyectos de gobernanza | id, name (unique), description, status (ACTIVE\|ARCHIVED), created_by, archived_at, timestamps | created_by → users. Índices created_by, status, uq_projects_name. |
| **features** | Features por proyecto | id, project_id, title, description, status (DRAFT\|APPROVED\|IN_PROGRESS\|DONE\|ARCHIVED), priority, created_by, approved_by, approved_at, closed_at, release_id (añadido en migración), timestamps | project_id → projects; created_by, approved_by → users; release_id → releases. Índices project_id, status, created_by, approved_by, release_id. |
| **user_stories** | User stories por feature | id, feature_id, title, description, acceptance_criteria (JSON), status (DRAFT\|READY\|…\|ARCHIVED), priority, assigned_to, created_by, approved_by, closed_at, timestamps | feature_id → features; created_by, approved_by, assigned_to → users. Índices feature_id, assigned_to, status, created_by. |
| **releases** | Releases con versionado SemVer | id, version (unique), status (PLANNED\|IN_PROGRESS\|QA\|RELEASED\|ROLLED_BACK\|ARCHIVED), description, created_by, released_at, created_at, updated_at, deleted_at (paranoid) | created_by → users. Features tienen release_id → releases. Índices uq_releases_version, status, created_by. |
| **change_requests** | Solicitudes de cambio (Change Control) | id, code (unique), title, description, type, impact_level, status (DRAFT\|SUBMITTED\|APPROVED\|REJECTED\|IMPLEMENTED), requested_by, approved_by, entity_type (FEATURE\|RELEASE), entity_id (obligatorios), approved_at, implemented_at, timestamps, deleted_at | requested_by, approved_by → users. entity_type/entity_id referencian Feature o Release. Índices uq_cr_code, idx_cr_status, idx_cr_entity. |

**Otras migraciones:**  
- `add-request-id-to-audit-logs`: añade request_id a audit_logs.  
- `alter-refresh-tokens-single-session`: deduplica refresh_tokens por usuario, añade revoked_at, índice único user_id (una sesión por usuario).  
- `add-deleted-at-to-users`: soft delete en users (paranoid).  
- `add-release-id-to-features`: FK release_id en features.

---

## 4. FUNCIONALIDADES IMPLEMENTADAS

Evaluación según código real:

| Funcionalidad | Estado | Notas |
|---------------|--------|--------|
| Autenticación JWT | **IMPLEMENTADO** | login, access token, verificación en authenticateMiddleware |
| Refresh token rotation | **IMPLEMENTADO** | Nuevo refresh token en cada refresh; hash SHA256 + bcrypt en auth.service |
| Single session enforcement | **IMPLEMENTADO** | Índice único user_id en refresh_tokens; upsertByUserId reemplaza token por usuario |
| Logout con revocación | **IMPLEMENTADO** | logout revoca por user (revokeByUserId), revoked_at |
| Workflow Change Requests | **IMPLEMENTADO** | DRAFT→SUBMITTED→APPROVED/REJECTED→IMPLEMENTED; validación en service y uso en Release/Feature |
| Auditoría | **IMPLEMENTADO** | audit_logs; middleware registra HTTP no-GET o status≥400; servicios registran STATUS_CHANGE, FEATURE_ASSIGN_RELEASE, HOTFIX_CREATED, etc. |
| Observabilidad | **IMPLEMENTADO** | request_id por request, logger (pino), metrics (contadores, latencia), GET /api/v1/system/metrics (MASTER) |
| RBAC | **IMPLEMENTADO** | authorizeMiddleware(…roles), roles MASTER/EMPLOYEE; control por ruta |
| Rate limiting | **IMPLEMENTADO** | express-rate-limit global en app.js, handler con AUTH_RATE_LIMIT_EXCEEDED |
| Workflow Feature/Story | **IMPLEMENTADO** | TRANSITION_MAP en workflow.constants.js, validateTransition en workflow.validator.js |
| Workflow Release | **IMPLEMENTADO** | TRANSITION_MAP_RELEASE, release.workflow.validator, SemVer estricto, anti-downgrade, hotfix |
| Versionado SemVer (releases) | **IMPLEMENTADO** | semver.validator.js, versión inmutable, released_at solo QA→RELEASED |
| Control de cambios (CR) en Release/Feature | **IMPLEMENTADO** | change_request_id obligatorio en acciones estructurales; validateAndConsumeChangeRequest; markAsImplemented tras éxito |
| Sistema de Sprints | **NO EXISTE** | No hay entidad Sprint ni rutas de sprints |
| Gestión de incidentes | **NO EXISTE** | No hay módulo ni entidad Incident |
| Sistema documental / versionado documental | **NO EXISTE** | No hay módulo de documentos ni versionado de documentos |
| Time tracking | **NO EXISTE** | No hay entidad ni endpoints de tiempo |

---

## 5. API ACTUAL

Prefijo base: **`/api/v1`**. Todas las rutas listadas son bajo ese prefijo.

| METHOD | Endpoint | Controlador / Módulo | Propósito |
|--------|----------|----------------------|-----------|
| GET | /api/v1/health | healthController | Health check (status, timestamp_utc, request_id) |
| POST | /api/v1/auth/login | auth.controller | Login (email, password) → access_token, refresh_token |
| POST | /api/v1/auth/refresh | auth.controller | Refresco de tokens (refresh_token en body) |
| POST | /api/v1/auth/logout | auth.controller | Logout (revoca refresh) |
| GET | /api/v1/auth/me | auth.controller | Usuario actual (autenticado) |
| GET | /api/v1/auth/admin/test | auth.controller | Ruta de prueba MASTER |
| POST | /api/v1/users | users.controller | Crear usuario (MASTER) |
| GET | /api/v1/users | users.controller | Listar usuarios (MASTER, EMPLOYEE) |
| GET | /api/v1/users/:id | users.controller | Obtener usuario por id |
| PUT | /api/v1/users/:id | users.controller | Actualizar usuario (MASTER) |
| DELETE | /api/v1/users/:id | users.controller | Soft delete usuario (MASTER) |
| PATCH | /api/v1/users/:id/password | users.controller | Cambiar contraseña (propio usuario) |
| GET | /api/v1/system/metrics | metrics.controller | Métricas (MASTER) |
| POST | /api/v1/projects | backlog.controller | Crear proyecto (MASTER) |
| GET | /api/v1/projects | backlog.controller | Listar proyectos |
| GET | /api/v1/projects/:id | backlog.controller | Obtener proyecto |
| PATCH | /api/v1/projects/:id/archive | backlog.controller | Archivar proyecto (MASTER) |
| GET | /api/v1/projects/:projectId/features | backlog.controller | Listar features de un proyecto |
| POST | /api/v1/projects/:projectId/features | backlog.controller | Crear feature en proyecto |
| GET | /api/v1/features/:id | backlog.controller | Obtener feature |
| GET | /api/v1/features/:featureId/stories | backlog.controller | Listar stories de una feature |
| PATCH | /api/v1/features/:id/status | backlog.controller | Cambiar estado feature (exige change_request_id si aplica) |
| POST | /api/v1/features/:featureId/stories | backlog.controller | Crear story en feature |
| GET | /api/v1/stories/:id | backlog.controller | Obtener story |
| PATCH | /api/v1/stories/:id/status | backlog.controller | Cambiar estado story |
| PATCH | /api/v1/stories/:id/assign | backlog.controller | Asignar story a usuario |
| POST | /api/v1/releases | release.controller | Crear release (MASTER) |
| GET | /api/v1/releases | release.controller | Listar releases (MASTER) |
| GET | /api/v1/releases/:id | release.controller | Obtener release |
| PATCH | /api/v1/releases/:id/status | release.controller | Cambiar estado release (MASTER, change_request_id) |
| POST | /api/v1/releases/:id/features/:featureId | release.controller | Asignar feature a release (MASTER, change_request_id) |
| POST | /api/v1/releases/:id/hotfix | release.controller | Crear hotfix desde release RELEASED (MASTER, change_request_id) |
| PATCH | /api/v1/releases/:id | release.controller | Actualizar descripción release (MASTER, change_request_id) |
| POST | /api/v1/change-requests | changeRequest.controller | Crear CR (MASTER, EMPLOYEE) |
| PATCH | /api/v1/change-requests/:id/submit | changeRequest.controller | Pasar CR a SUBMITTED |
| PATCH | /api/v1/change-requests/:id/approve | changeRequest.controller | Aprobar CR (MASTER) |
| PATCH | /api/v1/change-requests/:id/reject | changeRequest.controller | Rechazar CR (MASTER) |
| PATCH | /api/v1/change-requests/:id/implement | changeRequest.controller | Marcar CR como IMPLEMENTED (MASTER) |

---

## 6. WORKFLOWS IMPLEMENTADOS

| Workflow | Archivos | Estados / Transiciones |
|----------|----------|--------------------------|
| **Feature** | `backlog/workflow.constants.js`, `workflow.validator.js` | DRAFT→APPROVED→IN_PROGRESS→DONE→ARCHIVED. Prohibidas otras transiciones. |
| **User Story** | Mismo módulo backlog | DRAFT→READY→IN_PROGRESS→{BLOCKED↔IN_PROGRESS, IN_REVIEW}→DONE→ARCHIVED. |
| **Release** | `releases/release.workflow.constants.js`, `release.workflow.validator.js` | PLANNED→IN_PROGRESS→QA→RELEASED o ROLLED_BACK; RELEASED→ARCHIVED; ROLLED_BACK→IN_PROGRESS. ARCHIVED sin salida. SemVer y anti-downgrade en service. |
| **Change Request** | `changeRequests/changeRequest.workflow.constants.js`, `changeRequest.workflow.validator.js` | DRAFT→SUBMITTED→APPROVED|REJECTED; APPROVED→IMPLEMENTED. REJECTED e IMPLEMENTED finales. |

No existen en código: **Incident workflow**, **Document workflow**, **Sprint workflow**.

---

## 7. ESTADO DEL PLAN MAESTRO

**Nota:** El documento "NEXUS DevSuite — Plan Maestro Estratégico ISO 9001 Ready (Versión 2.0)" **no está en el repositorio**. La evaluación se basa en las etapas típicas de un plan de este tipo (referenciadas en la solicitud de auditoría) y en lo que existe en el código.

| Etapa | Estado | Explicación breve |
|-------|--------|--------------------|
| **ETAPA 0 — Infraestructura Base** | **COMPLETADA** | app.js, server.js, config (env, database, logger), middlewares (requestContext, errorHandler, notFound, responseVersion, shutdownGuard, metrics, auditLogger, rate limit), health, carga de modelos sin sync. |
| **ETAPA 1 — Gobernanza Base** | **COMPLETADA** | Project, Feature, UserStory con workflows formales, rutas, servicios, repositorios, auditoría de cambios de estado, índices y códigos de error documentados. |
| **ETAPA 2 — Gestión de Sprints** | **NO INICIADA** | No existe entidad Sprint ni rutas de sprints. Sí está implementada la **gestión de Releases** (versionado SemVer, estados, hotfix), que en el historial del proyecto se denominó "ETAPA 2" de implementación. |
| **ETAPA 3 — Gestión de Incidentes** | **NO INICIADA** | No hay entidad Incident ni flujo de incidentes. Sí está implementado **Change Control (ChangeRequest)** como control de cambios sobre Feature/Release, que en el historial se llamó "ETAPA 3". |
| **ETAPA 4 — Sistema Documental ISO** | **NO INICIADA** | No hay módulo de documentos, versionado documental ni flujos documentales. |
| **ETAPA 5 — Trazabilidad y Reportes** | **PARCIAL** | Trazabilidad: audit_logs, request_id, eventos STATUS_CHANGE, FEATURE_ASSIGN_RELEASE, HOTFIX_CREATED, CHANGE_REQUEST_IMPLEMENTED, etc. Reportes específicos (dashboard, agregados, exportación) no implementados. |
| **ETAPA 6 — Sistema de Calidad Interno** | **NO INICIADA** | No hay módulo dedicado a calidad interna, no conformidades o indicadores de calidad en código. |

---

## 8. GAP ANALYSIS (ANÁLISIS DE BRECHA)

**Lo que EXISTE en el código:**  
Infraestructura, auth JWT + refresh + single session, RBAC, rate limit, auditoría automática y por eventos, Project/Feature/UserStory con workflows, Releases con SemVer y hotfix, Change Requests integrados en Release y Feature, usuarios, métricas básicas, health, capa de errores y códigos documentados.

**Piezas FALTANTES respecto a un plan maestro ISO típico:**

- Entidad **Sprint** y gestión de sprints (planificación, cierre, relación con features/stories).
- Entidad **Incident** y flujo de gestión de incidentes (apertura, escalado, cierre).
- Módulo **Documental**: entidades Documento, versionado documental, aprobaciones, retención.
- **Reportes y dashboards**: agregados por proyecto, por release, por usuario, exportación.
- **Time tracking**: registro de tiempo por tarea/story/proyecto.
- Integración formal con **Nexus Core** (carpeta `nexusCore` vacía; solo preparada).
- **Sistema de calidad interno**: no conformidades, indicadores, acciones correctivas (si están en el plan).
- Posibles **índices o campos** para consultas pesadas de auditoría o reportes (según necesidad futura).

---

## 9. RIESGOS TÉCNICOS

| Riesgo | Severidad | Descripción |
|--------|-----------|-------------|
| **auth.repository** | Baja | En `auth.repository.js`, `revokeRefreshToken` y `findRefreshTokenByHash` usan el campo `revoked` (boolean); la migración y el modelo usan `revoked_at`. El flujo activo de login/refresh/logout usa `refreshToken.repository.js` (correcto). Las funciones de auth.repository con `revoked` son código muerto o legacy; si se reutilizan, fallarían. Conviene alinearlas con `revoked_at` o eliminarlas. |
| **Auditoría en login/refresh/logout** | Baja | El middleware solo registra según método y status; login/refresh/logout se registran explícitamente en el código (comprobar que así esté en auth.controller/service). |
| **Migraciones y orden** | Media | El orden de migraciones debe respetar FKs (roles → users → refresh_tokens, audit_logs; users, projects → features; features → user_stories; releases; features.release_id; change_requests). Cualquier migración nueva debe mantener este orden. |
| **Paridad Plan Maestro** | Media | Al no existir el documento en el repo, cualquier referencia a "Plan Maestro" puede desalinearse con lo implementado. Recomendable versionar el plan en /docs. |
| **Versionado documental** | N/A hoy | No existe; cuando se implemente, definir política de retención y auditoría de documentos. |
| **Tests y datos compartidos** | Baja | Las suites de releases usan rangos de versión dinámicos para no colisionar; mantener esta estrategia en nuevas suites que creen releases. |
| **Caché de modelos** | Baja | loadModels usa caché; en tests que reinician conexión o cargan otro sequelize, podría ser necesario evitar o resetear la caché. |

---

## 10. RECOMENDACIÓN DE SIGUIENTE FASE

**Siguiente fase recomendada:** **ETAPA 2 del Plan Maestro — Gestión de Sprints** (o, si el plan numera distinto, la fase que corresponda a **Sprints**).

**Motivos:**

1. La gobernanza base (Project, Feature, UserStory) y la gestión de Releases ya están implementadas; los sprints encajan entre backlog y releases (planificación por periodo, asignación de features/stories a sprints).
2. Cierra la brecha más lógica en un flujo ágil: proyectos → features → stories → **sprints** → releases.
3. No sustituye ni rompe Change Control ni Releases; se puede definir que ciertas acciones (por ejemplo, cerrar sprint o asignar ítems a sprint) exijan o no Change Request según política.
4. Permite después reportes de trazabilidad (por sprint, velocidad, etc.) alineados con ETAPA 5.

**Alternativa:** Si la prioridad del negocio es **incidentes**, la siguiente fase podría ser **ETAPA 3 — Gestión de Incidentes** (entidad Incident, estados, vinculación opcional a Release/Feature, auditoría). La decisión debe alinearse con el Plan Maestro versionado y las prioridades ISO.

---

## REGLAS IMPORTANTES

- Este informe se ha generado **analizando solo lo que existe en el código** del repositorio.
- No se han inventado funcionalidades; la evaluación está basada en archivos reales (routes, controllers, services, migrations, models, middlewares, config).
- La base es técnica y objetiva para permitir que otra IA continúe el desarrollo con la menor ambigüedad posible.
