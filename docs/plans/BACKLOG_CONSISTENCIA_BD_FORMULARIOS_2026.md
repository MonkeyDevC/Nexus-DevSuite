# Backlog de consistencia BD — Modelos, API y formularios

**Rol:** Product Owner Senior — NEXUS DevSuite  
**Origen:** docs/AUDITORIA_BD_MODELOS_API_FORMULARIOS_2026.md  
**Objetivo:** Backlog priorizado de tickets que alinean frontend y backend con el modelo de datos existente, sin modificar arquitectura ni eliminar campos de la base de datos.  
**Regla:** Solo alinear uso de campos ya definidos en BD; no añadir nuevos campos en BD.

---

# PARTE 1 — CLASIFICACIÓN DE HALLAZGOS

| # | Hallazgo | Prioridad | Tipo |
|---|----------|-----------|------|
| 1 | Feature: priority no enviado en crear | **ALTA** | Frontend |
| 2 | Document: description y project_id no enviados en crear | **ALTA** | Frontend |
| 3 | Incident: description y severity fijos en crear | **ALTA** | Frontend |
| 4 | Sprint: goal no editable (PATCH backend sin goal; frontend sin campo) | **MEDIA** | Backend + Frontend |
| 5 | Improvement: project_id e incident_id no enviados en crear | **MEDIA** | Frontend |
| 6 | Organization: settings no enviado en PATCH | **BAJA** | Frontend (opcional) |
| 7 | RefreshToken: token_hash modelo 255 vs migración 128 | **BAJA** | Refactor técnico |
| 8 | User stories: sprint_id no declarado en validador de creación | **BAJA** | Backend |
| 9 | Document: description no editable tras creación (sin PATCH documento) | **MEDIA** | Decisión producto / Frontend (solo si API expone PATCH documento) |

---

# PARTE 2 — TICKETS POR TIPO

---

## A) FRONTEND

---

### NEXUS-CONS-001

| Campo | Valor |
|-------|--------|
| **ID** | NEXUS-CONS-001 |
| **Título** | Añadir prioridad al formulario de crear feature |
| **Prioridad** | ALTA |
| **Descripción** | El modelo y la API aceptan el campo `priority` en POST /projects/:projectId/features. El formulario del frontend solo envía title y description; no existe selector de prioridad. Los usuarios no pueden asignar prioridad (LOW, MEDIUM, HIGH, CRITICAL) al crear una feature. |
| **Objetivo** | Que el formulario de creación de feature envíe el campo priority al backend, utilizando los valores definidos en el modelo/API. |
| **Archivos afectados** | public/js/views/features.js |
| **Criterios de aceptación** | (1) El modal "Nueva feature" incluye un campo para prioridad (select con opciones LOW, MEDIUM, HIGH, CRITICAL o las que exponga la API). (2) Al enviar el POST, el body incluye `priority` con el valor seleccionado (o valor por defecto si se deja opcional). (3) La feature creada refleja la prioridad en listado o detalle si se muestra. |

---

### NEXUS-CONS-002

| Campo | Valor |
|-------|--------|
| **ID** | NEXUS-CONS-002 |
| **Título** | Añadir descripción y opcional project_id al crear documento |
| **Prioridad** | ALTA |
| **Descripción** | La API acepta `description` y `project_id` en POST /documents. El formulario actual solo envía code y title. La descripción es un campo de negocio relevante para documentos; project_id permite asociar el documento a un proyecto. |
| **Objetivo** | Incluir description en el formulario de creación de documento y, opcionalmente, selector de proyecto (project_id) si el flujo de negocio lo requiere. |
| **Archivos afectados** | public/js/views/documents.js |
| **Criterios de aceptación** | (1) El modal o formulario de "Crear documento" incluye campo descripción (textarea u otro). (2) El body del POST /documents incluye `description` con el valor introducido (vacío o string). (3) Opcional: selector de proyecto que envíe `project_id` en el POST cuando se implemente. (4) No se elimina ningún campo existente (code, title). |

---

### NEXUS-CONS-003

