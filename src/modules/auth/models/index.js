const defineUserModel = require("./user.model");
const defineRoleModel = require("./role.model");
const defineRefreshTokenModel = require("./refreshToken.model");
const defineAuditLogModel = require("./auditLog.model");

function defineAuthModels(sequelize) {
  const Role = defineRoleModel(sequelize);
  const User = defineUserModel(sequelize);
  const RefreshToken = defineRefreshTokenModel(sequelize);
  const AuditLog = defineAuditLogModel(sequelize);

  return {
    Role,
    User,
    RefreshToken,
    AuditLog
  };
}

module.exports = defineAuthModels;
