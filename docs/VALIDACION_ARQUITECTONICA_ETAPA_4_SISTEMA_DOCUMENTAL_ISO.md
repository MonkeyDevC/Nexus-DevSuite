# Validación arquitectónica — ETAPA 4 Sistema documental ISO

**Validador:** SYSTEM ARCHITECT (NEXUS ARCHITECT)  
**Fecha:** 2026-03-05  
**Documento validado:** `docs/PLAN_ETAPA_4_SISTEMA_DOCUMENTAL_ISO.md`  
**Referencia:** nexus-system-architect.mdc, nexus-contexto-arquitectonico.mdc, nexus-plan-maestro-etapas.mdc

---

## I. Resultado de la validación

**ESTADO: APROBADO CON OBSERVACIONES**

La etapa 4 respeta la arquitectura existente y está alineada con la decisión estratégica de versionado documental formal del Plan Maestro. Se identifican observaciones que deben resolverse durante la implementación.

---

## II. Validación por principios arquitectónicos

### 1. Arquitectura en capas obligatoria (controller → service → repository)

| Capa | Document | DocumentVersion | Estado |
|------|----------|-----------------|--------|
| Controller | buildSuccess, buildContext, Response Layer v1 | Idem (rutas anidadas) | OK |
| Service | createDocument, getDocumentById, listDocuments, getDocumentByCode | createVersion, getVersionById, listVersionsByDocumentId, updateVersionStatus | OK |
| Repository | document.repository | documentVersion.repository | OK |

**Evidencia:** El plan define explícitamente la separación. Document y DocumentVersion comparten módulo pero tienen repositorios separados; el service orquesta ambos. Patrón coherente con entidades relacionadas.

---

### 2. Dominio gobernado

- Reglas de negocio en **document.service.js** (incluye lógica de versiones).
- Workflow centralizado en **documentVersion.workflow.constants.js** y **documentVersion.workflow.validator.js**.
- Inmutabilidad de versiones APPROVED/ARCHIVED en service.
- No duplicación de lógica en controllers.

**Evidencia:** Coherente con módulos incidents, improvements y sprints.

---

### 3. Validadores separados

- **document.validator.js:** validaciones de formato (code, title, project_id, etc.).
- **documentVersion.workflow.validator.js:** validaciones de transición DRAFT→APPROVED, APPROVED→ARCHIVED.

**Evidencia:** Patrón alineado con módulos existentes.

---

### 4. Migraciones controladas

| Requisito | Estado |
|-----------|--------|
| No modificar migraciones previas | OK — Solo migraciones nuevas |
| Migraciones incrementales | OK — 20260307100005, 20260307100006 (consecutivas a 20260307100004) |
| snake_case en esquema | OK — documents, document_versions |
| Índices definidos | OK — idx_documents_*, idx_document_versions_* |
| Constraint único | OK — uq_document_versions_document_version (document_id, version_number) |

| FK | onDelete | Justificación |
|----|---------|---------------|
| documents.project_id | SET NULL | OK — Documento organizacional si proyecto se borra |
| documents.created_by | RESTRICT | OK — Plan explícito |
| document_versions.document_id | RESTRICT | OK — No borrar documento con versiones |
| document_versions.created_by, approved_by | RESTRICT/SET NULL | OK — Seguir convención users |

---

### 5. Auditoría estructural obligatoria

| Evento | entity | entity_id | metadata |
|--------|--------|-----------|----------|
| DOCUMENT_CREATED | DOCUMENT | documentId | — |
| DOCUMENT_VERSION_CREATED | DOCUMENT_VERSION | versionId | document_id, version_number |
| STATUS_CHANGE | DOCUMENT_VERSION | versionId | from, to |
| DOCUMENT_VERSION_APPROVED | DOCUMENT_VERSION | versionId | approved_by, approved_at |
| DOCUMENT_VERSION_ARCHIVED | DOCUMENT_VERSION | versionId | — |

**Campos obligatorios:** user_id, request_id, entity, entity_id, action, metadata, ip_address, user_agent.

**Evidencia:** Patrón coherente con authRepository.createAuditLog.

---

### 6. Response Layer v1 obligatorio

- success, data/error, meta.request_id, meta.timestamp.
- buildSuccess, buildContext en controllers.
- controllerUtils en todos los endpoints.

**Evidencia:** Explícito en criterio de cierre.

---

### 7. Error handling estandarizado

- AppError con códigos contractuales.
- Nuevos códigos: DOCUMENT_*, DOCUMENT_VERSION_*.
- DOCUMENT_CODE_ALREADY_EXISTS → 409 Conflict (duplicado).
- Documentación en CONTRATO_API.md y openapi.yaml.

**Evidencia:** Códigos específicos para aprobación (DOCUMENT_APPROVE_MASTER_ONLY).

---

## III. Validaciones arquitectónicas adicionales

| Criterio | Estado |
|----------|--------|
| No rompe arquitectura existente | OK |
| No introduce dependencias circulares | OK — Document depende de Project, User; DocumentVersion depende de Document, User |
| No rompe separación de responsabilidades | OK |
| No mezcla dominio con transporte HTTP | OK |
| No rompe Response Layer | OK |
| No rompe modelo de auditoría | OK |

---

## IV. Cumplimiento de decisión estratégica (Plan Maestro)

