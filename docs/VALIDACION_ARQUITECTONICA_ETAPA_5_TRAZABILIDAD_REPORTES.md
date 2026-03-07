# Validación arquitectónica — ETAPA 5 Trazabilidad y reportes

**Validador:** SYSTEM ARCHITECT (NEXUS ARCHITECT)  
**Fecha:** 2026-03-05  
**Documento validado:** `docs/PLAN_ETAPA_5_TRAZABILIDAD_REPORTES.md`  
**Referencia:** nexus-system-architect.mdc, nexus-contexto-arquitectonico.mdc

---

## I. Resultado de la validación

**ESTADO: APROBADO CON OBSERVACIONES**

La etapa 5 respeta la arquitectura existente. Es una etapa de **solo lectura** que no introduce nuevas entidades ni migraciones, reutilizando modelos y `audit_logs` existentes. Se identifican observaciones para la implementación.

---

## II. Naturaleza de la etapa

| Aspecto | Etapa 5 | Estado |
|---------|---------|--------|
| Nuevas entidades | No | OK |
| Nuevas migraciones | No (índices opcionales) | OK |
| Modificación loadModels | No | OK |
| Endpoints | Solo GET (lectura) | OK |
| Auditoría de consultas | No obligatoria (evitar ruido) | OK |

**Evidencia:** El plan es explícito: "No se crean nuevas entidades ni tablas." Coherente con el objetivo de trazabilidad sin modificar el modelo de datos.

---

## III. Validación por principios arquitectónicos

### 1. Arquitectura en capas obligatoria (controller → service → repository)

| Capa | Plan | Estado |
|------|------|--------|
| Controller | GET handlers; buildSuccess, controllerUtils; sin lógica de negocio | OK |
| Service | getProjectSummary, getSprintSummary, getUserActivity, getAuditLogs; orquesta repos | OK |
| Repository | report.repository: getAuditLogs, helpers de conteo | OK |

**Evidencia:** El plan define explícitamente la separación. La lógica de agregación vive en service/repository; el controller solo delega.

---

### 2. Dominio gobernado

- No hay reglas de negocio que modifiquen datos.
- La lógica de agregación y filtrado está en **report.service** y **report.repository**.
- RBAC (quién puede ver qué) es lógica de autorización, no de dominio de reportes; se valida en service.

**Evidencia:** Coherente con el patrón existente.

---

### 3. Validadores separados

- **report.validator.js:** validación de query params (page, limit, from, to, entity, etc.) con express-validator.

**Evidencia:** Patrón alineado con módulos existentes.

---

### 4. Migraciones controladas

- **No se requieren migraciones** para esta etapa.
- Índices opcionales en `audit_logs` (entity, created_at) si el rendimiento lo exige; no obligatorio.

**Evidencia:** Cumple la regla de no modificar migraciones previas.

---

### 5. Auditoría

- Los reportes son **solo lectura**.
- No se exige crear registros en `audit_logs` por cada consulta (evitar ruido).
- Opcional: registrar acceso a GET /reports/audit si se considera crítico.

**Evidencia:** Coherente con el principio de no generar ruido en auditoría por operaciones de lectura.

---

### 6. Response Layer v1 obligatorio

- success, data/error, meta.request_id, meta.timestamp.
- buildSuccess, buildContext en controllers.
- controllerUtils en todos los endpoints.

**Evidencia:** Explícito en criterio de cierre.

---

### 7. Error handling estandarizado

- Reutilizar códigos existentes: PROJECT_NOT_FOUND, SPRINT_NOT_FOUND, NOT_FOUND, AUTH_FORBIDDEN.
- Códigos REPORT_* opcionales si AUTH_FORBIDDEN no basta.

**Evidencia:** No introduce códigos redundantes.

---

## IV. Validaciones arquitectónicas adicionales

| Criterio | Estado |
|----------|--------|
| No rompe arquitectura existente | OK |
| No introduce dependencias circulares | OK — reports solo lee; no hay módulo que dependa de reports |
| No rompe separación de responsabilidades | OK |
| No mezcla dominio con transporte HTTP | OK |
| No rompe Response Layer | OK |

---

## V. Acceso a datos existentes

| Fuente | Uso en reports | Estado |
|--------|----------------|--------|
| audit_logs | getAuditLogs (filtros, paginación) | OK — Tabla existente |
| Project | getProjectSummary, validación | OK — vía getModels() o project.repository |
| Feature, UserStory | Conteos por proyecto | OK — UserStory vía Feature |
| Sprint | getSprintSummary | OK — sprint.repository |
| Incident, Improvement, Document | Conteos por proyecto | OK — project_id en cada modelo |

**Recomendación del plan:** Crear `report.repository.js` que use `getModels()` para AuditLog y, si hace falta, otros modelos para lecturas agregadas. Mantiene el dominio de reportes separado de auth y evita extender auth.repository con lógica de reportes.

---

## VI. RBAC y seguridad

