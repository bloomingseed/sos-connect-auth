const cors = require("cors");
const express = require("express");
const config = require("./config");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const app = express();
const PORT = config.PORT;
const routers = require("./routers");
var { authUserMiddleware } = require("./helpers");
var { loginHandler, logoutHandler } = require("./routers/Tokens");
var { registerHandler } = require("./routers/Accounts");
const apiSpec = swaggerJsDoc(require("./config/swagger"));

app.use(cors());
app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(apiSpec));
console.log(routers);
routers.forEach((router) => app.use(`/${router.name}`, router.router));
app.post("/login", loginHandler);
app.post("/register", registerHandler);
app.get("/logout", authUserMiddleware, logoutHandler);

app.listen(PORT, () => {
  console.log(`Example app listening at port: ${PORT}`);
});
