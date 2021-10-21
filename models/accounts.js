const createModel = (sequelize, DataTypes) => {
  const Accounts = sequelize.define('Accounts', {
    username: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    password_hash: {
      type: DataTypes.STRING
    },
    date_created: DataTypes.DATE,
  }, {
    timestamps:true,
    createdAt: "date_created",
    updatedAt: false
  })
  Accounts.associate = function (models) {
    Accounts.hasOne(models.Tokens, { foreignKey: 'username', as: 'tokens' })
  }
  return Accounts
}
module.exports = createModel