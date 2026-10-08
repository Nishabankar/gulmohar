const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000
});

const connectDB = async () => {
  const connection = await pool.getConnection();
  console.log(`✅ MySQL Connected: ${env.DB_NAME} @ ${env.DB_HOST}:${env.DB_PORT}`);
  connection.release();
  return pool;
};

module.exports = {
  connectDB,
  pool,
  query: (sql, params) => pool.query(sql, params),
  execute: (sql, params) => pool.execute(sql, params)
};
