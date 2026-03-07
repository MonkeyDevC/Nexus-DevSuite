/**
 * -------------------------------------------------------------
 * Módulo: Response version header
 * Descripción: Incluye X-Response-Version: 1 en todas las respuestas (Response Layer v1).
 * -------------------------------------------------------------
 */

function responseVersionMiddleware(req, res, next) {
  res.setHeader("X-Response-Version", "1");
  next();
}

module.exports = {
  responseVersionMiddleware
};
