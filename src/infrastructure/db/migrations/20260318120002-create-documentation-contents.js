"use strict";

/**
 * Crea documentation_contents para guardar contenido (html/markdown)
 * por organización/proyecto y tipo (functional/technical).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("documentation_contents", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
      },
      organization_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM("functional", "technical"),
        allowNull: false
      },
      format: {
        type: Sequelize.ENUM("html", "markdown"),
        allowNull: false,
        defaultValue: "html"
      },
      content: {
        type: Sequelize.TEXT("long"),
        allowNull: false
      },
      updated_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.addIndex("documentation_contents", ["organization_id", "project_id", "type"], {
      name: "idx_documentation_contents_scope_type"
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("documentation_contents");
    // Limpieza de ENUM (MySQL). En Postgres, Sequelize maneja types con nombres distintos.
    try {
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_documentation_contents_type;");
    } catch (_) {}
    try {
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_documentation_contents_format;");
    } catch (_) {}
  }
};

