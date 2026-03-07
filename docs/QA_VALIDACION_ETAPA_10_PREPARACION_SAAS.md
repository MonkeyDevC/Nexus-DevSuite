# Validación QA — ETAPA 10 Preparación SaaS

**Documento:** Evidencia de validación independiente por QA ENGINEER  
**Referencia:** `docs/EVIDENCIA_ETAPA_10_PREPARACION_SAAS_2026-03-06.md`, `docs/PLAN_ETAPA_10_PREPARACION_SAAS.md`, `docs/PROMPT_MASTER_DEVELOPER_ETAPA_10_PREPARACION_SAAS.md`  
**Fecha de validación:** 2026-03-06  
**Estado:** **VALIDADO** — Checklist ejecutado; evidencia de migraciones y suite de tests registrada.

---

## I. Resumen ejecutivo

El QA ENGINEER valida la implementación de la **ETAPA 10 — Preparación SaaS** realizada por el MASTER DEVELOPER. Criterios a verificar: tabla `organizations` y migraciones; middleware de resolución de tenant (header/subdominio/default); aislamiento por `organization_id` en proyectos, usuarios, backlog, releases, documentos y reportes; endpoints de organización (GET current, GET :id, PATCH :id) con Response Layer v1 y RBAC; preparación billing (plan, billing_email, next_billing_date); documentación de despliegue; regresión de tests.

**Resultado:** **APROBADO CON OBSERVACIONES** (ver observación en sección VI)

---

## II. Validación por modelo de QA (6 niveles)

### 1️⃣ QA FUNCIONAL — ☑ CUMPLE

- [x] **Resolución de tenant:** Header `X-Organization-Id` (UUID) o `X-Tenant-Slug` (slug) resuelve la organización; sin header se usa org con slug `"default"`. Opcional: subdominio con `SUBDOMAIN_BASE` configurado. Verificado en `tenantResolution.middleware.js`.
- [x] **GET /api/v1/organizations/current:** Con tenant resuelto devuelve la organización actual (id, name, slug, settings, plan, billing_email, next_billing_date). Response Layer v1. Verificado en organization.service/controller/routes.
- [x] **GET /api/v1/organizations/:id:** Con token y tenant, devuelve la organización si el id coincide con el tenant actual; si no, 403 RESOURCE_OTHER_ORGANIZATION. Verificado en organization.service.
- [x] **PATCH /api/v1/organizations/:id:** Solo MASTER; actualiza name, settings, plan, billing_email, next_billing_date; validadores en ruta. Verificado en organization.routes (authorize MASTER) y organization.validator.
- [x] **Listados por tenant:** GET /projects, GET /users, GET /releases y listados de features, stories, sprints, incidents, improvements, documents, reports filtrados por `req.organizationId`. Verificado en repositories/services correspondientes.

### 2️⃣ QA DE DOMINIO — ☑ CUMPLE

- [x] Un usuario solo ve/opera sobre datos de su organización (proyectos, usuarios de la org, releases, backlog, documentos, reportes). Servicios usan `organizationId` en list/get/create y validaciones de recurso en org.
- [x] Un proyecto pertenece a una sola organización; nombre único por organización (índice único `(organization_id, name)` en migración 20260310100003).
- [x] Releases tienen `organization_id`; listado y operaciones filtrados/validados por org. Verificado en release.repository y release.service.

### 3️⃣ QA NEGATIVA — ☑ CUMPLE

- [x] Petición sin tenant válido: se usa org default si existe; getCurrent devuelve TENANT_REQUIRED cuando no hay tenant (organizationId null). Lógica en tenantResolution.middleware y organization.service.
- [x] Acceso a recurso de otra organización: servicios validan que el recurso pertenezca a la org del tenant; 403 RESOURCE_OTHER_ORGANIZATION (o 404). Verificado en projects, users, feature, release, report, organization.
- [x] GET /organizations/:id con id de otra org: 403 RESOURCE_OTHER_ORGANIZATION. Verificado en organization.service getById.
- [x] Códigos ORGANIZATION_NOT_FOUND, TENANT_REQUIRED, RESOURCE_OTHER_ORGANIZATION en errorCodes.js y usados en organization.service; documentados en CONTRATO_API.md.

### 4️⃣ QA DE REGRESIÓN — ☑ CUMPLE

- [x] **Migraciones:** Ejecutadas en BD de desarrollo; 5 migraciones Etapa 10 aplicadas correctamente (organizations, organization_id en users/projects/releases, seed default).
- [x] **Suite de tests backend:** Tras migraciones, `npm test -- --runInBand`: **12 test suites passed, 79 tests passed.** (En una ejecución previa se observó 2 fallos puntuales asociados a auditoría "Data too long for column entity_id" — no atribuible a Etapa 10; ver observación en VI.)
- [x] Flujos actuales operativos con org por defecto (middleware asigna req.organizationId desde org default cuando no hay header; tests pasan sin enviar headers de tenant).

### 5️⃣ QA DE SEGURIDAD — ☑ CUMPLE

- [x] Aislamiento: listados filtrados por organizationId; con tenant A no se devuelven datos de org B. Verificado en repositories (list con organizationId/projectIds por org).
- [x] Acceso a recurso de otra org por ID: getById/validaciones en servicios comprueban que el recurso pertenezca a la org del tenant; respuesta 403 o 404. Verificado en projects, releases, features, documents, reports, users, organization.
- [x] PATCH /organizations/:id protegido con authorize(MASTER); EMPLOYEE recibe 403. Verificado en organization.routes.

### 6️⃣ QA DE CONTRATO — ☑ CUMPLE

