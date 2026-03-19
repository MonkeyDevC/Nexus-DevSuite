const defineModels = require("../../modules/auth/models");
const defineOrganizationModel = require("../../modules/organizations/models/organization.model");
const defineBacklogModels = require("../../modules/backlog/models");
const defineReleaseModels = require("../../modules/releases/models");
const defineChangeRequestModels = require("../../modules/changeRequests/models");
const defineSprintModels = require("../../modules/sprints/models");
const defineIncidentModels = require("../../modules/incidents/models");
const defineImprovementModels = require("../../modules/improvements/models");
const defineDocumentModels = require("../../modules/documents/models");
const defineDocumentationModels = require("../../modules/documentation/models");
const defineTaskModels = require("../../modules/tasks/models");
const defineCodeDeliveryModels = require("../../modules/code-deliveries/models");
const defineWorkOrderModels = require("../../modules/work-orders/models");
const defineImplementationStepModels = require("../../modules/implementation-steps/models");
const defineGitHubConnectionModel = require("../../modules/github-integration/models/githubConnection.model");
const defineGithubOauthStateModel = require("../../modules/github-integration/models/githubOauthState.model");
const defineAiReviewModels = require("../../modules/ai-review/models");
const defineAutomationRuleModel = require("../../modules/automation/automation.rule.model");
const defineAutomationRuleExecutionModel = require("../../modules/automation/automation.ruleExecution.model");

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
  const { Release, ReleaseFeature } = releaseModels;
  Organization.hasMany(Release, { foreignKey: "organization_id", as: "releases" });
  Release.belongsTo(Organization, { foreignKey: "organization_id", as: "organization" });
  Project.hasMany(Release, { foreignKey: "project_id", as: "project_releases" });
  Release.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  User.hasMany(Release, { foreignKey: "created_by", as: "releases" });
  Release.belongsTo(User, { foreignKey: "created_by", as: "creator" });
  Release.hasMany(Feature, { foreignKey: "release_id", as: "features" });
  Feature.belongsTo(Release, { foreignKey: "release_id", as: "release" });
  Release.hasMany(ReleaseFeature, { foreignKey: "release_id", as: "release_features" });
  ReleaseFeature.belongsTo(Release, { foreignKey: "release_id", as: "release" });
  Feature.hasMany(ReleaseFeature, { foreignKey: "feature_id", as: "release_features" });
  ReleaseFeature.belongsTo(Feature, { foreignKey: "feature_id", as: "feature" });

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

  const documentationModels = defineDocumentationModels(sequelize);
  const { DocumentationContent } = documentationModels;
  Organization.hasMany(DocumentationContent, { foreignKey: "organization_id", as: "documentation_contents" });
  DocumentationContent.belongsTo(Organization, { foreignKey: "organization_id", as: "organization" });
  Project.hasMany(DocumentationContent, { foreignKey: "project_id", as: "documentation_contents" });
  DocumentationContent.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  User.hasMany(DocumentationContent, { foreignKey: "updated_by_user_id", as: "documentation_contents_updated" });
  DocumentationContent.belongsTo(User, { foreignKey: "updated_by_user_id", as: "updated_by_user" });

  const workOrderModels = defineWorkOrderModels(sequelize);
  const { WorkOrder } = workOrderModels;
  Project.hasMany(WorkOrder, { foreignKey: "project_id", as: "work_orders" });
  WorkOrder.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  UserStory.hasMany(WorkOrder, { foreignKey: "user_story_id", as: "work_orders" });
  WorkOrder.belongsTo(UserStory, { foreignKey: "user_story_id", as: "user_story" });
  User.hasMany(WorkOrder, { foreignKey: "created_by_user_id", as: "work_orders_created" });
  WorkOrder.belongsTo(User, { foreignKey: "created_by_user_id", as: "creator" });
  User.hasMany(WorkOrder, { foreignKey: "assigned_to_user_id", as: "work_orders_assigned" });
  WorkOrder.belongsTo(User, { foreignKey: "assigned_to_user_id", as: "assignee" });

  const taskModels = defineTaskModels(sequelize);
  const { Task } = taskModels;
  Project.hasMany(Task, { foreignKey: "project_id", as: "tasks" });
  Task.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  UserStory.hasMany(Task, { foreignKey: "user_story_id", as: "tasks" });
  Task.belongsTo(UserStory, { foreignKey: "user_story_id", as: "user_story" });
  WorkOrder.hasMany(Task, { foreignKey: "work_order_id", as: "tasks" });
  Task.belongsTo(WorkOrder, { foreignKey: "work_order_id", as: "work_order" });
  User.hasMany(Task, { foreignKey: "created_by_user_id", as: "tasks_created" });
  Task.belongsTo(User, { foreignKey: "created_by_user_id", as: "creator" });
  User.hasMany(Task, { foreignKey: "assigned_to_user_id", as: "tasks_assigned" });
  Task.belongsTo(User, { foreignKey: "assigned_to_user_id", as: "assignee" });

  const implementationStepModels = defineImplementationStepModels(sequelize);
  const { ImplementationStep } = implementationStepModels;
  Project.hasMany(ImplementationStep, { foreignKey: "project_id", as: "implementation_steps" });
  ImplementationStep.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  Task.hasMany(ImplementationStep, { foreignKey: "task_id", as: "implementation_steps" });
  ImplementationStep.belongsTo(Task, { foreignKey: "task_id", as: "task" });
  WorkOrder.hasMany(ImplementationStep, { foreignKey: "work_order_id", as: "implementation_steps" });
  ImplementationStep.belongsTo(WorkOrder, { foreignKey: "work_order_id", as: "work_order" });

  const codeDeliveryModels = defineCodeDeliveryModels(sequelize);
  const { CodeDelivery, DeliveryFile, DeliveryCommit, DeliveryReview, ReviewComment } = codeDeliveryModels;
  Project.hasMany(CodeDelivery, { foreignKey: "project_id", as: "code_deliveries" });
  CodeDelivery.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  Task.hasMany(CodeDelivery, { foreignKey: "task_id", as: "code_deliveries" });
  CodeDelivery.belongsTo(Task, { foreignKey: "task_id", as: "task" });
  WorkOrder.hasMany(CodeDelivery, { foreignKey: "work_order_id", as: "code_deliveries" });
  CodeDelivery.belongsTo(WorkOrder, { foreignKey: "work_order_id", as: "work_order" });
  WorkOrder.belongsTo(CodeDelivery, { foreignKey: "delivery_id", as: "delivery" });
  UserStory.hasMany(CodeDelivery, { foreignKey: "user_story_id", as: "code_deliveries" });
  CodeDelivery.belongsTo(UserStory, { foreignKey: "user_story_id", as: "user_story" });
  User.hasMany(CodeDelivery, { foreignKey: "created_by_user_id", as: "code_deliveries_created" });
  CodeDelivery.belongsTo(User, { foreignKey: "created_by_user_id", as: "creator" });

  Project.hasMany(DeliveryFile, { foreignKey: "project_id", as: "delivery_files" });
  DeliveryFile.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  CodeDelivery.hasMany(DeliveryFile, { foreignKey: "delivery_id", as: "delivery_files" });
  DeliveryFile.belongsTo(CodeDelivery, { foreignKey: "delivery_id", as: "code_delivery" });

  Project.hasMany(DeliveryCommit, { foreignKey: "project_id", as: "delivery_commits" });
  DeliveryCommit.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  CodeDelivery.hasMany(DeliveryCommit, { foreignKey: "delivery_id", as: "delivery_commits" });
  DeliveryCommit.belongsTo(CodeDelivery, { foreignKey: "delivery_id", as: "code_delivery" });
  WorkOrder.hasMany(DeliveryCommit, { foreignKey: "work_order_id", as: "delivery_commits_work_orders" });
  DeliveryCommit.belongsTo(WorkOrder, { foreignKey: "work_order_id", as: "work_order_commit" });

  Project.hasMany(DeliveryReview, { foreignKey: "project_id", as: "delivery_reviews" });
  DeliveryReview.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  CodeDelivery.hasMany(DeliveryReview, { foreignKey: "delivery_id", as: "delivery_reviews" });
  DeliveryReview.belongsTo(CodeDelivery, { foreignKey: "delivery_id", as: "code_delivery" });
  User.hasMany(DeliveryReview, { foreignKey: "reviewer_id", as: "delivery_reviews_given" });
  DeliveryReview.belongsTo(User, { foreignKey: "reviewer_id", as: "reviewer" });

  Project.hasMany(ReviewComment, { foreignKey: "project_id", as: "review_comments" });
  ReviewComment.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  CodeDelivery.hasMany(ReviewComment, { foreignKey: "delivery_id", as: "review_comments" });
  ReviewComment.belongsTo(CodeDelivery, { foreignKey: "delivery_id", as: "code_delivery" });
  User.hasMany(ReviewComment, { foreignKey: "author_id", as: "review_comments_authored" });
  ReviewComment.belongsTo(User, { foreignKey: "author_id", as: "author" });
  ReviewComment.belongsTo(ReviewComment, { foreignKey: "parent_id", as: "parent" });
  ReviewComment.hasMany(ReviewComment, { foreignKey: "parent_id", as: "replies" });

  const aiReviewModels = defineAiReviewModels(sequelize);
  const { CodeReview } = aiReviewModels;
  Project.hasMany(CodeReview, { foreignKey: "project_id", as: "code_reviews" });
  CodeReview.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  CodeDelivery.hasMany(CodeReview, { foreignKey: "delivery_id", as: "code_reviews" });
  CodeReview.belongsTo(CodeDelivery, { foreignKey: "delivery_id", as: "code_delivery" });

  const GitHubConnection = defineGitHubConnectionModel(sequelize);
  const GithubOauthState = defineGithubOauthStateModel(sequelize);
  User.hasMany(GitHubConnection, { foreignKey: "user_id", as: "github_connections" });
  GitHubConnection.belongsTo(User, { foreignKey: "user_id", as: "user" });
  Project.hasMany(GitHubConnection, { foreignKey: "project_id", as: "github_connections" });
  GitHubConnection.belongsTo(Project, { foreignKey: "project_id", as: "project" });
  User.hasMany(GithubOauthState, { foreignKey: "user_id" });
  GithubOauthState.belongsTo(User, { foreignKey: "user_id" });
  Project.hasMany(GithubOauthState, { foreignKey: "project_id" });
  GithubOauthState.belongsTo(Project, { foreignKey: "project_id" });

  const AutomationRule = defineAutomationRuleModel(sequelize);
  const AutomationRuleExecution = defineAutomationRuleExecutionModel(sequelize);

  // Asociaciones mínimas para navegación y consistencia.
  AutomationRule.hasMany(AutomationRuleExecution, { foreignKey: "rule_id", as: "executions" });
  AutomationRuleExecution.belongsTo(AutomationRule, { foreignKey: "rule_id", as: "rule" });

  cachedModels = {
    ...authModels,
    Organization,
    ...backlogModels,
    ...sprintModels,
    ...releaseModels,
    ...changeRequestModels,
    ...incidentModels,
    ...improvementModels,
    ...documentModels,
    ...documentationModels,
    ...workOrderModels,
    ...taskModels,
    ...implementationStepModels,
    ...codeDeliveryModels,
    ...aiReviewModels,
    AutomationRule,
    AutomationRuleExecution,
    GitHubConnection,
    GithubOauthState
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
