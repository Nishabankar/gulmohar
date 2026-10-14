const env = require('./config/env');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { connectDB, query } = require('./config/db');

const app = express();

// Middleware
// CORS_ORIGIN: comma-separated list of allowed origins; empty allows all
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Seed Default Inbuilt Admin Users directly into MySQL
const seedAdminUser = async () => {
  try {
    // 1. Expand role ENUM to support 'SystemAdmin' and 'SalesExecutive' if running MySQL
    try {
      await query("ALTER TABLE users MODIFY COLUMN role ENUM('SuperAdmin', 'SystemAdmin', 'SalesExecutive', 'Manager', 'Agent', 'Admin') NOT NULL DEFAULT 'SalesExecutive'");
    } catch (e) {
      // Column may already be updated
    }

    // Ensure created_by column exists in leads table
    try {
      await query("ALTER TABLE leads ADD COLUMN created_by VARCHAR(255) NOT NULL DEFAULT 'System' AFTER assigned_agent_name");
    } catch (e) {
      // Column may already exist
    }

    // 2. Ensure SuperAdmin exists
    const adminUsername = (env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
    const [existingAdmin] = await query('SELECT id FROM users WHERE LOWER(username) = ? LIMIT 1', [adminUsername]);
    if (!existingAdmin || existingAdmin.length === 0) {
      const defaultPass = env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPass, 10);

      await query(
        `INSERT INTO users (name, username, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'Super Admin',
          adminUsername,
          env.ADMIN_EMAIL || 'admin@gulmoharcity.com',
          '9876543210',
          hashedPassword,
          'SuperAdmin'
        ]
      );
      console.log(`🔐 Admin user '${adminUsername}' seeded in MySQL`);
    }

    // 3. Ensure Inbuilt Admin user exists (system / system123)
    const [existingSys] = await query("SELECT id, username FROM users WHERE LOWER(username) IN ('system', 'systemadmin') LIMIT 1");
    if (!existingSys || existingSys.length === 0) {
      const sysHashedPassword = await bcrypt.hash('system123', 10);
      await query(
        `INSERT INTO users (name, username, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'Admin',
          'system',
          'system@gulmoharcity.com',
          '9876543211',
          sysHashedPassword,
          'Admin'
        ]
      );
      console.log("🔐 Inbuilt Admin 'system' seeded in MySQL");
    } else {
      await query("UPDATE users SET name = 'Admin', role = 'Admin', username = 'system' WHERE id = ?", [existingSys[0].id]);
      console.log("🔐 Inbuilt Admin user updated to 'Admin' in MySQL");
    }
  } catch (err) {
    console.warn('Admin seed note:', err.message);
  }
};

// Routes
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Global JSON Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Health Check Route
app.get(env.SERVE_FRONTEND ? '/api' : '/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Gulmohar City Real Estate Pure MySQL Backend Server Running',
    endpoints: {
      publicEnquiry: 'POST /api/enquiries',
      adminLogin: 'POST /api/admin/login',
      adminLeads: 'GET /api/admin/enquiries'
    }
  });
});

// Serve the built React app (npm run build → ../dist) from this same Node app
if (env.SERVE_FRONTEND) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error(`❌ MySQL Connection Error: ${error.message}`);
    process.exit(1);
  }

  await seedAdminUser();

  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });
};

startServer();

