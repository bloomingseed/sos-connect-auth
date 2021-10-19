module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      'Accounts',
      [
        {
          username: 'bloomingseed',
          password_hash: '',
          date_created: new Date()
        },
      ], {})
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('People', null, {})
  }
}