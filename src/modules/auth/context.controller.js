const { buildSuccess } = require("../../shared/responses/responseLayer");

function meController(req, res) {
  const requestId = req.requestId || "no-request-id";
  const data = {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
    name: req.user.name || null,
    profile_photo_url: req.user.profile_photo_url || null
  };
  res.status(200).json(buildSuccess(data, { request_id: requestId }));
}

function adminTestController(req, res) {
  const requestId = req.requestId || "no-request-id";
  const data = {
    status: "ok",
    message: "MASTER access granted"
  };
  res.status(200).json(buildSuccess(data, { request_id: requestId }));
}

module.exports = {
  meController,
  adminTestController
};
