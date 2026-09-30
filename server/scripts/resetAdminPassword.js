// Sets the admin user's password to ADMIN_PASSWORD from .env (creates the admin if missing)
// Usage: npm run reset-admin
const env = require('../config/env');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const run = async () => {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    console.error('❌ Set ADMIN_USERNAME and ADMIN_PASSWORD in .env first');
    process.exit(1);
  }

  await mongoose.connect(env.MONGO_URI);
  const username = env.ADMIN_USERNAME.toLowerCase().trim();
  const password = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

  await Admin.findOneAndUpdate(
    { username },
    { $set: { password }, $setOnInsert: { email: env.ADMIN_EMAIL, role: 'SuperAdmin' } },
    { upsert: true }
  );

  console.log(`✅ Password updated for admin user '${username}'`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
