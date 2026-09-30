const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Enquiry = require('../models/Enquiry');
const Admin = require('../models/Admin');

// In-Memory Storage for offline MongoDB fallback
let memoryEnquiries = [
  {
    _id: 'inmem-1',
    firstName: 'Rahul',
    lastName: 'Sharma',
    phone: '9876543210',
    email: 'rahul.sharma@example.com',
    plotInfo: 'Plot #12 (1200 Sq.Ft)',
    plotsCount: '1 Plot',
    visitDate: '2026-09-25',
    status: 'New',
    notes: 'Interested in East facing plot.',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'inmem-2',
    firstName: 'Priya',
    lastName: 'Patil',
    phone: '9123456789',
    email: 'priya.patil@example.com',
    plotInfo: 'Plot #45 (1500 Sq.Ft)',
    plotsCount: '2 Plots',
    visitDate: '2026-09-22',
    status: 'Site Visit Scheduled',
    notes: 'Weekend visit scheduled.',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Create Enquiry
const createEnquiry = async (data) => {
  if (isDbConnected()) {
    return await Enquiry.create(data);
  } else {
    const newEnquiry = {
      _id: 'mem-' + Date.now(),
      ...data,
      status: 'New',
      notes: '',
      createdAt: new Date().toISOString()
    };
    memoryEnquiries.unshift(newEnquiry);
    return newEnquiry;
  }
};

// Get Enquiries with optional status and search filter
const getEnquiries = async (status, search) => {
  if (isDbConnected()) {
    let query = {};
    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { plotInfo: { $regex: search, $options: 'i' } }
      ];
    }
    return await Enquiry.find(query).sort({ createdAt: -1 });
  } else {
    return memoryEnquiries.filter(item => {
      const matchStatus = !status || status === 'All' || item.status === status;
      const matchSearch = !search || 
        `${item.firstName} ${item.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        (item.phone && item.phone.toLowerCase().includes(search.toLowerCase())) ||
        (item.email && item.email.toLowerCase().includes(search.toLowerCase())) ||
        (item.plotInfo && item.plotInfo.toLowerCase().includes(search.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }
};

// Update Enquiry
const updateEnquiry = async (id, updateFields) => {
  if (isDbConnected()) {
    return await Enquiry.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
  } else {
    const index = memoryEnquiries.findIndex(item => item._id === id);
    if (index !== -1) {
      memoryEnquiries[index] = { ...memoryEnquiries[index], ...updateFields };
      return memoryEnquiries[index];
    }
    return null;
  }
};

// Delete Enquiry
const deleteEnquiry = async (id) => {
  if (isDbConnected()) {
    return await Enquiry.findByIdAndDelete(id);
  } else {
    const initialLength = memoryEnquiries.length;
    memoryEnquiries = memoryEnquiries.filter(item => item._id !== id);
    return memoryEnquiries.length < initialLength;
  }
};

// Find Admin User
const findAdminByUsername = async (username) => {
  if (isDbConnected()) {
    return await Admin.findOne({ username: username.toLowerCase().trim() });
  } else {
    // In-memory fallback admin credentials
    if (username.toLowerCase().trim() === 'admin') {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      return {
        _id: 'admin-mem-id',
        username: 'admin',
        email: 'admin@gulmoharcity.com',
        password: hashedPassword,
        role: 'SuperAdmin'
      };
    }
    return null;
  }
};

module.exports = {
  isDbConnected,
  createEnquiry,
  getEnquiries,
  updateEnquiry,
  deleteEnquiry,
  findAdminByUsername
};
