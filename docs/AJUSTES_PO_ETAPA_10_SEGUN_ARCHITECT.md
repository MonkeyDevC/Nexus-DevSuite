# Ajustes para el PO — Etapa 10 Preparación SaaS (según SYSTEM ARCHITECT)

**Destinatario:** PO MASTER  
**Origen:** Validación arquitectónica SYSTEM ARCHITECT  
**Documentos de referencia:**  
- `docs/VALIDACION_ARQUITECTONICA_ETAPA_10_PREPARACION_SAAS.md`  
- `docs/PLAN_ETAPA_10_PREPARACION_SAAS.md`  
- `docs/PROMPT_MASTER_DEVELOPER_ETAPA_10_PREPARACION_SAAS.md`

**Estado de la etapa:** APROBADA con observaciones y condiciones. El PO debe incorporar los ajustes siguientes en el plan y en el prompt (sección 9) antes de enviar el prompt al MASTER DEVELOPER.

---

## 1. Resumen del análisis del arquitecto

- Multi-tenant por organización: entidad Organization, `organization_id` en users y projects, migraciones incrementales correctas.
- Índice unique de `projects`: se cambia en una **nueva** migración (eliminar `uq_projects_name`, añadir unique compuesto `(organization_id, name)`), sin tocar migraciones ya existentes.
- Release no tiene `project_id`: el aislamiento debe definirse explícitamente (filtrar vía Feature → Project o añadir `organization_id` a Release).
- Documentos con `project_id` null: debe definirse la política (solo default, o visibles para todos).
- Orden de resolución de tenant: unificar entre plan (subdominio, header, JWT) y prompt (header, subdominio, default) y documentarlo.
- Tests: incluir en el prompt el uso de org default y de header `X-Tenant-Slug` (o equivalente) en las peticiones de test.

---

## 2. Ajustes al PLAN (PLAN_ETAPA_10_PREPARACION_SAAS.md)

| Dónde | Ajuste sugerido |
|-------|------------------|
| **Sección 5 (Aislamiento) — Releases** | Añadir: “**Release** no tiene `project_id`. Definir criterio: (a) filtrar listados de releases por ‘releases que tengan al menos una feature cuyo project pertenezca a la org’ (join Feature → Project → organization_id), o (b) añadir `organization_id` a la tabla releases en una migración y filtrar por él. Dejar la opción elegida explícita en el prompt.” |
| **Sección 5 — Documents** | Añadir: “**Documentos con project_id null** (documentos globales): definir política en el prompt: visibles solo para organización default, o visibles para todos los tenants. No dejar sin definir.” |
| **Sección 4 (Resolución de tenant)** | Unificar orden de prioridad con el prompt. Ejemplo: “Orden configurable (ej. variable TENANT_RESOLUTION_ORDER); por defecto: (1) Header X-Organization-Id / X-Tenant-Slug, (2) Subdominio, (3) Organización por defecto (slug ‘default’). Si no se resuelve tenant, usar siempre organización por defecto (no 400/403 salvo que se documente otra política).” |
| **Sección 3.2 (projects)** | Dejar explícito: “El cambio de unique de `projects.name` a unique compuesto `(organization_id, name)` se hace en una **nueva** migración (removeIndex de uq_projects_name + addIndex), sin modificar el archivo create-projects.js.” |

---

## 3. Ajustes al PROMPT — Sección 9 (incorporar tras validación)

Añadir al prompt una **sección 9** con el siguiente contenido (o equivalente):

---

### 9️⃣ OBSERVACIONES DEL SYSTEM ARCHITECT (incorporar en implementación)

1. **Release y aislamiento:** Release no tiene `project_id`. Definir e implementar uno de los dos criterios:  
   - **(A)** Al listar releases, filtrar por “releases que tengan al menos una feature cuyo project.organization_id === req.organizationId” (join Feature → Project).  
   - **(B)** Añadir columna `organization_id` a la tabla `releases` en una migración nueva, asignarla al crear release desde req.organizationId, y filtrar listados por organization_id.  
   Documentar en CONTRATO_API la opción elegida.

2. **Documentos con project_id null:** Definir política y aplicar en servicio/repositorio: p. ej. “documentos sin project_id se consideran de la organización default” (solo visibles cuando req.organizationId es la org default), o “visibles para todos los tenants”. No dejar el comportamiento indefinido.

3. **Orden de resolución de tenant:** Dejar documentado en código o en docs/DESPLIEGUE_PRODUCCION.md el orden usado (p. ej. header → subdominio → org default) y la variable de entorno si aplica (TENANT_RESOLUTION, SUBDOMAIN_BASE). Debe coincidir con lo indicado en el plan.

4. **Migración 20260310100003 (projects):** No modificar el archivo create-projects.js. En la nueva migración: usar `queryInterface.removeIndex('projects', 'uq_projects_name')` y después `queryInterface.addIndex('projects', ['organization_id', 'name'], { unique: true, name: 'uq_projects_organization_name' })`.

5. **Tests existentes y multi-tenant:** Asegurar que los tests que llaman a la API envíen un tenant válido: header `X-Tenant-Slug: default` (o `X-Organization-Id` con el UUID de la org default), o que el middleware asigne org default cuando no hay header. Los fixtures de usuarios y proyectos deben tener `organization_id` (por seed o por setup del test). Incluir en la Fase 8 del prompt la verificación de que la suite existente pasa con tenant por defecto.

6. **Códigos de error:** Añadir en errorCodes.js y documentar en CONTRATO_API los códigos que se usen (ej. ORGANIZATION_NOT_FOUND, TENANT_REQUIRED, RESOURCE_OTHER_ORGANIZATION o equivalente para 403 por aislamiento).

---

## 4. Checklist para el PO

Antes de enviar el prompt al MASTER DEVELOPER, el PO debe:

- [ ] Haber incorporado en el **plan** los ajustes de la sección 2 (Release, Document global, resolución de tenant, migración de unique en projects).
- [ ] Haber añadido al **prompt** la **sección 9** con las observaciones del arquitecto (sección 3 de este documento).
- [ ] Confirmar que la opción elegida para Release (A o B) y la política para documentos globales quedan explícitas en el prompt.

---

## 5. Referencia a la validación completa

Para el detalle de la validación (migraciones, entidades, riesgos, conclusión), ver:  
**`docs/VALIDACION_ARQUITECTONICA_ETAPA_10_PREPARACION_SAAS.md`**
