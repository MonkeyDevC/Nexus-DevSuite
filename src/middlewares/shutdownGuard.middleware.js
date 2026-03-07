/**
 * -------------------------------------------------------------
 * Módulo: Shutdown guard
 * Descripción: Rechaza nuevas requests con 503 durante cierre ordenado.
 * -------------------------------------------------------------
 */

const { getIsShuttingDown } = require("../shared/shutdownState");
const { buildError } = require("../shared/responses/responseLayer");
const { ERROR_CODES } = require("../shared/errors/errorCodes");

function shutdownGuardMiddleware(req, res, next) {
  if (!getIsShuttingDown()) {
    return next();
  }

  const requestId = req.requestId || "no-request-id";
  const { body } = buildError({
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: "Servidor en cierre. Intente nuevamente mas tarde.",
    statusCode: 503,
    requestId
  });

  res.status(503).json(body);
}

module.exports = {
  shutdownGuardMiddleware
};
