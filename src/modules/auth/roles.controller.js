/**
 * Listar roles (solo MASTER). Usado en el modal de edición de usuario para el desplegable de rol.
 */
const authRepository = require("./auth.repository");
const { buildSuccess } = require("../../shared/responses/responseLayer");

async function listRolesController(req, res, next) {
  try {
    const roles = await authRepository.findAllRoles();
    const data = roles.map((r) => ({ id: r.id, name: r.name }));
    const requestId = req.requestId || "no-request-id";
    res.status(200).json(buildSuccess(data, { request_id: requestId }));
  } catch (error) {
    next(error);
  }
}

module.exports = { listRolesController };
