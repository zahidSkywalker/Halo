import fs from 'fs';
import path from 'path';
import { getDatabase } from '../config/database';

const database = getDatabase();

async function runMigrations(): Promise<void> {
  try {
    console.log('🔄 Starting database migrations...');

    // Read the init.sql file
    const initSqlPath = path.join(__dirname, '../../db/init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    // Split the SQL into individual statements
    const statements = initSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await database.query(statement);
        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
      } catch (error: any) {
        // Skip if table already exists or other non-critical errors
        if (error.code === '42P07' || error.code === '42710') {
          console.log(`⚠️  Skipped statement ${i + 1}/${statements.length} (already exists)`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}/${statements.length}:`, error.message);
          throw error;
        }
      }
    }

    console.log('✅ Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { runMigrations };