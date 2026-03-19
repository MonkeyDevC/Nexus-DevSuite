/**
 * Módulo Tasks - Rutas bajo /api/v1/projects/:projectId/tasks
 * Aislamiento: projectId obligatorio en todas las rutas.
 * Crear task: POST / body user_story_id. Listar por story: GET /?user_story_id=...
 */

const express = require("express");
const {
  createTaskController,
  getTaskController,
  listTasksController,
  updateTaskController
} = require("./task.controller");
const {
  projectIdParamValidator,
  taskIdParamValidator,
  createTaskValidator,
  updateTaskValidator,
  listTasksQueryValidator
} = require("./task.validator");
const { authenticateMiddleware } = require("../../middlewares/authenticate.middleware");
const { authorizeMiddleware } = require("../../middlewares/authorize.middleware");

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  listTasksQueryValidator,
  listTasksController
);

router.post(
  "/",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  createTaskValidator,
  createTaskController
);

router.get(
  "/:taskId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  taskIdParamValidator,
  getTaskController
);

router.patch(
  "/:taskId",
  authenticateMiddleware,
  authorizeMiddleware("MASTER", "EMPLOYEE"),
  projectIdParamValidator,
  taskIdParamValidator,
  updateTaskValidator,
  updateTaskController
);

module.exports = router;
