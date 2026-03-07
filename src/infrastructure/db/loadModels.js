const defineModels = require("../../modules/auth/models");
const defineOrganizationModel = require("../../modules/organizations/models/organization.model");
const defineBacklogModels = require("../../modules/backlog/models");
const defineReleaseModels = require("../../modules/releases/models");
const defineChangeRequestModels = require("../../modules/changeRequests/models");
const defineSprintModels = require("../../modules/sprints/models");
const defineIncidentModels = require("../../modules/incidents/models");
const defineImprovementModels = require("../../modules/improvements/models");
const defineDocumentModels = require("../../modules/documents/models");

let cachedModels = null;

function loadModels(sequelize) {
  if (cachedModels) {
    return cachedModels;
  }

  const authModels = defineModels(sequelize);
  const { User, Role, RefreshToken, AuditLog } = authModels;

  const Organization = defineOrganizationModel(sequelize);

  Role.hasMany(User, { foreignKey: "role_id", as: "users" });
  User.belongsTo(Role, { foreignKey: "role_id", as: "role" });
  Organization.hasMany(User, { foreignKey: "organization_id", as: "users" });
  User.belongsTo(Organization, { foreignKey: "organization_id", as: "organization" });

  User.hasMany(RefreshToken, { foreignKey: "user_id", as: "refresh_tokens" });
  RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasMany(AuditLog, { foreignKey: "user_id", as: "audit_logs" });
  AuditLog.belongsTo(User, { foreignKey: "user_id", as: "user" });

  const backlogModels = defineBacklogModels(sequelize);
  const { Project, Feature, UserStory } = backlogModels;

  Organization.hasMany(Project, { foreignKey: "organization_id", as: "projects" });
  Project.belongsTo(Organization, { foreignKey: "organization_id", as: "organization" });
  User.hasMany(Project, { foreignKey: "created_by", as: "projects" });
  Project.belongsTo(User, { foreignKey: "created_by", as: "creator" });

  Project.hasMany(Feature, { foreignKey: "project_id", as: "features" });
  Feature.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  Feature.belongsTo(User, { foreignKey: "created_by", as: "creator" });
  Feature.belongsTo(User, { foreignKey: "approved_by", as: "approver" });
  User.hasMany(Feature, { foreignKey: "created_by", as: "created_features" });

  Feature.hasMany(UserStory, { foreignKey: "feature_id", as: "user_stories" });
  UserStory.belongsTo(Feature, { foreignKey: "feature_id", as: "feature" });
  UserStory.belongsTo(User, { foreignKey: "created_by", as: "creator" });
  UserStory.belongsTo(User, { foreignKey: "approved_by", as: "approver" });
  UserStory.belongsTo(User, { foreignKey: "assigned_to", as: "assignee" });
  User.hasMany(UserStory, { foreignKey: "assigned_to", as: "assigned_stories" });

  const sprintModels = defineSprintModels(sequelize);
  const { Sprint } = sprintModels;
  Project.hasMany(Sprint, { foreignKey: "project_id", as: "sprints" });
  Sprint.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  User.hasMany(Sprint, { foreignKey: "created_by", as: "sprints_created" });
  Sprint.belongsTo(User, { foreignKey: "created_by", as: "creator" });
  User.hasMany(Sprint, { foreignKey: "closed_by", as: "sprints_closed" });
  Sprint.belongsTo(User, { foreignKey: "closed_by", as: "closedByUser" });
  Sprint.hasMany(UserStory, { foreignKey: "sprint_id", as: "user_stories" });
  UserStory.belongsTo(Sprint, { foreignKey: "sprint_id", as: "sprint" });

  const releaseModels = defineReleaseModels(sequelize);
  const { Release } = releaseModels;
  Organization.hasMany(Release, { foreignKey: "organization_id", as: "releases" });
  Release.belongsTo(Organization, { foreignKey: "organization_id", as: "organization" });
  User.hasMany(Release, { foreignKey: "created_by", as: "releases" });
  Release.belongsTo(User, { foreignKey: "created_by", as: "creator" });
  Release.hasMany(Feature, { foreignKey: "release_id", as: "features" });
  Feature.belongsTo(Release, { foreignKey: "release_id", as: "release" });

  const changeRequestModels = defineChangeRequestModels(sequelize);
  const { ChangeRequest } = changeRequestModels;
  User.hasMany(ChangeRequest, { foreignKey: "requested_by", as: "change_requests_requested" });
  ChangeRequest.belongsTo(User, { foreignKey: "requested_by", as: "requester" });
  User.hasMany(ChangeRequest, { foreignKey: "approved_by", as: "change_requests_approved" });
  ChangeRequest.belongsTo(User, { foreignKey: "approved_by", as: "approver" });

  const incidentModels = defineIncidentModels(sequelize);
  const { Incident } = incidentModels;
  Project.hasMany(Incident, { foreignKey: "project_id", as: "incidents" });
  Incident.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  User.hasMany(Incident, { foreignKey: "reported_by", as: "incidents_reported" });
  Incident.belongsTo(User, { foreignKey: "reported_by", as: "reporter" });
  User.hasMany(Incident, { foreignKey: "assigned_to", as: "incidents_assigned" });
  Incident.belongsTo(User, { foreignKey: "assigned_to", as: "assignee" });
  User.hasMany(Incident, { foreignKey: "closed_by", as: "incidents_closed" });
  Incident.belongsTo(User, { foreignKey: "closed_by", as: "closedByUser" });

  const improvementModels = defineImprovementModels(sequelize);
  const { Improvement } = improvementModels;
  Incident.hasMany(Improvement, { foreignKey: "incident_id", as: "improvements" });
  Improvement.belongsTo(Incident, { foreignKey: "incident_id", as: "incident" });
  Improvement.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  User.hasMany(Improvement, { foreignKey: "proposed_by", as: "improvements_proposed" });
  Improvement.belongsTo(User, { foreignKey: "proposed_by", as: "proposer" });
  User.hasMany(Improvement, { foreignKey: "approved_by", as: "improvements_approved" });
  Improvement.belongsTo(User, { foreignKey: "approved_by", as: "approver" });

  const documentModels = defineDocumentModels(sequelize);
  const { Document, DocumentVersion } = documentModels;
  Project.hasMany(Document, { foreignKey: "project_id", as: "documents" });
  Document.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  User.hasMany(Document, { foreignKey: "created_by", as: "documents_created" });
  Document.belongsTo(User, { foreignKey: "created_by", as: "creator" });
  Document.hasMany(DocumentVersion, { foreignKey: "document_id", as: "versions" });
  DocumentVersion.belongsTo(Document, { foreignKey: "document_id", as: "document" });
  User.hasMany(DocumentVersion, { foreignKey: "created_by", as: "document_versions_created" });
  DocumentVersion.belongsTo(User, { foreignKey: "created_by", as: "versionCreator" });
  User.hasMany(DocumentVersion, { foreignKey: "approved_by", as: "document_versions_approved" });
  DocumentVersion.belongsTo(User, { foreignKey: "approved_by", as: "approver" });

  cachedModels = {
    ...authModels,
    Organization,
    ...backlogModels,
    ...sprintModels,
    ...releaseModels,
    ...changeRequestModels,
    ...incidentModels,
    ...improvementModels,
    ...documentModels
  };
  return cachedModels;
}

function getModels() {
  if (!cachedModels) {
    throw new Error("Modelos no cargados. Ejecuta loadModels antes de usarlos.");
  }

  return cachedModels;
}

module.exports = {
  loadModels,
  getModels
};
