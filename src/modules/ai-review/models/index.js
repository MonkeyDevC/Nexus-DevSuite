const defineCodeReviewModel = require("./codeReview.model");

function defineAiReviewModels(sequelize) {
  const CodeReview = defineCodeReviewModel(sequelize);
  return { CodeReview };
}

module.exports = defineAiReviewModels;
