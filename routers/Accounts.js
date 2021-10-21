var express = require("express");
var db = require("../models");
var crypto = require("crypto");
var accountsRouter = express.Router();

function hash(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("base64");
}

async function registerHandler(req, res) {
  let { username, password } = req.body;
  let passwordHash = hash(password);
  try {
    await db.Accounts.create({
      username,
      password_hash: passwordHash,
      date_created: new Date(),
    });
    res.sendStatus(200);
  } catch (e) {
    e = e.parent;
    const USERNAME_EXISTS_ERR_CODE = "ER_DUP_ENTRY";
    if (e.code === USERNAME_EXISTS_ERR_CODE) {
      return res
        .status(400)
        .json({ error: `Username ${username} has already existed` });
    }
    return res.status(500).json({ error: e });
  }
}

// register, insert {username, password_hash} to db: POST /accounts
accountsRouter.route("/").post(registerHandler);

module.exports = { router: accountsRouter, name: "accounts" };
