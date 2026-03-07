/**
 * Módulo Documents - Índice de modelos
 */

const defineDocumentModel = require("./document.model");
const defineDocumentVersionModel = require("./documentVersion.model");

function defineDocumentModels(sequelize) {
  const Document = defineDocumentModel(sequelize);
  const DocumentVersion = defineDocumentVersionModel(sequelize);
  return { Document, DocumentVersion };
}

module.exports = defineDocumentModels;
