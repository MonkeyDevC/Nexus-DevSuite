/**
 * Módulo Organizations - Controller
 * GET current, GET :id, PATCH :id. Respuestas con buildSuccess.
 */

const organizationService = require("./organization.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { assertRequestValid } = require("../../shared/utils/controllerUtils");

async function getCurrentController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await organizationService.getCurrent(req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function getByIdController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await organizationService.getById(req.params.id, req.organizationId);
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

async function patchController(req, res, next) {
  try {
    assertRequestValid(req);
    const data = await organizationService.updateOrganization(
      req.params.id,
      req.body,
      req.organizationId
    );
    res.status(200).json(buildSuccess(data, { request_id: req.requestId }));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getCurrentController,
  getByIdController,
  patchController
};
