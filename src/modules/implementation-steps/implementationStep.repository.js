const { getModels } = require("../../infrastructure/db/loadModels");

function getImplementationStepModel() {
  const { ImplementationStep } = getModels();
  if (!ImplementationStep) throw new Error("Modelo ImplementationStep no registrado en loadModels");
  return ImplementationStep;
}

async function getMaxStepNumberByTask(taskId, projectId, transaction) {
  const ImplementationStep = getImplementationStepModel();
  const r = await ImplementationStep.max("step_number", {
    where: { task_id: taskId, project_id: projectId },
    transaction: transaction || undefined
  });
  return r == null ? 0 : Number(r);
}

async function create(payload, transaction) {
  const ImplementationStep = getImplementationStepModel();
  return ImplementationStep.create(payload, { transaction: transaction || undefined });
}

async function findById(id, options = {}) {
  const ImplementationStep = getImplementationStepModel();
  return ImplementationStep.findByPk(id, options);
}

async function findByIdAndProject(id, projectId, options = {}) {
  const ImplementationStep = getImplementationStepModel();
  return ImplementationStep.findOne({
    where: { id, project_id: projectId },
    ...options
  });
}

async function listByTask(taskId, projectId, { page = 1, limit = 50 } = {}) {
  const ImplementationStep = getImplementationStepModel();
  const offset = (page - 1) * limit;
  const where = { task_id: taskId, project_id: projectId };
  const { rows, count } = await ImplementationStep.findAndCountAll({
    where,
    limit,
    offset,
    order: [["step_number", "ASC"]]
  });
  return { items: rows, total: count };
}

async function listByWorkOrder(workOrderId, projectId, { page = 1, limit = 100 } = {}) {
  const ImplementationStep = getImplementationStepModel();
  const offset = (page - 1) * limit;
  const where = { work_order_id: workOrderId, project_id: projectId };
  const { rows, count } = await ImplementationStep.findAndCountAll({
    where,
    limit,
    offset,
    order: [["step_number", "ASC"]]
  });
  return { items: rows, total: count };
}

async function update(id, projectId, payload) {
  const ImplementationStep = getImplementationStepModel();
  const [affected] = await ImplementationStep.update(payload, { where: { id, project_id: projectId } });
  if (!affected) return null;
  return findById(id);
}

module.exports = {
  getMaxStepNumberByTask,
  create,
  findById,
  findByIdAndProject,
  listByTask,
  listByWorkOrder,
  update
};
