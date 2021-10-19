const express = require("express");
const config = require("./config");
const app = express();
const port = config.PORT || 3000;
const routers = require("./routers");

app.use(express.json());
console.log(routers);
routers.forEach((router) => app.use(`/${router.name}`, router.router));

app.listen(port, () => {
  console.log(`Example app listening at port: ${port}`);
});
