const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Enquiry = require('../models/Enquiry');
const { protectAdmin } = require('../middleware/authMiddleware');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

// @route   POST /api/admin/login
// @desc    Admin login directly from MongoDB database & return JWT token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    // Direct MongoDB Admin Search
    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin username or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin username or password' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name || (admin.role === 'SuperAdmin' ? 'Admin Control Panel' : admin.username),
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin Login MongoDB Error:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error during Admin Login', error: error.message });
  }
});

// @route   GET /api/admin/verify
// @desc    Verify current admin JWT token
// @access  Protected
router.get('/verify', protectAdmin, async (req, res) => {
  return res.json({ success: true, admin: req.admin });
});

// @route   GET /api/admin/enquiries
// @desc    Get all leads directly from MongoDB database
// @access  Protected
router.get('/enquiries', protectAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { plotInfo: { $regex: search, $options: 'i' } }
      ];
    }

    // Direct MongoDB Database Query
    const enquiries = await Enquiry.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, count: enquiries.length, data: enquiries });
  } catch (error) {
    console.error('Error fetching enquiries from MongoDB:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error: Could not fetch enquiries from MongoDB', error: error.message });
  }
});

// @route   GET /api/admin/stats
// @desc    Get metrics stats summary directly from MongoDB
// @access  Protected
router.get('/stats', protectAdmin, async (req, res) => {
  try {
    const totalLeads = await Enquiry.countDocuments();
    const newLeads = await Enquiry.countDocuments({ status: 'New' });
    const scheduledVisits = await Enquiry.countDocuments({ status: 'Site Visit Scheduled' });
    const closedDeals = await Enquiry.countDocuments({ status: 'Closed' });

    return res.json({
      success: true,
      stats: {
        totalLeads,
        newLeads,
        scheduledVisits,
        closedDeals
      }
    });
  } catch (error) {
    console.error('Error fetching stats from MongoDB:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   GET /api/admin/enquiries/:id
// @desc    Get single lead details with history directly from MongoDB
// @access  Protected
router.get('/enquiries/:id', protectAdmin, async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry record not found in MongoDB' });
    }
    return res.json({ success: true, data: enquiry });
  } catch (error) {
    console.error('Error fetching single enquiry:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   PATCH /api/admin/enquiries/:id
// @desc    Update any lead details (name, phone, email, plots, visit date, status, notes) directly in MongoDB & log history
// @access  Protected
router.patch('/enquiries/:id', protectAdmin, async (req, res) => {
  try {
    const { firstName, lastName, phone, oldPhone, email, plotsCount, plotInfo, visitDate, followupDate, status, notes, assignedAgentName, assignedTo, updatedBy } = req.body;
    
    let existing = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      existing = await Enquiry.findById(req.params.id);
    }
    if (!existing && oldPhone) {
      existing = await Enquiry.findOne({ phone: oldPhone.trim() });
    }
    if (!existing && phone) {
      existing = await Enquiry.findOne({ phone: phone.trim() });
    }
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Enquiry record not found in MongoDB' });
    }

    const performer = updatedBy || (req.admin ? (req.admin.name || req.admin.username || 'Admin') : 'Admin');

    const fieldsToCompare = [
      { key: 'firstName', label: 'First Name', incoming: firstName },
      { key: 'lastName', label: 'Last Name', incoming: lastName },
      { key: 'phone', label: 'Mobile No.', incoming: phone },
      { key: 'email', label: 'Email Address', incoming: email },
      { key: 'plotsCount', label: 'No. of Guntha', incoming: plotsCount },
      { key: 'plotInfo', label: 'Plot Info', incoming: plotInfo },
      { key: 'visitDate', label: 'Visit Date', incoming: visitDate },
      { key: 'followupDate', label: 'Followup Date', incoming: followupDate },
      { key: 'status', label: 'Status', incoming: status },
      { key: 'notes', label: 'Notes', incoming: notes },
      { key: 'assignedAgentName', label: 'Assigned Agent', incoming: assignedAgentName }
    ];

    let newHistoryEntries = [];
    let updateFields = {};

    fieldsToCompare.forEach(f => {
      if (f.incoming !== undefined) {
        updateFields[f.key] = f.incoming;
        const oldVal = (existing[f.key] || '').toString().trim();
        const newVal = (f.incoming || '').toString().trim();
        
        if (oldVal !== newVal) {
          newHistoryEntries.push({
            fieldName: f.label,
            oldValue: oldVal || '—',
            newValue: newVal || '—',
            modifiedBy: performer,
            modifiedDate: new Date()
          });
        }
      }
    });

    if (assignedTo !== undefined) updateFields.assignedTo = assignedTo;

    console.log('📝 Updating Enquiry in MongoDB Atlas:', existing._id, updateFields);
    console.log('📜 History entries created:', newHistoryEntries.length);

    let updateQuery = { $set: updateFields };
    if (newHistoryEntries.length > 0) {
      updateQuery.$push = { history: { $each: newHistoryEntries } };
    }

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      existing._id,
      updateQuery,
      { new: true, runValidators: true }
    );

    return res.json({ success: true, message: 'Enquiry updated in MongoDB', data: updatedEnquiry });
  } catch (error) {
    console.error('Error updating enquiry in MongoDB:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error', error: error.message });
  }
});

// @route   DELETE /api/admin/enquiries/:id
// @desc    Delete an enquiry directly from MongoDB
// @access  Protected
router.delete('/enquiries/:id', protectAdmin, async (req, res) => {
  try {
    const deleted = await Enquiry.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Enquiry record not found in MongoDB' });
    }

    return res.json({ success: true, message: 'Enquiry deleted from MongoDB' });
  } catch (error) {
    console.error('Error deleting enquiry from MongoDB:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   GET /api/admin/agents
// @desc    Get all created sales agents from MongoDB database
// @access  Protected
router.get('/agents', protectAdmin, async (req, res) => {
  try {
    const agents = await Admin.find({ role: 'Agent' }).select('-password');
    return res.json({ success: true, count: agents.length, data: agents });
  } catch (error) {
    console.error('Error fetching agents:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   POST /api/admin/agents
// @desc    Create new sales agent in MongoDB database
// @access  Protected
router.post('/agents', protectAdmin, async (req, res) => {
  try {
    const { name, username, password, phone, email } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, username, and password' });
    }

    const existing = await Admin.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Agent with this username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const agentEmail = (email && email.trim()) ? email.toLowerCase().trim() : `${username.toLowerCase().trim()}@gulmoharcity.com`;

    const newAgent = await Admin.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: agentEmail,
      phone: phone ? phone.trim() : '',
      password: hashedPassword,
      role: 'Agent'
    });

    return res.json({
      success: true,
      message: 'Sales Agent created successfully in MongoDB',
      data: {
        id: newAgent._id,
        name: newAgent.name || name,
        username: newAgent.username,
        email: newAgent.email,
        phone: newAgent.phone,
        role: newAgent.role
      }
    });
  } catch (error) {
    console.error('Error creating agent:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   DELETE /api/admin/agents/:id
// @desc    Delete sales agent from MongoDB database
// @access  Protected
router.delete('/agents/:id', protectAdmin, async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Agent removed successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   PATCH /api/admin/agents/:id
// @desc    Update sales agent details in MongoDB database
// @access  Protected
router.patch('/agents/:id', protectAdmin, async (req, res) => {
  try {
    const { name, username, password, phone, email } = req.body;
    let updateFields = {};

    if (name !== undefined) updateFields.name = name.trim();
    if (username !== undefined) updateFields.username = username.toLowerCase().trim();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (email !== undefined) updateFields.email = email.toLowerCase().trim();
    if (password && password.trim() && !password.includes('•••')) {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    const updatedAgent = await Admin.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    return res.json({ success: true, message: 'Agent updated successfully', data: updatedAgent });
  } catch (error) {
    console.error('Error updating agent:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   GET /api/admin/column-preferences
// @desc    Get logged-in user's customized column preferences from MongoDB Atlas
// @access  Protected
router.get('/column-preferences', protectAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('columnPreferences');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, columnPreferences: admin.columnPreferences || [] });
  } catch (error) {
    console.error('Error fetching column preferences:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error', error: error.message });
  }
});

// @route   PUT /api/admin/column-preferences
// @desc    Update logged-in user's customized column preferences in MongoDB Atlas
// @access  Protected
router.put('/column-preferences', protectAdmin, async (req, res) => {
  try {
    const { columnPreferences } = req.body;
    if (!Array.isArray(columnPreferences)) {
      return res.status(400).json({ success: false, message: 'columnPreferences must be an array' });
    }
    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      { $set: { columnPreferences } },
      { new: true }
    ).select('columnPreferences');
    return res.json({ success: true, message: 'Column preferences updated successfully', columnPreferences: admin.columnPreferences });
  } catch (error) {
    console.error('Error updating column preferences:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error', error: error.message });
  }
});

module.exports = router;
