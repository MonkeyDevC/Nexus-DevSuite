/**
 * GitHub Integration — Controller para rutas /projects/:projectId/repository
 * Delega en github.service y actualiza Code Deliveries cuando corresponde.
 */

const https = require("https");
const githubService = require("./github.service");
const githubConnectionRepository = require("./githubConnection.repository");
const codeDeliveryService = require("../code-deliveries/codeDelivery.service");
const codeDeliveryRepository = require("../code-deliveries/codeDelivery.repository");
const projectsRepository = require("../backlog/projects.repository");
const featureService = require("../backlog/feature.service");
const logger = require("../../config/logger");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { assertRequestValid } = require("../../shared/utils/controllerUtils");

async function ensureProject(projectId, organizationId) {
  const project = await projectsRepository.findById(projectId);
  if (!project) {
    const err = new Error("Proyecto no encontrado");
    err.statusCode = 404;
    throw err;
  }
  featureService.ensureProjectInOrg(project, organizationId);
  return project;
}

async function getBranchesController(req, res, next) {
  try {
    assertRequestValid(req);
    await ensureProject(req.params.projectId, req.organizationId);
    const userId = req.user && req.user.id;
    const branches = await githubService.getBranches(req.params.projectId, userId);
    const list = branches.map((b) => ({
      name: b.name,
      commit_sha: b.commit?.sha,
      protected: b.protected
    }));
    res.status(200).json(buildSuccess({ branches: list }, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getPullRequestsController(req, res, next) {
  try {
    assertRequestValid(req);
    await ensureProject(req.params.projectId, req.organizationId);
    const state = (req.query.state || "open").toLowerCase();
    const userId = req.user && req.user.id;
    const prs = await githubService.getPullRequests(
      state === "all" ? "all" : state === "closed" ? "closed" : "open",
      req.params.projectId,
      userId
    );
    const list = prs.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      head: pr.head?.ref,
      base: pr.base?.ref,
      html_url: pr.html_url,
      user: pr.user?.login,
      created_at: pr.created_at,
      merged_at: pr.merged_at
    }));
    res.status(200).json(buildSuccess({ pull_requests: list }, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function createBranchController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = { user: req.user, requestId: req.requestId, organizationId: req.organizationId };
    await ensureProject(req.params.projectId, req.organizationId);
    const projectId = req.params.projectId;
    let baseBranch = req.body.base_branch;
    let newBranch = req.body.new_branch;
    const deliveryId = req.body.delivery_id;

    if (deliveryId) {
      const delivery = await codeDeliveryRepository.findByIdAndProject(deliveryId, projectId);
      if (!delivery) {
        const err = new Error("Code delivery no encontrada");
        err.statusCode = 404;
        throw err;
      }
      const d = typeof delivery.toJSON === "function" ? delivery.toJSON() : delivery;
      if (!newBranch) newBranch = d.branch_name;
      if (!newBranch) {
        const err = new Error("La entrega no tiene branch_name definido");
        err.statusCode = 400;
        throw err;
      }
    }

    const userId = req.user && req.user.id;
    if (!baseBranch) baseBranch = await githubService.getDefaultBranch(projectId, userId);
    if (!newBranch) {
      const err = new Error("new_branch o delivery_id con branch_name es obligatorio");
      err.statusCode = 400;
      throw err;
    }

    const result = await githubService.createBranch(baseBranch, newBranch, projectId, userId);

    if (deliveryId) {
      await codeDeliveryService.updateCodeDelivery(
        deliveryId,
        projectId,
        { status: "COMMITTED" },
        context
      );
    }

    res.status(201).json(buildSuccess(result, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function createPRController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = { user: req.user, requestId: req.requestId, organizationId: req.organizationId };
    await ensureProject(req.params.projectId, req.organizationId);
    const projectId = req.params.projectId;
    let title = req.body.title;
    let headBranch = req.body.head_branch;
    let baseBranch = req.body.base_branch;
    const bodyText = req.body.body;
    const deliveryId = req.body.delivery_id;

    if (deliveryId) {
      const delivery = await codeDeliveryRepository.findByIdAndProject(deliveryId, projectId);
      if (!delivery) {
        const err = new Error("Code delivery no encontrada");
        err.statusCode = 404;
        throw err;
      }
      const d = typeof delivery.toJSON === "function" ? delivery.toJSON() : delivery;
      if (!headBranch) headBranch = d.branch_name;
      if (!title) title = d.title || "PR " + d.branch_name;
      if (!headBranch) {
        const err = new Error("La entrega no tiene branch_name definido");
        err.statusCode = 400;
        throw err;
      }
    }

    const userId = req.user && req.user.id;
    if (!baseBranch) baseBranch = await githubService.getDefaultBranch(projectId, userId);
    if (!headBranch || !title) {
      const err = new Error("head_branch y title (o delivery_id) son obligatorios");
      err.statusCode = 400;
      throw err;
    }

    const pr = await githubService.createPullRequest(title, headBranch, baseBranch, bodyText, projectId, userId);
    const repoFull = await githubService.getRepoFullName(projectId, userId);
    const pullRequestUrl = pr.html_url || (repoFull ? `https://github.com/${repoFull}/pull/${pr.number}` : null);

    if (deliveryId) {
      await codeDeliveryService.updateCodeDelivery(
        deliveryId,
        projectId,
        { status: "PR_CREATED", pull_request_url: pullRequestUrl },
        context
      );
    }

    res.status(201).json(
      buildSuccess(
        {
          number: pr.number,
          title: pr.title,
          state: pr.state,
          html_url: pullRequestUrl,
          delivery_updated: !!deliveryId
        },
        { request_id: req.requestId || "no-request-id" }
      )
    );
  } catch (e) {
    next(e);
  }
}

async function syncController(req, res, next) {
  try {
    assertRequestValid(req);
    const context = { user: req.user, requestId: req.requestId, organizationId: req.organizationId };
    await ensureProject(req.params.projectId, req.organizationId);
    const projectId = req.params.projectId;
    const deliveryId = req.body.delivery_id;

    if (deliveryId) {
      const delivery = await codeDeliveryRepository.findByIdAndProject(deliveryId, projectId);
      if (!delivery) {
        const err = new Error("Code delivery no encontrada");
        err.statusCode = 404;
        throw err;
      }
      const d = typeof delivery.toJSON === "function" ? delivery.toJSON() : delivery;
      const prUrl = d.pull_request_url;
      if (!prUrl) {
        return res.status(200).json(
          buildSuccess(
            { delivery_id: deliveryId, status: d.status, message: "Sin PR vinculado" },
            { request_id: req.requestId || "no-request-id" }
          )
        );
      }
      const match = prUrl.match(/\/pull\/(\d+)/);
      if (!match) {
        return res.status(200).json(
          buildSuccess(
            { delivery_id: deliveryId, status: d.status, message: "URL de PR no reconocida" },
            { request_id: req.requestId || "no-request-id" }
          )
        );
      }
      const prNumber = parseInt(match[1], 10);
      const userId = req.user && req.user.id;
      const prStatus = await githubService.getPullRequestStatus(prNumber, projectId, userId);
      let newStatus = d.status;
      if (prStatus.merged_at) newStatus = "MERGED";
      else if (prStatus.state === "closed") newStatus = "PR_CREATED";
      else if (prStatus.state === "open") newStatus = "PR_CREATED";
      if (newStatus !== d.status) {
        await codeDeliveryService.updateCodeDelivery(deliveryId, projectId, { status: newStatus }, context);
      }
      return res.status(200).json(
        buildSuccess(
          { delivery_id: deliveryId, pr_number: prNumber, state: prStatus.state, status: newStatus, merged_at: prStatus.merged_at },
          { request_id: req.requestId || "no-request-id" }
        )
      );
    }

    const { listByProject } = require("../code-deliveries/codeDelivery.repository");
    const result = await listByProject(projectId, { limit: 200 });
    const deliveries = result.items || [];
    const withPr = deliveries.filter((d) => d.pull_request_url);
    const synced = [];
    for (const d of withPr) {
      const match = (d.pull_request_url || "").match(/\/pull\/(\d+)/);
      if (!match) continue;
      const prNumber = parseInt(match[1], 10);
      try {
        const userId = req.user && req.user.id;
        const prStatus = await githubService.getPullRequestStatus(prNumber, projectId, userId);
        let newStatus = d.status;
        if (prStatus.merged_at) newStatus = "MERGED";
        if (newStatus !== d.status) {
          await codeDeliveryService.updateCodeDelivery(d.id, projectId, { status: newStatus }, context);
          synced.push({ delivery_id: d.id, pr_number: prNumber, status: newStatus });
        }
      } catch (err) {
        synced.push({ delivery_id: d.id, pr_number: prNumber, error: err.message });
      }
    }

    res.status(200).json(
      buildSuccess(
        { synced, total_checked: withPr.length },
        { request_id: req.requestId || "no-request-id" }
      )
    );
  } catch (e) {
    next(e);
  }
}

async function getGithubConnectionController(req, res, next) {
  try {
    assertRequestValid(req);
    await ensureProject(req.params.projectId, req.organizationId);
    const userId = req.user && req.user.id;
    const status = await githubConnectionRepository.getConnectionStatusByProjectId(req.params.projectId, userId);
    res.status(200).json(buildSuccess(status, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getCommitsController(req, res, next) {
  try {
    assertRequestValid(req);
    await ensureProject(req.params.projectId, req.organizationId);
    const userId = req.user && req.user.id;
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const commits = await githubService.getCommits(req.params.projectId, userId, limit);
    logger.info({ event: "REPOSITORY_COMMITS_LOADED", project_id: req.params.projectId, count: commits.length }, "Repository commits loaded");
    res.status(200).json(buildSuccess(commits, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getContributorsController(req, res, next) {
  try {
    assertRequestValid(req);
    await ensureProject(req.params.projectId, req.organizationId);
    const userId = req.user && req.user.id;
    const contributors = await githubService.getContributors(req.params.projectId, userId);
    logger.info({ event: "REPOSITORY_CONTRIBUTORS_LOADED", project_id: req.params.projectId, count: contributors.length }, "Repository contributors loaded");
    res.status(200).json(buildSuccess(contributors, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

/**
 * Proxy de avatar de GitHub para evitar bloqueos por CORS/CSP en el navegador.
 * GET /projects/:projectId/repository/avatar?userId=262685951
 * Público (sin auth) para que <img src="..."> funcione; solo se valida UUID de projectId y userId numérico.
 */
function getAvatarProxyController(req, res, next) {
  assertRequestValid(req);
  const userId = req.query.userId;
  const avatarUrl = "https://avatars.githubusercontent.com/u/" + userId + "?v=4";
  const parsed = new URL(avatarUrl);
  const opts = {
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    method: "GET",
    headers: { "User-Agent": "Nexus-DevSuite-Avatar-Proxy" }
  };
  https
    .get(opts, (proxyRes) => {
      if (proxyRes.statusCode !== 200) {
        res.status(proxyRes.statusCode === 404 ? 404 : 502).send("Avatar no disponible");
        return;
      }
      const contentType = proxyRes.headers["content-type"] || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      proxyRes.pipe(res);
    })
    .on("error", (err) => {
      logger.warn({ err: err.message, userId }, "Avatar proxy request failed");
      res.status(502).send("No se pudo cargar el avatar");
    });
}

async function getStatsController(req, res, next) {
  try {
    assertRequestValid(req);
    await ensureProject(req.params.projectId, req.organizationId);
    const userId = req.user && req.user.id;
    const projectId = req.params.projectId;
    const [branches, prsOpen, prsClosed, commits, contributors] = await Promise.all([
      githubService.getBranches(projectId, userId),
      githubService.getPullRequests("open", projectId, userId),
      githubService.getPullRequests("closed", projectId, userId),
      githubService.getCommits(projectId, userId, 1),
      githubService.getContributors(projectId, userId)
    ]);
    const lastCommitDate = commits.length && commits[0].date ? commits[0].date : null;
    const stats = {
      branches_count: branches.length,
      pull_requests_open: prsOpen.length,
      pull_requests_closed: prsClosed.length,
      last_commit_date: lastCommitDate,
      contributors_count: contributors.length
    };
    logger.info({ event: "REPOSITORY_INSIGHTS_LOADED", project_id: projectId }, "Repository stats loaded");
    res.status(200).json(buildSuccess(stats, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

async function getActivityController(req, res, next) {
  try {
    assertRequestValid(req);
    await ensureProject(req.params.projectId, req.organizationId);
    const userId = req.user && req.user.id;
    const projectId = req.params.projectId;
    const [commits, prsOpen, prsClosed, deliveriesResult] = await Promise.all([
      githubService.getCommits(projectId, userId, 30),
      githubService.getPullRequests("open", projectId, userId),
      githubService.getPullRequests("closed", projectId, userId),
      codeDeliveryRepository.listByProject(projectId, { limit: 50 })
    ]);
    const deliveries = (deliveriesResult.items || []).map((d) => {
      const row = d.toJSON ? d.toJSON() : d;
      return {
        type: "delivery",
        title: row.title || row.branch_name || "Code delivery",
        status: row.status,
        date: row.updated_at || row.created_at
      };
    });
    const prs = [...prsOpen, ...prsClosed].map((pr) => ({
      type: "pull_request",
      title: pr.title,
      state: pr.state,
      date: pr.created_at || pr.updated_at
    }));
    const activities = [
      ...commits.map((c) => ({ type: "commit", message: c.message, author: c.author, date: c.date })),
      ...prs.map((p) => ({ type: "pull_request", title: p.title, state: p.state, date: p.date })),
      ...deliveries.map((d) => ({ type: "delivery", title: d.title, status: d.status, date: d.date }))
    ].filter((a) => a.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
    logger.info({ event: "REPOSITORY_ACTIVITY_LOADED", project_id: projectId, count: activities.length }, "Repository activity loaded");
    res.status(200).json(buildSuccess(activities, { request_id: req.requestId || "no-request-id" }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getBranchesController,
  getPullRequestsController,
  createBranchController,
  createPRController,
  syncController,
  getGithubConnectionController,
  getCommitsController,
  getContributorsController,
  getAvatarProxyController,
  getStatsController,
  getActivityController
};