| Campo | Valor |
|-------|--------|
| **ID** | NEXUS-CONS-003 |
| **Título** | Añadir descripción y severidad al crear incidente |
| **Prioridad** | ALTA |
| **Descripción** | El formulario de creación de incidente envía description vacía y severity fija "MEDIUM". La API acepta description y severity en POST. Los usuarios no pueden describir el incidente ni elegir severidad (LOW, MEDIUM, HIGH, CRITICAL) al crear. |
| **Objetivo** | Permitir al usuario introducir descripción y elegir severidad al crear un incidente, y enviar ambos en el POST. |
| **Archivos afectados** | public/js/views/incidents.js |
| **Criterios de aceptación** | (1) El modal/formulario de "Nuevo incidente" incluye campo descripción (textarea) y selector de severidad (LOW, MEDIUM, HIGH, CRITICAL o los valores que defina la API). (2) El body del POST incluye `description` con el valor del usuario y `severity` con el valor seleccionado. (3) Si el usuario deja descripción vacía, se envía cadena vacía o se omite según contrato API. (4) Title se mantiene obligatorio según API. |

---

### NEXUS-CONS-004

| Campo | Valor |
|-------|--------|
| **ID** | NEXUS-CONS-004 |
| **Título** | Permitir editar objetivo (goal) de sprint en frontend |
| **Prioridad** | MEDIA |
| **Descripción** | El sprint tiene el campo `goal` en BD y modelo. El formulario de edición de sprint no muestra ni envía goal. El backend debe aceptar goal en PATCH (ver NEXUS-CONS-007). Una vez el backend acepte goal, el frontend debe incluir el campo en el formulario de edición y enviarlo en PATCH. |
| **Objetivo** | Que el usuario pueda ver y editar el objetivo del sprint desde la UI, y que el valor se persista vía PATCH. |
| **Archivos afectados** | public/js/views/sprints.js |
| **Dependencia** | Backend debe aceptar goal en PATCH (NEXUS-CONS-007). |
| **Criterios de aceptación** | (1) En la vista de detalle de sprint (o modal de edición), existe un campo "Objetivo" (goal) visible y editable. (2) Al guardar la edición del sprint, el PATCH incluye `goal` con el valor del campo. (3) Al cargar el detalle del sprint, el campo goal se rellena con el valor devuelto por GET /sprints/:id. |

---

### NEXUS-CONS-005

| Campo | Valor |
|-------|--------|
| **ID** | NEXUS-CONS-005 |
| **Título** | Opcional: project_id e incident_id en formulario de crear mejora |
| **Prioridad** | MEDIA |
| **Descripción** | La API acepta project_id e incident_id en POST /improvements. El formulario actual solo envía title y description. Si el flujo de negocio requiere asociar una mejora a un proyecto o a un incidente, los selectores deben añadirse. |
| **Objetivo** | Opcionalmente, permitir al usuario asociar la mejora a un proyecto y/o a un incidente al crear, enviando project_id e incident_id en el POST cuando corresponda. |
| **Archivos afectados** | public/js/views/improvements.js |
| **Criterios de aceptación** | (1) Si se implementa: el modal "Nueva mejora" incluye selector de proyecto (opcional) y/o selector de incidente (opcional, posiblemente filtrado por proyecto). (2) El body del POST incluye project_id y/o incident_id cuando el usuario los selecciona. (3) Si el flujo no requiere estos campos, el ticket puede cerrarse como "No implementar" documentando la decisión. |

---

### NEXUS-CONS-006

| Campo | Valor |
|-------|--------|
| **ID** | NEXUS-CONS-006 |
| **Título** | Opcional: settings en edición de organización |
| **Prioridad** | BAJA |
| **Descripción** | El modelo organizations tiene el campo `settings` (JSON). La API acepta settings en PATCH /organizations/:id. El formulario de Admin → Organización no incluye settings. Si la organización usa settings para configuración, debe exponerse (campo editable o solo lectura). |
| **Objetivo** | Si el producto utiliza el campo settings de la organización, añadirlo al formulario de edición (o vista de solo lectura); en caso contrario, documentar que no se usa y cerrar como N/A. |
| **Archivos afectados** | public/js/views/admin.js |
| **Criterios de aceptación** | (1) Si se implementa: el formulario de #/admin/organization incluye un campo o bloque para settings (por ejemplo textarea JSON o campos específicos según diseño). El PATCH envía settings cuando se modifica. (2) Si no se usa: se documenta en el ticket que settings no se expone por decisión de producto. |

