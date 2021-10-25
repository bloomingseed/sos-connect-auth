var express = require("express");
var db = require("../models");
var crypto = require("crypto");
var config = require("../config");
var { getAuthToken, authUserMiddleware } = require("../helpers");
var jwt = require("jsonwebtoken");

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
    const ERR_CODE = { production: 23505, development: 1062 };
    const ENV_TYPE = config.NODE_ENV || config.env;
    if (
      (ENV_TYPE === "production" && ERR_CODE[ENV_TYPE] === e.code) ||
      (ENV_TYPE === "development" && ERR_CODE[ENV_TYPE] === e.errno)
    ) {
      return res
        .status(400)
        .json({ error: `Username ${username} has already existed` });
    }
    return res.status(500).json({ error: e });
  }
}
async function getInfoHandler(req, res) {
  let { username } = await jwt.verify(
    getAuthToken(req),
    config.ACCESS_TOKEN_SECRET
  );
  let user = await db.Accounts.findByPk(username);
  res.status(200).json({ username, date_created: user.date_created });
}

// register, insert {username, password_hash} to db: POST /accounts
accountsRouter.route("/").post(registerHandler);
accountsRouter.route("/:username").get(authUserMiddleware, getInfoHandler);

module.exports = { router: accountsRouter, name: "accounts" };
