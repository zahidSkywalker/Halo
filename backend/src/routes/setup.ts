import { Router } from 'express';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { getDatabase } from '../config/database';

const router = Router();

// Database setup endpoint (POST)
router.post('/init-database', async (req, res) => {
  try {
    console.log('🚀 Database initialization requested via POST');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({
        success: false,
        message: 'DATABASE_URL not configured'
      });
    }

    console.log('🔗 Connecting to database...');
    const client = new Client({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();
    console.log('✅ Connected to database successfully');

    // Read the init.sql file
    const initSqlPath = path.join(process.cwd(), 'db', 'init.sql');
    console.log('📖 Reading schema from:', initSqlPath);
    
    if (!fs.existsSync(initSqlPath)) {
      throw new Error(`Database schema file not found at: ${initSqlPath}`);
    }

    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    console.log('📄 Schema file loaded, executing...');

    // Execute the SQL
    await client.query(initSql);
    
    console.log('✅ Database initialized successfully!');
    
    await client.end();
    
    res.json({
      success: true,
      message: 'Database initialized successfully! All tables created and ready to use.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database setup endpoint (GET - alternative method)
router.get('/init-database', async (req, res) => {
  try {
    console.log('🚀 Database initialization requested via GET');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({
        success: false,
        message: 'DATABASE_URL not configured'
      });
    }

    console.log('🔗 Connecting to database...');
    const client = new Client({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();
    console.log('✅ Connected to database successfully');

    // Read the init.sql file
    const initSqlPath = path.join(process.cwd(), 'db', 'init.sql');
    console.log('📖 Reading schema from:', initSqlPath);
    
    if (!fs.existsSync(initSqlPath)) {
      throw new Error(`Database schema file not found at: ${initSqlPath}`);
    }

    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    console.log('📄 Schema file loaded, executing...');

    // Execute the SQL
    await client.query(initSql);
    
    console.log('✅ Database initialized successfully!');
    
    await client.end();
    
    res.json({
      success: true,
      message: 'Database initialized successfully! All tables created and ready to use.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check database status
router.get('/status', async (req, res) => {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({
        success: false,
        message: 'DATABASE_URL not configured'
      });
    }

    const client = new Client({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();
    
    // Check if users table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const usersTableExists = result.rows[0].exists;
    
    await client.end();
    
    res.json({
      success: true,
      databaseConnected: true,
      usersTableExists,
      message: usersTableExists 
        ? 'Database is ready with all tables' 
        : 'Database connected but tables are missing'
    });

  } catch (error) {
    console.error('❌ Database status check error:', error);
    res.status(500).json({
      success: false,
      databaseConnected: false,
      message: 'Cannot connect to database',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test database connection and basic operations
router.get('/test-db', async (req, res) => {
  try {
    console.log('🧪 Testing database connection and operations...');
    
    // Test basic connection
    const db = getDatabase();
    const client = await db.getClient();
    console.log('✅ Database client obtained');
    
    // Test if posts table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'posts'
      );
    `);
    
    const postsTableExists = tableCheck.rows[0].exists;
    console.log('📊 Posts table exists:', postsTableExists);
    
    if (postsTableExists) {
      // Test if we can query the posts table
      const postCount = await client.query('SELECT COUNT(*) as count FROM posts');
      console.log('📊 Total posts in database:', postCount.rows[0].count);
      
      // Test if we can insert a test record (will be rolled back)
      await client.query('BEGIN');
      const testInsert = await client.query(`
        INSERT INTO posts (content, author_id) 
        VALUES ($1, $2) 
        RETURNING id
      `, ['TEST POST - WILL BE ROLLED BACK', '00000000-0000-0000-0000-000000000000']);
      
      console.log('✅ Test insert successful, ID:', testInsert.rows[0].id);
      await client.query('ROLLBACK');
      console.log('✅ Test insert rolled back');
    }
    
    client.release();
    
    res.json({
      success: true,
      database: {
        connected: true,
        postsTableExists,
        canQuery: postsTableExists,
        canInsert: postsTableExists
      },
      message: 'Database test completed'
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Check if a specific user exists in the database
router.get('/check-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 Checking if user exists:', userId);
    
    const db = getDatabase();
    const client = await db.getClient();
    
    // Check if user exists
    const userCheck = await client.query(
      'SELECT id, username, email, display_name, is_active FROM users WHERE id = $1',
      [userId]
    );
    
    const userExists = userCheck.rows.length > 0;
    const user = userExists ? userCheck.rows[0] : null;
    
    console.log('🔍 User check result:', { userId, userExists, user });
    
    client.release();
    
    res.json({
      success: true,
      user: {
        id: userId,
        exists: userExists,
        details: user
      },
      message: userExists ? 'User found' : 'User not found'
    });
    
  } catch (error) {
    console.error('❌ User check failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'User check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Check current authenticated user (requires JWT token)
router.get('/check-current-user', async (req, res) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'No authorization header provided'
        }
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'No token provided'
        }
      });
    }

    console.log('🔍 Checking current user from token:', token.substring(0, 20) + '...');

    // Verify the token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const userId = decoded.userId;
    console.log('🔍 User ID from token:', userId);

    // Check if user exists in database
    const db = getDatabase();
    const client = await db.getClient();
    
    const userCheck = await client.query(
      'SELECT id, username, email, display_name, is_active FROM users WHERE id = $1',
      [userId]
    );
    
    const userExists = userCheck.rows.length > 0;
    const user = userExists ? userCheck.rows[0] : null;
    
    console.log('🔍 Current user check result:', { userId, userExists, user });
    
    client.release();
    
    res.json({
      success: true,
      token: {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        iat: decoded.iat,
        exp: decoded.exp
      },
      user: {
        id: userId,
        exists: userExists,
        details: user
      },
      message: userExists ? 'User found in database' : 'User not found in database'
    });
    
  } catch (error) {
    console.error('❌ Current user check failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Current user check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export default router;