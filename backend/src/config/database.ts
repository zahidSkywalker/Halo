import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const database = new Database();

export const connectDatabase = async (): Promise<void> => {
  try {
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    console.log('Database connection established');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export const getDatabase = (): Database => database;

export default database;