# Contrato API — NEXUS DevSuite

## Versionado del contrato

- **Todas las respuestas siguen Response Layer v1.**
- El header `X-Response-Version: 1` está presente en todas las respuestas HTTP (éxito y error).
- Cualquier cambio estructural del envelope (success, data/error, meta) requerirá **Response Layer v2** y nueva versión del header.
- La documentación y el contrato OpenAPI (`docs/openapi.yaml`) corresponden a esta versión.

## Response Layer v1

### Cobertura de Response Layer v1

Tras las correcciones de auditoría de código (auditoría 2026), **todos los endpoints** de la API utilizan el envelope estándar (`buildSuccess` / `buildError` de `responseLayer.js`):

- **Auth:** login, refresh, me, admin/test (logout devuelve 204 sin cuerpo).
- **Users:** create, getById, list, update, delete (204), changePassword.
- **Health:** GET /health.
- **System:** GET /system/metrics.
- **Projects, Features, Stories, Releases, Change-requests:** todos los endpoints de éxito devuelven `{ success, data, meta }`; los de error devuelven `{ success: false, error, meta }`.

No hay excepciones: cualquier respuesta con cuerpo sigue el envelope. El header `X-Response-Version: 1` está presente en todas las respuestas (middleware `responseVersion.middleware.js`).

### Respuesta de éxito

- `success`: `true`
- `data`: objeto o array según el recurso.
- `meta`:
  - `request_id`: string (UUID por request).
  - `timestamp`: string ISO 8601 en UTC (termina en `Z`).

### Respuesta de error

- `success`: `false`
- `error`:
  - `code`: string (código del catálogo oficial).
  - `message`: string (mensaje seguro para cliente).
  - `details`: opcional (p. ej. validación).
- `meta`:
  - `request_id`: string.
  - `timestamp`: string ISO 8601 UTC.
- `stack`: solo en desarrollo; nunca en producción.

## Catálogo oficial de códigos de error Día 2

Convención: **MAYÚSCULAS_SNAKE_CASE**. Códigos estables contractualmente.

