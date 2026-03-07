const { ERROR_CODES } = require("./errorCodes");

class AppError extends Error {
  constructor(
    message,
    {
      statusCode = 500,
      code = ERROR_CODES.INTERNAL_SERVER_ERROR,
      details = null,
      isOperational = true
    } = {}
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
  }
}

module.exports = {
  AppError
};
