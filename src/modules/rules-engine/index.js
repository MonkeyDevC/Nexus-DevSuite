const rulesEngineService = require("./rulesEngine.service");
const rulesEngineValidator = require("./rulesEngine.validator");
const { parseRules } = require("./rulesEngine.parser");
const { evaluateRuleset } = require("./rulesEngine.evaluator");

function defineRulesEngineModels(sequelize) {
  void sequelize;
  return {};
}

module.exports = {
  defineRulesEngineModels,
  rulesEngineService,
  rulesEngineValidator,
  parseRules,
  evaluateRuleset
};