| Código | Uso |
|--------|-----|
| `AUTH_INVALID_CREDENTIALS` | Credenciales de login incorrectas |
| `AUTH_TOKEN_EXPIRED` | Token (access o refresh) expirado |
| `AUTH_REFRESH_REPLAY` | Refresh inválido, revocado o replay |
| `AUTH_RATE_LIMIT_EXCEEDED` | Límite de solicitudes excedido (429) |
| `AUTH_UNAUTHORIZED` | No autenticado o no autorizado para la acción |
| `AUTH_FORBIDDEN` | Sin permisos para el recurso |
| `INTERNAL_SERVER_ERROR` | Errores no operacionales no controlados (no usar en validaciones de negocio) |
| `NOT_FOUND` | Recurso no encontrado (404) |
| `VALIDATION_ERROR` | Error de validación de entrada (400) |
| `PROJECT_ALREADY_EXISTS` | Nombre de proyecto duplicado (POST /projects) |
| `PROJECT_NOT_FOUND` | Proyecto no encontrado (GET/PATCH /projects/:id) |
| `FEATURE_NOT_FOUND` | Feature no encontrada |
| `STORY_NOT_FOUND` | User story no encontrada |
| `FEATURE_INVALID_TRANSITION` | Transición de estado no permitida en Feature |
| `STORY_INVALID_TRANSITION` | Transición de estado no permitida en UserStory |
| `PROJECT_ARCHIVED` | Operación no permitida sobre proyecto archivado (ej. crear feature) |
| `FEATURE_ARCHIVED` | Operación no permitida sobre feature archivada (ej. crear story) |
| `INVALID_ASSIGNMENT` | Asignar story a usuario inexistente o inactivo; o aprobar sin rol MASTER |
| `RELEASE_INVALID_VERSION` | Versión no cumple SemVer estricto X.Y.Z (POST /releases) |
| `RELEASE_ALREADY_EXISTS` | Ya existe una release con esa versión |
| `RELEASE_NOT_FOUND` | Release no encontrada |
| `RELEASE_INVALID_TRANSITION` | Transición de estado no permitida en Release |
| `RELEASE_EMPTY` | No se puede publicar una release sin features asociadas |
| `RELEASE_ARCHIVED` | Operación no permitida sobre release archivada (cambio status, asignar features, editar description) |
| `RELEASE_VERSION_IMMUTABLE` | Intento de modificar el campo version (no permitido) |
| `RELEASE_VERSION_NOT_ALLOWED` | Nueva versión debe ser mayor que la última release publicada (anti-downgrade) |
| `FEATURE_ALREADY_IN_RELEASE` | La feature ya está asignada a otra release |
| `RELEASE_HOTFIX_NOT_ALLOWED` | Hotfix solo permitido desde release en estado RELEASED (no desde PLANNED, IN_PROGRESS, QA, ARCHIVED) |
| `CHANGE_REQUEST_REQUIRED` | Acción estructural requiere ChangeRequest aprobado (falta change_request_id en body) |
| `CHANGE_REQUEST_NOT_FOUND` | ChangeRequest no encontrado |
| `CHANGE_REQUEST_INVALID` | ChangeRequest no corresponde a la entidad indicada (entity_type/entity_id no coinciden) |
| `CHANGE_REQUEST_INVALID_TRANSITION` | Transición de estado no permitida en ChangeRequest |
| `CHANGE_REQUEST_NOT_APPROVED` | El ChangeRequest debe estar aprobado para ejecutar la acción |
| `CHANGE_REQUEST_ALREADY_IMPLEMENTED` | El ChangeRequest ya fue implementado |
| `SPRINT_NOT_FOUND` | Sprint no encontrado |
| `SPRINT_INVALID_TRANSITION` | Transición de estado no permitida en Sprint |
| `SPRINT_CLOSED` | Operación no permitida sobre sprint cerrado (asignar/desasignar stories, cambiar status) |
| `SPRINT_STORY_PROJECT_MISMATCH` | La story no pertenece al mismo proyecto que el sprint |
| `SPRINT_CLOSE_MASTER_ONLY` | Solo MASTER puede cerrar sprint (IN_PROGRESS → CLOSED); EMPLOYEE recibe 403 AUTH_FORBIDDEN |
| `INCIDENT_NOT_FOUND` | Incidente no encontrado |
| `INCIDENT_INVALID_TRANSITION` | Transición de estado no permitida en Incident |
| `INCIDENT_CLOSED` | Operación no permitida sobre incidente cerrado (cambio status, PATCH) |
| `INCIDENT_CLOSE_MASTER_ONLY` | Solo MASTER puede cerrar incidente (RESOLVED → CLOSED); EMPLOYEE → 403 |
| `INCIDENT_ROOT_CAUSE_REQUIRED` | root_cause_analysis no vacío obligatorio antes de RESOLVED → CLOSED |
| `IMPROVEMENT_NOT_FOUND` | Mejora no encontrada |
| `IMPROVEMENT_INVALID_TRANSITION` | Transición de estado no permitida en Improvement |
| `IMPROVEMENT_APPROVE_MASTER_ONLY` | Solo MASTER puede aprobar/rechazar (PROPOSED → APPROVED\|REJECTED) o marcar IMPLEMENTED |
| `IMPROVEMENT_CLOSED` | Operación no permitida sobre mejora en estado REJECTED o IMPLEMENTED |
| `DOCUMENT_NOT_FOUND` | Documento no encontrado |
| `DOCUMENT_CODE_ALREADY_EXISTS` | Código de documento duplicado (409) |
| `DOCUMENT_VERSION_NOT_FOUND` | Versión de documento no encontrada |
| `DOCUMENT_VERSION_INVALID_TRANSITION` | Transición de estado no permitida en versión (DRAFT→APPROVED, APPROVED→ARCHIVED) |
| `DOCUMENT_VERSION_IMMUTABLE` | No se puede modificar content/change_reason de versión APPROVED o ARCHIVED |
| `DOCUMENT_APPROVE_MASTER_ONLY` | Solo MASTER puede aprobar (DRAFT→APPROVED) o archivar (APPROVED→ARCHIVED) |
| `DOCUMENT_CHANGE_REASON_REQUIRED` | change_reason no vacío obligatorio al aprobar (DRAFT→APPROVED) |
| `ORGANIZATION_NOT_FOUND` | Organización no encontrada (GET/PATCH /organizations/:id) |
| `TENANT_REQUIRED` | Petición sin tenant válido cuando la política lo exige (opcional según diseño) |
| `RESOURCE_OTHER_ORGANIZATION` | Recurso pertenece a otra organización; acceso denegado (403) |
| `DEDUP_KEY_REQUIRED` | Mutación APEX sin cabecera `x-dedup-key` (400) |
| `DOCUMENTATION_NOT_FOUND` | Registro `documentation_contents` inexistente o fuera del tenant (404) |
| `DOCUMENTATION_CONFLICT` | Ya existe contenido ACTIVE para el mismo alcance (org + `project_id` + `type`) (409) |
| `DOCUMENTATION_PATCH_EMPTY` | PATCH sin ningún campo permitido (`content`, `title`, `format`, `type`, `project_id`, `status`) (400) |
| `DOCUMENTATION_CONTENT_TOO_LARGE` | Campo `content` supera el máximo contractual (400; límite 500000 caracteres) |
| `IDEMPOTENCY_IN_PROGRESS` | Misma `dedup_key` en ejecución concurrente (409) |
| `IDEMPOTENCY_KEY_REUSED` | Misma `dedup_key` con cuerpo o ruta distinta al registrado (409) |
| `SCOPE_LOCK_CONFLICT` | Conflicto de bloqueo de concurrencia por scope (409) |

