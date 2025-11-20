// Database connection configuration
const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? {
    rejectUnauthorized: false
  } : false
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Initialize database schema
const initDatabase = async () => {
  try {
    // Create leads table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        name VARCHAR(255),
        email VARCHAR(255),
        email_address VARCHAR(255),
        phone VARCHAR(255),
        phone_number VARCHAR(255),
        country_code VARCHAR(50),
        phone_full VARCHAR(255),
        property VARCHAR(500),
        message TEXT,
        best_time_to_contact VARCHAR(50),
        budget_range VARCHAR(255),
        lead_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add best_time_to_contact column if it doesn't exist (for existing databases)
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'leads' AND column_name = 'best_time_to_contact'
        ) THEN
          ALTER TABLE leads ADD COLUMN best_time_to_contact VARCHAR(50);
        END IF;
      END $$;
    `);
    
    // Add budget_range column if it doesn't exist (for existing databases)
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'leads' AND column_name = 'budget_range'
        ) THEN
          ALTER TABLE leads ADD COLUMN budget_range VARCHAR(255);
        END IF;
      END $$;
    `);

    // Create index on email for faster lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email, email_address)
    `);

    // Create index on timestamp for sorting
    await query(`
      CREATE INDEX IF NOT EXISTS idx_leads_timestamp ON leads(timestamp DESC)
    `);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  initDatabase
};

