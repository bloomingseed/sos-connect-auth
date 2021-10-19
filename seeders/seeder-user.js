module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      "Accounts",
      [
        {
          username: "bloomingseed",
          password_hash: "jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=",
          date_created: new Date(),
        },
        {
          username: "nvcgooner",
          password_hash: "jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=",
          date_created: new Date(),
        },
      ],
      {}
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Accounts", null, {});
  },
};
