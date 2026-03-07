const { AppError } = require("../shared/errors/AppError");
const { ERROR_CODES } = require("../shared/errors/errorCodes");

function notFoundMiddleware(req, res, next) {
  next(
    new AppError("Recurso no encontrado", {
      statusCode: 404,
      code: ERROR_CODES.NOT_FOUND
    })
  );
}

module.exports = {
  notFoundMiddleware
};
