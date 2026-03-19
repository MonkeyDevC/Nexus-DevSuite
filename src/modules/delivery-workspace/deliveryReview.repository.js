/**
 * Code Review System — Repositorio delivery_reviews
 */

const { getModels } = require("../../infrastructure/db/loadModels");

function getDeliveryReviewModel() {
  const { DeliveryReview } = getModels();
  if (!DeliveryReview) throw new Error("DeliveryReview no registrado");
  return DeliveryReview;
}

async function listByDelivery(deliveryId, projectId) {
  const DeliveryReview = getDeliveryReviewModel();
  return DeliveryReview.findAll({
    where: { delivery_id: deliveryId, project_id: projectId },
    order: [["submitted_at", "DESC"], ["created_at", "DESC"]]
  });
}

async function findByDeliveryAndReviewer(deliveryId, projectId, reviewerId) {
  const DeliveryReview = getDeliveryReviewModel();
  return DeliveryReview.findOne({
    where: { delivery_id: deliveryId, project_id: projectId, reviewer_id: reviewerId }
  });
}

async function create(payload) {
  const DeliveryReview = getDeliveryReviewModel();
  return DeliveryReview.create(payload);
}

async function updateStatus(id, projectId, status, submittedAt) {
  const DeliveryReview = getDeliveryReviewModel();
  const [n] = await DeliveryReview.update(
    { status, submitted_at: submittedAt },
    { where: { id, project_id: projectId } }
  );
  return n > 0;
}

async function upsertReview(deliveryId, projectId, reviewerId, status) {
  const DeliveryReview = getDeliveryReviewModel();
  const existing = await findByDeliveryAndReviewer(deliveryId, projectId, reviewerId);
  const submittedAt = new Date();
  if (existing) {
    await updateStatus(existing.id, projectId, status, submittedAt);
    return DeliveryReview.findByPk(existing.id);
  }
  return DeliveryReview.create({
    delivery_id: deliveryId,
    project_id: projectId,
    reviewer_id: reviewerId,
    status,
    submitted_at: submittedAt
  });
}

module.exports = {
  listByDelivery,
  findByDeliveryAndReviewer,
  create,
  updateStatus,
  upsertReview
};
