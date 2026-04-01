const { getModels } = require("../../../infrastructure/db/loadModels");
const { AppError } = require("../../../shared/errors/AppError");
const deliveryWorkspaceService = require("../../delivery-workspace/deliveryWorkspace.service");

function safeJsonParse(maybeJson) {
  if (!maybeJson) return null;
  try {
    return typeof maybeJson === "string" ? JSON.parse(maybeJson) : maybeJson;
  } catch (_) {
    return null;
  }
}

function shortSha(sha) {
  const s = sha ? String(sha) : "";
  return s.length > 8 ? s.slice(0, 8) : s;
}

async function resolveDelivery({ projectId, deliveryId, organizationId }) {
  const { CodeDelivery } = getModels();
  if (deliveryId) {
    const d = await CodeDelivery.findOne({ where: { id: deliveryId, project_id: projectId, organization_id: organizationId } });
    return d ? (d.toJSON ? d.toJSON() : d) : null;
  }
  if (!projectId) return null;
  const last = await CodeDelivery.findOne({
    where: { project_id: projectId, organization_id: organizationId },
    order: [["updated_at", "DESC"]]
  });
  return last ? (last.toJSON ? last.toJSON() : last) : null;
}

async function resolveChain(delivery, organizationId) {
  if (!delivery) return { delivery: null, task: null, workOrder: null, story: null, feature: null, release: null };
  const { Task, WorkOrder, UserStory, Feature, Release, Project } = getModels();

  const task = await Task.findOne({ where: { id: delivery.task_id, organization_id: organizationId } }).catch(() => null);

  let story = null;
  if (delivery.user_story_id) {
    story = await UserStory.findOne({
      where: { id: delivery.user_story_id },
      include: [
        {
          model: Feature,
          as: "feature",
          required: true,
          include: [{ model: Project, as: "project", attributes: ["id", "organization_id"], required: true, where: { organization_id: organizationId } }]
        }
      ]
    }).catch(() => null);
  }

  const storyPlain = story ? (story.toJSON ? story.toJSON() : story) : null;
  const featureId = storyPlain ? storyPlain.feature_id : null;
  const feature =
    featureId && storyPlain && storyPlain.feature
      ? typeof storyPlain.feature.toJSON === "function"
        ? storyPlain.feature.toJSON()
        : storyPlain.feature
      : featureId
        ? await Feature.findOne({
            where: { id: featureId },
            include: [{ model: Project, as: "project", where: { organization_id: organizationId }, required: true }]
          }).catch(() => null)
        : null;
  const featurePlain = feature && typeof feature.toJSON === "function" ? feature.toJSON() : feature;

  const workOrderId = delivery.work_order_id || (task ? (task.work_order_id || null) : null);
  const workOrder = workOrderId ? await WorkOrder.findOne({ where: { id: workOrderId, organization_id: organizationId } }).catch(() => null) : null;

  /**
   * Release (WAVE 4.5): precedencia canónica — story.release_id > feature.release_id (legacy lectura).
   * Si ambos existen y difieren, prevalece story.release_id.
   */
  let release = null;
  const storyReleaseId = storyPlain && storyPlain.release_id != null ? String(storyPlain.release_id) : null;
  const featureReleaseId = featurePlain && featurePlain.release_id != null ? String(featurePlain.release_id) : null;
  const releaseIdToLoad = storyReleaseId || featureReleaseId || null;
  if (releaseIdToLoad) {
    release = await Release.findOne({ where: { id: releaseIdToLoad, organization_id: organizationId } }).catch(() => null);
  }

  return {
    delivery,
    task: task ? (task.toJSON ? task.toJSON() : task) : null,
    workOrder: workOrder ? (workOrder.toJSON ? workOrder.toJSON() : workOrder) : null,
    story: storyPlain,
    feature: featurePlain,
    release: release ? (release.toJSON ? release.toJSON() : release) : null
  };
}

