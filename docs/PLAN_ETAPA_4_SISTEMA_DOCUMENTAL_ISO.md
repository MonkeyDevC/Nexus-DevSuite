# Plan ETAPA 4 — Sistema documental ISO

**Referencia:** nexus-plan-maestro-etapas.mdc  
**Objetivo Plan Maestro:** Control documental formal. Entidades Document y DocumentVersion. Versionado obligatorio y aprobación por MASTER. Base sólida para cumplimiento ISO 9001.  
**Estado:** Diseñado por PO MASTER — pendiente validación SYSTEM ARCHITECT

---

## Contexto

- **Decisión Plan Maestro (versionado documental):** Versionado documental real con historial inmutable. Campos obligatorios por versión: version_number, change_reason, created_by, approved_by, approved_at, status (Draft / Approved / Archived).
- **Decisión Plan Maestro (aprobaciones):** Solo el rol MASTER puede aprobar documentos.
- **Document:** Identidad del documento (código, título). Puede ser de proyecto o organizacional (project_id nullable).
- **DocumentVersion:** Cada versión del documento. version_number incremental por documento; status DRAFT → APPROVED (solo MASTER) → ARCHIVED. Historial inmutable.
- **Patrones a seguir:** workflow.constants/validator, módulos incidents/improvements (repository, service, controller), auditoría estructural.

---

## FASE 1 — Modelo y migraciones

### 1.1 Modelo Document

**Archivo:** `src/modules/documents/models/document.model.js`

Campos:
- `id` (UUID PK)
- `code` (STRING 50, único, obligatorio) — ej. DOC-2026-001, POL-001
- `title` (STRING 255, obligatorio)
- `description` (TEXT nullable)
- `project_id` (UUID FK projects, nullable) — documento de proyecto o organizacional
- `created_by` (UUID FK users, NOT NULL)
- timestamps, paranoid: true

Tabla: `documents`

### 1.2 Migración create-documents

**Archivo:** `src/infrastructure/db/migrations/20260307100005-create-documents.js`

- Crear tabla `documents` con los campos anteriores.
- Índices: `idx_documents_code` (unique), `idx_documents_project_id`, `idx_documents_created_by`.
- FK project_id → projects.id ON DELETE SET NULL (documento organizacional si se borra proyecto).
- FK created_by → users.id ON DELETE RESTRICT.

### 1.3 Modelo DocumentVersion

**Archivo:** `src/modules/documents/models/documentVersion.model.js`

Campos (según decisión estratégica):
- `id` (UUID PK)
- `document_id` (UUID FK documents, NOT NULL)
- `version_number` (INTEGER, obligatorio) — 1, 2, 3… único por document_id
- `status` (ENUM: DRAFT, APPROVED, ARCHIVED)
- `change_reason` (TEXT nullable) — obligatorio en flujo de aprobación (recomendado)
- `content` (TEXT nullable) — contenido o referencia; puede ser URL en futuro
- `created_by` (UUID FK users, NOT NULL)
- `approved_by` (UUID FK users, nullable) — solo MASTER
- `approved_at` (DATE nullable)
- timestamps, paranoid: true

Tabla: `document_versions`

Constraint único: (document_id, version_number) para garantizar versionado incremental.

### 1.4 Migración create-document-versions

**Archivo:** `src/infrastructure/db/migrations/20260307100006-create-document-versions.js`

- Crear tabla `document_versions` con los campos anteriores.
- Índices: `idx_document_versions_document_id`, `idx_document_versions_status`, `idx_document_versions_created_by`, `idx_document_versions_approved_by`.
- Unique: `uq_document_versions_document_version` (document_id, version_number).
- FK document_id → documents.id **ON DELETE RESTRICT** (no borrar documento con versiones).
- FK created_by, approved_by → users.id.

### 1.5 loadModels

- Cargar Document, DocumentVersion.
- Project.hasMany(Document), Document.belongsTo(Project).
- Document.hasMany(DocumentVersion), DocumentVersion.belongsTo(Document).
- Document.belongsTo(User) created_by (alias "creator").
- DocumentVersion.belongsTo(User) created_by, approved_by (alias "versionCreator", "approver").
- Incluir ...documentModels en cachedModels (Document y DocumentVersion en mismo módulo).

