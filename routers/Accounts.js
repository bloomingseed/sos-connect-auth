var express = require("express");
var db = require("../models");
var crypto = require("crypto");
var { authUserMiddleware } = require("../helpers");
const DUP_KEY_ERRCODE = "23505";

var accountsRouter = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *    "User Info":
 *      description: Public user information.
 *      type: object
 *      properties:
 *        username:
 *          type: string
 *        date_created:
 *          type: string
 *          format: date-time
 *        is_admin:
 *          type: boolean
 *      example:
 *        username: bloomingseed
 *        date_created: 2021-11-02T18:39:32.758Z
 *        is_admin: true
 */
function createUserInfo(user) {
  return {
    username: user.username,
    date_created: user.date_created,
    is_admin: user.is_admin,
  };
}

/**
 * @swagger
 * tags:
 *  name: Accounts
 *  description: Account related APIs
 */
function hash(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("base64");
}

async function getUser(username, res) {
  let user = await db.Accounts.findByPk(username);
  if (user == null) {
    return res
      .status(401)
      .json({ error: `Username ${username} does not exist` });
  }
  return user;
}

async function registerCreationHandler(req, res) {
  let user = req.user;
  try {
    await user.save();
    res.status(201).json(createUserInfo(user));
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
    return;
  }
  if (sender.is_admin == false) {
    return res
      .status(403)
      .json({ error: `Only admins can register admin accounts` });
  }
  let user = new db.Accounts({
    username: req.body.username,
    password_hash: hash(req.body.password),
    is_admin: true,
    date_created: new Date(),
  });
  req.user = user;
  return await registerCreationHandler(req, res);
}

/**
 * @swagger
 * /register:
 *  post:
 *    summary: Register an account
 *    tags:
 *      - Accounts
 *    security:
 *      - bearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              username:
 *                type: string
 *                required: true
 *              password:
 *                type: string
 *                required: true
 *              password_confirmation:
 *                type: string
 *                required: true
 *              is_admin:
 *                type: boolean
 *            example:
 *              username: user123
 *              password: PKEgIMk123jrcbJ
 *              password_confirmation: PKEgIMk123jrcbJ
 *              is_admin: false
 *    responses:
 *      201:
 *        description: Account registered
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/User Info"
 *      400:
 *        description: Register info is invalid. See returned error message for details.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/Response Error"
 *      401:
 *        description: Failed to authenticate admin.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/Response Error"
 *      403:
 *        description: Action forbidden. Only admins can register admin accounts
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/Response Error"
 *      500:
 *        description: Account failed to register due to server error
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/Response Error"
 */
async function registerHandler(req, res) {
  let { username, password, password_confirmation, is_admin } = req.body;
  if (!username || !password || !password_confirmation) {
    return res.status(400).json({
      error: `Either username, password or password_confirmation is missing`,
    });
  }
  if (password != password_confirmation) {
    return res
      .status(400)
      .json({ error: `Password confirmation does not match` });
  }
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
/**
 * @swagger
 * /accounts/{username}:
 *  get:
 *    summary: Get register info of a specific user, including username, date created, and role
 *    tags:
 *      - Accounts
 *    parameters:
 *      - name: username
 *        in: path
 *        required: true
 *        description: The username of the user of which to get account info
 *        schema:
 *          type: string
 *          example: bloomingseed
 *    responses:
 *      200:
 *        description: Returns register info
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/User Info"
 *      404:
 *        description: User not found
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 *                  example: "Could not find user with username {username}"
 */
async function getInfoHandler(req, res) {
  let username = req.params.username;
  let user = await db.Accounts.findByPk(username);
  if (!user) {
    res.status(404).json({
      error: `Could not find user with username ${username}`,
    });
    return;
  }
  res.status(200).json(createUserInfo(user));
}

// register, insert {username, password_hash} to db: POST /accounts
accountsRouter.route("/:username").get(getInfoHandler);

module.exports = { router: accountsRouter, name: "accounts", registerHandler };
