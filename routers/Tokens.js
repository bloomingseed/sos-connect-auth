var config = require("../config");
var express = require("express");
var db = require("../models");
var crypto = require("crypto");
var jwt = require("jsonwebtoken");
var EXPIRES_IN = config.EXPIRES_IN || "10m";
var tokensRouter = express.Router();

function hash(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("base64");
}

function signToken(payload, isAccessToken = true) {
  let expiresIn = isAccessToken ? EXPIRES_IN : null;
  let secret = isAccessToken
    ? config.ACCESS_TOKEN_SECRET
    : config.REFRESH_TOKEN_SECRET;
  return jwt.sign(payload, secret, expiresIn ? { expiresIn } : {});
}

async function getLoggedInUser(username, refreshToken = null) {
  if (!refreshToken) {
    return await db.Tokens.findByPk(username);
  }
  let userArray = await db.Tokens.findAll({
    where: { username, refresh_token: refreshToken },
  });
  return userArray.length == 0 ? null : userArray[0];
}

async function authenticate(username, password) {
  let user = await db.Accounts.findByPk(username);
  if (!user) {
    return {
      status: 400,
      payload: { error: "Account does not exist or password is incorrect" },
    };
  }
  let passwordHash = hash(password);
  if (passwordHash != user.password_hash) {
    return {
      status: 400,
      payload: { error: "Account does not exist or password is incorrect" },
    };
  }
  let payload = {
    accessToken: signToken({ username }),
  };
  let loggedInUser = await getLoggedInUser(username);
  if (loggedInUser == null) {
    // checks if user not signed in
    let refreshToken = signToken({ username }, false);
    payload.refreshToken = refreshToken;
    await db.Tokens.create({
      username: username,
      refresh_token: payload.refreshToken,
    });
  } else {
    payload.refreshToken = loggedInUser.refresh_token;
  }
  return {
    status: 200,
    payload: payload,
  };
}
async function loginHandler(req, res) {
  let username = req.params.username;
  let password = req.body.password;
  let { status, payload } = await authenticate(username, password);
  res.status(status).json(payload);
}
function getAuthToken(req) {
  let authHeader = req.get("Authorization");
  return authHeader && authHeader.split(" ")[1];
}
function authUserMiddleware(req, res, next) {
  let accessToken = getAuthToken(req);
  if (accessToken == null) {
    return res.status(401).json({
      error:
        'Request header "Authentication" does not exist or does not contain authentication token.',
    });
  }
  try {
    jwt.verify(accessToken, config.ACCESS_TOKEN_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Access token is invalid" });
  }
  next();
}
async function logoutHandler(req, res) {
  let accessToken = getAuthToken(req);
  let username = jwt.verify(accessToken, config.ACCESS_TOKEN_SECRET).username;
  let loggedInUser = await getLoggedInUser(username);
  if (loggedInUser == null) {
    return res.status(400).json({ error: "User have not logged in" });
  }
  await loggedInUser.destroy(); // deletes from db
  res.sendStatus(200);
}

async function refreshTokenHandler(req, res) {
  let username = req.params.username;
  let refreshToken = req.body.refreshToken;
  let loggedInUser = await getLoggedInUser(username, refreshToken);
  if (loggedInUser == null) {
    return res.status(401).json({ error: `User ${username} not logged in` });
  }
  let accessToken = signToken({ username });
  res.status(200).json({ accessToken });
}

// login, create access token: POST /tokens/{username}
// logout, remove {username, refresh token} from TOKENS table: DELETE /tokens/{username}
tokensRouter
  .route("/:username")
  .post(loginHandler)
  .delete(authUserMiddleware, logoutHandler)
  .put(refreshTokenHandler);

module.exports = { router: tokensRouter, name: "tokens" };
