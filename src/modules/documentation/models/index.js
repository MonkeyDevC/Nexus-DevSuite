const { defineDocumentationContentModel } = require("./documentationContent.model");

module.exports = function defineDocumentationModels(sequelize) {
  const DocumentationContent = defineDocumentationContentModel(sequelize);
  return { DocumentationContent };
};

