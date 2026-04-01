"use strict";

function normalizeProjectName(value) {
  const raw = value == null ? "" : String(value);
  return raw.trim().replace(/\s+/g, " ");
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("projects", "normalized_name", {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn("projects", "version", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1
    });

    const [rows] = await queryInterface.sequelize.query(
      "SELECT id, name, organization_id, created_at FROM projects ORDER BY created_at ASC, id ASC"
    );

    for (const row of rows) {
      const normalized = normalizeProjectName(row.name).toLowerCase();
      await queryInterface.sequelize.query(
        "UPDATE projects SET normalized_name = :normalized, description = COALESCE(description, '') WHERE id = :id",
        { replacements: { normalized, id: row.id } }
      );
    }

    await queryInterface.changeColumn("projects", "organization_id", {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "organizations",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    });

    await queryInterface.changeColumn("projects", "normalized_name", {
      type: Sequelize.STRING(255),
      allowNull: false
    });

    await queryInterface.changeColumn("projects", "description", {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: ""
    });

    await queryInterface.removeIndex("projects", "uq_projects_organization_name");
    await queryInterface.removeIndex("projects", "uq_projects_number");

    await queryInterface.addIndex("projects", ["organization_id", "normalized_name"], {
      unique: true,
      name: "uq_projects_organization_normalized_name"
    });

    await queryInterface.addIndex("projects", ["organization_id", "number"], {
      unique: true,
      name: "uq_projects_organization_number"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("projects", "uq_projects_organization_number");
    await queryInterface.removeIndex("projects", "uq_projects_organization_normalized_name");

    await queryInterface.addIndex("projects", ["number"], {
      unique: true,
      name: "uq_projects_number"
    });

    await queryInterface.addIndex("projects", ["organization_id", "name"], {
      unique: true,
      name: "uq_projects_organization_name"
    });

    await queryInterface.changeColumn("projects", "description", {
      type: Sequelize.TEXT,
      allowNull: false
    });

    await queryInterface.changeColumn("projects", "organization_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "organizations",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    });

    await queryInterface.removeColumn("projects", "version");
    await queryInterface.removeColumn("projects", "normalized_name");
  }
};
