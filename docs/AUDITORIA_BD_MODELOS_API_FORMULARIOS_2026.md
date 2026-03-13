# Auditoría: Base de datos, modelos Sequelize, API y formularios frontend

**Proyecto:** NEXUS DevSuite  
**Rol:** Master Developer  
**Fecha:** 2026-03  
**Objetivo:** Verificar coherencia entre modelo de base de datos, modelos Sequelize, endpoints del backend y formularios de creación/edición del frontend. Identificar campos de la BD no utilizados en la UI o no expuestos por la API.

---

## Resumen ejecutivo

Se ha realizado una auditoría en cuatro capas (BD → modelos → API → frontend) para las entidades con formularios de crear/editar. **No se propone modificar la arquitectura ni eliminar campos de la base de datos;** solo alinear frontend y backend con el modelo existente.

**Hallazgos principales:**

- La mayoría de tablas y modelos Sequelize están alineados; no hay campos de BD faltantes en los modelos.
- Existen **campos de negocio** aceptados por la API que **no se envían** desde los formularios del frontend (description/project_id en documentos; priority en features; project_id/incident_id en improvements; description/severity en incidentes al crear; goal en sprints al editar; settings en organización).
- Algunos formularios no permiten **editar** campos que la API sí acepta (ej. descripción de documento, goal de sprint).
- Un detalle de consistencia: modelo `refresh_tokens` usa `token_hash` STRING(255) frente a migración STRING(128).

---

## PASO 1 — Modelo de base de datos (por tabla)

Origen: migraciones en `src/infrastructure/db/migrations/`.

| Tabla | Campos de negocio | Relaciones | Auditoría / workflow |
|-------|-------------------|------------|----------------------|
| **roles** | id (PK), name, description | — | — |
| **users** | id, email, password_hash, is_active, name, profile_photo_url | role_id, organization_id | created_at, updated_at, deleted_at |
| **refresh_tokens** | id, token_hash, expires_at, revoked_at | user_id | created_at, updated_at |
| **organizations** | id, name, slug, settings, plan, billing_email, next_billing_date | — | created_at, updated_at |
| **projects** | id, number, name, description, status | organization_id, created_by | archived_at, created_at, updated_at |
| **features** | id, title, description, status, priority | project_id, release_id, created_by, approved_by | approved_at, closed_at, created_at, updated_at |
| **user_stories** | id, number, title, description, acceptance_criteria, status, priority | feature_id, sprint_id, assigned_to, created_by, approved_by | closed_at, created_at, updated_at |
| **sprints** | id, name, goal, start_date, end_date, status | project_id, created_by, closed_by | closed_at, created_at, updated_at, deleted_at |
| **releases** | id, version, status, description | organization_id, created_by | released_at, created_at, updated_at, deleted_at |
| **incidents** | id, title, description, severity, status, root_cause_analysis | project_id, reported_by, assigned_to, closed_by | closed_at, created_at, updated_at, deleted_at |
| **improvements** | id, title, description, status | project_id, incident_id, proposed_by, approved_by | approved_at, implemented_at, created_at, updated_at, deleted_at |
| **documents** | id, code, title, description | project_id, created_by | created_at, updated_at, deleted_at |
| **document_versions** | id, version_number, status, change_reason, content | document_id, created_by, approved_by | approved_at, created_at, updated_at, deleted_at |
| **change_requests** | id, code, title, description, type, impact_level, status | requested_by, approved_by, entity_type, entity_id | approved_at, implemented_at, created_at, updated_at, deleted_at |
| **audit_logs** | id, user_id, action, entity, entity_id, metadata, request_id, ip_address, user_agent | — | created_at |

Campos obligatorios y tipos se derivan de las migraciones (UUID, STRING, TEXT, ENUM, DATE, etc.). Relaciones con otras tablas vía FK; soft delete donde existe `deleted_at`.

---

## PASO 2 — Modelos Sequelize vs base de datos

Verificación: modelos en `src/modules/*/models/*.js` frente al esquema de migraciones.

| Entidad | Coincide | Observaciones |
|---------|----------|---------------|
| roles | Sí | — |
| users (auth + users) | Sí | name, profile_photo_url presentes |
| refresh_tokens | Casi | token_hash: modelo STRING(255), migración STRING(128). Alinear tipo si se quiere consistencia estricta. |
| organizations | Sí | — |
| projects | Sí | number, organization_id, created_by, etc. |
| features | Sí | — |
| user_stories | Sí | number, acceptance_criteria, etc. |
| sprints | Sí | — |
| releases | Sí | — |
| incidents | Sí | — |
| improvements | Sí | — |
| documents | Sí | — |
| document_versions | Sí | — |
| change_requests | Sí | — |
| audit_logs | Sí | — |

