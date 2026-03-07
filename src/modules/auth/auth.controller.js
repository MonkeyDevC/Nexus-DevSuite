const authService = require("./auth.service");
const { buildSuccess } = require("../../shared/responses/responseLayer");
const { buildContext, assertRequestValid } = require("../../shared/utils/controllerUtils");

async function loginController(req, res, next) {
  try {
    assertRequestValid(req);

    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
      context: buildContext(req)
    });

    const requestId = req.requestId || "no-request-id";
    res.status(200).json(buildSuccess(result, { request_id: requestId }));
  } catch (error) {
    next(error);
  }
}

async function refreshController(req, res, next) {
  try {
    assertRequestValid(req);

    const result = await authService.refresh({
      refreshToken: req.body.refresh_token,
      context: buildContext(req)
    });

    const requestId = req.requestId || "no-request-id";
    res.status(200).json(buildSuccess(result, { request_id: requestId }));
  } catch (error) {
    next(error);
  }
}

async function logoutController(req, res, next) {
  try {
    assertRequestValid(req);

    await authService.logout({
      refreshToken: req.body.refresh_token,
      context: buildContext(req)
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  loginController,
  refreshController,
  logoutController
};
