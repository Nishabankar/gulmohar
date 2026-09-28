const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const connectDB = async () => {
  const conn = await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000
  });
  console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
};

module.exports = connectDB;
