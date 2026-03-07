/**
 * Middleware de resolución de tenant (multi-org).
 * Orden: (1) Header X-Organization-Id (UUID) o X-Tenant-Slug (slug);
 *        (2) Subdominio (hostname respecto a SUBDOMAIN_BASE);
 *        (3) Organización por defecto (slug "default").
 * Establece req.organizationId (UUID) y opcionalmente req.tenantSlug.
 * Documentado en docs/DESPLIEGUE_PRODUCCION.md.
 */

const { getModels } = require("../infrastructure/db/loadModels");
const { env } = require("../config/env");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function extractSubdomain(hostname, base) {
  if (!base || !hostname || hostname === base) return null;
  if (hostname.endsWith("." + base)) {
    const sub = hostname.slice(0, -(base.length + 1));
    return sub && sub !== "www" ? sub : null;
  }
  return null;
}

async function resolveOrganizationId(slugOrId) {
  if (!slugOrId) return null;
  const { Organization } = getModels();
  if (UUID_REGEX.test(slugOrId)) {
    const org = await Organization.findByPk(slugOrId);
    return org ? org.id : null;
  }
  const org = await Organization.findOne({ where: { slug: slugOrId } });
  return org ? org.id : null;
}

async function getDefaultOrganizationId() {
  const { Organization } = getModels();
  const org = await Organization.findOne({ where: { slug: "default" } });
  return org ? org.id : null;
}

async function tenantResolutionMiddleware(req, res, next) {
  try {
    let slugOrId = null;

    const headerOrgId = req.get("X-Organization-Id");
    const headerSlug = req.get("X-Tenant-Slug");
    if (headerOrgId) slugOrId = headerOrgId.trim();
    else if (headerSlug) slugOrId = headerSlug.trim();

    if (!slugOrId && env.SUBDOMAIN_BASE) {
      const sub = extractSubdomain(req.hostname || "", env.SUBDOMAIN_BASE);
      if (sub) slugOrId = sub;
    }

    if (slugOrId) {
      const orgId = await resolveOrganizationId(slugOrId);
      if (orgId) {
        req.organizationId = orgId;
        const { Organization } = getModels();
        const org = await Organization.findByPk(orgId);
        req.tenantSlug = org ? org.slug : null;
        return next();
      }
    }

    const defaultId = await getDefaultOrganizationId();
    if (defaultId) {
      req.organizationId = defaultId;
      req.tenantSlug = "default";
    } else {
      req.organizationId = null;
      req.tenantSlug = null;
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  tenantResolutionMiddleware
};