async function computeReleaseCounts(release, organizationId) {
  void organizationId;
  const { UserStory } = getModels();
  if (!release || !release.id) return { featuresCount: null, storiesCount: null, featureIds: [] };
  const sequelize = UserStory.sequelize;
  const rid = release.id;

  const storiesCount = await UserStory.count({ where: { release_id: rid } }).catch(() => null);

  const distinctRows = await sequelize
    .query(`SELECT DISTINCT feature_id AS fid FROM user_stories WHERE release_id = :rid AND feature_id IS NOT NULL`, {
      replacements: { rid },
      type: sequelize.QueryTypes.SELECT
    })
    .catch(() => []);
  const featureIds = (distinctRows || []).map((r) => r.fid).filter(Boolean);
  const featuresCount = featureIds.length;

  return { featuresCount, storiesCount, featureIds };
}

function snapshotSummaryFromDelivery(delivery) {
  const snap = safeJsonParse(delivery && delivery.git_snapshot_json);
  if (!snap) return { hasSnapshot: false, total_files: 0, large_files_count: 0, hash_count: 0 };
  const files = Array.isArray(snap.files) ? snap.files : [];
  const large = files.filter((f) => f && f.large_file).length;
  const hashes = snap.content_by_hash && typeof snap.content_by_hash === "object" ? Object.keys(snap.content_by_hash) : [];
  return { hasSnapshot: true, total_files: files.length, large_files_count: large, hash_count: hashes.length };
}

async function getRecentCommits(projectId, deliveryId, organizationId) {
  const { DeliveryCommit } = getModels();
  if (!projectId || !deliveryId) return [];
  const rows = await DeliveryCommit.findAll({
    where: { project_id: projectId, delivery_id: deliveryId, organization_id: organizationId },
    order: [["created_at", "DESC"]],
    limit: 5,
    attributes: ["commit_sha", "commit_message", "author", "created_at"]
  }).catch(() => []);
  return rows.map((r) => {
    const p = r.toJSON ? r.toJSON() : r;
    return {
      sha: p.commit_sha,
      shortSha: shortSha(p.commit_sha),
      message: p.commit_message || "",
      author: p.author || null,
      created_at: p.created_at || null
    };
  });
}

async function getReviewsAndComments(projectId, deliveryId, organizationId) {
  const { DeliveryReview, ReviewComment, User } = getModels();
  if (!projectId || !deliveryId) return { reviews: [], comments: [] };

  const [reviewsRows, commentsRows] = await Promise.all([
    DeliveryReview.findAll({
      where: { project_id: projectId, delivery_id: deliveryId, organization_id: organizationId },
      order: [["created_at", "DESC"]],
      limit: 10
    }).catch(() => []),
    ReviewComment.findAll({
      where: { project_id: projectId, delivery_id: deliveryId },
      order: [["created_at", "DESC"]],
      limit: 10,
      include: [{ model: User, as: "author", attributes: ["id", "email", "name"], required: false }]
    }).catch(() => [])
  ]);

  const reviews = reviewsRows.map((r) => {
    const p = r.toJSON ? r.toJSON() : r;
    return { status: p.status || null, reviewer_id: p.reviewer_id || null, created_at: p.created_at || null };
  });
  const comments = commentsRows.map((c) => {
    const p = c.toJSON ? c.toJSON() : c;
    const a = p.author || null;
    return {
      file_path: p.file_path || null,
      line_number: p.line_number != null ? p.line_number : null,
      body: p.body || "",
      author: a ? { id: a.id, email: a.email, name: a.name } : null,
      created_at: p.created_at || null
    };
  });

  return { reviews, comments };
}

