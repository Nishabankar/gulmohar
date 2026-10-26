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

    // Ensure project details columns exist in leads table
    const leadColumns = [
      { name: 'project_name', type: "VARCHAR(255) NOT NULL DEFAULT ''" },
      { name: 'typography', type: "TEXT DEFAULT NULL" },
      { name: 'carpet_area', type: "TEXT DEFAULT NULL" },
      { name: 'budget', type: "VARCHAR(100) NOT NULL DEFAULT ''" },
      { name: 'location', type: "VARCHAR(255) NOT NULL DEFAULT ''" },
      { name: 'source', type: "VARCHAR(100) NOT NULL DEFAULT 'Website'" }
    ];
    for (const col of leadColumns) {
      try {
        await query(`ALTER TABLE leads ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {
        // Column may already exist
      }
    }

    // Expand existing lead columns from VARCHAR to TEXT so multiple typographies & types are never truncated
    try {
      await query("ALTER TABLE leads MODIFY COLUMN typography TEXT DEFAULT NULL");
    } catch (e) {
      // Ignore if not permitted
    }

    try {
      await query("ALTER TABLE leads MODIFY COLUMN carpet_area TEXT DEFAULT NULL");
    } catch (e) {
      // Ignore if not permitted
    }

    // Auto-migrate any existing plots_count data into carpet_area before dropping plots_count
    try {
      const [leadsToMigrate] = await query("SELECT id, plots_count, carpet_area FROM leads WHERE (carpet_area IS NULL OR TRIM(carpet_area) = '' OR carpet_area = '-') AND plots_count IS NOT NULL AND TRIM(plots_count) != ''");
      for (const lead of leadsToMigrate || []) {
        if (lead.plots_count) {
          const match = String(lead.plots_count).match(/(\d+)/);
          const sqft = match ? `${parseInt(match[1], 10) * 1000} sqft` : String(lead.plots_count);
          await query("UPDATE leads SET carpet_area = ? WHERE id = ?", [sqft, lead.id]);
        }
      }
    } catch (e) {
      // Column may not exist or already migrated
    }

    // Safely drop plots_count column from MySQL leads table
    try {
      await query("ALTER TABLE leads DROP COLUMN plots_count");
    } catch (e) {
      // Column already dropped or not present
    }

    // Safely drop project_type column from MySQL leads table
    try {
      await query("ALTER TABLE leads DROP COLUMN project_type");
    } catch (e) {
      // Column already dropped or not present
    }

    // Reset stored column_preferences in users table to null so all users adopt new canonical sequence
    try {
      await query("UPDATE users SET column_preferences = NULL WHERE column_preferences IS NOT NULL");
    } catch (e) {
      // Ignore if table/column does not exist
    }

    // Auto-repair any existing leads whose typography was truncated by the 255-char limit
    try {
      const [projects] = await query("SELECT name, typography FROM projects WHERE typography IS NOT NULL AND typography != ''");
      for (const p of projects || []) {
        if (!p.name || !p.typography) continue;
        let list = [];
        try {
          const parsed = JSON.parse(p.typography);
          if (Array.isArray(parsed)) list = parsed;
        } catch (e) {
          list = p.typography.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (list.length > 0) {
          const fullTypoStr = list.join(', ');
          await query(
            "UPDATE leads SET typography = ? WHERE LOWER(TRIM(project_name)) = LOWER(TRIM(?)) AND (LENGTH(typography) >= 240 OR typography = '' OR typography IS NULL)",
            [fullTypoStr, p.name]
          );
        }
      }
    } catch (e) {
      // Table may not exist yet
    }

    // Clean up unwanted internal import history entries (Import & Sheet Status)
    try {
      await query("DELETE FROM lead_history WHERE field_name IN ('Import', 'Sheet Status')");
    } catch (e) {
      // Table may not exist yet or empty
    }

    // Ensure projects table exists
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS projects (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          developer_name VARCHAR(255) NOT NULL DEFAULT '',
          project_type TEXT DEFAULT NULL,
          typography TEXT DEFAULT NULL,
          rera_number VARCHAR(100) DEFAULT NULL,
          area VARCHAR(255) DEFAULT NULL,
          address TEXT DEFAULT NULL,
          created_by VARCHAR(255) NOT NULL DEFAULT 'Admin',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_project_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      // Auto-migrate column 'area' if table was created previously without it
      try {
        await query("ALTER TABLE projects ADD COLUMN area VARCHAR(255) DEFAULT NULL AFTER rera_number");
      } catch (alterErr) {
        // Column already exists, safe to ignore
      }
    } catch (e) {
      console.warn('Projects table init note:', e.message);
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
          'System',
          'system',
          '',
          '',
          sysHashedPassword,
          'Admin'
        ]
      );
      console.log("🔐 Inbuilt Admin 'system' seeded in MySQL");
    } else {
      await query("UPDATE users SET name = 'System', role = 'Admin', username = 'system', phone = '', email = '' WHERE id = ?", [existingSys[0].id]);
      console.log("🔐 Inbuilt Admin user updated to 'System' in MySQL");
    }
  } catch (err) {
    console.warn('Admin seed note:', err.message);
  }
};

// Routes
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));

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

