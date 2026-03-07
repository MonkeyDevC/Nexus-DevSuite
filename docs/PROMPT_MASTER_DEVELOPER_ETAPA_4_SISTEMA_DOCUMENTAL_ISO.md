# Prompt de implementación — ETAPA 4 Sistema documental ISO

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md  
**Estructura:** nexus-engineering-execution.mdc

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 4 — Sistema documental ISO** siguiendo estrictamente el plan `docs/PLAN_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md`.

**Propósito:** Control documental formal. Entidades Document y DocumentVersion. Versionado obligatorio (version_number incremental, historial inmutable). Aprobación y archivado solo por MASTER. Base sólida para cumplimiento ISO 9001.

---

## 2️⃣ REGLAS INNEGOCIABLES

- No romper arquitectura controller → service → repository.
- No usar sequelize.sync().
- No modificar migraciones previas.
- No crear endpoints fuera del plan.
- No introducir lógica de negocio en controllers.
- Cero respuestas 500 en flujos esperados.
- No dejar TODOs pendientes.
- Response Layer v1 en todos los endpoints (buildSuccess).
- Usar controllerUtils (buildContext, assertRequestValid).
- snake_case en BD.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Modelo y migraciones

1. Crear `src/modules/documents/models/document.model.js` (id, code único, title, description, project_id nullable, created_by, timestamps, paranoid).
2. Crear `src/modules/documents/models/documentVersion.model.js` (id, document_id, version_number, status DRAFT|APPROVED|ARCHIVED, change_reason, content, created_by, approved_by, approved_at, timestamps, paranoid).
3. Crear `src/modules/documents/models/index.js`.
4. **Migración `20260307100005-create-documents.js`** — tabla documents, idx_documents_code (unique), idx_documents_project_id, idx_documents_created_by; FK project_id ON DELETE SET NULL, FK created_by ON DELETE RESTRICT.
5. **Migración `20260307100006-create-document-versions.js`** — tabla document_versions, unique (document_id, version_number), FKs document_id ON DELETE RESTRICT, created_by/approved_by → users.
6. Actualizar `loadModels.js`: Document, DocumentVersion; Project.hasMany(Document), Document.belongsTo(Project); Document.hasMany(DocumentVersion), DocumentVersion.belongsTo(Document); Document.belongsTo(User) alias "creator"; DocumentVersion.belongsTo(User) alias "versionCreator","approver". **Incluir ...documentModels en cachedModels.**

### FASE 2 — Workflow

7. Crear `documentVersion.workflow.constants.js` (TRANSITION_MAP_DOCUMENT_VERSION: DRAFT→[APPROVED], APPROVED→[ARCHIVED], ARCHIVED→[]).
8. Crear `documentVersion.workflow.validator.js` (validateDocumentVersionTransition; DRAFT→APPROVED y APPROVED→ARCHIVED solo MASTER).

### FASE 3 — Error codes y documentación

9. Añadir en errorCodes.js: DOCUMENT_NOT_FOUND, DOCUMENT_CODE_ALREADY_EXISTS, DOCUMENT_VERSION_NOT_FOUND, DOCUMENT_VERSION_INVALID_TRANSITION, DOCUMENT_VERSION_IMMUTABLE, DOCUMENT_APPROVE_MASTER_ONLY, DOCUMENT_CHANGE_REASON_REQUIRED (si aplica).
10. Actualizar CONTRATO_API.md y openapi.yaml.

### FASE 4 — Repository y Service (un solo document.service)

