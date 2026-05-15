/**
 * Modulo Users - Capa Controller
 * Responsabilidad: recibir request/response HTTP y delegar en service.
 */

const { validationResult } = require("express-validator");
const usersService = require("./users.service");
const { AppError } = require("../../shared/errors/AppError");
const { ERROR_CODES } = require("../../shared/errors/errorCodes");
const { buildSuccess } = require("../../shared/responses/responseLayer");

function assertRequestValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError("Datos de entrada invalidos", {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: errors.array()
    });
  }
}

async function createUserController(req, res, next) {
  try {
    assertRequestValid(req);
    const user = await usersService.createUser(req.body, req.organizationId);
    const requestId = req.requestId || "no-request-id";
    res.status(201).json(buildSuccess(user, { request_id: requestId }));
  } catch (error) {
    next(error);
  }
}

async function getUserByIdController(req, res, next) {
  try {
    assertRequestValid(req);
    const user = await usersService.getUserById(req.params.id, { requester: req.user, organizationId: req.organizationId });
    const requestId = req.requestId || "no-request-id";
    res.status(200).json(buildSuccess(user, { request_id: requestId }));
  } catch (error) {
    next(error);
  }
}

async function listUsersController(req, res, next) {
  try {
    assertRequestValid(req);
    const page = Number.isInteger(req.query.page) ? req.query.page : 1;
    const limit = Number.isInteger(req.query.limit) ? req.query.limit : 10;
    const result = await usersService.listUsers({
      page,
      limit,
      organizationId: req.organizationId,
      filters: {
        email: req.query.email,
        role_id: req.query.role_id,
        is_active: req.query.is_active
      }
    });
    const requestId = req.requestId || "no-request-id";
    res.status(200).json(buildSuccess(result, { request_id: requestId }));
  } catch (error) {
    next(error);
  }
}

async function updateUserController(req, res, next) {
  try {
    assertRequestValid(req);
    const isMaster = req.user && req.user.role === "MASTER";
    const isSelf = req.user && String(req.user.id) === String(req.params.id);
    if (!isMaster && !isSelf) {
      throw new AppError("No tiene permisos para modificar este usuario", {
        statusCode: 403,
        code: ERROR_CODES.AUTH_FORBIDDEN
      });
    }

    let body = req.body && typeof req.body === "object" ? { ...req.body } : {};
    if (!isMaster && isSelf) {
      const allowed = {};
      if (Object.prototype.hasOwnProperty.call(body, "name")) {
        allowed.name = body.name;
      }
      if (Object.prototype.hasOwnProperty.call(body, "profile_photo_url")) {
        allowed.profile_photo_url = body.profile_photo_url;
      }
      if (Object.keys(allowed).length === 0) {
        throw new AppError("Debe enviar al menos name o profile_photo_url", {
          statusCode: 400,
          code: ERROR_CODES.VALIDATION_ERROR
        });
      }
      body = allowed;
    }

    const updatedUser = await usersService.updateUser(req.params.id, body);
    const requestId = req.requestId || "no-request-id";
    res.status(200).json(buildSuccess(updatedUser, { request_id: requestId }));
  } catch (error) {
    next(error);
  }
}

async function softDeleteUserController(req, res, next) {
  try {
    assertRequestValid(req);
    await usersService.softDeleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function changePasswordController(req, res, next) {
  try {
    assertRequestValid(req);
    await usersService.changeUserPassword({
      targetUserId: req.params.id,
      actor: req.user,
      currentPassword: req.body.current_password,
      newPassword: req.body.new_password
    });

    const requestId = req.requestId || "no-request-id";
    res.status(200).json(
      buildSuccess({ message: "Password actualizada correctamente" }, { request_id: requestId })
    );
  } catch (error) {
    next(error);
  }
}

async function uploadPhotoController(req, res, next) {
  try {
    if (!req.file || !req.file.filename) {
      throw new AppError("No se recibio ninguna imagen", {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }
    const isMaster = req.user && req.user.role === "MASTER";
    const isSelf = req.user && req.user.id === req.params.id;
    if (!isMaster && !isSelf) {
      throw new AppError("No tiene permisos para cambiar la foto de este usuario", {
        statusCode: 403,
        code: ERROR_CODES.AUTH_FORBIDDEN
      });
    }
    const profilePhotoUrl = "/uploads/avatars/" + req.file.filename;
    const updatedUser = await usersService.updateUser(req.params.id, { profile_photo_url: profilePhotoUrl });
    const requestId = req.requestId || "no-request-id";
    res.status(200).json(buildSuccess(updatedUser, { request_id: requestId }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUserController,
  getUserByIdController,
  listUsersController,
  updateUserController,
  softDeleteUserController,
  changePasswordController,
  uploadPhotoController
};
