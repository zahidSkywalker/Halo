import { Router } from 'express';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

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

export default router;