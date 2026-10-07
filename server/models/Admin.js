const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: ''
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['SuperAdmin', 'Manager', 'Agent', 'Admin'],
      default: 'Agent'
    },
    columnPreferences: [
      {
        id: { type: String },
        label: { type: String },
        visible: { type: Boolean, default: true }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Admin', adminSchema);
