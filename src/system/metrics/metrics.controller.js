const { getMetricsSnapshot } = require("./metrics.store");
const { buildSuccess } = require("../../shared/responses/responseLayer");

function getMetricsController(req, res) {
  const requestId = req.requestId || "no-request-id";
  const data = getMetricsSnapshot();
  res.status(200).json(buildSuccess(data, { request_id: requestId }));
}

module.exports = {
  getMetricsController
};
