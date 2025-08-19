import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HALO Social Media API',
      version: '1.0.0',
      description: 'A comprehensive social media platform API with real-time features',
      contact: {
        name: 'HALO Team',
        email: 'support@halo.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.halo.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            displayName: { type: 'string' },
            bio: { type: 'string' },
            profilePicture: { type: 'string', format: 'uri' },
            coverPhoto: { type: 'string', format: 'uri' },
            isVerified: { type: 'boolean' },
            isPrivate: { type: 'boolean' },
            location: { type: 'string' },
            website: { type: 'string', format: 'uri' },
            birthDate: { type: 'string', format: 'date' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            followersCount: { type: 'integer' },
            followingCount: { type: 'integer' },
            postsCount: { type: 'integer' }
          }
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            authorId: { type: 'string', format: 'uuid' },
            author: { $ref: '#/components/schemas/User' },
            media: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  url: { type: 'string', format: 'uri' },
                  type: { type: 'string', enum: ['image', 'video', 'gif'] },
                  altText: { type: 'string' }
                }
              }
            },
            hashtags: { type: 'array', items: { type: 'string' } },
            mentions: { type: 'array', items: { type: 'string' } },
            likesCount: { type: 'integer' },
            commentsCount: { type: 'integer' },
            sharesCount: { type: 'integer' },
            isLiked: { type: 'boolean' },
            isBookmarked: { type: 'boolean' },
            isEdited: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            authorId: { type: 'string', format: 'uuid' },
            author: { $ref: '#/components/schemas/User' },
            postId: { type: 'string', format: 'uuid' },
            parentId: { type: 'string', format: 'uuid' },
            replies: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
            likesCount: { type: 'integer' },
            isLiked: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['like', 'comment', 'share', 'follow', 'mention', 'message'] },
            userId: { type: 'string', format: 'uuid' },
            actorId: { type: 'string', format: 'uuid' },
            actor: { $ref: '#/components/schemas/User' },
            postId: { type: 'string', format: 'uuid' },
            commentId: { type: 'string', format: 'uuid' },
            messageId: { type: 'string', format: 'uuid' },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            senderId: { type: 'string', format: 'uuid' },
            sender: { $ref: '#/components/schemas/User' },
            conversationId: { type: 'string', format: 'uuid' },
            media: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  url: { type: 'string', format: 'uri' },
                  type: { type: 'string', enum: ['image', 'video', 'gif'] }
                }
              }
            },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Conversation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            participants: { type: 'array', items: { $ref: '#/components/schemas/User' } },
            lastMessage: { $ref: '#/components/schemas/Message' },
            unreadCount: { type: 'integer' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            error: { type: 'string' },
            code: { type: 'string' },
            status: { type: 'integer' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'HALO API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  }));

  // Serve swagger.json
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};