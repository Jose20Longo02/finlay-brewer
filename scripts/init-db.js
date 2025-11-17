// Database initialization script
// Run this once to set up the database schema
// Usage: node scripts/init-db.js

const { initDatabase } = require('../config/database');

async function main() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

main();

