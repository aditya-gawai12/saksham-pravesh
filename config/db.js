const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool to MySQL database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'saksham_pravesh',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to test DB connection and log warning if down
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the MySQL database.');
    connection.release();
  } catch (error) {
    console.error('CRITICAL ERROR: Could not connect to the MySQL database.');
    console.error('Make sure your MySQL server is running and .env configuration is correct.');
    console.error(error.message);
  }
}

testConnection();

module.exports = pool;