| Endpoint | RBAC | Estado |
|----------|------|--------|
| GET /reports/projects/:projectId/summary | MASTER, EMPLOYEE (política TBD) | OK |
| GET /reports/sprints/:sprintId/summary | MASTER, EMPLOYEE (política TBD) | OK |
| GET /reports/users/:userId/activity | MASTER: cualquiera; EMPLOYEE: solo propio (userId === req.user.id) | OK |
| GET /reports/audit | Solo MASTER; EMPLOYEE → 403 | OK |

**Evidencia:** GET /reports/audit restringido a MASTER (datos sensibles para auditoría externa). getUserActivity valida que EMPLOYEE solo vea su propia actividad.

---

## VII. Datos sensibles

- **getUserActivity:** "metadatos básicos del usuario (id, email, role; sin datos sensibles)". No exponer password_hash ni tokens.

**Evidencia:** El plan lo especifica. El service debe usar un método que no devuelva datos sensibles (p. ej. usersRepository.findById sin password).

---

## VIII. Performance y consultas

| Aspecto | Estado |
|---------|--------|
| Paginación obligatoria en GET /reports/audit | OK — "evitar respuestas sin límite" |
| Índices opcionales en audit_logs | OK — entity, created_at si se necesita |
| Conteos por proyecto | OK — Evitar N+1; usar count/aggregation en repository |

**Observación:** Para getProjectSummary, los conteos (features, userStories, sprints, incidents, improvements, documents) pueden ejecutarse en paralelo o en consultas optimizadas. El report.repository debe evitar N+1 y consultas redundantes.

---

## IX. Conteo de improvements por proyecto

El plan indica: "mejoras con project_id = projectId (o vinculadas al proyecto según modelo)".

**Clarificación:** Improvement tiene `project_id` nullable. El conteo más directo es `Improvement.count({ where: { project_id: projectId } })`. Las mejoras con `incident_id` pero sin `project_id` no se cuentan como del proyecto. Si se desea incluir mejoras vinculadas vía incidente del proyecto, habría que definirlo explícitamente en el prompt.

---

## X. Observaciones para el MASTER DEVELOPER

### O1. Origen de datos para report.repository

El report.repository puede usar `getModels()` para acceder a AuditLog, Project, Feature, UserStory, Sprint, Incident, Improvement, Document. Alternativamente, puede usar los repositorios existentes (project.repository, sprint.repository, etc.) si exponen los métodos necesarios. **Recomendación:** Centralizar las consultas de reportes en report.repository usando getModels() para mantener el módulo reports autocontenido y no extender repositorios de otros módulos con lógica de reportes.

### O2. Política RBAC para proyectos y sprints

El plan indica "definir en implementación" para EMPLOYEE en reportes de proyecto/sprint. **Recomendación:** Por defecto, MASTER y EMPLOYEE pueden ver todos los reportes de proyecto/sprint si no hay política de restricción por proyecto. Documentar la decisión en el prompt.

### O3. lastActivity en getProjectSummary

El plan indica "Opcional: lastActivity" (último evento en audit_logs para entity=PROJECT, entity_id=projectId). **Recomendación:** Definir en el prompt si se implementa o se deja para una iteración futura. Si se implementa, considerar el coste de la consulta adicional.

### O4. Estructura de stories en getSprintSummary

El plan permite "lista de user stories" o "solo conteo storiesCount". **Recomendación:** Definir en el prompt si se devuelve lista completa, lista resumida (id, title, status) o solo storiesCount. Evitar ambigüedad.

### O5. Auditoría de acceso a GET /reports/audit

El plan dice: "Opcional: registrar acceso a GET /reports/audit si se considera crítico para trazabilidad." **Recomendación:** Incluir en el prompt como obligatorio u opcional explícito. Para auditoría externa, registrar quién accedió al listado de auditoría puede ser valioso.

---

## XI. Criterios de bloqueo — No aplicados

No se detectan:

- Violación de arquitectura en capas
- Duplicación de lógica de dominio
- Cambios peligrosos en base de datos
- Rompimiento del Response Layer
- Acoplamientos fuertes entre módulos
- Introducción de deuda técnica estructural

---

## XII. Evidencia de validación

| Elemento | Confirmado |
|----------|------------|
| Arquitectura intacta | Sí |
| Separación de capas respetada | Sí |
| Sin nuevas entidades ni migraciones | Sí |
| Solo lecturas | Sí |
| Response Layer intacto | Sí |
| RBAC correcto |

---

## XIII. Conclusión

**La ETAPA 5 — Trazabilidad y reportes está APROBADA para implementación** por el MASTER DEVELOPER.

Las observaciones O1–O5 son de clarificación. El PO MASTER debe incorporarlas al prompt de implementación antes de enviarlo al MASTER DEVELOPER.

**Firma de validación:** SYSTEM ARCHITECT (NEXUS ARCHITECT) — 2026-03-05
