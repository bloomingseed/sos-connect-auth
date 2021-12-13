const config = require("../index");
function getServerUrl() {
  return config.HOSTNAME || `http://localhost:${config.PORT}`;
}
module.exports = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Specification",
      version: "1.0.0",
      description: "The API specification for SOS Connect Auth service.",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    servers: [
      {
        url: getServerUrl(),
      },
    ],
  },
  apis: ["routers/*.js", "config/swagger/*.js"],
};
