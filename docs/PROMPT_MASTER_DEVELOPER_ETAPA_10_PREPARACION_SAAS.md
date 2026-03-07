# Prompt de implementación — ETAPA 10 Preparación SaaS

**Para:** MASTER DEVELOPER  
**Referencia:** docs/PLAN_ETAPA_10_PREPARACION_SAAS.md, docs/VALIDACION_ARQUITECTONICA_ETAPA_10_PREPARACION_SAAS.md, docs/AJUSTES_PO_ETAPA_10_SEGUN_ARCHITECT.md, docs/CHECKLIST_ETAPAS_PROYECTO.md  
**Estructura:** nexus-engineering-execution.mdc

---

## 1️⃣ OBJETIVO

Implementar **ETAPA 10 — Preparación SaaS** siguiendo el plan `docs/PLAN_ETAPA_10_PREPARACION_SAAS.md`.

**Propósito:** Introducir modelo multi-tenant (entidad Organization, vinculación User y Project a organización), middleware de resolución de tenant (subdominio y/o header), aislamiento de datos por organization_id, endpoints de organización, preparación para billing (esquema) y documentación de despliegue productivo. Mantener Response Layer v1, RBAC y auditoría; migrar datos existentes a una organización por defecto.

---

## 2️⃣ REGLAS INNEGOCIABLES

- **Arquitectura:** Controller → service → repository; no lógica de negocio en controllers; validadores separados.
- **Migraciones:** Incrementales; no modificar migraciones ya ejecutadas; convención snake_case; timestamps de migración según se indican en el prompt (ej. 20260310100001, 20260310100002, …).
- **Response Layer v1:** Todos los endpoints nuevos usan buildSuccess/buildError; meta.request_id, meta.timestamp.
- **Auditoría:** Acciones críticas sobre organizaciones (crear, actualizar, eliminar si aplica) y acceso a datos por tenant deben registrarse en audit_logs. Opcional: añadir columna organization_id a audit_logs para filtrar por tenant.
- **Aislamiento:** Ninguna consulta debe devolver datos de otra organización; filtrar siempre por req.organizationId (o equivalente) en listados y en validación de recursos por ID.
- **No integración de pago:** Solo esquema y campos para billing futuro; no conectar Stripe ni otra pasarela.
- **Regresión:** Suite de tests del backend en verde; adaptar o añadir tests para flujos multi-tenant cuando sea necesario.

---

## 3️⃣ ORDEN OBLIGATORIO DE IMPLEMENTACIÓN

### FASE 1 — Migraciones (modelo multi-tenant)

1. **Crear tabla organizations.** Migración `20260310100001-create-organizations.js`. Campos: id (UUID, PK), name (STRING 255), slug (STRING 100, unique), settings (JSON, nullable), plan (STRING 50, nullable), billing_email (STRING 255, nullable), next_billing_date (DATE, nullable), created_at, updated_at. Índice unique en slug.
2. **Añadir organization_id a users.** Migración `20260310100002-add-organization-id-to-users.js`. Columna organization_id (UUID, nullable). FK a organizations, ON DELETE RESTRICT. Índice en organization_id.
3. **Añadir organization_id a projects.** Migración `20260310100003-add-organization-id-to-projects.js`. **No modificar** el archivo `create-projects.js`. En esta nueva migración: añadir columna organization_id (UUID, nullable), FK a organizations, ON DELETE RESTRICT, índice en organization_id; luego `queryInterface.removeIndex('projects', 'uq_projects_name')` y `queryInterface.addIndex('projects', ['organization_id', 'name'], { unique: true, name: 'uq_projects_organization_name' })`.
4. **Migración de datos existentes.** Migración `20260310100004-seed-default-organization.js`: Insertar una organización (name: "Default", slug: "default"); obtener su id; UPDATE users SET organization_id = <id> WHERE organization_id IS NULL; UPDATE projects SET organization_id = <id> WHERE organization_id IS NULL. Asegurar idempotencia (si ya existe org "default", usar su id).
5. **(Opcional)** Hacer organization_id NOT NULL en users y projects en una migración posterior; si se deja nullable, la lógica debe tratar NULL como “organización por defecto” (resolver por slug "default").

