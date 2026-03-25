const { DataTypes } = require("sequelize");

const DOC_TYPES = ["functional", "technical"];
const DOC_FORMATS = ["html", "markdown"];

function defineDocumentationContentModel(sequelize) {
  return sequelize.define(
    "DocumentationContent",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      organization_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      type: {
        type: DataTypes.ENUM(...DOC_TYPES),
        allowNull: false
      },
      format: {
        type: DataTypes.ENUM(...DOC_FORMATS),
        allowNull: false,
        defaultValue: "html"
      },
      content: {
        type: DataTypes.TEXT("long"),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "ARCHIVED"),
        allowNull: false,
        defaultValue: "ACTIVE"
      },
      updated_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true
      }
    },
    {
      tableName: "documentation_contents",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  );
}

module.exports = {
  defineDocumentationContentModel,
  DOC_TYPES,
  DOC_FORMATS
};

