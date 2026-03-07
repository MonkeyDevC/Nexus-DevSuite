# Plan ETAPA 10 — Preparación SaaS

**Referencia:** docs/CHECKLIST_ETAPAS_PROYECTO.md (Fase de evolución del producto)  
**Objetivo:** Preparar Nexus DevSuite para despliegue SaaS multi-organización: modelo multi-tenant (organizaciones), aislamiento de datos por organización, resolución de tenant (subdominio o header), preparación para billing y configuración de despliegue productivo.  
**Estado:** Diseñado por PO MASTER — pendiente validación SYSTEM ARCHITECT

---

## 1. Contexto

- **Situación actual:** El sistema es single-tenant: usuarios y proyectos son globales; no existe el concepto de organización ni de aislamiento por tenant. Las Etapas 0–9 entregan un backend y una plataforma web operativos.
- **Objetivo de la etapa:** Introducir el **modelo multi-tenant por organización**: entidad Organization, vinculación de User y Project a una organización, middleware de resolución de tenant (subdominio o header), filtrado de todas las consultas por organization_id (aislamiento), esquema y extensiones para billing futuro, y documentación/configuración para despliegue en producción.
- **Principios:** Mantener Response Layer v1, RBAC y auditoría. Migraciones incrementales; compatibilidad con datos existentes mediante una organización “default” a la que se asignan usuarios y proyectos actuales. No se integra un proveedor de pagos real; solo se prepara el esquema y los puntos de extensión para billing.

---

## 2. Alcance

| Área | Incluido |
|------|----------|
| **Backend** | Nueva entidad Organization; migraciones para organizations, organization_id en users y projects; middleware tenant; aislamiento en repositorios/servicios; endpoints de organización (CRUD mínimo para MASTER); preparación billing (tabla o columnas). |
| **Frontend** | Opcional en esta etapa: selector de organización o pantalla de configuración si se exponen endpoints de org. Prioridad: backend y despliegue. |
| **Despliegue** | Documentación de variables de entorno, NODE_ENV=production, checklist de despliegue productivo; opcional: ejemplo Dockerfile o archivo de configuración para plataforma cloud. |

---

## 3. Modelo de datos (multi-tenant)

### 3.1 Entidad Organization

- **Tabla:** `organizations`
- **Campos:** id (UUID, PK), name (STRING 255), slug (STRING 100, único, para subdominio o identificador en URL), settings (JSON, nullable), created_at, updated_at.
- **Índices:** unique en slug; índice en name si se filtra por nombre.
- **Migración:** Crear tabla organizations. Convención snake_case; sin modificar migraciones existentes.

### 3.2 Vinculación User y Project a Organization

- **users:** Añadir columna `organization_id` (UUID, nullable al principio para migración). FK a organizations; ON DELETE RESTRICT. Un usuario pertenece a una organización; si es NULL, se considera “global” o se asigna por defecto en lógica (ver migración de datos).
- **projects:** Añadir columna `organization_id` (UUID, nullable en migración estructural; luego obligatorio vía migración de datos). FK a organizations; ON DELETE RESTRICT. Un proyecto pertenece a una organización.
- **Unicidad:** El nombre de proyecto puede repetirse entre organizaciones. El cambio de unique de `projects.name` a unique compuesto `(organization_id, name)` se hace en una **nueva** migración (removeIndex de `uq_projects_name` + addIndex), **sin modificar** el archivo `create-projects.js`.

### 3.3 Migración de datos existentes

- Crear una organización por defecto (ej. name: "Default", slug: "default") y asignar todos los usuarios y proyectos existentes a esa organización (UPDATE users SET organization_id = <id_default>; UPDATE projects SET organization_id = <id_default>).
- Después de la migración de datos, organization_id en users y projects puede dejarse NOT NULL si se desea (otra migración) o mantenerse nullable para compatibilidad; el middleware y la lógica deben tratar “sin organización” como “organización por defecto” si se mantiene nullable.

### 3.4 Preparación billing