### FASE 2 — Modelos y asociaciones

6. Crear modelo **Organization** (id, name, slug, settings, timestamps). TableName: organizations, underscored.
7. En **User:** añadir organization_id; asociación belongsTo Organization. Cargar en loadModels y cachedModels.
8. En **Project:** añadir organization_id; asociación belongsTo Organization. Ajustar unique de name a scope por organization_id en modelo si Sequelize lo soporta (unique: ["organization_id", "name"]).
9. **Preparación billing:** Incluir en el modelo Organization las columnas plan, billing_email, next_billing_date (ya en la migración create-organizations). No se requiere migración adicional para billing.

### FASE 3 — Middleware de resolución de tenant

10. Crear **tenantResolution.middleware.js**. Orden de resolución: (1) Header `X-Organization-Id` (UUID) o `X-Tenant-Slug` (slug); (2) Subdominio: extraer de req.hostname (ej. acme.nexusapp.com → slug "acme"); variable de entorno SUBDOMAIN_BASE o similar para el dominio base; (3) Si no hay tenant, resolver organización por defecto (slug "default") y asignar su id a req.organizationId. Establecer req.organizationId (UUID) y opcionalmente req.tenantSlug.
11. Montar el middleware después de las rutas que no requieran tenant (ej. /health, /api/v1/auth/login) y antes de las rutas que sí (resto de /api/v1). O montar al inicio de /api/v1 para que todas las rutas API reciban req.organizationId.
12. Documentar en código o en docs/DESPLIEGUE_PRODUCCION.md el orden de resolución usado (p. ej. header → subdominio → org default) y las variables de entorno (TENANT_RESOLUTION, SUBDOMAIN_BASE). Debe coincidir con el plan.

### FASE 4 — Aislamiento en repositorios y servicios

13. **Projects:** En listProjects y createProject, filtrar/asignar por req.organizationId. getProjectById debe comprobar que project.organization_id === req.organizationId (o 403). Ajustar repositorio y servicio; inyectar organizationId desde el controller (req.organizationId).
14. **Users:** listUsers y createUser deben filtrar/asignar por organization_id = req.organizationId. getUserById debe comprobar que el usuario pertenece a la organización (o política MASTER global si se define). Ajustar según RBAC: MASTER de la org puede gestionar usuarios de la org.
15. **Features, UserStories, Sprints, Releases, Incidents, Improvements:** Todas las consultas que dependan de project_id deben validar que el proyecto pertenece a req.organizationId (vía join con projects o consulta previa). Crear/actualizar: mismo criterio.
16. **Documents:** Si document tiene project_id, validar proyecto de la org; si es global (project_id null), definir política (ej. documentos globales visibles para todos los tenants o solo para default).
18. **Reports:** Filtrar por organization_id: reportes de proyecto/sprint/usuario solo para datos de la organización del tenant. GET /reports/audit: puede incluir filtro por organization_id si se añade a audit_logs; si no, mantener comportamiento actual para MASTER.

### FASE 5 — Módulo organizations (API)

19. Crear **organization.repository.js**, **organization.service.js**, **organization.controller.js**, **organization.validator.js**, **organization.routes.js**. CRUD mínimo: getOrganizationById (por id o “current” usando req.organizationId), listOrganizations (si aplica: solo la del tenant o todas para super-MASTER; por defecto solo “current”). PATCH /organizations/:id para actualizar name, settings, plan, billing_email, next_billing_date (preparación). Validar que :id === req.organizationId (o política super-MASTER).
20. Montar rutas en v1.routes.js: router.use("/organizations", organizationRoutes). Endpoints: GET /organizations/current (devuelve la org del tenant), GET /organizations/:id (detalle, solo si id es del tenant), PATCH /organizations/:id (MASTER, solo org del tenant). Response Layer v1 en todos.
21. RBAC: GET current y GET :id pueden ser MASTER y EMPLOYEE de la org; PATCH solo MASTER. Comprobar que el usuario pertenece a la organización (user.organization_id === req.organizationId).

