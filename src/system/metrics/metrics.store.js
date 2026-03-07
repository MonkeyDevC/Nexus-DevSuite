const counters = {
  total_requests: 0,
  total_errors: 0,
  auth_failures: 0,
  refresh_failures: 0
};

function incrementCounter(counterName, value = 1) {
  if (!Object.prototype.hasOwnProperty.call(counters, counterName)) {
    return;
  }

  counters[counterName] += value;
}

function getMetricsSnapshot() {
  return {
    ...counters,
    scope: "instance"
  };
}

module.exports = {
  incrementCounter,
  getMetricsSnapshot
};