**Conclusión:** No hay campos de BD faltantes en los modelos. Única inconsistencia menor: longitud de `token_hash` en el modelo RefreshToken.

---

## PASO 3 — API: endpoints POST / PUT / PATCH y campos aceptados

Resumen por entidad (validadores + controladores).

| Entidad | Crear (POST) | Actualizar (PATCH/PUT) |
|---------|--------------|--------------------------|
| **projects** | name, description | name?, description? |
| **features** | title, description, priority? | status (PATCH /status) |
| **user_stories** | title, description, acceptance_criteria?, priority?, assigned_to?, sprint_id? (servicio usa si viene) | title?, description?, priority?, assigned_to?, acceptance_criteria?; status; sprint_id (rutas específicas) |
| **sprints** | name, goal?, start_date?, end_date? | name?, start_date?, end_date? (PATCH genérico sin goal) |
| **releases** | version, description? | description?; status (PATCH /status) |
| **incidents** | title, description?, severity? | assigned_to?, root_cause_analysis?; status + root_cause_analysis? |
| **improvements** | title, description?, project_id?, incident_id? | status (PATCH /status) |
| **documents** | code, title, description?, project_id?, content? | — (solo versiones: change_reason?, content?; status en versión) |
| **document_versions** | change_reason?, content? | change_reason?, content?; status |
| **change_requests** | entity_type, entity_id, title?, description?, type?, impact_level? | submit/approve/reject/implement (sin body) |
| **organizations** | — | name?, settings?, plan?, billing_email?, next_billing_date? |
| **users** | email, password, role_id, name?, profile_photo_url?, is_active? | PUT: name?, profile_photo_url?, email?, password?, role_id?, is_active? |

Campos generados en backend (no enviados por cliente): id (UUID), created_at, updated_at, created_by/organization_id cuando se infieren del contexto, number en projects/user_stories cuando es auto, code en change_requests, etc.

---

## PASO 4 — Formularios frontend (crear / editar)

| Vista | Crear: campos en formulario | Editar: campos en formulario | Payload real enviado (crear) |
|-------|-----------------------------|------------------------------|------------------------------|
| **projects** | name, description | name, description | name, description |
| **features** | title, description | Solo estado (select) | title, description (sin priority) |
| **stories** | title, description, priority, sprint, asignado | title, description, priority, asignado, estado, sprint, criterios | title, description, priority, assigned_to?, sprint_id? |
| **sprints** | name, start_date, end_date (goal no visible en modal crear) | name, start_date, end_date (sin goal) | name, goal: "", start_date?, end_date? |
| **releases** | version, description | description; estado; hotfix; asignar feature | version, description |
| **incidents** | title (descripción vacía, severity fijo MEDIUM) | estado, asignado, causa raíz | title, description: "", severity: "MEDIUM" |
| **improvements** | title, description | Solo estado | title, description (sin project_id, incident_id) |
| **documents** | code, title | — (solo versiones) | code, title (sin description, project_id) |
| **document_versions** | change_reason, content | content (modal Ver contenido); status (botones) | change_reason?, content? |
| **change_requests** | entity_type, entity_id, title, description, type, impact_level | Acciones por ID (submit/approve/reject/implement) | entity_type, entity_id, title?, description?, type?, impact_level? |
| **admin (users)** | email, password, role_id | name, email, role_id, contraseña opcional | POST: email, password, role_id. PUT: email, name?, role_id? |
| **admin (organization)** | — | name, plan, billing_email, next_billing_date | PATCH: name, plan?, billing_email?, next_billing_date? (sin settings) |

---

## PASO 5 — Tabla comparativa (entidad / campo DB / modelo / API / formulario)

Solo se listan entidades con formularios y campos con alguna brecha o decisión relevante.

