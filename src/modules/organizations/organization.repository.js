const { getModels } = require("../../infrastructure/db/loadModels");

function getOrganizationModel() {
  const { Organization } = getModels();
  if (!Organization) throw new Error("Modelo Organization no registrado");
  return Organization;
}

async function findById(id) {
  const Organization = getOrganizationModel();
  return Organization.findByPk(id);
}

async function findBySlug(slug) {
  const Organization = getOrganizationModel();
  return Organization.findOne({ where: { slug } });
}

async function update(id, payload) {
  const Organization = getOrganizationModel();
  const [affected] = await Organization.update(payload, { where: { id } });
  if (!affected) return null;
  return findById(id);
}

module.exports = {
  findById,
  findBySlug,
  update
};