---

## FASE 2 — Workflow DocumentVersion

### 2.1 Constantes

**Archivo:** `src/modules/documents/documentVersion.workflow.constants.js`

```js
TRANSITION_MAP_DOCUMENT_VERSION = {
  DRAFT: ["APPROVED"],      // solo MASTER
  APPROVED: ["ARCHIVED"],   // solo MASTER (ej. al aprobar nueva versión o archivar)
  ARCHIVED: []
};
```

### 2.2 Validador

**Archivo:** `src/modules/documents/documentVersion.workflow.validator.js`

- `validateDocumentVersionTransition(currentStatus, nextStatus)` → AppError DOCUMENT_VERSION_INVALID_TRANSITION si no permitida.
- DRAFT → APPROVED: **solo MASTER**. EMPLOYEE → 403 DOCUMENT_APPROVE_MASTER_ONLY.
- APPROVED → ARCHIVED: solo MASTER.

### 2.3 Reglas de versionado

- Al crear nueva versión: `version_number = max(version_number) por document_id + 1`. Si no hay versiones, 1.
- No modificar contenido ni status de una versión ya APPROVED o ARCHIVED (inmutabilidad). Solo transición APPROVED → ARCHIVED permitida.
- Opcional: al aprobar una nueva versión (DRAFT→APPROVED), archivar automáticamente la versión APPROVED anterior del mismo documento (si existe).

---

## FASE 3 — Reglas de dominio

### Document
- code único a nivel global.
- project_id nullable: documento organizacional (null) o de proyecto.
- No eliminar documento si tiene versiones (o política soft-delete; RESTRICT en FK).

### DocumentVersion
- version_number único por document_id; incremental.
- DRAFT: editable (change_reason, content); solo created_by o MASTER pueden subir/editar.
- APPROVED: inmutable; solo transición a ARCHIVED.
- ARCHIVED: sin salida.
- Aprobación (DRAFT→APPROVED) y archivado (APPROVED→ARCHIVED): solo MASTER.
- approved_by y approved_at se rellenan al pasar a APPROVED.

---

## FASE 4 — Error codes

Añadir en errorCodes.js:
- DOCUMENT_NOT_FOUND
- DOCUMENT_CODE_ALREADY_EXISTS
- DOCUMENT_VERSION_NOT_FOUND
- DOCUMENT_VERSION_INVALID_TRANSITION
- DOCUMENT_VERSION_IMMUTABLE (intentar modificar APPROVED/ARCHIVED)
- DOCUMENT_APPROVE_MASTER_ONLY
- DOCUMENT_PROJECT_MISMATCH (si se valida project_id en listado por proyecto)

Documentar en CONTRATO_API.md y openapi.yaml.

---

## FASE 5 — Repository, Service, Controller

### Document
- **Repository:** create, findById, findByCode, list (por project_id, paginado), update (solo campos no críticos si aplica).
- **Service:** createDocument (validar code único, project existe si project_id presente), getDocumentById, listDocuments, getDocumentByCode. Opcional: updateDocument (solo title, description; no code).

### DocumentVersion
- **Repository:** create, findById, listByDocumentId (orden version_number DESC), getMaxVersionNumber(documentId), update (solo status vía workflow; no reescribir content/change_reason si APPROVED/ARCHIVED).
- **Service:** createVersion (version_number = max+1, status DRAFT), getVersionById, listVersionsByDocumentId, updateVersionStatus (workflow; DRAFT→APPROVED y APPROVED→ARCHIVED solo MASTER). Validar inmutabilidad: no permitir PATCH de content/change_reason si status !== DRAFT.

### Controller
- buildSuccess, controllerUtils (buildContext, assertRequestValid), Response Layer v1 en todos los endpoints.

---

## FASE 6 — Auditoría

- DOCUMENT_CREATED (entity: DOCUMENT, entity_id).
- DOCUMENT_VERSION_CREATED (entity: DOCUMENT_VERSION, entity_id, metadata: document_id, version_number).
- STATUS_CHANGE (entity: DOCUMENT_VERSION, metadata: from, to).
- DOCUMENT_VERSION_APPROVED (entity: DOCUMENT_VERSION, metadata: approved_by, approved_at).
- DOCUMENT_VERSION_ARCHIVED (entity: DOCUMENT_VERSION, metadata).

