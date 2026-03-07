const organizationRepository = require("./organization.repository");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");

function toPlain(org) {
  if (!org) return null;
  const o = typeof org.toJSON === "function" ? org.toJSON() : org;
  return {
    id: o.id,
    name: o.name,
    slug: o.slug,
    settings: o.settings,
    plan: o.plan,
    billing_email: o.billing_email,
    next_billing_date: o.next_billing_date,
    created_at: o.created_at,
    updated_at: o.updated_at
  };
}

async function getById(id, organizationId) {
  if (id !== organizationId) {
    throw new AppError("No tiene acceso a esta organizacion", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }
  const org = await organizationRepository.findById(id);
  if (!org) {
    throw new AppError("Organizacion no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.ORGANIZATION_NOT_FOUND
    });
  }
  return toPlain(org);
}

async function getCurrent(organizationId) {
  if (!organizationId) {
    throw new AppError("Tenant no resuelto", {
      statusCode: 400,
      code: ERROR_CODES.TENANT_REQUIRED
    });
  }
  const org = await organizationRepository.findById(organizationId);
  if (!org) {
    throw new AppError("Organizacion no encontrada", {
      statusCode: 404,
      code: ERROR_CODES.ORGANIZATION_NOT_FOUND
    });
  }
  return toPlain(org);
}

async function updateOrganization(id, payload, organizationId) {
  if (id !== organizationId) {
    throw new AppError("No tiene acceso a esta organizacion", {
      statusCode: 403,
      code: ERROR_CODES.RESOURCE_OTHER_ORGANIZATION
    });
  }
  const allowed = ["name", "settings", "plan", "billing_email", "next_billing_date"];
  const toUpdate = {};
  allowed.forEach(function (k) {
    if (payload[k] !== undefined) toUpdate[k] = payload[k];
  });
  if (Object.keys(toUpdate).length === 0) {
    return getById(id, organizationId);
  }
  const updated = await organizationRepository.update(id, toUpdate);
  return updated ? toPlain(updated) : null;
}

module.exports = {
  getById,
  getCurrent,
  updateOrganization
};