### FASE 6 — Auditoría y audit_logs

22. Opcional: migración para añadir **organization_id** a audit_logs (nullable, FK a organizations). En auditLogger.middleware, rellenar req.organizationId en metadata o en la fila de audit_logs. Permite filtrar auditoría por tenant después.
23. Registrar en audit_logs: creación/actualización de organización (entity: "Organization", entity_id, action, metadata con plan/billing si aplica).

### FASE 7 — Documentación y despliegue

24. Crear **docs/DESPLIEGUE_PRODUCCION.md** (o actualizar existente) con: variables de entorno obligatorias (NODE_ENV, DATABASE_URL, JWT_SECRET, CORS_ALLOWED_ORIGINS, SUBDOMAIN_BASE o TENANT_RESOLUTION, etc.), checklist de seguridad (HTTPS, secrets), pasos para ejecutar migraciones y arrancar la aplicación, health check. Incluir nota sobre resolución de tenant (header vs subdominio).
25. Actualizar **CONTRATO_API.md** (y openapi.yaml si aplica) con: GET /organizations/current, GET /organizations/:id, PATCH /organizations/:id; descripción de multi-tenant (header X-Organization-Id, X-Tenant-Slug, subdominio); opción elegida para aislamiento de Release (A o B); política para documentos con project_id null. **Códigos de error:** Añadir en errorCodes.js y documentar en CONTRATO_API: ORGANIZATION_NOT_FOUND, TENANT_REQUIRED (si aplica), y un código para 403 por aislamiento (ej. RESOURCE_OTHER_ORGANIZATION o AUTH_FORBIDDEN con mensaje explícito).

### FASE 8 — QA y regresión

26. Ejecutar todas las migraciones en orden en una base limpia; verificar que los datos seed (org default, asignación de users y projects) se aplican correctamente.
27. Ejecutar suite de tests existente. **Tests y multi-tenant:** Los tests que llaman a la API deben enviar un tenant válido: header `X-Tenant-Slug: default` (o `X-Organization-Id` con el UUID de la org default), o asegurar que el middleware asigna org default cuando no hay header. Los fixtures de usuarios y proyectos deben tener `organization_id` (por seed o por setup del test). Verificar que la suite existente pasa con tenant por defecto. Corregir fallos debidos a organization_id (fixtures o mocks con organization_id; req.organizationId en tests que llamen a rutas con tenant).
28. Añadir al menos un test de integración que verifique aislamiento: petición con X-Tenant-Slug o X-Organization-Id no debe devolver datos de otra organización.

---

## 4️⃣ REGLAS DE DOMINIO CRÍTICAS

- Un **proyecto** pertenece a una sola organización; un **usuario** pertenece a una sola organización. Listados y creaciones siempre acotados a req.organizationId.
- **Nombre de proyecto:** Único por organización (organization_id, name); no global.
- **Organización por defecto:** Slug "default"; usada cuando no se resuelve tenant por header/subdominio.
- **Billing:** Campos plan, billing_email, next_billing_date son de preparación; no hay lógica de cobro ni integración con pasarela.

---

## 5️⃣ AUDITORÍA

- Acciones sobre organizaciones (crear, actualizar) deben registrarse en audit_logs (entity: "Organization", entity_id, action, metadata).
- Acceso a GET /reports/audit ya se audita; si se añade organization_id a audit_logs, rellenarlo en cada registro.

---

## 6️⃣ QA OBLIGATORIA (6 niveles)

