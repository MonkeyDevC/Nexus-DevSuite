/**
 * Fachada interna para módulos que necesitan cliente/config sin pasar por la capability HTTP.
 */
const githubService = require("../github.service");

module.exports = {
  getConfigAsync: githubService.getConfigAsync,
  createClient: githubService.createClient
};
