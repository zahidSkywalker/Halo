import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { setupSocketIO } from './config/socket';
import { setupSwagger } from './config/swagger';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import statsRoutes from './routes/stats';
import notificationRoutes from './routes/notifications';
import setupRoutes from './routes/setup';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// Parse CORS origins from environment variable
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

console.log('🌐 CORS Origins:', corsOrigins);

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (corsOrigins.includes(origin)) {
      console.log('✅ CORS: Allowing origin:', origin);
      callback(null, true);
    } else {
      console.log('🚫 CORS: Blocking origin:', origin);
      console.log('🚫 CORS: Allowed origins:', corsOrigins);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check request from:', req.get('Origin') || 'No origin');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// CORS debug endpoint
app.get('/cors-debug', (req, res) => {
  const origin = req.get('Origin');
  const userAgent = req.get('User-Agent');
  const referer = req.get('Referer');
  
  console.log('🔍 CORS Debug Request:');
  console.log('  Origin:', origin);
  console.log('  User-Agent:', userAgent);
  console.log('  Referer:', referer);
  console.log('  Allowed origins:', corsOrigins);
  
  res.status(200).json({
    success: true,
    cors: {
      requestOrigin: origin,
      allowedOrigins: corsOrigins,
      isAllowed: origin ? corsOrigins.includes(origin) : true,
      userAgent: userAgent,
      referer: referer
    },
    message: 'CORS debug information'
  });
});

// Debug endpoint to show registered routes
app.get('/debug/routes', (req, res) => {
  const routes: any[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          routes.push({
            path: middleware.regexp.source.replace('^\\/','').replace('\\/?(?=\\/|$)','') + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    success: true,
    routes: routes,
    message: 'Available routes'
  });
});

// API Routes
console.log('🔗 Registering API routes...');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes registered');
app.use('/api/users', userRoutes);
console.log('✅ User routes registered');
app.use('/api/posts', postRoutes);
console.log('✅ Post routes registered');
app.use('/api/stats', statsRoutes);
console.log('✅ Stats routes registered');
app.use('/api/notifications', notificationRoutes);
console.log('✅ Notification routes registered');
app.use('/api/setup', setupRoutes);
console.log('✅ Setup routes registered');
console.log('🔗 All API routes registered successfully');

// Setup Swagger documentation
setupSwagger(app);

// Setup Socket.IO
setupSocketIO(io);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Database connected successfully');

    // Only try Redis if REDIS_URL is explicitly set
    if (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379') {
      try {
        await connectRedis();
        console.log('✅ Redis connected successfully');
      } catch (redisError) {
        console.log('⚠️ Redis connection failed, continuing without Redis');
      }
    } else {
      console.log('ℹ️ Redis not configured, skipping Redis connection');
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 HALO Backend Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

startServer();