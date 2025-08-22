const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  // Read the database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Read the init.sql file
    const initSqlPath = path.join(__dirname, '..', 'db', 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    console.log('📖 Reading database schema...');
    console.log('🚀 Executing database initialization...');

    // Execute the SQL
    await client.query(initSql);
    
    console.log('✅ Database initialized successfully!');
    console.log('🎉 All tables created and ready to use');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the initialization
initializeDatabase().catch(console.error);