**Nota:** `INTERNAL_SERVER_ERROR` está reservado exclusivamente para errores no operacionales no controlados; no debe usarse para validaciones de negocio.

## Documentación de plataforma (`/api/v1/documentation`)

Recurso **`documentation_contents`** (contenido documental operativo de la plataforma). **No** es el módulo ISO de documentos (`/api/v1/documents`).

En JSON se usa el campo **`type`** con valores `functional` | `technical` (tipo documental); en texto de dominio puede citarse como *documentation_type*.

### Cabeceras (mutaciones)

| Cabecera | Obligatoria | Descripción |
|----------|-------------|-------------|
| `x-dedup-key` | Sí (POST, PATCH, DELETE) | Idempotencia APEX; sin ella → `DEDUP_KEY_REQUIRED` (400). |
| `x-expected-global-hash` | No | Tras respuesta **2xx**, el middleware valida coherencia con el hash global; discrepancia → fallo crítico en ledger (ver OpenAPI). |

### Idempotencia y atomic commit

- **Replay:** misma `x-dedup-key` y mismo request canónico (método + `originalUrl` + body + query) → misma respuesta almacenada; en replay puede enviarse `X-Idempotent-Replay: true`.
- **4xx:** la respuesta se guarda como completada en idempotency (**replay del error**); **no** se encola outbox `HTTP_MUTATION_COMMITTED` ni se valida hash global.
- **2xx:** se valida hash global (si aplica), se actualiza ledger en fase `COMMIT_VALIDATED` y se encola outbox.
- **5xx:** idempotency en estado `FAILED`; el cliente puede **reintentar** con la misma clave.

### Validación y seguridad

- `content`: longitud máxima **500000** caracteres; mitigación XSS en servidor (eliminación de `script`, `iframe`, handlers `on*`, URLs `javascript:` / `data:text/html` peligrosas). El consumidor debe seguir aplicando escape/CSP al renderizar.
- **PATCH:** al menos un campo permitido; de lo contrario `DOCUMENTATION_PATCH_EMPTY`.

### Tabla de errores por endpoint

| Método | Ruta | Códigos típicos (además de AUTH_*) |
|--------|------|-------------------------------------|
| GET | `/documentation` | `VALIDATION_ERROR` |
| GET | `/documentation/:id` | `DOCUMENTATION_NOT_FOUND` |
| POST | `/documentation` | `DEDUP_KEY_REQUIRED`, `VALIDATION_ERROR`, `DOCUMENTATION_CONTENT_TOO_LARGE`, `PROJECT_NOT_FOUND`, `DOCUMENTATION_CONFLICT`, `IDEMPOTENCY_*`, `SCOPE_LOCK_CONFLICT` |
| PATCH | `/documentation/:id` | `DEDUP_KEY_REQUIRED`, `VALIDATION_ERROR`, `DOCUMENTATION_PATCH_EMPTY`, `DOCUMENTATION_CONTENT_TOO_LARGE`, `DOCUMENTATION_NOT_FOUND`, `DOCUMENTATION_CONFLICT`, `IDEMPOTENCY_*`, `SCOPE_LOCK_CONFLICT` |
| DELETE | `/documentation/:id` | `DEDUP_KEY_REQUIRED`, `DOCUMENTATION_NOT_FOUND`, `IDEMPOTENCY_*`, `SCOPE_LOCK_CONFLICT` |

Contrato OpenAPI: `docs/openapi.yaml` (tag `documentation`).

## Exportación DOCX (`/api/v1/docs/export`)

Endpoint para generar archivo Word desde contenido documental funcional/técnico.

### Reglas de contrato

