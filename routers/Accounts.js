var express = require("express");
var db = require("../models");
var crypto = require("crypto");
var { authUserMiddleware } = require("../helpers");
const DUP_KEY_ERRCODE = "23505";

var accountsRouter = express.Router();

function hash(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("base64");
}

async function getUser(username, res) {
  let user = await db.Accounts.findByPk(username);
  if (user == null) {
    return res
      .status(400)
      .json({ error: `Username ${username} does not exist` });
  }
  return user;
}

async function registerCreationHandler(req, res) {
  let user = req.user;
  try {
    await user.save();
    res.sendStatus(200);
  } catch (e) {
    e = e.parent;
    if (e.code == DUP_KEY_ERRCODE) {
      return res
        .status(400)
        .json({ error: `Username ${user.username} has already existed` });
    }
    return res.status(500).json({ error: e });
  }
}
async function registerAdminHandler(req, res) {
  let username = req.verifyResult.username;
  let sender = await getUser(username);
  if (sender == null) {
    return res.status(400).json({ error: `Username ${username} not found` });
  }
  if (sender.is_admin == false) {
    return res
      .status(401)
      .json({ error: `Only admins can register admin accounts` });
  }
  let user = new db.Accounts({
    username: req.body.username,
    password_hash: hash(req.body.password),
    date_created: new Date(),
  });
  req.user = user;
  return await registerCreationHandler(req, res);
}

async function registerHandler(req, res) {
  let { username, password, is_admin } = req.body;
  if (is_admin === true) {
    authUserMiddleware(req, res, () => {});
    return await registerAdminHandler(req, res);
  }
  let user = new db.Accounts({
    username,
    password_hash: hash(password),
    date_created: new Date(),
  });
  req.user = user;
  registerCreationHandler(req, res);
}
async function getInfoHandler(req, res) {
  let username = req.verifyResult.username;
  let user = await db.Accounts.findByPk(username);
  res.status(200).json({
    username,
    date_created: user.date_created,
    is_admin: user.is_admin,
  });
}

// register, insert {username, password_hash} to db: POST /accounts
accountsRouter.route("/").post(registerHandler);
accountsRouter.route("/:username").get(authUserMiddleware, getInfoHandler);

module.exports = { router: accountsRouter, name: "accounts" };
