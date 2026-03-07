const { randomUUID } = require("crypto");

function requestContextMiddleware(req, res, next) {
  const incomingRequestId = req.headers["x-request-id"];
  const requestId =
    typeof incomingRequestId === "string" && incomingRequestId.trim().length > 0
      ? incomingRequestId
      : randomUUID();

  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
}

module.exports = {
  requestContextMiddleware
};
