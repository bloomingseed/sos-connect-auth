'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Accounts', {
      username: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      password_hash: {
        allowNull: false,
        type: Sequelize.STRING
      },
      is_admin:{
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
      date_created: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.createTable('Tokens', {
      username: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING,
        references:{
          model:'Accounts',
          key:'username'
        }
      },
      refresh_token: {
        allowNull: false,
        type: Sequelize.STRING
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Tokens');
    await queryInterface.dropTable('Accounts');
  }
};
