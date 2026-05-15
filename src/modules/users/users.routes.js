/**
 * Modulo Users - Capa Routes
 * Responsabilidad: definir endpoints HTTP del modulo users.
 */

const express = require("express");
const {
  createUserController,
  getUserByIdController,
  listUsersController,
  updateUserController,
  softDeleteUserController,
  changePasswordController,
  uploadPhotoController
} = require("./users.controller");
const {
  createUserValidator,
  updateUserValidator,
  listUsersValidator,
  deleteUserValidator,
  changePasswordValidator,
  userIdParamValidator
} = require("./users.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");
const { uploadPhoto } = require("./uploadPhoto.middleware");

const router = express.Router();

router.post("/", authenticateMiddleware, authorizeMiddleware("MASTER"), createUserValidator, createUserController);
router.post(
  "/:id/photo",
  authenticateMiddleware,
  userIdParamValidator,
  uploadPhoto,
  uploadPhotoController
);
router.get(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  listUsersValidator,
  listUsersController
);
router.get(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  userIdParamValidator,
  getUserByIdController
);
router.put(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  updateUserValidator,
  updateUserController
);
router.delete(
  "/:id",
  authenticateMiddleware,
  authorizeMiddleware("MASTER"),
  deleteUserValidator,
  softDeleteUserController
);
router.patch("/:id/password", authenticateMiddleware, changePasswordValidator, changePasswordController);

module.exports = router;
