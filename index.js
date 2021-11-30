const cors = require("cors");
const express = require("express");
const config = require("./config");
const app = express();
const port = config.PORT || 3000;
const routers = require("./routers");
var { authUserMiddleware } = require("./helpers");
var { loginHandler, logoutHandler } = require("./routers/Tokens");
var { registerHandler } = require("./routers/Accounts");

app.use(cors());
app.use(express.json());
console.log(routers);
routers.forEach((router) => app.use(`/${router.name}`, router.router));
app.post("/login", loginHandler);
app.post("/register", registerHandler);
app.get("/logout", authUserMiddleware, logoutHandler);

app.listen(port, () => {
  console.log(`Example app listening at port: ${port}`);
});
