# Evidencia ETAPA 10 — Preparación SaaS

**Fecha:** 2026-03-06  
**Referencia:** docs/PLAN_ETAPA_10_PREPARACION_SAAS.md, docs/PROMPT_MASTER_DEVELOPER_ETAPA_10_PREPARACION_SAAS.md

---

## 1. Archivos creados o modificados

### Migraciones (FASE 1)
- **src/infrastructure/db/migrations/20260310100001-create-organizations.js** — Tabla `organizations` (id, name, slug, settings, plan, billing_email, next_billing_date, timestamps); índice único en `slug`.
- **20260310100002-add-organization-id-to-users.js** — Columna `organization_id` (UUID, nullable, FK) en `users`.
- **20260310100003-add-organization-id-to-projects.js** — Columna `organization_id` en `projects`; eliminación de índice único `uq_projects_name` y creación de índice único compuesto `(organization_id, name)`.
- **20260310100004-seed-default-organization.js** — Inserta organización con slug `"default"` si no existe; actualiza `users` y `projects` con ese `organization_id`.
- **20260310100005-add-organization-id-to-releases.js** — Columna `organization_id` en `releases`; actualización de filas existentes a la org default.

### Modelos (FASE 2)
- **src/modules/organizations/models/organization.model.js** — Modelo Organization.
- **src/modules/users/models/user.model.js** — Añadido `organization_id`.
- **src/modules/backlog/models/project.model.js** — Añadido `organization_id` e índice único compuesto.
- **src/modules/releases/models/release.model.js** — Añadido `organization_id`.
- **src/infrastructure/db/loadModels.js** — Carga de Organization y asociaciones (hasMany User/Project/Release; belongsTo).

### Middleware y rutas (FASE 3)
- **src/middlewares/tenantResolution.middleware.js** — Resolución de tenant: (1) header `X-Organization-Id` o `X-Tenant-Slug`, (2) subdominio con `SUBDOMAIN_BASE`, (3) org slug `"default"`. Asigna `req.organizationId` y `req.tenantSlug`.
- **src/config/env.js** — Variable `SUBDOMAIN_BASE`.
- **src/routes/v1.routes.js** — `router.use(tenantResolutionMiddleware)` antes de rutas; montaje de `router.use("/organizations", organizationRoutes)`.

### Aislamiento por organización (FASE 4)
- **Projects:** repository (findByNameAndOrganization, list con organizationId), service (create/getById/list/archive con organizationId), controller (req.organizationId).
- **Features:** ensureProjectInOrg; createFeature, listFeaturesByProject, getFeatureById, updateFeatureStatus validan proyecto de la org.
- **UserStory (stories):** createStory, getStoryById, listStoriesByFeature, updateStoryStatus, assignStory validan feature/proyecto en org; controller pasa req.organizationId.
- **Releases:** repository list con organizationId; create con organization_id; getReleaseById, updateStatus, assignFeatureToRelease, updateReleaseDescription, createHotfixFromRelease validan org; controller pasa req.organizationId.
- **Sprints:** createSprint, getSprintById, listSprints, updateSprintStatus, assignStoryToSprint, unassignStoryFromSprint, listStoriesBySprintId validan proyecto en org.
- **Incidents:** createIncident, getIncidentById, listIncidents, updateIncidentStatus, updateIncident validan proyecto en org.
- **Improvements:** createImprovement, getImprovementById, listImprovements (con projectIds por org cuando no hay project_id), updateImprovementStatus validan proyecto/org; repository list con projectIds.
- **Documents:** createDocument, getDocumentById, listDocuments, getDocumentByCode, createVersion, listVersionsByDocumentId, getVersionById, updateVersion, updateVersionStatus validan documento/proyecto en org.
- **Reports:** getProjectSummary, getSprintSummary, getUserActivity validan proyecto/sprint/usuario en org.
- **Users:** repository y service con organization_id en list/create/getById; controller pasa req.organizationId.
- **Backlog:** projects.repository findIdsByOrganization para improvements.

