const express = require("express");
const { buildFeatureDisabledResponse } = require("../../config/optionalModules");

const router = express.Router();

router.get("/health", (req, res) => {
  void req;
  const result = buildFeatureDisabledResponse("workflow-intelligence", {
    status: "disabled",
    checks: []
  });
  if (!result.available) {
    return res.status(400).json(result);
  }
  return res.status(200).json({
    success: true,
    data: result
  });
});

module.exports = router;
