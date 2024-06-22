const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Video Hosting Platform API',
      version: '1.0.0',
      description: 'API documentation for the Video Hosting Platform application',
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
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
            },
            password: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
            },
          },
        },
        UserLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
            },
            password: {
              type: 'string',
            },
          },
        },
        UserUpdate: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
            },
          },
        },
        Video: {
          type: 'object',
          required: ['title', 'description'],
          properties: {
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            videoUrl: {
              type: 'string',
            },
            videoFileId: {
              type: 'string',
            },
            date: {
              type: 'string',
              format: 'date-time',
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
  apis: ['./routes/*.js'], // Files containing annotations as above
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