Campos obligatorios: user_id, request_id, entity, entity_id, action, metadata, ip_address, user_agent.

---

## FASE 7 — Rutas

Base: `/api/v1`

### Documents
- POST /documents — MASTER, EMPLOYEE (body: code, title, description, project_id opcional). Crear documento y primera versión DRAFT (version_number 1) en una transacción o secuencia definida.
- GET /documents — MASTER, EMPLOYEE (?project_id=, paginado).
- GET /documents/:id — MASTER, EMPLOYEE (documento con última versión aprobada o lista de versiones según diseño).
- GET /documents/code/:code — MASTER, EMPLOYEE (opcional; por código único).

### Document versions
- POST /documents/:documentId/versions — MASTER, EMPLOYEE (body: change_reason, content). Crea nueva versión DRAFT con version_number = max+1.
- GET /documents/:documentId/versions — MASTER, EMPLOYEE (listado versiones, ?status=).
- GET /documents/:documentId/versions/:versionId — MASTER, EMPLOYEE.
- PATCH /documents/:documentId/versions/:versionId — MASTER, EMPLOYEE (solo si status DRAFT; body: change_reason, content). Opcional.
- PATCH /documents/:documentId/versions/:versionId/status — MASTER para DRAFT→APPROVED y APPROVED→ARCHIVED; body: status.

Montar en v1: `router.use("/documents", documentRoutes)`.

---

## FASE 8 — QA

### Suite documents
**Archivo:** `src/tests/integration/documents/documents.negative.test.js`

Tests sugeridos:
- Crear documento con code duplicado → 409 DOCUMENT_CODE_ALREADY_EXISTS.
- Documento inexistente → 404 DOCUMENT_NOT_FOUND.
- Crear versión en documento inexistente → 404.
- Transición inválida (DRAFT → ARCHIVED) → 400 DOCUMENT_VERSION_INVALID_TRANSITION.
- EMPLOYEE intenta aprobar versión (DRAFT → APPROVED) → 403 DOCUMENT_APPROVE_MASTER_ONLY.
- MASTER aprueba versión → 200.
- Modificar contenido de versión APPROVED → 400 DOCUMENT_VERSION_IMMUTABLE.
- Document version inexistente → 404 DOCUMENT_VERSION_NOT_FOUND.

### Regresión
- backlog, releases, changeRequests, sprints, incidents, improvements en verde.

---

## Archivos nuevos / modificados

| Tipo | Ruta |
|------|------|
| Nuevo | src/modules/documents/models/document.model.js |
| Nuevo | src/modules/documents/models/documentVersion.model.js |
| Nuevo | src/modules/documents/models/index.js |
| Nuevo | src/infrastructure/db/migrations/20260307100005-create-documents.js |
| Nuevo | src/infrastructure/db/migrations/20260307100006-create-document-versions.js |
| Nuevo | src/modules/documents/documentVersion.workflow.constants.js |
| Nuevo | src/modules/documents/documentVersion.workflow.validator.js |
| Nuevo | src/modules/documents/document.repository.js |
| Nuevo | src/modules/documents/documentVersion.repository.js |
| Nuevo | src/modules/documents/document.service.js |
| Nuevo | src/modules/documents/document.controller.js |
| Nuevo | src/modules/documents/document.validator.js |
| Nuevo | src/modules/documents/document.routes.js |
| Modif | src/infrastructure/db/loadModels.js |
| Modif | src/shared/errors/errorCodes.js |
| Modif | src/routes/v1.routes.js |
| Modif | docs/CONTRATO_API.md, docs/openapi.yaml |
| Nuevo | src/tests/integration/documents/documents.negative.test.js |

---

## Criterio de cierre

- Todas las fases implementadas.
- Tests en verde; 0 respuestas 500.
- Solo MASTER puede aprobar (DRAFT→APPROVED) y archivar (APPROVED→ARCHIVED) versiones.
- Versionado obligatorio: version_number incremental por documento; historial inmutable (APPROVED/ARCHIVED no editables).
- Auditoría generada para documentos y versiones.
- Response Layer v1 y controllerUtils en todos los endpoints.
- Arquitectura controller → service → repository intacta.
- Regresión: suites existentes en verde.