### Módulo organizations (FASE 5)
- **src/modules/organizations/organization.repository.js** — findById, findBySlug, update.
- **src/modules/organizations/organization.service.js** — getCurrent, getById, updateOrganization; validaciones de org y códigos de error.
- **src/modules/organizations/organization.controller.js** — getCurrentController, getByIdController, patchController (creado; antes faltaba el archivo).
- **src/modules/organizations/organization.validator.js** — organizationIdParamValidator, patchOrganizationValidator.
- **src/modules/organizations/organization.routes.js** — GET /current, GET /:id, PATCH /:id (MASTER), con authenticate y authorize.
- **src/shared/errors/errorCodes.js** — ORGANIZATION_NOT_FOUND, TENANT_REQUIRED, RESOURCE_OTHER_ORGANIZATION.
- **feature.service.js** — Export de ensureProjectInOrg para uso en userStory, sprint, incident, improvement, document, report.

### Documentación (FASE 7)
- **docs/DESPLIEGUE_PRODUCCION.md** — Variables de entorno, resolución de tenant, checklist de seguridad, pasos de despliegue, health check.
- **docs/CONTRATO_API.md** — Códigos ORGANIZATION_NOT_FOUND, TENANT_REQUIRED, RESOURCE_OTHER_ORGANIZATION; sección "Multi-tenant y organizaciones (ETAPA 10)" con headers, subdominio, org default; endpoints GET /organizations/current, GET /organizations/:id, PATCH /organizations/:id; nota sobre releases con organization_id.

---

## 2. Estrategia de resolución de tenant y variables

- **Orden:** (1) Header `X-Organization-Id` (UUID) o `X-Tenant-Slug` (slug), (2) Subdominio si `SUBDOMAIN_BASE` está definido, (3) Organización con slug `"default"`.
- **Variables:** Documentadas en docs/DESPLIEGUE_PRODUCCION.md (NODE_ENV, PORT, DB_*, JWT_*, CORS_ALLOWED_ORIGINS, MASTER_PASSWORD, SUBDOMAIN_BASE opcional, etc.).
- Sin tenant válido se usa la org default; si no existe org default, `req.organizationId` queda null (getCurrent devuelve TENANT_REQUIRED si se llama sin tenant).

---

## 3. Pasos para verificar aislamiento

- Ejecutar migraciones en la base de datos (incluida la de pruebas si se ejecutan tests): `npx sequelize-cli db:migrate`.
- Crear dos organizaciones (p. ej. vía BD o futura API de alta). Asignar usuarios y proyectos a cada una.
- Con header `X-Tenant-Slug: default` (o slug de la primera org), listar proyectos y usuarios: solo deben verse los de esa org.
- Con header `X-Tenant-Slug` de la segunda org, listar proyectos: solo los de la segunda. Intentar acceder a un proyecto de la primera org por ID con el tenant de la segunda debe devolver 403 y código RESOURCE_OTHER_ORGANIZATION (o 404 según recurso).
- GET /api/v1/organizations/current con tenant debe devolver la organización del tenant actual. PATCH /api/v1/organizations/:id (solo MASTER) actualiza name, settings, plan, billing_email, next_billing_date.

---

## 4. Tests y regresión

- **Controller de organizaciones:** Se creó el archivo faltante `organization.controller.js` (getCurrentController, getByIdController, patchController).
- **Suite de tests:** Los tests de integración requieren que la base de datos de pruebas tenga aplicadas las migraciones de la etapa 10 (tabla `organizations`, columnas `organization_id` en users, projects, releases, y seed de la organización default). Ejecutar `npx sequelize-cli db:migrate` sobre la BD de pruebas antes de `npm test`. Con la BD actualizada y la org default presente, el middleware de tenant asigna `req.organizationId` y los listados/altas quedan acotados por organización.
- Se recomienda añadir al menos un test de aislamiento (dos orgs; petición con un tenant solo devuelve datos de esa org) en una iteración posterior.

---

## 5. Referencias

- Plan: **docs/PLAN_ETAPA_10_PREPARACION_SAAS.md**
- Prompt: **docs/PROMPT_MASTER_DEVELOPER_ETAPA_10_PREPARACION_SAAS.md**
- Despliegue: **docs/DESPLIEGUE_PRODUCCION.md**
- Contrato API: **docs/CONTRATO_API.md** (sección Multi-tenant y organizaciones ETAPA 10)
- **Validación QA:** **docs/QA_VALIDACION_ETAPA_10_PREPARACION_SAAS.md** — Checklist de 6 niveles y criterios de aceptación para que QA ENGINEER complete la validación independiente.
