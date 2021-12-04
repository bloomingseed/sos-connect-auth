module.exports = {
  up: async (queryInterface, Sequelize) => {
    let seedings = [];
    for (let i = 0; i < 20; ++i) {
      seedings.push({
        username: `seeding.user.${i + 1}`,
        password_hash: "jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=",
        date_created: new Date(),
      });
    }
    await queryInterface.bulkInsert("Accounts", seedings, {});
    return queryInterface.bulkInsert(
      "Accounts",
      [
        {
          username: "bloomingseed",
          password_hash: "jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=",
          is_admin: true,
          date_created: new Date(),
        },
        {
          username: "nvcgooner",
          password_hash: "jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI=",
          is_admin: true,
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
