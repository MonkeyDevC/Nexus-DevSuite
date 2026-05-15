/**
 * Navegación global por código humano (PR/FT/US).
 */

const { buildSuccess } = require("../../shared/responses/responseLayer");
const workspaceNavService = require("./workspaceNav.service");

async function getResolveHumanWorkItemCodeController(req, res, next) {
  try {
    const q = req.query.q != null ? String(req.query.q) : "";
    const data = await workspaceNavService.resolveHumanWorkItemCode(req.organizationId, q);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getResolveHumanWorkItemCodeController
};