---

## B) BACKEND

---

### NEXUS-CONS-007

| Campo | Valor |
|-------|--------|
| **ID** | NEXUS-CONS-007 |
| **Título** | PATCH sprint: aceptar y persistir goal |
| **Prioridad** | MEDIA |
| **Descripción** | El modelo Sprint tiene el campo goal. El endpoint PATCH genérico de sprint (actualización de nombre, fechas) no incluye goal en el validador ni en la lógica de actualización. Para que el frontend pueda editar el objetivo del sprint (NEXUS-CONS-004), el backend debe aceptar goal en el PATCH. |
| **Objetivo** | Incluir el campo goal en el validador y en la lógica de actualización (PATCH) del sprint para que las ediciones desde frontend persistan el objetivo. |
| **Archivos afectados** | src/modules/backlog/ o src/modules/sprints/ (validador y controlador/servicio de PATCH de sprint). |
| **Criterios de aceptación** | (1) El validador del PATCH de sprint acepta un campo opcional `goal` (string o texto). (2) La actualización del sprint en base de datos incluye el campo goal cuando viene en el body. (3) GET /sprints/:id devuelve el campo goal. (4) No se modifican otros campos ni la estructura del endpoint. |

---

### NEXUS-CONS-008

| Campo | Valor |
|-------|--------|
| **ID** | NEXUS-CONS-008 |
| **Título** | Declarar sprint_id en validador de creación de user story |
| **Prioridad** | BAJA |
| **Descripción** | El servicio de creación de user story ya utiliza sprint_id si viene en el body, pero el validador de creación (createStoryValidator o equivalente) no declara sprint_id como campo aceptado. Esto puede generar inconsistencias de documentación o validación. |
| **Objetivo** | Añadir sprint_id como campo opcional en el validador de POST de user stories para que quede documentado y validado de forma explícita. |
| **Archivos afectados** | src/modules/backlog/ (validador de creación de stories; p. ej. validators o schemas). |
| **Criterios de aceptación** | (1) El validador de creación de user story incluye sprint_id como opcional (UUID o string). (2) El comportamiento actual del servicio se mantiene (asignación a sprint si sprint_id viene en el body). (3) No se rompe ningún flujo existente del frontend. |

---

## C) REFACTOR TÉCNICO

---

### NEXUS-CONS-009

| Campo | Valor |
|-------|--------|
| **ID** | NEXUS-CONS-009 |
| **Título** | Alinear tipo token_hash en modelo RefreshToken con migración |
| **Prioridad** | BAJA |
| **Descripción** | El modelo RefreshToken define token_hash como STRING(255); la migración de la tabla refresh_tokens define token_hash como STRING(128). La inconsistencia puede generar advertencias o comportamientos no deseados en migraciones futuras o en validaciones. |
| **Objetivo** | Alinear la longitud de token_hash entre modelo Sequelize y migración: bien cambiar el modelo a STRING(128) para coincidir con la migración, bien crear una migración que amplíe la columna a 255 si se prefiere mayor margen. No eliminar el campo ni cambiar la semántica. |
| **Archivos afectados** | Modelo RefreshToken (src/modules/auth/models o similar); opcionalmente una nueva migración si se amplía la columna. |
| **Criterios de aceptación** | (1) Tras el cambio, el modelo y el esquema de BD (migración) coinciden en tipo y longitud de token_hash. (2) Los tokens existentes siguen siendo válidos; no se requiere cambio de lógica de negocio. (3) No se elimina ni renombra el campo. |

---

# PARTE 3 — RESUMEN DE TICKETS POR PRIORIDAD Y TIPO

