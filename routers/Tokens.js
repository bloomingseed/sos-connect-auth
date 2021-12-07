var config = require("../config");
var express = require("express");
var db = require("../models");
var crypto = require("crypto");
var jwt = require("jsonwebtoken");
var { getAuthToken } = require("../helpers");
var EXPIRES_IN = config.EXPIRES_IN || "10m";
var tokensRouter = express.Router();

/**
 * @swagger
 * tags:
 *  - name: Tokens
 *    description: Authentication token related APIs
 */

function hash(pwd) {
  return crypto.createHash("sha256").update(pwd.toString()).digest("base64");
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
    accessToken: signToken({ username, is_admin: user.is_admin }),
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

/**
 * @swagger
 * /login:
 *  post:
 *    summary: Password login and get authentication token
 *    tags:
 *      - Tokens
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            description: The request body schema for /login.
 *            type: object
 *            properties:
 *              username:
 *                type: string
 *                required: true
 *              password:
 *                type: string
 *                required: true
 *    responses:
 *      200:
 *        description: Login successfully
 *        content:
 *          application/json:
 *            schema:
 *              description: The response body schema for /login if logged in successfully.
 *              type: object
 *              properties:
 *                accessToken:
 *                  type: string
 *                refreshToken:
 *                  type: string
 *              example:
 *                accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImJsb29taW5nc2VlZCIsImlzX2FkbWluIjp0cnVlLCJpYXQiOjE2Mzg2MjY5OTgsImV4cCI6MTYzODYyNzg5OH0.P8XWAt2SvwxCJZFlt0S3gVS2taHM7dCPKPN2nDMtxH8
 *                refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImJsb29taW5nc2VlZCIsImlhdCI6MTYzNTg4MDk0NH0.y4Gcjp3njdEQGHICWp_iqczLkaDJHy7WftAAQeThppw
 *      400:
 *        description: Login failed. Wrong username or password.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 *              example:
 *                error: Account does not exist or password is incorrect
 */
async function loginHandler(req, res) {
  let { username, password } = req.body;
  let { status, payload } = await authenticate(username, password);
  res.status(status).json(payload);
}

/**
 * @swagger
 * /logout:
 *  get:
 *    summary: Prevents refresh token, force password login next time.
 *    tags:
 *      - Tokens
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      200:
 *        description: Logout successfully
 *      400:
 *        description: Can not log out because user not logged in.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 *              example:
 *                error: User have not logged in
 *      401:
 *        description: Unauthorized. Logging out need authorization.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/Response Error Unauthorized"
 *
 */
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

/**
 * @swagger
 * /tokens/{username}:
 *  put:
 *    summary: Retrieve new access token from a refresh token
 *    tags:
 *      - Tokens
 *    parameters:
 *      - name: username
 *        in: path
 *        required: true
 *        description: The username of the account to refresh the token
 *        schema:
 *          type: string
 *          example: seeding.user.1
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              refreshToken:
 *                type: string
 *                example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InNlZWRpbmcudXNlci4xIiwiaWF0IjoxNjM1OTM3MDE4fQ.s8aNQGg5iGEKH7nwgzAn4yhD67t3JCVaHYJWdBGrC1I
 *    responses:
 *      200:
 *        description: New access token created successfully
 *        content:
 *          application/json:
 *            schema:
 *              description: The response body schema for /refresh/{username} if refreshed the token successfully.
 *              type: object
 *              properties:
 *                accessToken:
 *                  type: string
 *              example:
 *                accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImJsb29taW5nc2VlZCIsImlzX2FkbWluIjp0cnVlLCJpYXQiOjE2Mzg2MjY5OTgsImV4cCI6MTYzODYyNzg5OH0.P8XWAt2SvwxCJZFlt0S3gVS2taHM7dCPKPN2nDMtxH8
 *      400:
 *        description: Failed to refresh token.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 *              example:
 *                error: User {username} does not exist, has logged out or the refresh token is invalid
 *
 */
async function refreshTokenHandler(req, res) {
  let username = req.params.username;
  let refreshToken = req.body.refreshToken;
  let loggedInUser = await getLoggedInUser(username, refreshToken);
  if (loggedInUser == null) {
    return res.status(400).json({
      error: `User ${username} does not exist, has logged out or the refresh token is invalid`,
    });
  }
  let accessToken = signToken({ username });
  res.status(200).json({ accessToken });
}

// login, create access token: POST /tokens/{username}
// logout, remove {username, refresh token} from TOKENS table: DELETE /tokens/{username}
tokensRouter.route("/:username").put(refreshTokenHandler);

module.exports = {
  router: tokensRouter,
  name: "tokens",
  loginHandler,
  logoutHandler,
};
