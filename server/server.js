const env = require('./config/env');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

const app = express();

// Middleware
// CORS_ORIGIN: comma-separated list of allowed origins; empty allows all
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));
app.use(express.json());

// Seed Default Admin User directly into MongoDB
const seedAdminUser = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
        console.warn('⚠️  No admin user exists. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env to seed one.');
        return;
      }
      const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

      await Admin.create({
        username: env.ADMIN_USERNAME.toLowerCase().trim(),
        email: env.ADMIN_EMAIL,
        password: hashedPassword,
        role: 'SuperAdmin'
      });

      console.log(`🔐 Admin user '${env.ADMIN_USERNAME}' seeded in MongoDB`);
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
    message: 'Gulmohar City Real Estate Pure MongoDB Backend Server Running',
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
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }

  await seedAdminUser();

  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });
};

startServer();