| ID | Título | Prioridad | Tipo |
|----|--------|-----------|------|
| NEXUS-CONS-001 | Añadir priority al crear feature | ALTA | Frontend |
| NEXUS-CONS-002 | Añadir description (y opcional project_id) al crear documento | ALTA | Frontend |
| NEXUS-CONS-003 | Añadir description y severity al crear incidente | ALTA | Frontend |
| NEXUS-CONS-004 | Editar goal de sprint en frontend | MEDIA | Frontend |
| NEXUS-CONS-005 | Opcional: project_id e incident_id en crear mejora | MEDIA | Frontend |
| NEXUS-CONS-006 | Opcional: settings en edición de organización | BAJA | Frontend |
| NEXUS-CONS-007 | PATCH sprint: aceptar goal en backend | MEDIA | Backend |
| NEXUS-CONS-008 | Declarar sprint_id en createStoryValidator | BAJA | Backend |
| NEXUS-CONS-009 | Alinear token_hash modelo RefreshToken | BAJA | Refactor técnico |

---

# PARTE 4 — SPRINT DE CORRECCIÓN DE CONSISTENCIA

## 4.1 Objetivo del sprint

Corregir la consistencia entre base de datos, modelos, API y formularios del frontend, implementando los tickets del backlog sin modificar arquitectura ni eliminar campos de BD.

## 4.2 Alcance

- **Duración sugerida:** 1 sprint (p. ej. 1 semana o 5 días de desarrollo).
- **Tickets incluidos:** Los 9 tickets NEXUS-CONS-001 a NEXUS-CONS-009, ordenados por prioridad y dependencias.

## 4.3 Orden de implementación recomendado

| Orden | Ticket | Motivo |
|-------|--------|--------|
| 1 | **NEXUS-CONS-007** | Backend: PATCH sprint con goal. Debe estar antes de que el frontend lo use (CONS-004). |
| 2 | **NEXUS-CONS-001** | Frontend: priority en feature; impacto alto, sin dependencias. |
| 3 | **NEXUS-CONS-002** | Frontend: description (y opcional project_id) en documento. |
| 4 | **NEXUS-CONS-003** | Frontend: description y severity en incidente. |
| 5 | **NEXUS-CONS-004** | Frontend: editar goal de sprint (depende de CONS-007). |
| 6 | **NEXUS-CONS-005** | Frontend: opcional project_id/incident_id en mejora (valorar si el flujo lo requiere). |
| 7 | **NEXUS-CONS-008** | Backend: sprint_id en validador de stories; bajo riesgo. |
| 8 | **NEXUS-CONS-009** | Refactor: token_hash; bajo riesgo. |
| 9 | **NEXUS-CONS-006** | Frontend: opcional settings en organización; valorar si se usa. |

## 4.4 Dependencias entre tickets

| Ticket | Depende de |
|--------|------------|
| NEXUS-CONS-004 | NEXUS-CONS-007 (backend debe aceptar goal antes de enviarlo desde frontend). |
| Resto | Ninguna. |

## 4.5 Criterio de cierre del sprint

- Todos los tickets ALTA (001, 002, 003) implementados y verificados.
- Tickets MEDIA (004, 005, 007) implementados o cerrados como "No implementar" con decisión documentada (p. ej. 005, 006).
- Tickets BAJA (006, 008, 009) implementados o pospuestos al siguiente sprint con acuerdo del PO.
- Actualización de docs/ENDPOINTS_API_Y_USO_FRONTEND.md si algún payload de formulario cambia.
- Registro en docs/project-logs/TICKETS_IMPLEMENTADOS.md (o equivalente para NEXUS-CONS-*).

## 4.6 Riesgos y mitigación

| Riesgo | Mitigación |
|--------|------------|
| API de sprint no expone PATCH genérico con body | Verificar ruta exacta de actualización de sprint (PATCH /sprints/:id o bajo backlog); adaptar CONS-007 al endpoint real. |
| Campos opcionales en mejoras/organización no usados en producto | Cerrar CONS-005 y CONS-006 como "No implementar" documentando la decisión; no obligatorio implementar todos los opcionales. |

---

**Documento listo para que el Master Developer ejecute el sprint de consistencia. Origen técnico: docs/AUDITORIA_BD_MODELOS_API_FORMULARIOS_2026.md.**
