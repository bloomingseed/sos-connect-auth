const db = require("../models");
const Accounts = db.Accounts;
const Tokens = db.Tokens;

/**
 * new Accounts(values) -> save();
 * Accounts.create(values) = new + save
 */
async function createAccount() {
  try {
    let admin = new Accounts({
      username: "nhattungnguyen.2kgl@gmail.com",
      password_hash: "",
    });
    console.log(admin);
    await admin.save();
  } catch (e) {
    console.log("ERROR getAccounts", e.errors || e);
  }
}
async function createToken() {
  try {
    let token = new Tokens({
      username: "who is it?",
      refresh_token: "",
    });
    console.log(token);
    await token.save();
    console.log(token);
  } catch (e) {
    console.log("ERROR getAccounts", e.errors || e);
  }
  try {
    let token = new Tokens({
      username: "nhattungnguyen.2kgl@gmail.com",
      refresh_token: "cookies?",
    });
    console.log(token);
    await token.save();
    console.log(token);
  } catch (e) {
    console.log("ERROR getAccounts", e.errors || e);
  }
}
/**
 * findAll() will return an array. No options means select all, with options will depend. (https://sequelize.org/master/class/lib/model.js~Model.html#static-method-findAll)
 */
async function getAccounts() {
  try {
    let accounts = await Accounts.findAll();
    console.log(`There are ${accounts.length} accounts.`, accounts);
  } catch (e) {
    console.log("ERROR getAccounts", e.errors || e);
  }
}
async function getTokens() {
  try {
    let tokens = await Tokens.findAll();
    console.log(`There are ${tokens.length} tokens.`, tokens);
  } catch (e) {
    console.log("ERROR getAccounts", e.errors || e);
  }
}
/**
 * Find account by PK -> getTokens() returns an array (or empty array) if the association is many, otherwise an object (or null)
 */
async function getAccountToken() {
  let admin = await Accounts.findByPk("nhattungnguyen.2kgl@gmail.com");
  let adminToken = await admin.getTokens();
  console.log(
    `${admin.username} has ${adminToken ? 1 : 0} tokens.`,
    adminToken
  );
  admin = await Accounts.findByPk("bloomingseed");
  adminToken = admin ? await admin.getTokens() : null;
  console.log(
    `${admin ? admin.username : admin} has ${adminToken ? 1 : 0} tokens.`,
    adminToken
  );
}
/**
 * Find account by PK -> setter -> save
 */
async function updateAccount() {
  try {
    let admin = await Accounts.findByPk("nhattungnguyen.2kgl@gmail.com");
    console.log(admin.password_hash);
    admin.password_hash = "i have new password hash!" + Math.random();
    await admin.save();
    console.log(admin.password_hash);
  } catch (e) {
    console.log("ERROR getAccounts", e.errors || e);
  }
}
/**
 * Find account by PK -> destroy
 */
async function removeAccount() {
  try {
    let admin = await Accounts.findByPk("bloomingseed");
    await admin.destroy();
    await getAccounts();
  } catch (e) {
    console.log("ERROR getAccounts", e.errors || e);
  }
}
async function removeToken() {
  try {
    let token = await Tokens.findByPk("nhattungnguyen.2kgl@gmail.com");
    await token.destroy();
  } catch (e) {
    console.log("ERROR getAccounts", e.errors || e);
  }
}

async function test() {
  await createAccount();
  await createToken();
  await getAccounts();
  await getTokens();
  await getAccountToken();
  await updateAccount();
  await removeAccount();
  await removeToken();
  console.log("TEST DONE");
}

test();
