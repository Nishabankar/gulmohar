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
app.use(express.json());

// Seed Default Admin User directly into MySQL
const seedAdminUser = async () => {
  try {
    const [rows] = await query('SELECT COUNT(*) AS count FROM admins');
    const adminCount = rows[0]?.count || 0;

    if (adminCount === 0) {
      if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
        console.warn('⚠️  No admin user exists. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env to seed one.');
        return;
      }
      const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

      await query(
        `INSERT INTO admins (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)`,
        [
          'Super Admin',
          env.ADMIN_USERNAME.toLowerCase().trim(),
          env.ADMIN_EMAIL || 'admin@gulmoharcity.com',
          hashedPassword,
          'SuperAdmin'
        ]
      );

      console.log(`🔐 Admin user '${env.ADMIN_USERNAME}' seeded in MySQL`);
    }
  } catch (err) {
    console.warn('Admin seed note:', err.message);
  }
};

// Routes
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

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