| Entidad | Campo DB | En modelo | En API (create/update) | En formulario | Estado |
|---------|----------|-----------|------------------------|---------------|--------|
| **features** | priority | Sí | Sí (POST) | No en crear | No usado en UI crear |
| **features** | title, description, status | Sí | Sí | Sí (crear: title, desc; editar: estado) | OK |
| **user_stories** | sprint_id | Sí | Sí (POST; servicio usa si viene) | Sí (crear) | OK (validador podría declarar sprint_id) |
| **sprints** | goal | Sí | Sí (POST); PATCH genérico no goal | Crear: goal ""; editar: no hay campo goal | Goal no editable en UI |
| **incidents** | description, severity | Sí | Sí (POST) | Crear: description "", severity MEDIUM fijo | No elegibles en crear |
| **improvements** | project_id, incident_id | Sí | Sí (POST) | No en formulario | No usados en UI |
| **documents** | description, project_id | Sí | Sí (POST) | No en crear | No usados en UI crear |
| **organizations** | settings | Sí | Sí (PATCH) | No en formulario | No usado en UI |
| **users** | name, organization_id | Sí | POST: name?; organization_id por contexto | Crear: no name; editar: name | name en crear no enviado si se añade campo |
| **releases** | version, description, status | Sí | Sí | version, description; estado en detalle | OK |
| **projects** | name, description, status | Sí | Sí | name, description | OK (status no editable en formulario; puede ser intencional) |
| **change_requests** | entity_type, entity_id, title, description, type, impact_level | Sí | Sí | Todos en formulario crear | OK |

Campos de auditoría (created_at, updated_at, created_by, etc.): generados en backend; no deben enviarse desde el frontend. Correcto en el estado actual.

---

## PASO 6 — Clasificación de hallazgos

### 1) Campos de BD no usados en frontend (formularios)

- **features:** priority (la API lo acepta en POST; el formulario no lo envía).
- **improvements:** project_id, incident_id (API los acepta en POST; el formulario no los incluye).
- **documents:** description, project_id (API los acepta en POST; el formulario solo envía code y title).
- **incidents:** description y severity en crear (el formulario envía description "" y severity "MEDIUM" fijo; no hay campos editables).
- **organizations:** settings (API acepta en PATCH; el formulario no lo envía).
- **sprints:** goal en edición (PATCH genérico del backend no incluye goal; frontend no muestra goal en editar).

### 2) Campos de BD no expuestos por la API

No se detectaron campos de la BD que la API no acepte o exponga cuando corresponde; los que faltan son opcionales y la API ya los admite en los validadores. La brecha es de **uso en frontend**, no de exposición en API.

### 3) Campos que deberían ser editables pero no lo son

- **documents:** description no editable en creación ni en un PATCH de documento (solo hay PATCH en versiones).
- **sprints:** goal no editable en el formulario de edición (y el PATCH genérico del backend no incluye goal).
- **incidents:** description y severity no editables al crear (solo título); en edición sí se puede causa raíz y asignado.

### 4) Campos que deben ser solo automáticos

Correctos como están: id, created_at, updated_at, deleted_at, created_by (cuando se infiere), number/code cuando se generan en backend, organization_id cuando se toma del contexto. No requieren cambios.

---

## PASO 7 — Propuesta de ajustes

### Frontend

| Ajuste | Archivo(s) | Acción |
|--------|------------|--------|
| Añadir **priority** al formulario de crear feature | `public/js/views/features.js` | Incluir select de prioridad (LOW, MEDIUM, HIGH, CRITICAL) en el modal "Nueva feature" y enviarlo en el body del POST. |
| Añadir **description** y opcionalmente **project_id** al crear documento | `public/js/views/documents.js` | Incluir campo descripción en el modal de nuevo documento; opcionalmente selector de proyecto si se desea filtrar por proyecto. Enviar description y project_id en POST. |
| Añadir **description** y **severity** al crear incidente | `public/js/views/incidents.js` | Incluir textarea descripción y select severidad (LOW, MEDIUM, HIGH, CRITICAL) en el modal de nuevo incidente; enviar en POST. |
| Opcional: **project_id** e **incident_id** en crear mejora | `public/js/views/improvements.js` | Si el flujo de negocio lo requiere, añadir selectores de proyecto e incidente y enviarlos en POST. |
| Edición de **goal** en sprint | `public/js/views/sprints.js` | Añadir campo "Objetivo" (goal) en el formulario/modal de edición de sprint y enviarlo en PATCH. Requiere que el backend acepte goal en PATCH (ver abajo). |
| **settings** en organización (solo si se usa) | `public/js/views/admin.js` | Si la organización usa settings (JSON), añadir campo o vista read-only; si no se usa, dejar sin cambio. |

Campos que conviene mantener **solo lectura** en UI cuando corresponda: id, number, code (cuando es auto), created_at, updated_at, created_by (mostrar nombre, no editar).

### Backend

