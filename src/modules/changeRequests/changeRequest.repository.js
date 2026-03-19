/**
 * Módulo ChangeRequest - Repositorio
 * Único punto de acceso a datos de change_requests.
 */

const { getModels } = require("../../infrastructure/db/loadModels");
const { Op } = require("sequelize");

function getChangeRequestModel() {
  const { ChangeRequest } = getModels();
  if (!ChangeRequest) throw new Error("Modelo ChangeRequest no registrado en loadModels");
  return ChangeRequest;
}

async function create(payload) {
  const ChangeRequest = getChangeRequestModel();
  return ChangeRequest.create(payload);
}

async function findById(id, options = {}) {
  const ChangeRequest = getChangeRequestModel();
  return ChangeRequest.findByPk(id, options);
}

async function update(id, payload) {
  const ChangeRequest = getChangeRequestModel();
  const [affected] = await ChangeRequest.update(payload, { where: { id } });
  if (!affected) return null;
  return findById(id);
}

/**
 * Obtiene el siguiente número de secuencia para el año (formato CR-YYYY-NNNN).
 * Busca el máximo code que empiece por CR-{year}- y devuelve N+1.
 */
async function getNextCodeForYear(year) {
  const ChangeRequest = getChangeRequestModel();
  const prefix = `CR-${year}-`;
  const rows = await ChangeRequest.findAll({
    where: { code: { [Op.like]: `${prefix}%` } },
    attributes: ["code"],
    order: [["code", "DESC"]],
    limit: 1
  });
  if (rows.length === 0) return `${prefix}0001`;
  const lastCode = rows[0].code;
  const numPart = lastCode.slice(prefix.length);
  const num = parseInt(numPart, 10);
  if (Number.isNaN(num)) return `${prefix}0001`;
  const next = num + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

async function listByFilters(filters = {}, pagination = {}) {
  const ChangeRequest = getChangeRequestModel();
  const page = Math.max(1, Number.parseInt(pagination.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(pagination.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const where = {};

  if (filters.status) where.status = filters.status;
  if (filters.entity_type) where.entity_type = filters.entity_type;
  if (Array.isArray(filters.entity_ids) && filters.entity_ids.length > 0) where.entity_id = { [Op.in]: filters.entity_ids };

  const { rows, count } = await ChangeRequest.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]]
  });
  return { items: rows, total: count, page, limit };
}

async function findLatestApprovedByEntity(entityType, entityId) {
  const ChangeRequest = getChangeRequestModel();
  return ChangeRequest.findOne({
    where: {
      entity_type: entityType,
      entity_id: entityId,
      status: "APPROVED"
    },
    order: [
      ["approved_at", "DESC"],
      ["created_at", "DESC"]
    ]
  });
}

async function findLatestImplementedByEntity(entityType, entityId) {
  const ChangeRequest = getChangeRequestModel();
  return ChangeRequest.findOne({
    where: {
      entity_type: entityType,
      entity_id: entityId,
      status: "IMPLEMENTED"
    },
    order: [
      ["implemented_at", "DESC"],
      ["updated_at", "DESC"]
    ]
  });
}

module.exports = {
  create,
  findById,
  update,
  getNextCodeForYear,
  listByFilters,
  findLatestApprovedByEntity,
  findLatestImplementedByEntity
};
