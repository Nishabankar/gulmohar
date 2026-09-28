const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Seed Default Admin User directly into MongoDB
const seedAdminUser = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      await Admin.create({
        username: defaultUsername,
        email: 'admin@gulmoharcity.com',
        password: hashedPassword,
        role: 'SuperAdmin'
      });

      console.log(`🔐 Default Admin User seeded in MongoDB: username='${defaultUsername}', password='${defaultPassword}'`);
    }
  } catch (err) {
    console.warn('Admin seed note:', err.message);
  }
};

setTimeout(seedAdminUser, 2000);

// Routes
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health Check Root Route
app.get('/', (req, res) => {
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Pure MongoDB Backend Server running on http://localhost:${PORT}`);
});