| Ajuste | Archivo(s) | Acción |
|--------|------------|--------|
| PATCH sprint: aceptar **goal** | `src/modules/sprints/` (validator + service/controller) | Incluir `goal` en el validador y en la lógica de PATCH del sprint para que la edición desde frontend persista el objetivo. |
| refresh_tokens: alinear tipo **token_hash** | Modelo RefreshToken | Opcional: cambiar STRING(255) a STRING(128) para coincidir con la migración, o ampliar la migración a 255 si se prefiere. |
| user_stories: declarar **sprint_id** en createStoryValidator | `src/modules/backlog/` (validator de stories) | Añadir sprint_id opcional al validador de creación para que quede documentado y validado (el servicio ya lo usa). |

No se proponen eliminaciones de campos ni cambios de arquitectura.

---

## Salida esperada: informe y tickets

### 1) Informe técnico

Este documento constituye el **informe técnico de auditoría**. Resumen:

- **BD:** Esquema extraído de migraciones; tablas y relaciones coherentes.
- **Modelos Sequelize:** Reflejan la BD; única diferencia menor en `token_hash` (longitud).
- **API:** POST/PATCH/PUT aceptan los campos necesarios; en algunos casos el frontend no envía todos (priority en features, description/project_id en documents, description/severity en incidents, project_id/incident_id en improvements, goal en PATCH sprint, settings en organization).
- **Formularios:** Varios formularios de creación no envían campos que la API ya acepta; algunos campos editables en BD (goal de sprint, description de documento) no son editables en la UI o no están en el PATCH correspondiente.

### 2) Lista de inconsistencias detectadas

1. Feature: priority no enviado en crear.  
2. Document: description y project_id no enviados en crear.  
3. Incident: description y severity fijos en crear.  
4. Improvement: project_id e incident_id no enviados en crear.  
5. Sprint: goal no editable (y PATCH sin goal).  
6. Organization: settings no enviado en PATCH.  
7. RefreshToken (modelo): token_hash 255 vs 128 en migración.  
8. User stories: sprint_id no declarado en validador de creación (sí usado en servicio).

### 3) Recomendaciones de ajuste

- **Prioridad alta (impacto en datos de negocio):**  
  - Añadir description y severity al crear incidente.  
  - Añadir description al crear documento.  
  - Añadir priority al crear feature.
- **Prioridad media (mejora de consistencia):**  
  - Permitir editar goal de sprint (backend PATCH + campo en frontend).  
  - Opcional: project_id en documento e project_id/incident_id en mejora según flujo.
- **Prioridad baja:**  
  - Alinear token_hash en modelo o migración; declarar sprint_id en validador de creación de story.

### 4) Tickets técnicos sugeridos

| ID | Título | Capa | Descripción |
|----|--------|------|-------------|
| NEXUS-AUD-DB-01 | Añadir priority al formulario de crear feature | Frontend | Incluir select de prioridad en modal nueva feature y enviarlo en POST. |
| NEXUS-AUD-DB-02 | Añadir description (y opcional project_id) al crear documento | Frontend | Campos en modal nuevo documento y en body POST. |
| NEXUS-AUD-DB-03 | Añadir description y severity al crear incidente | Frontend | Textarea y select en modal nuevo incidente; enviar en POST. |
| NEXUS-AUD-DB-04 | PATCH sprint: aceptar goal en backend | Backend | Incluir goal en validador y en actualización de sprint. |
| NEXUS-AUD-DB-05 | Editar goal de sprint en frontend | Frontend | Campo objetivo en formulario de edición de sprint y envío en PATCH. |
| NEXUS-AUD-DB-06 | Opcional: project_id e incident_id en crear mejora | Frontend | Selectores y envío en POST si el flujo lo requiere. |
| NEXUS-AUD-DB-07 | Opcional: settings en edición de organización | Frontend | Solo si se usa; campo o vista read-only en admin. |
| NEXUS-AUD-DB-08 | Declarar sprint_id en createStoryValidator | Backend | Añadir sprint_id opcional al validador de POST stories. |
| NEXUS-AUD-DB-09 | Alinear tipo token_hash en modelo RefreshToken | Backend | STRING(128) en modelo o ampliar migración a 255. |

---

**Importante:** No se modifican arquitectura ni esquema de BD; solo se alinea el uso de campos existentes entre base de datos, modelos, API y formularios.

---

## Backlog y sprint derivados

A partir de esta auditoría se ha generado un **backlog priorizado** y un **sprint de corrección de consistencia** en:

- **docs/plans/BACKLOG_CONSISTENCIA_BD_FORMULARIOS_2026.md**

Incluye: clasificación de hallazgos (ALTA/MEDIA/BAJA), tickets técnicos con ID, título, descripción, objetivo, archivos afectados y criterios de aceptación; agrupación por Frontend / Backend / Refactor técnico; y orden de implementación del sprint.
