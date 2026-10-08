const path = require('path');
const dotenv = require('dotenv');

// Load server/.env regardless of the directory node is started from
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const required = ['JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}. See server/.env.example`);
  process.exit(1);
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',
  SERVE_FRONTEND: process.env.SERVE_FRONTEND === 'true',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
  DB_HOST: process.env.DB_HOST || 'srv1002.hstgr.io',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'u660519083_gulmohar',
  DB_PASSWORD: process.env.DB_PASSWORD || 'Housedeal@123',
  DB_NAME: process.env.DB_NAME || 'u660519083_housedealcrm'
};
