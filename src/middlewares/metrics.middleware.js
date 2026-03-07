const { incrementCounter } = require("../system/metrics/metrics.store");

function metricsMiddleware(req, res, next) {
  incrementCounter("total_requests");
  next();
}

module.exports = {
  metricsMiddleware
};