- **Opción A:** Añadir a `organizations` columnas: `plan` (ENUM o STRING: FREE, PRO, ENTERPRISE), `billing_email` (STRING, nullable), `next_billing_date` (DATE, nullable). Sin integración con pasarela de pago; solo esquema.
- **Opción B:** Nueva tabla `organization_subscriptions` (organization_id, plan, billing_email, next_billing_date, status, created_at, updated_at). Relación 1:1 o 1:N con organizations.
- **Criterio:** Al menos un lugar en el esquema (organización o tabla relacionada) donde almacenar plan y datos de facturación para uso futuro. Documentar en CONTRATO_API que son campos de preparación.

---

## 4. Resolución de tenant (middleware)

- **Objetivo:** Establecer en cada petición el `organization_id` (o slug) del tenant para filtrar datos.
- **Orden de prioridad (configurable, ej. variable TENANT_RESOLUTION_ORDER):** Por defecto: (1) **Header** `X-Organization-Id` (UUID) o `X-Tenant-Slug` (slug); (2) **Subdominio** (ej. acme.nexusapp.com → slug "acme"; variable SUBDOMAIN_BASE); (3) **Organización por defecto** (slug "default"). Debe coincidir con lo documentado en el prompt y en docs/DESPLIEGUE_PRODUCCION.md.
- **Comportamiento sin tenant:** Si no se resuelve tenant por header ni subdominio, usar **siempre** organización por defecto (slug "default"); no devolver 400/403 salvo que se documente otra política explícita.

---

## 5. Aislamiento de datos

- **Regla:** Todas las consultas que devuelvan datos “por organización” deben filtrar por `organization_id` (del tenant resuelto en req.organizationId).
- **Ámbitos:**
  - **Projects:** Listar y crear proyectos solo de la organización del tenant. GET /projects → WHERE organization_id = req.organizationId. POST /projects → body puede incluir organization_id pero debe ser validado (solo el del tenant o solo MASTER puede asignar).
  - **Features, UserStories, Sprints, Incidents, Improvements:** Pertenecen a un proyecto; el aislamiento se hereda vía project (join con projects y filter projects.organization_id = req.organizationId).
  - **Release:** Release no tiene `project_id`. Definir e implementar uno de los dos criterios: **(A)** Filtrar listados por “releases que tengan al menos una feature cuyo project.organization_id === req.organizationId” (join Feature → Project); **(B)** Añadir columna `organization_id` a la tabla releases en una migración, asignarla al crear release desde req.organizationId, y filtrar por organization_id. Dejar la opción elegida explícita en el prompt y en CONTRATO_API.
  - **Documents:** Si document tiene project_id, validar proyecto de la org. **Documentos con project_id null** (globales): definir política en el prompt y aplicar en servicio/repositorio: p. ej. “solo visibles para organización default” o “visibles para todos los tenants”. No dejar el comportamiento indefinido.
  - **Users:** Listar usuarios: solo los de la organización del tenant (WHERE organization_id = req.organizationId). Crear usuario: asignar organization_id = req.organizationId. GET /users/:id debe comprobar que el usuario pertenece a la organización del tenant (o que el solicitante es MASTER global según política).
- **MASTER global:** Decidir si existe un rol “super MASTER” que ve todas las organizaciones o si cada MASTER está acotado a su organización. Por defecto en este plan: MASTER pertenece a una organización y solo ve/gestiona datos de esa organización; la resolución de tenant aplica igual. Si se requiere super-admin, puede ser un usuario sin organization_id (nullable) con un scope especial documentado.
- **Auditoría:** audit_logs puede incluir organization_id (añadir columna) para filtrar auditoría por tenant. Opcional en esta etapa pero recomendado.

---

## 6. Endpoints de organización (API)

