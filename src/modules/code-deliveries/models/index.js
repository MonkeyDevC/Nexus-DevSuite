const defineCodeDeliveryModel = require("./codeDelivery.model");
const defineDeliveryFileModel = require("./deliveryFile.model");
const defineDeliveryCommitModel = require("./deliveryCommit.model");
const defineDeliveryReviewModel = require("./deliveryReview.model");
const defineReviewCommentModel = require("./reviewComment.model");

function defineCodeDeliveryModels(sequelize) {
  const CodeDelivery = defineCodeDeliveryModel(sequelize);
  const DeliveryFile = defineDeliveryFileModel(sequelize);
  const DeliveryCommit = defineDeliveryCommitModel(sequelize);
  const DeliveryReview = defineDeliveryReviewModel(sequelize);
  const ReviewComment = defineReviewCommentModel(sequelize);
  return { CodeDelivery, DeliveryFile, DeliveryCommit, DeliveryReview, ReviewComment };
}

module.exports = defineCodeDeliveryModels;