| Requisito Plan Maestro | Plan Etapa 4 | Estado |
|------------------------|--------------|--------|
| Versionado documental real | DocumentVersion con version_number incremental | OK |
| Historial inmutable | APPROVED/ARCHIVED no editables | OK |
| version_number | Campo obligatorio, único por document_id | OK |
| change_reason | Campo presente (nullable; recomendado en aprobación) | OK |
| created_by | Obligatorio | OK |
| approved_by, approved_at | Obligatorios al aprobar | OK |
| status (Draft/Approved/Archived) | DRAFT, APPROVED, ARCHIVED | OK |
| Aprobación solo MASTER | DRAFT→APPROVED, APPROVED→ARCHIVED solo MASTER | OK |

---

## V. Validación de base de datos

| Aspecto | Estado |
|---------|--------|
| snake_case | OK |
| Migración dedicada por entidad | OK |
| Orden de migraciones | OK — documents antes que document_versions (FK document_id) |
| paranoid | OK — Document y DocumentVersion con paranoid: true |
| Unique constraint | OK — (document_id, version_number) |
| Índice único en code | OK — idx_documents_code (unique) |

---

## VI. Escalabilidad SaaS

| Criterio | Estado |
|----------|--------|
| No introduce estado global indebido | OK |
| No rompe escalabilidad horizontal | OK |
| No depende de memoria local | OK |
| content como TEXT | OK — Futuro: puede ser URL o referencia; no almacenar binarios pesados en BD sin política clara |

---

## VII. Integración con entidades existentes

| Entidad | Relación | Estado |
|---------|----------|--------|
| Project | Document puede ser organizacional (project_id nullable) o de proyecto | OK |
| User | created_by (Document), created_by, approved_by (DocumentVersion) | OK |

**loadModels:** El plan especifica incluir `...documentModels` en cachedModels. Document y DocumentVersion en mismo módulo (defineDocumentModels retorna ambos).

---

## VIII. Transacción POST /documents

El plan indica: "Crear documento y primera versión DRAFT (version_number 1) en una transacción o secuencia definida."

**Evidencia:** Requiere atomicidad. El service debe usar `sequelize.transaction()` para crear Document y DocumentVersion en una sola operación. Evitar estado inconsistente si falla la creación de la versión.

---

## IX. Observaciones para el MASTER DEVELOPER

### O1. Orden de rutas Express — GET /documents/code/:code

La ruta `GET /documents/code/:code` debe definirse **antes** de `GET /documents/:id`. Si no, Express interpretará "code" como `:id` y devolverá 404. Definir rutas más específicas antes que las parametrizadas genéricas.

### O2. change_reason — obligatoriedad en aprobación

El plan indica "obligatorio en flujo de aprobación (recomendado)". El modelo tiene `change_reason` nullable. **Recomendación:** Definir en el prompt si es obligatorio al transicionar DRAFT→APPROVED. Para ISO 9001, se recomienda exigirlo.

### O3. Archivado automático de versión anterior

El plan dice: "Opcional: al aprobar una nueva versión (DRAFT→APPROVED), archivar automáticamente la versión APPROVED anterior del mismo documento (si existe)." **Recomendación:** Incluir en el prompt como obligatorio u opcional explícito para evitar ambigüedad.

### O4. documentVersion.service vs document.service

El plan lista solo `document.service.js`. Las operaciones de DocumentVersion (createVersion, updateVersionStatus, etc.) pueden vivir en `document.service.js` (orquestando document.repository y documentVersion.repository) o en un `documentVersion.service.js` separado. **Recomendación:** Un solo `document.service.js` que use ambos repositorios es coherente con el plan y evita complejidad innecesaria.

### O5. PATCH de versión DRAFT

El plan indica `PATCH /documents/:documentId/versions/:versionId` como opcional para editar change_reason y content cuando status es DRAFT. Si se implementa, el service debe validar `status === DRAFT` antes de actualizar. El repository no debe permitir update de content/change_reason si status !== DRAFT (o el service debe bloquear la llamada).

### O6. GET /documents/:id — respuesta

El plan dice: "documento con última versión aprobada o lista de versiones según diseño". **Recomendación:** Definir en el prompt la estructura de respuesta: ¿incluir solo metadatos del documento? ¿incluir la última versión APPROVED embebida? ¿incluir lista de versiones? Evitar ambigüedad.

---

## X. Criterios de bloqueo — No aplicados

No se detectan:

- Violación de arquitectura en capas
- Duplicación de lógica de dominio
- Cambios peligrosos en base de datos
- Rompimiento del Response Layer
- Acoplamientos fuertes entre módulos
- Introducción de deuda técnica estructural

---

## XI. Evidencia de validación

| Elemento | Confirmado |
|----------|------------|
| Arquitectura intacta | Sí |
| Separación de capas respetada | Sí |
| Dominio correctamente encapsulado | Sí |
| Migraciones correctas | Sí |
| Response Layer intacto | Sí |
| Auditoría estructural consistente | Sí |
| Decisión estratégica de versionado cumplida | Sí |

---

## XII. Conclusión

**La ETAPA 4 — Sistema documental ISO está APROBADA para implementación** por el MASTER DEVELOPER.

Las observaciones O1–O6 son de clarificación y no bloquean la ejecución. El PO MASTER debe incorporarlas al prompt de implementación antes de enviarlo al MASTER DEVELOPER.

**Firma de validación:** SYSTEM ARCHITECT (NEXUS ARCHITECT) — 2026-03-05
