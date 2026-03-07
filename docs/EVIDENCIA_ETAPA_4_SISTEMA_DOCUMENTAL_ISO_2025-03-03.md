# Evidencia de implementación — ETAPA 4 Sistema documental ISO

**Documento:** Evidencia de cierre ETAPA 4  
**Nombre de etapa:** ETAPA 4 — Sistema documental ISO  
**Fecha de generación:** 2025-03-03  
**Referencia:** `docs/PLAN_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md`, `docs/PROMPT_MASTER_DEVELOPER_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md`, `docs/VALIDACION_ARQUITECTONICA_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md`

---

## 1. Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `src/modules/documents/models/document.model.js` | Modelo Document (code único, title, description, project_id nullable, created_by, paranoid) |
| `src/modules/documents/models/documentVersion.model.js` | Modelo DocumentVersion (version_number, status DRAFT\|APPROVED\|ARCHIVED, change_reason, content, approved_by, approved_at, paranoid) |
| `src/modules/documents/models/index.js` | Índice de modelos documents |
| `src/infrastructure/db/migrations/20260307100005-create-documents.js` | Tabla documents, idx_documents_code (unique), project_id ON DELETE SET NULL |
| `src/infrastructure/db/migrations/20260307100006-create-document-versions.js` | Tabla document_versions, unique (document_id, version_number), document_id ON DELETE RESTRICT |
| `src/modules/documents/documentVersion.workflow.constants.js` | TRANSITION_MAP_DOCUMENT_VERSION (DRAFT→APPROVED, APPROVED→ARCHIVED) |
| `src/modules/documents/documentVersion.workflow.validator.js` | validateDocumentVersionTransition |
| `src/modules/documents/document.repository.js` | create, findById, findByCode, list |
| `src/modules/documents/documentVersion.repository.js` | create, findById, listByDocumentId, getMaxVersionNumber, findLatestApprovedByDocumentId, update, archiveApprovedVersionsExcept |
| `src/modules/documents/document.service.js` | createDocument (transacción doc+v1 DRAFT), getDocumentById (metadatos + currentVersion), listDocuments, getDocumentByCode, createVersion, getVersionById, listVersionsByDocumentId, updateVersionStatus (MASTER only aprobar/archivar; change_reason obligatorio; archivado automático versión anterior), updateVersion (solo DRAFT) |
| `src/modules/documents/document.controller.js` | Controladores con buildSuccess y controllerUtils |
| `src/modules/documents/document.validator.js` | Validadores de entrada |
| `src/modules/documents/document.routes.js` | Rutas; GET /documents/code/:code antes de GET /documents/:id |
| `src/tests/integration/documents/documents.negative.test.js` | Suite QA negativo (9 tests) |

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/infrastructure/db/loadModels.js` | Carga Document, DocumentVersion; relaciones Project–Document, User–Document (creator), Document–DocumentVersion, User–DocumentVersion (versionCreator, approver) |
| `src/shared/errors/errorCodes.js` | DOCUMENT_*, DOCUMENT_VERSION_*, DOCUMENT_CHANGE_REASON_REQUIRED |
| `docs/CONTRATO_API.md` | Códigos de error de documentos |
| `docs/openapi.yaml` | Enum de códigos de error documents |
| `src/routes/v1.routes.js` | `router.use("/documents", documentRoutes)` |

---

## 3. Migraciones aplicadas

- **20260307100005-create-documents:** tabla documents, idx_documents_code (unique), idx_documents_project_id, idx_documents_created_by; FK project_id ON DELETE SET NULL, created_by ON DELETE RESTRICT.
- **20260307100006-create-document-versions:** tabla document_versions, uq_document_versions_document_version (document_id, version_number), FK document_id ON DELETE RESTRICT.

---

## 4. API implementada

| Método | Endpoint | Roles | Propósito |
|--------|----------|-------|-----------|
| POST | `/api/v1/documents` | MASTER, EMPLOYEE | Crear documento + v1 DRAFT (transacción) |
| GET | `/api/v1/documents` | MASTER, EMPLOYEE | Listar (?project_id=, paginado) |
| GET | `/api/v1/documents/code/:code` | MASTER, EMPLOYEE | Por código (ruta antes de /:id) |
| GET | `/api/v1/documents/:id` | MASTER, EMPLOYEE | Documento con metadatos + currentVersion (última APPROVED o última versión) |
| POST | `/api/v1/documents/:documentId/versions` | MASTER, EMPLOYEE | Nueva versión DRAFT (version_number = max+1) |
| GET | `/api/v1/documents/:documentId/versions` | MASTER, EMPLOYEE | Listar versiones (?status=) |
| GET | `/api/v1/documents/:documentId/versions/:versionId` | MASTER, EMPLOYEE | Obtener versión |
| PATCH | `/api/v1/documents/:documentId/versions/:versionId` | MASTER, EMPLOYEE | Editar versión (solo DRAFT; change_reason, content) |
| PATCH | `/api/v1/documents/:documentId/versions/:versionId/status` | MASTER para APPROVED/ARCHIVED | Cambiar estado (change_reason obligatorio al aprobar) |

---

## 5. Reglas de dominio verificadas

### Document

- code único global. project_id nullable (organizacional o de proyecto).
- POST /documents: crear Document + primera DocumentVersion (version_number 1, DRAFT) en **una transacción** (sequelize.transaction).

### DocumentVersion

- version_number incremental por document_id (max+1).
- DRAFT: editable (change_reason, content); APPROVED y ARCHIVED inmutables (solo transición APPROVED→ARCHIVED).
- DRAFT→APPROVED y APPROVED→ARCHIVED: **solo MASTER** (403 DOCUMENT_APPROVE_MASTER_ONLY si EMPLOYEE).
- **change_reason no vacío obligatorio** al pasar DRAFT→APPROVED (400 DOCUMENT_CHANGE_REASON_REQUIRED).
- Al aprobar (DRAFT→APPROVED): approved_by, approved_at; **archivar automáticamente** la versión APPROVED anterior del mismo documento (si existe).
- GET /documents/:id: metadatos del documento + currentVersion (última APPROVED o última versión si no hay aprobada).

---

## 6. Auditoría

- DOCUMENT_CREATED (entity: DOCUMENT).
- DOCUMENT_VERSION_CREATED (entity: DOCUMENT_VERSION, metadata: document_id, version_number).
- STATUS_CHANGE (entity: DOCUMENT_VERSION, metadata: from, to).
- DOCUMENT_VERSION_APPROVED (metadata: approved_by, approved_at).
- DOCUMENT_VERSION_ARCHIVED.

Campos: user_id, request_id, entity, entity_id, action, metadata, ip_address, user_agent.

---

## 7. Resultado de QA

- **documents.negative.test.js:** 9/9 pasando (code duplicado 409, documento inexistente 404, versión en doc inexistente 404, transición inválida 400, EMPLOYEE aprueba 403, MASTER aprueba 200, modificar versión APPROVED 400 DOCUMENT_VERSION_IMMUTABLE, versión inexistente 404, DRAFT→APPROVED sin change_reason 400).

**Comando de verificación:**

```bash
$env:NODE_ENV="development"; npm test -- --testPathPattern="documents.negative" --runInBand --forceExit
```

---

## 8. Criterios de cierre

- [x] Todas las fases implementadas.
- [x] POST /documents con transacción (Document + DocumentVersion v1 DRAFT).
- [x] GET /documents/:id con metadatos + currentVersion (última APPROVED o última versión).
- [x] change_reason obligatorio al aprobar; archivado automático de versión anterior al aprobar nueva.
- [x] Rutas: GET /documents/code/:code antes de GET /documents/:id.
- [x] Tests en verde; 0 respuestas 500 en flujos de documentos; arquitectura intacta.
- [x] Response Layer v1 y controllerUtils en todos los endpoints.

---

## 9. Guía para QA — Verificación del cierre ETAPA 4

**Objetivo:** Permitir al agente/equipo QA validar que la ETAPA 4 finalizó según criterios del plan y del prompt de implementación.

### Documentos de referencia para QA

| Documento | Uso |
|-----------|-----|
| `docs/PLAN_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md` | Alcance y fases de la etapa |
| `docs/PROMPT_MASTER_DEVELOPER_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md` | Reglas innegociables, orden de implementación y criterios de cierre |
| `docs/VALIDACION_ARQUITECTONICA_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md` | Validación arquitectónica (SYSTEM ARCHITECT) |

### Checklist de verificación sugerido

1. **Arquitectura**
   - [ ] Controller → Service → Repository respetado (sin lógica de negocio en controller).
   - [ ] Un solo `document.service.js` orquesta Document y DocumentVersion (no existe `documentVersion.service.js`).
   - [ ] Response Layer v1 y `controllerUtils` (buildContext, assertRequestValid) en todos los endpoints de documents.

2. **Dominio**
   - [ ] POST /documents crea Document + primera DocumentVersion (v1, DRAFT) en **una transacción** (ver `document.service.js` → `sequelize.transaction`).
   - [ ] GET /documents/:id devuelve metadatos del documento + `currentVersion` (última APPROVED o última versión).
   - [ ] GET /documents/code/:code está definido **antes** de GET /documents/:id en `document.routes.js`.
   - [ ] DRAFT→APPROVED y APPROVED→ARCHIVED solo permitidos para rol MASTER (403 DOCUMENT_APPROVE_MASTER_ONLY para EMPLOYEE).
   - [ ] change_reason no vacío obligatorio al aprobar (400 DOCUMENT_CHANGE_REASON_REQUIRED).
   - [ ] Al aprobar una versión, se archiva automáticamente la versión APPROVED anterior del mismo documento.
   - [ ] Versiones APPROVED/ARCHIVED no editables (PATCH contenido → 400 DOCUMENT_VERSION_IMMUTABLE).

3. **Base de datos**
   - [ ] Migraciones 20260307100005 y 20260307100006 presentes y aplicadas (`npm run db:migrate`).
   - [ ] FK document_versions.document_id ON DELETE RESTRICT; documents.project_id ON DELETE SET NULL.

4. **API y errores**
   - [ ] Códigos DOCUMENT_* y DOCUMENT_VERSION_* en `errorCodes.js`, CONTRATO_API.md y openapi.yaml.
   - [ ] Endpoints listados en sección 4 de esta evidencia coinciden con `document.routes.js` y v1.routes.js.

5. **Tests**
   - [ ] Ejecutar: `npm test -- --testPathPattern="documents.negative" --runInBand --forceExit`.
   - [ ] 9 tests en verde; ningún flujo esperado devuelve 500.
   - [ ] Suite cubre: 409 código duplicado, 404 documento/versión, 400 transición inválida, 403 EMPLOYEE aprueba, 200 MASTER aprueba, 400 inmutabilidad, 400 sin change_reason.

6. **Auditoría**
   - [ ] En `document.service.js`: DOCUMENT_CREATED, DOCUMENT_VERSION_CREATED, STATUS_CHANGE, DOCUMENT_VERSION_APPROVED, DOCUMENT_VERSION_ARCHIVED con user_id, request_id, entity, entity_id, action, metadata, ip_address, user_agent.

7. **Regresión (opcional)**
   - [ ] Ejecutar suites existentes (backlog, releases, changeRequests, sprints, incidents, improvements) y confirmar que siguen en verde.

### Resultado esperado del proceso

- Todas las fases 1–7 del prompt implementadas.
- Cero respuestas 500 en flujos esperados del módulo documents.
- Arquitectura intacta; sin sequelize.sync(); solo migraciones incrementales.
- Evidencia en este archivo con nomenclatura: `EVIDENCIA_ETAPA_4_SISTEMA_DOCUMENTAL_ISO_<YYYY-MM-DD>.md`.

---

**Nomenclatura del archivo:** `EVIDENCIA_ETAPA_4_SISTEMA_DOCUMENTAL_ISO_<YYYY-MM-DD>.md`
