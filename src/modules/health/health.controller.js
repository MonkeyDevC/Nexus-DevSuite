const { buildSuccess } = require("../../shared/responses/responseLayer");

function healthController(req, res) {
  const requestId = req.requestId || "no-request-id";
  const data = {
    status: "ok",
    timestamp_utc: new Date().toISOString(),
    request_id: requestId
  };
  res.status(200).json(buildSuccess(data, { request_id: requestId }));
}

module.exports = {
  healthController
};
