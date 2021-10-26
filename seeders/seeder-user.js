module.exports = {
  up: async (queryInterface, Sequelize) => {
    let seedings = [];
    for (let i = 0; i < 20; ++i) {
      seedings.push({
        username: `seeding.user.${i + 1}`,
        password_hash: "jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=",
        date_created: new Date(),
      });
    }
    await queryInterface.bulkInsert("Accounts", seedings, {});
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