11. Crear `document.repository.js`: create, findById, findByCode, list (por project_id, paginado).
12. Crear `documentVersion.repository.js`: create, findById, listByDocumentId, getMaxVersionNumber(documentId), update (solo campos permitidos; inmutabilidad en service).
13. **Un solo `document.service.js`** que use document.repository y documentVersion.repository (orquestación). Incluir: createDocument (validar code único; si project_id, validar project existe); **crear documento y primera versión DRAFT (version_number 1) en una sola transacción con `sequelize.transaction()`**; getDocumentById, listDocuments, getDocumentByCode; createVersion (version_number = max+1, status DRAFT); getVersionById, listVersionsByDocumentId; updateVersionStatus (workflow; solo MASTER para DRAFT→APPROVED y APPROVED→ARCHIVED). **Al aprobar (DRAFT→APPROVED): archivar automáticamente la versión APPROVED anterior del mismo documento, si existe.** Opcional: updateVersion (PATCH de versión: solo si status === DRAFT; validar en service; actualizar change_reason, content).
14. **change_reason obligatorio** al transicionar DRAFT→APPROVED. Si viene vacío → 400 DOCUMENT_CHANGE_REASON_REQUIRED (o equivalente). Cumplimiento ISO 9001.
15. Inmutabilidad: no permitir actualizar content/change_reason de una versión con status !== DRAFT (validación en service).

### FASE 5 — Auditoría

16. DOCUMENT_CREATED, DOCUMENT_VERSION_CREATED, STATUS_CHANGE (DOCUMENT_VERSION), DOCUMENT_VERSION_APPROVED, DOCUMENT_VERSION_ARCHIVED. Campos: user_id, request_id, entity, entity_id, action, metadata, ip_address, user_agent.

### FASE 6 — Controller, Validator, Routes

17. Crear document.controller.js, document.validator.js, document.routes.js.
18. **Orden de rutas Express:** Definir **GET /documents/code/:code antes de GET /documents/:id** para que "code" no se interprete como :id.
19. **GET /documents/:id — estructura de respuesta:** Incluir metadatos del documento (id, code, title, description, project_id, created_by) y **última versión APPROVED embebida** (id, version_number, status, change_reason, content, approved_by, approved_at). Si no hay versión APPROVED, devolver documento con versión actual (ej. última DRAFT) o campo `currentVersion` null según diseño coherente.
20. Rutas: POST /documents (body: code, title, description, project_id opcional; crea doc + v1 DRAFT en transacción), GET /documents (?project_id=, paginado), GET /documents/code/:code, GET /documents/:id (con última versión aprobada embebida), POST /documents/:documentId/versions (body: change_reason, content), GET /documents/:documentId/versions (?status=), GET /documents/:documentId/versions/:versionId, PATCH /documents/:documentId/versions/:versionId (opcional; solo si DRAFT; body: change_reason, content), PATCH /documents/:documentId/versions/:versionId/status (body: status; solo MASTER para APPROVED/ARCHIVED).
21. Montar en v1: `router.use("/documents", documentRoutes)`.

### FASE 7 — QA

22. Crear `src/tests/integration/documents/documents.negative.test.js`: code duplicado 409, documento inexistente 404, versión en doc inexistente 404, transición inválida 400, EMPLOYEE aprueba 403, MASTER aprueba 200, modificar versión APPROVED 400 DOCUMENT_VERSION_IMMUTABLE, versión inexistente 404; opcional: DRAFT→APPROVED sin change_reason 400.
23. Verificar regresión: backlog, releases, changeRequests, sprints, incidents, improvements en verde.

---

## 4️⃣ REGLAS DE DOMINIO CRÍTICAS

### Document
- code único global. project_id nullable (organizacional o de proyecto).
- No borrar documento con versiones (FK RESTRICT).

### DocumentVersion
- version_number único por document_id; incremental (max+1).
- DRAFT: editable (change_reason, content); APPROVED y ARCHIVED inmutables (solo transición APPROVED→ARCHIVED).
- DRAFT→APPROVED y APPROVED→ARCHIVED: **solo MASTER** (403 DOCUMENT_APPROVE_MASTER_ONLY si EMPLOYEE).
- **change_reason no vacío obligatorio** al pasar DRAFT→APPROVED.
- Al aprobar (DRAFT→APPROVED): approved_by = user.id, approved_at = new Date(); **archivar automáticamente la versión APPROVED anterior del mismo documento** (si existe).
- POST /documents: crear Document + primera DocumentVersion (version_number 1, DRAFT) en **una transacción** (sequelize.transaction).