- **Funcional:** Resolución de tenant (header o subdominio); listados de proyectos y usuarios filtrados por org; GET/PATCH organizaciones operativos.
- **Dominio:** No se devuelven proyectos ni usuarios de otra organización; nombre de proyecto único por org.
- **Negativa:** Petición con tenant inexistente o inválido; intento de acceso a recurso de otra org → 403.
- **Regresión:** Tests existentes en verde; flujos con organización default operativos.
- **Seguridad:** Aislamiento verificado; RBAC por organización.
- **Contrato:** Response Layer v1; nuevos endpoints documentados.

---

## 7️⃣ CRITERIO DE CIERRE

- Tabla organizations creada; users y projects con organization_id; datos existentes migrados a org default.
- Middleware de resolución de tenant operativo (header y/o subdominio); req.organizationId disponible en rutas API.
- Aislamiento aplicado en proyectos, usuarios y datos derivados de proyecto.
- Endpoints GET /organizations/current, GET /organizations/:id, PATCH /organizations/:id con Response Layer v1 y RBAC.
- Campos de preparación billing en organizations (plan, billing_email, next_billing_date).
- Documento de despliegue productivo; CONTRATO_API actualizado.
- Suite de tests en verde; al menos un test de aislamiento.

---

## 8️⃣ EVIDENCIA OBLIGATORIA

**Entrega en archivo:** `docs/EVIDENCIA_ETAPA_10_PREPARACION_SAAS_<YYYY-MM-DD>.md`

Contenido mínimo:

1. Lista de archivos creados y modificados (migraciones, modelos, middleware, organization module, docs).
2. Descripción de la estrategia de resolución de tenant (header, subdominio, default) y variables de entorno.
3. Pasos para verificar aislamiento (ej. dos organizaciones, usuarios en cada una; petición con X-Tenant-Slug solo devuelve datos de esa org).
4. Confirmación de migración de datos existentes a organización default y de que la suite de tests está en verde.
5. Referencia a docs/DESPLIEGUE_PRODUCCION.md y a CONTRATO_API.md actualizado.
6. Referencia al plan: PLAN_ETAPA_10_PREPARACION_SAAS.md.

---

## 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (incorporadas)

| Id | Observación | Aplicación en el prompt |
|----|-------------|-------------------------|
| **O1** | Release y aislamiento | FASE 4 paso 16: Release no tiene project_id; implementar opción (A) filtro vía Feature→Project o (B) añadir organization_id a releases; documentar en CONTRATO_API la opción elegida. |
| **O2** | Documentos con project_id null | FASE 4 paso 17: Definir política (solo org default o visibles para todos) y aplicar en servicio/repositorio; no dejar indefinido. |
| **O3** | Orden de resolución de tenant | FASE 3 paso 12: Documentar en DESPLIEGUE_PRODUCCION.md el orden (header → subdominio → org default) y variables; debe coincidir con el plan. |
| **O4** | Migración 20260310100003 (projects) | FASE 1 paso 3: No modificar create-projects.js; en la nueva migración usar removeIndex('projects', 'uq_projects_name') y addIndex con unique (organization_id, name). |
| **O5** | Tests existentes y multi-tenant | FASE 8 paso 27: Tests que llaman a la API deben enviar X-Tenant-Slug: default o X-Organization-Id; fixtures con organization_id; suite debe pasar con tenant por defecto. |
| **O6** | Códigos de error | FASE 7 paso 25: Añadir en errorCodes.js y CONTRATO_API: ORGANIZATION_NOT_FOUND, TENANT_REQUIRED (si aplica), código para 403 por aislamiento (ej. RESOURCE_OTHER_ORGANIZATION). |

**Validación:** APROBADO CON OBSERVACIONES Y CONDICIONES — SYSTEM ARCHITECT. Ver docs/VALIDACION_ARQUITECTONICA_ETAPA_10_PREPARACION_SAAS.md y docs/AJUSTES_PO_ETAPA_10_SEGUN_ARCHITECT.md.
