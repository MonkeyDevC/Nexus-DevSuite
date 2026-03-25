const { AsyncLocalStorage } = require("async_hooks");

const githubRequestAls = new AsyncLocalStorage();

/**
 * Store opcional por request: memoización de getGithubConfigResolutionAsync y logs deduplicados.
 * Si no hay middleware que ejecute `runWithGithubRequestStore`, devuelve undefined.
 */
function getGithubRequestStore() {
  return githubRequestAls.getStore();
}

/**
 * @param {object} store
 * @param {() => any} fn
 */
function runWithGithubRequestStore(store, fn) {
  return githubRequestAls.run(store, fn);
}

module.exports = {
  getGithubRequestStore,
  runWithGithubRequestStore
};