- [x] Endpoints de organizations y resto de API usan Response Layer v1 (success, data/error, meta; X-Response-Version). Sin cambios en capa de respuesta por Etapa 10.
- [x] CONTRATO_API.md actualizado: códigos ORGANIZATION_NOT_FOUND, TENANT_REQUIRED, RESOURCE_OTHER_ORGANIZATION; sección "Multi-tenant y organizaciones (ETAPA 10)" con orden de resolución (header, subdominio, default); endpoints GET /organizations/current, GET /organizations/:id, PATCH /organizations/:id; nota sobre organization_id en releases.

---

## III. Verificación técnica de implementación

### Migraciones (evidencia vs plan)

| Criterio | Archivo / verificación | Estado |
|----------|------------------------|--------|
| Tabla organizations | 20260310100001-create-organizations.js (slug único, plan, billing_email, next_billing_date) | ☑ |
| organization_id en users | 20260310100002-add-organization-id-to-users.js | ☑ |
| organization_id en projects + único (org, name) | 20260310100003-add-organization-id-to-projects.js | ☑ |
| Seed org default + UPDATE users/projects | 20260310100004-seed-default-organization.js | ☑ |
| organization_id en releases | 20260310100005-add-organization-id-to-releases.js | ☑ |

### Middleware y rutas

| Criterio | Verificación | Estado |
|----------|--------------|--------|
| tenantResolutionMiddleware | Orden: X-Organization-Id, X-Tenant-Slug, subdominio (SUBDOMAIN_BASE), default | ☑ |
| req.organizationId / req.tenantSlug | Asignados en middleware; v1.routes.js usa middleware antes de rutas API | ☑ |
| Rutas /organizations | GET /current, GET /:id, PATCH /:id con auth y authorize (MASTER para PATCH) | ☑ |

### Aislamiento (resumen por módulo)

| Módulo | List/Get/Create validan org | Estado |
|--------|-----------------------------|--------|
| Projects | list, getById, create, archive por organizationId | ☑ |
| Users | list, getById, create con organizationId | ☑ |
| Features | create, listByProject, getById, updateStatus con proyecto en org | ☑ |
| UserStory | create, getById, listByFeature, updateStatus, assign con feature/proyecto en org | ☑ |
| Releases | list, create, getById, updateStatus, assign, updateDescription, hotfix por org | ☑ |
| Sprints | create, getById, list, updateStatus, assign/unassign, listStories por proyecto en org | ☑ |
| Incidents | create, getById, list, updateStatus, update por proyecto en org | ☑ |
| Improvements | create, getById, list (projectIds por org), updateStatus por proyecto/org | ☑ |
| Documents | create, getById, list, getByCode, versiones con documento/proyecto en org | ☑ |
| Reports | getProjectSummary, getSprintSummary, getUserActivity por proyecto/sprint/usuario en org | ☑ |

### Documentación

| Documento | Contenido esperado | Estado |
|------------|--------------------|--------|
| docs/DESPLIEGUE_PRODUCCION.md | Variables de entorno, resolución de tenant, checklist seguridad, pasos despliegue, health check, nota tests/migraciones | ☑ |
| docs/CONTRATO_API.md | Códigos org, sección multi-tenant, endpoints organizations | ☑ |

---

## IV. Evidencia de ejecución

### Migraciones (BD de pruebas)

```bash
npx sequelize-cli db:migrate
```

**Resultado:** 5 migraciones Etapa 10 aplicadas correctamente (20260310100001 a 20260310100005). Entorno: development.

### Regresión backend (tras migraciones)

```bash
npm test -- --runInBand
```

**Resultado:** 12 test suites passed, 79 tests passed.

### Prueba manual de aislamiento (opcional)

- Crear segunda organización y proyecto en BD (o vía script).
- Petición con `X-Tenant-Slug: default` → listar proyectos → solo org default.
- Petición con `X-Tenant-Slug: <segunda-org>` → listar proyectos → solo segunda org.
- Con tenant segunda org, GET /projects/:id de un proyecto de la org default → 403 RESOURCE_OTHER_ORGANIZATION (o 404).

---

## V. Criterios de bloqueo

Marcar si aplica; si todos están vacíos, no hay bloqueos.

- [ ] Migraciones fallan o no crean/actualizan tablas según plan.
- [ ] Suite de tests no pasa tras aplicar migraciones en BD de pruebas.
- [ ] Aislamiento no verificado: se pueden listar o acceder a recursos de otra organización.
- [ ] Endpoints de organizaciones no responden con Response Layer v1 o RBAC incorrecto.
- [ ] Documentación de despliegue o contrato no actualizada.

**Ningún criterio de bloqueo aplicado.** La implementación es apta para cierre de etapa.

---

## VI. Conclusión

La implementación de la **ETAPA 10 — Preparación SaaS** **cumple con observaciones** con los criterios de cierre del plan y con el modelo de QA en 6 niveles.

- **Funcional, dominio, negativa, seguridad y contrato:** Cumplidos según evidencia de código y documentación.
- **Regresión:** Migraciones aplicadas; suite de tests 79/79 en la ejecución de validación. En una ejecución anterior se registró un fallo puntual por error de BD en auditoría ("Data too long for column 'entity_id'") al registrar una petición HTTP con path largo en `audit_logs`; **no es atribuible a la Etapa 10** (columna `entity_id` existente, uso en middleware de auditoría de peticiones).

**Recomendación al PO MASTER:** **APROBAR CIERRE** de la Etapa 10. Opcional: registrar como incidencia o mejora futura el alargado de la columna `entity_id` en `audit_logs` (o truncado/alternativa para acciones HTTP_REQUEST) para evitar fallos esporádicos en auditoría automática.

---

**Firma QA ENGINEER (NEXUS QA)** — Validación independiente de calidad.  
**Fecha:** 2026-03-06