- **GET /api/v1/organizations** (solo MASTER si multi-org, o solo para listar la org del tenant): Listar organizaciones a las que el usuario tiene acceso (o la actual). En modelo estricto por tenant: GET /api/v1/organizations/current o similar que devuelva la organización del tenant (req.organizationId).
- **GET /api/v1/organizations/:id** (MASTER o propio tenant): Detalle de una organización (name, slug, settings, plan, billing_email si aplica). Validar que el id sea el del tenant o que el usuario sea super-MASTER si se implementa.
- **PATCH /api/v1/organizations/:id** (MASTER): Actualizar nombre, settings, billing_email (preparación). Solo para la organización del tenant.
- **Crear organización:** POST /api/v1/organizations podría estar restringido a super-MASTER o a un proceso de registro; definir en el prompt. Mínimo: al menos lectura de “mi organización” y actualización de datos de billing/preparación.

Rutas bajo `/api/v1/organizations`; Response Layer v1; CONTRATO_API.md actualizado.

---

## 7. Subdominios y configuración

- **Aplicación:** La resolución por subdominio requiere que el servidor (o el proxy inverso) reciba el Host correcto. En desarrollo, se puede simular con header `X-Tenant-Slug` o `Host: acme.localhost:3000`. Documentar en configuración.
- **Variable de entorno:** Ej. `TENANT_RESOLUTION=subdomain|header|jwt` para elegir la estrategia; o `SUBDOMAIN_BASE=nexusapp.com` para extraer el tenant del host.

---

## 8. Configuración de despliegue productivo

- **Documentación:** Crear o actualizar documento (ej. docs/DESPLIEGUE_PRODUCCION.md) con: variables de entorno obligatorias (NODE_ENV=production, DATABASE_URL, JWT_SECRET, CORS, SUBDOMAIN_BASE, etc.), checklist de seguridad (HTTPS, secrets no en código), health check, y pasos recomendados para desplegar (build si aplica, migraciones, reinicio).
- **Opcional:** Añadir o referenciar Dockerfile, docker-compose para producción, o archivo de configuración para Railway/Heroku/Vercel si el proyecto lo usa. No es obligatorio implementar el despliegue real; sí documentar cómo hacerlo.

---

## 9. Criterios de aceptación (resumen)

- Tabla `organizations` creada; usuarios y proyectos con `organization_id`; migración de datos existentes a una organización por defecto.
- Middleware de resolución de tenant (subdominio y/o header y/o JWT) que establezca req.organizationId.
- Aislamiento: listados y altas de proyectos, usuarios (y datos derivados de proyecto) filtrados por organization_id del tenant.
- Endpoints de organización (al menos GET actual / detalle y PATCH para preparación billing) con Response Layer v1 y RBAC.
- Preparación billing: columnas o tabla para plan, billing_email, next_billing_date (sin integración de pago).
- Documentación de despliegue productivo (variables, checklist, pasos).
- Regresión: suites de tests existentes en verde; tests nuevos o adaptados para multi-tenant si aplica.
- Auditoría: acciones críticas sobre organizaciones registradas en audit_logs; opcional: columna organization_id en audit_logs.

---

## 10. QA (6 niveles) — aplicación a la etapa

| Nivel | Criterio |
|-------|----------|
| **Funcional** | Crear/listar organizaciones (o “mi org”); listar proyectos y usuarios por tenant; resolución por header/subdominio operativa. |
| **Dominio** | Un usuario solo ve datos de su organización; un proyecto solo pertenece a una organización. |
| **Negativa** | Petición sin tenant válido manejada (default o 400/403); intento de acceso a recurso de otra org → 403. |
| **Regresión** | Tests existentes pasan; flujos actuales operativos con organización por defecto. |
| **Seguridad** | Aislamiento verificado; no es posible listar proyectos de otra org manipulando IDs. |
| **Contrato** | Response Layer v1; nuevos endpoints documentados en CONTRATO_API.md. |

---

## 11. No incluido en esta etapa

- Integración real con pasarela de pago (Stripe, etc.).
- Registro público de nuevas organizaciones (sign-up de tenants) puede ser solo documento de extensión futura.
- Frontend específico para gestión de organizaciones (puede limitarse a “mi organización” y datos de billing en admin si hay tiempo).

---

*Documento de diseño ETAPA 10 — Preparación SaaS. Aprobación pendiente: SYSTEM ARCHITECT.*
