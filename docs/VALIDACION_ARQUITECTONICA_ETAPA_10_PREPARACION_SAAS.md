# Validación arquitectónica — ETAPA 10 Preparación SaaS

**Validador:** SYSTEM ARCHITECT (NEXUS ARCHITECT)  
**Fecha:** 2026-03-05  
**Documentos validados:** `docs/PLAN_ETAPA_10_PREPARACION_SAAS.md`, `docs/PROMPT_MASTER_DEVELOPER_ETAPA_10_PREPARACION_SAAS.md`  
**Referencia:** nexus-system-architect.mdc, nexus-contexto-arquitectonico.mdc, nexus-migraciones.mdc

---

## I. Resultado de la validación

**ESTADO: APROBADO CON OBSERVACIONES Y CONDICIONES**

La etapa 10 introduce **multi-tenant por organización**, migraciones incrementales, middleware de tenant, aislamiento por `organization_id` y preparación de billing. La arquitectura en capas, Response Layer v1 y RBAC se mantienen. Se identifican observaciones y condiciones que el PO debe incorporar en el plan y en el prompt (sección 9) antes de la implementación.

---

## II. Validación por principios arquitectónicos

| Principio | Estado |
|-----------|--------|
| Controller → service → repository | OK — Módulo organizations y ajustes en servicios existentes |
| Migraciones incrementales, no modificar previas | OK — Nuevas migraciones 20260310100001–00004; índice unique de projects se cambia en migración nueva (drop uq_projects_name + add unique(organization_id, name)) |
| snake_case en BD | OK — organizations, organization_id |
| Response Layer v1 | OK — Endpoints nuevos y existentes |
| Auditoría | OK — Acciones sobre Organization; opcional organization_id en audit_logs |
| Validadores separados | OK — organization.validator.js |

---

## III. Migraciones

| Migración | Contenido | Estado |
|-----------|-----------|--------|
| 20260310100001-create-organizations | Tabla organizations (id, name, slug, settings, plan, billing_email, next_billing_date, timestamps) | OK |
| 20260310100002-add-organization-id-to-users | organization_id (UUID, nullable), FK, índice | OK |
| 20260310100003-add-organization-id-to-projects | organization_id (UUID, nullable), FK, índice; **eliminar** uq_projects_name; **añadir** unique(organization_id, name) | OK |
| 20260310100004-seed-default-organization | Insert org default; UPDATE users y projects; idempotencia | OK |

**Importante:** La migración 00003 no modifica el archivo `20260304100001-create-projects.js`; crea uno nuevo que hace `queryInterface.removeIndex` sobre `uq_projects_name` y `queryInterface.addIndex` con unique compuesto. Cumple la regla de no modificar migraciones previas.

---

## IV. Entidades sin organization_id directo — Aislamiento

| Entidad | Tiene project_id / organization_id | Aislamiento |
|---------|------------------------------------|-------------|
| Feature, UserStory, Sprint | project_id | Heredado vía Project; validar project.organization_id === req.organizationId |
| Incident, Improvement | project_id (Incident); project_id e incident_id (Improvement) | Heredado vía Project |
| Document | project_id (nullable) | Si project_id: vía Project. Si null: **definir política** (ver O2) |
| **Release** | No tiene project_id; Feature tiene release_id | **No heredado directamente.** Filtrar listados por “releases que tengan al menos una feature cuyo project esté en la org” o añadir organization_id a Release (ver O1) |

---

## V. Resolución de tenant (orden de prioridad)

El **plan** indica: (1) Subdominio, (2) Header, (3) JWT.  
El **prompt** indica: (1) Header, (2) Subdominio, (3) Organización por defecto.

**Recomendación:** Unificar y dejar explícito en el plan y en el prompt el orden configurable (p. ej. variable `TENANT_RESOLUTION_ORDER=header,subdomain` o equivalente) y documentar que, si no hay tenant, se usa organización por defecto (slug "default").

---

## VI. Colocación del middleware de tenant

El middleware debe ejecutarse de forma que todas las rutas que requieran tenant tengan `req.organizationId`. Si se monta al inicio de `/api/v1`, también `/auth/login` recibirá tenant (por header o default). No es necesario excluir login: sin header/subdominio se asigna org por defecto. Documentar en el prompt que health puede quedar fuera de `/api/v1` y no requerir tenant.

---

## VII. Criterios de bloqueo — No aplicados

No se detectan:

- Modificación de archivos de migración ya existentes
- Ruptura del Response Layer
- Lógica de negocio en controllers
- Omisión de aislamiento en listados/creaciones críticas

---

## VIII. Riesgos y condiciones

| Riesgo | Mitigación |
|--------|------------|
| Tests existentes fallan por falta de organization_id o tenant | Incluir en prompt: fixtures con org default; en requests enviar header X-Tenant-Slug: default (o inyectar req.organizationId en tests). |
| Release sin organization_id: listado ambiguo | Definir en prompt: criterio de filtro (join Feature → Project → organization_id) o añadir organization_id a Release. |
| Documentos con project_id null | Definir política en prompt: solo org default, o visibles para todos los tenants. |

---

## IX. Evidencia de validación

| Elemento | Confirmado |
|----------|------------|
| Migraciones solo incrementales | Sí |
| Aislamiento por organization_id en User y Project | Sí |
| Aislamiento heredado vía Project en Features, Stories, Sprints, Incidents, Improvements | Sí |
| Endpoints de organización (GET current, GET :id, PATCH :id) | Sí |
| Preparación billing en esquema | Sí |
| Response Layer v1 y RBAC | Sí |

---

## X. Conclusión

**ETAPA 10 — Preparación SaaS: APROBADA** para implementación una vez incorporadas en el plan y en el prompt las observaciones del documento de ajustes para el PO (en particular Release, Document global, orden de resolución de tenant y tests).

**Firma de validación:** SYSTEM ARCHITECT (NEXUS ARCHITECT) — 2026-03-05
