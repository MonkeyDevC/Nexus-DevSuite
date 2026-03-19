/**
 * Code Review System — Repositorio review_comments
 */

const { getModels } = require("../../infrastructure/db/loadModels");

function getReviewCommentModel() {
  const { ReviewComment } = getModels();
  if (!ReviewComment) throw new Error("ReviewComment no registrado");
  return ReviewComment;
}

async function listByDelivery(deliveryId, projectId) {
  const ReviewComment = getReviewCommentModel();
  return ReviewComment.findAll({
    where: { delivery_id: deliveryId, project_id: projectId },
    order: [
      ["file_path", "ASC"],
      ["line_number", "ASC"],
      ["created_at", "ASC"]
    ]
  });
}

async function listByFileAndLine(deliveryId, projectId, filePath, lineNumber) {
  const ReviewComment = getReviewCommentModel();
  const where = { delivery_id: deliveryId, project_id: projectId, file_path: filePath };
  if (lineNumber != null) where.line_number = lineNumber;
  return ReviewComment.findAll({
    where,
    order: [["created_at", "ASC"]]
  });
}

async function findById(id, projectId) {
  const ReviewComment = getReviewCommentModel();
  return ReviewComment.findOne({
    where: { id, project_id: projectId }
  });
}

async function create(payload) {
  const ReviewComment = getReviewCommentModel();
  return ReviewComment.create(payload);
}

module.exports = {
  listByDelivery,
  listByFileAndLine,
  findById,
  create
};