- Método: `POST /api/v1/docs/export`
- Auth/RBAC: requiere sesión válida (`bearer`) y rol `MASTER` o `EMPLOYEE`.
- Body mínimo: `{ "type": "functional" | "technical" | "all" }`.
- Body opcional:
  - `projectId` (uuid),
  - `contentHtml`,
  - `contentHtmlFunctional`,
  - `contentHtmlTechnical`.
- Respuesta de éxito: **binaria** (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`) con `Content-Disposition: attachment`.
- En éxito no aplica envelope JSON de Response Layer; errores sí usan Response Layer v1 (`VALIDATION_ERROR`, `AUTH_UNAUTHORIZED`, `AUTH_FORBIDDEN`, etc.).

## Multi-tenant y organizaciones (ETAPA 10)

La API es multi-tenant por organización. El tenant se resuelve en este orden:

1. **Header `X-Organization-Id`:** UUID de la organización.
2. **Header `X-Tenant-Slug`:** Slug de la organización (ej. `default`, `acme`).
3. **Subdominio:** Si está configurado `SUBDOMAIN_BASE`, el tenant se extrae del `Host` (ej. `acme.nexusapp.com` → slug `acme`).
4. **Organización por defecto:** Si no se obtiene tenant, se usa la organización con `slug = "default"`.

Todos los listados y altas de proyectos, usuarios, releases, features, stories, sprints, incidencias, mejoras, documentos y reportes están aislados por `organization_id`. Un recurso de otra organización devuelve `403` con `error.code: "RESOURCE_OTHER_ORGANIZATION"`.

### Endpoints de organizaciones

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/v1/organizations/current` | MASTER, EMPLOYEE | Organización del tenant actual (resuelta por header/subdominio/default). |
| GET | `/api/v1/organizations/:id` | MASTER, EMPLOYEE | Detalle de una organización por ID (solo si pertenece al tenant actual). |
| PATCH | `/api/v1/organizations/:id` | Solo MASTER | Actualizar organización (name, settings, plan, billing_email, next_billing_date). |

Respuestas con Response Layer v1. Códigos de error: `ORGANIZATION_NOT_FOUND`, `RESOURCE_OTHER_ORGANIZATION`.

### Releases y organización

Las releases tienen `organization_id`. La lista de releases y las operaciones sobre una release (GET, PATCH status, asignar feature, hotfix) se filtran o validan por el tenant actual.

## Ejemplos ETAPA 3 (Change Control)

### ChangeRequest requerido
- **Request:** `PATCH /api/v1/releases/:id/status` sin `change_request_id` en body o con valor vacío.
- **Response:** `400` con `error.code: "CHANGE_REQUEST_REQUIRED"`.

### ChangeRequest no aprobado
- **Request:** Acción estructural (p. ej. PATCH status de release) con un CR en estado DRAFT o SUBMITTED.
- **Response:** `400` con `error.code: "CHANGE_REQUEST_NOT_APPROVED"`.

### ChangeRequest inválido (entity mismatch)
- **Request:** Acción sobre release X con un CR cuyo entity_id es de otra release o feature.
- **Response:** `400` con `error.code: "CHANGE_REQUEST_INVALID"`.

## Ejemplos ETAPA 1 (Backlog)

### Transición inválida (Feature o Story)
- **Request:** `PATCH /api/v1/features/:id/status` con `{ "status": "DONE" }` cuando la feature está en DRAFT.
- **Response:** `400` con `error.code: "FEATURE_INVALID_TRANSITION"`.

### Proyecto archivado
- **Request:** `POST /api/v1/projects/:projectId/features` cuando el proyecto tiene `status: "ARCHIVED"`.
- **Response:** `400` con `error.code: "PROJECT_ARCHIVED"`.

### Asignación inválida (Story)
- **Request:** `PATCH /api/v1/stories/:id/assign` con `{ "assigned_to": "<uuid-usuario-inexistente-o-inactivo>" }`.
- **Response:** `400` con `error.code: "INVALID_ASSIGNMENT"`.

## Ejemplos ETAPA 2 (Releases)

### Versión inválida
- **Request:** `POST /api/v1/releases` con `{ "version": "v1.0.0", "description": "Test" }`.
- **Response:** `400` con `error.code: "RELEASE_INVALID_VERSION"`.

### Versión duplicada
- **Request:** `POST /api/v1/releases` con una versión ya existente.
- **Response:** `409` con `error.code: "RELEASE_ALREADY_EXISTS"`.

### Anti-downgrade
- **Request:** `POST /api/v1/releases` con `{ "version": "1.0.0" }` cuando ya existe una release RELEASED con versión mayor (ej. 2.0.0).
- **Response:** `400` con `error.code: "RELEASE_VERSION_NOT_ALLOWED"`.

### Transición inválida (Release)
- **Request:** `PATCH /api/v1/releases/:id/status` con `{ "status": "RELEASED" }` cuando la release está en PLANNED.
- **Response:** `400` con `error.code: "RELEASE_INVALID_TRANSITION"`.

### Release archivada
- **Request:** `PATCH /api/v1/releases/:id/status`, asignar feature o `PATCH /api/v1/releases/:id` (description) cuando la release está ARCHIVED.
- **Response:** `400` con `error.code: "RELEASE_ARCHIVED"`.

### Inmutabilidad de version
- **Request:** `PATCH /api/v1/releases/:id` con `{ "version": "99.0.0" }`.
- **Response:** `400` con `error.code: "RELEASE_VERSION_IMMUTABLE"`.

### Hotfix no permitido (release no RELEASED)
- **Request:** `POST /api/v1/releases/:id/hotfix` cuando la release está en PLANNED, IN_PROGRESS, QA o ARCHIVED.
- **Response:** `400` con `error.code: "RELEASE_HOTFIX_NOT_ALLOWED"` o `RELEASE_ARCHIVED` si está archivada.

---

## Reportes (ETAPA 5 — Trazabilidad)

Endpoints de solo lectura para reportes y auditoría. Códigos reutilizados: `PROJECT_NOT_FOUND`, `SPRINT_NOT_FOUND`, `NOT_FOUND`, `AUTH_FORBIDDEN`.

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/v1/reports/projects/:projectId/summary` | MASTER, EMPLOYEE | Resumen proyecto + conteos (features, userStories, sprints, incidents, improvements, documents) |
| GET | `/api/v1/reports/sprints/:sprintId/summary` | MASTER, EMPLOYEE | Resumen sprint + proyecto + lista stories (id, title, status) |
| GET | `/api/v1/reports/users/:userId/activity` | MASTER; EMPLOYEE solo propio | Actividad usuario (audit_logs paginado) |
| GET | `/api/v1/reports/audit` | Solo MASTER | Listado auditoría con filtros (entity, entity_id, user_id, from, to, action); paginación obligatoria; registra acceso en audit_logs |

## Sistema (ETAPA 6 — Calidad interno)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/v1/system/metrics` | Solo MASTER | Snapshot de métricas de instancia (total_requests, total_errors, auth_failures, refresh_failures, scope: "instance"). Response Layer v1. |

Documentación completa del sistema de calidad: `docs/SISTEMA_CALIDAD_INTERNO.md`.

---

## Integración GitHub — ejemplos de `meta.source`

Para las respuestas de capability GitHub, `meta` incluye:
- `usable`: `available && integrated && systemReady`
- `systemReady`: estado de configuración de sistema (variables requeridas)
- `source`: `disabled | internal | cache | live`

### `disabled`

Caso: cualquier condición de usabilidad falla (`available=false` o `integrated=false` o `systemReady=false`).

```json
{
  "available": false,
  "integrated": false,
  "data": null,
  "error": { "code": "GITHUB_VALIDATION", "message": "GitHub no configurado para este proyecto." },
  "meta": { "usable": false, "systemReady": true, "source": "disabled" }
}
```

### `internal`

Caso: integración usable, pero sin llamada a GitHub API (p. ej. respuesta resuelta internamente).

```json
{
  "available": true,
  "integrated": true,
  "data": "main",
  "error": null,
  "meta": { "usable": true, "systemReady": true, "source": "internal" }
}
```

### `cache`

Caso: hubo ejecución API y el contexto indica camino asociado a configuración en cache.

```json
{
  "available": true,
  "integrated": true,
  "data": [{ "name": "main" }],
  "meta": { "usable": true, "systemReady": true, "source": "cache" }
}
```

### `live`

Caso: hubo ejecución API en vivo.

```json
{
  "available": true,
  "integrated": true,
  "data": [{ "name": "feature/x" }],
  "meta": { "usable": true, "systemReady": true, "source": "live" }
}
```

---

## Limitaciones técnicas declaradas

- **Métricas:** en memoria, por instancia; sin agregación entre nodos.
- **Rate limit:** per-instance (en memoria), no distribuido; en multi-instancia cada nodo tiene su propio contador.

## Nivel de madurez

Staging enterprise — listo para pruebas integradas y despliegue en entorno staging.