---

## 5️⃣ AUDITORÍA OBLIGATORIA

- DOCUMENT_CREATED, DOCUMENT_VERSION_CREATED, STATUS_CHANGE (DOCUMENT_VERSION), DOCUMENT_VERSION_APPROVED, DOCUMENT_VERSION_ARCHIVED.

entity, entity_id, action, metadata, request_id, ip_address, user_agent.

---

## 6️⃣ QA OBLIGATORIA (6 niveles)

- **Funcional:** Crear documento (doc + v1 DRAFT), crear versión, aprobar (MASTER), archivar, GET con última aprobada.
- **Dominio:** Versionado incremental, inmutabilidad APPROVED/ARCHIVED, change_reason obligatorio al aprobar, archivado automático versión anterior.
- **Negativa:** 409 code duplicado, 404, 400 transición inválida, 403 EMPLOYEE aprueba, DOCUMENT_VERSION_IMMUTABLE.
- **Regresión:** Todas las suites existentes en verde.
- **Seguridad:** EMPLOYEE no puede aprobar ni archivar → 403.
- **Contrato:** X-Response-Version, envelope Response Layer v1.

---

## 7️⃣ CRITERIO DE CIERRE

- Todas las fases implementadas.
- POST /documents con transacción (Document + DocumentVersion v1).
- GET /documents/:id con estructura definida (metadatos + última versión APPROVED embebida).
- change_reason obligatorio al aprobar; archivado automático de versión anterior al aprobar nueva.
- Rutas: GET /documents/code/:code antes de GET /documents/:id.
- Tests en verde; 0 respuestas 500; arquitectura intacta; regresión en verde.

---

## 8️⃣ EVIDENCIA OBLIGATORIA

**Entrega en archivo:** `docs/EVIDENCIA_ETAPA_4_SISTEMA_DOCUMENTAL_ISO_<YYYY-MM-DD>.md`

Contenido mínimo: lista archivos creados/modificados, migraciones 20260307100005 y 20260307100006, arquitectura intacta, reglas de dominio, QA funcional y negativa, auditoría, sin 500, Response Layer v1.

---

## 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (incorporadas)

| Id | Observación | Aplicación en el prompt |
|----|-------------|-------------------------|
| O1 | Orden rutas GET /documents/code/:code vs :id | FASE 6 paso 18: definir GET /documents/code/:code **antes** de GET /documents/:id. |
| O2 | change_reason obligatorio en aprobación | FASE 4 paso 14 y Reglas dominio: change_reason no vacío obligatorio al DRAFT→APPROVED; 400 si vacío. |
| O3 | Archivado automático versión anterior | FASE 4 paso 13 y Reglas dominio: al aprobar (DRAFT→APPROVED), archivar automáticamente la versión APPROVED anterior del mismo documento. |
| O4 | document.service único | FASE 4: un solo document.service.js que use document.repository y documentVersion.repository (no documentVersion.service). |
| O5 | PATCH versión DRAFT | FASE 4 paso 13: updateVersion opcional; validar status === DRAFT en service; no actualizar content/change_reason si status !== DRAFT. |
| O6 | GET /documents/:id respuesta | FASE 6 paso 19: estructura definida — metadatos del documento + última versión APPROVED embebida. |

**Transacción POST /documents:** Crear Document y primera DocumentVersion en `sequelize.transaction()` (sección VIII validación arquitectónica).

---

**Validación:** APROBADO CON OBSERVACIONES — SYSTEM ARCHITECT (observaciones incorporadas). Ver docs/VALIDACION_ARQUITECTONICA_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md.
