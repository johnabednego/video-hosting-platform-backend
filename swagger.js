const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Asset Tracking API",
      version: "1.0.0",
      description: "API documentation for the Asset Tracking application",
    },
    servers: [
      {
        url: 'http://localhost:5000', // Change this to your local URL
      },
      {
        url: 'https://videohostingplatform.vercel.app', // Change this to your deployed URL
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["firstName", "lastName", "email", "password", "country", "city", "role"],
          properties: {
            firstName: {
              type: "string",
            },
            lastName: {
              type: "string",
            },
            email: {
              type: "string",
            },
            password: {
              type: "string",
            },
            country: {
              type: "string",
            },
            city: {
              type: "string",
            },
            role: {
              type: "string",
              enum: ["admin", "user"],
              default: "user"
            },
          },
        },
        UserLogin: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
            },
            password: {
              type: "string",
            },
          },
        },
        UserUpdate: {
          type: "object",
          properties: {
            name: {
              type: "string",
            },
            email: {
              type: "string",
            },
            role: {
              type: "string",
              enum: ["admin", "user"],
            },
          },
        },
        Video: {
          type: "object",
          required: ["title", "description"],
          properties: {
            title: {
              type: "string",
            },
            description: {
              type: "string",
            },
            videoUrl: {
              type: "string",
            },
            videoFileId: {
              type: "string",
            },
            date: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Files containing annotations as above
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