async function getGitStatusFromSnapshotCompare(projectId, deliveryId, organizationId) {
  if (!projectId || !deliveryId) {
    return { ok: false, hasSnapshot: false, modified: [], added: [], deleted: [], extra: [], raw: null };
  }
  const cmp = await deliveryWorkspaceService.compareSnapshotWithCurrent(projectId, deliveryId, organizationId).catch(() => null);
  if (!cmp) return { ok: false, hasSnapshot: false, modified: [], added: [], deleted: [], extra: [], raw: null };

  const modified = Array.isArray(cmp.modified) ? cmp.modified : [];
  const missing = Array.isArray(cmp.missing) ? cmp.missing : [];
  const extra = Array.isArray(cmp.extra) ? cmp.extra : [];

  // Interpretación para reporte:
  // - missing: en snapshot pero no en BD actual ⇒ deleted
  // - extra: en BD actual pero no en snapshot ⇒ added/extra
  return {
    ok: true,
    hasSnapshot: true,
    modified,
    deleted: missing.map((p) => ({ path: p })),
    added: extra.map((p) => ({ path: p })),
    extra: extra.map((p) => ({ path: p })),
    raw: cmp
  };
}

function buildRisks(delivery, snapshotCompare) {
  const risks = [];
  const status = delivery && delivery.status ? String(delivery.status).toUpperCase() : "";
  if (status && status !== "READY" && status !== "LOCKED" && status !== "COMMITTED" && status !== "PR_CREATED" && status !== "MERGED") {
    risks.push({ level: "warning", title: "Estado no estándar", detail: `Estado actual: ${status}` });
  }

  const drift =
    snapshotCompare &&
    snapshotCompare.ok &&
    ((snapshotCompare.modified && snapshotCompare.modified.length) ||
      (snapshotCompare.deleted && snapshotCompare.deleted.length) ||
      (snapshotCompare.added && snapshotCompare.added.length));

  if (drift) {
    risks.push({
      level: "critical",
      title: "SNAPSHOT_DRIFT detectado",
      detail: "El snapshot no coincide con el estado actual de la entrega. Bloqueará preview/commit hasta re-sincronizar."
    });
  }

  if (status === "LOCKED") {
    risks.push({
      level: "info",
      title: "Entrega LOCKED",
      detail: "No se permite modificar archivos ni sync-from-git; solo commit con el contenido actual."
    });
  }

  return risks;
}

async function getExecutiveData({ projectId, deliveryId, organizationId }) {
  if (!organizationId) {
    throw new AppError("organizationId es obligatorio (tenant)", { statusCode: 400, code: "VALIDATION_ERROR" });
  }

  const delivery = await resolveDelivery({ projectId, deliveryId, organizationId });
  const chain = await resolveChain(delivery, organizationId);
  const releaseCounts = await computeReleaseCounts(chain.release, organizationId);
  const snapshotSummary = delivery ? snapshotSummaryFromDelivery(delivery) : { hasSnapshot: false, total_files: 0, large_files_count: 0, hash_count: 0 };

  const effectiveProjectId = projectId || (delivery && delivery.project_id) || null;
  const effectiveDeliveryId = (delivery && delivery.id) || null;

  const recentCommits = await getRecentCommits(effectiveProjectId, effectiveDeliveryId, organizationId);
  const gitStatus = await getGitStatusFromSnapshotCompare(effectiveProjectId, effectiveDeliveryId, organizationId);
  const reviews = await getReviewsAndComments(effectiveProjectId, effectiveDeliveryId, organizationId);
  const risks = buildRisks(delivery, gitStatus);

  return {
    scope: { projectId: effectiveProjectId, deliveryId: effectiveDeliveryId },
    chain,
    executiveSummary: {
      releaseName: chain.release ? (chain.release.name || chain.release.version || chain.release.id) : null,
      deliveryStatus: delivery ? delivery.status : null,
      featuresCount: releaseCounts.featuresCount,
      storiesCount: releaseCounts.storiesCount
    },
    snapshotSummary,
    recentCommits,
    gitStatus,
    risks,
    reviews
  };
}

module.exports = {
  getExecutiveData,
  resolveChain,
  computeReleaseCounts
};

