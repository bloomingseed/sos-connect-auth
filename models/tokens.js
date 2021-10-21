const createModel = (sequelize, DataTypes) => {
  const Tokens = sequelize.define('Tokens', {
    username: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    refresh_token: DataTypes.STRING
  }, {
    timestamps: false
  })
  Tokens.associate = function (models) {
    Tokens.belongsTo(models.Accounts, { foreignKey: 'username', as: 'accounts' })
  }
  return Tokens
}
module.exports = createModel