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

// @route   PATCH /api/admin/enquiries/:id
// @desc    Update any lead details (name, phone, email, plots, visit date, status, notes) directly in MongoDB & log history
// @access  Protected
router.patch('/enquiries/:id', protectAdmin, async (req, res) => {
  try {
    const { firstName, lastName, phone, email, plotsCount, plotInfo, visitDate, followupDate, status, notes, assignedAgentName, assignedTo, historyEntry, updatedBy } = req.body;
    
    let existing = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      existing = await Enquiry.findById(req.params.id);
    }
    if (!existing && phone) {
      existing = await Enquiry.findOne({ phone: phone.trim() });
    }
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Enquiry record not found in MongoDB' });
    }

    let updateFields = {};
    let newHistoryEntries = [];
    const performer = updatedBy || (req.admin ? (req.admin.name || req.admin.username) : 'System');

    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (phone !== undefined) updateFields.phone = phone;
    if (email !== undefined) updateFields.email = email;
    if (plotsCount !== undefined) updateFields.plotsCount = plotsCount;
    if (plotInfo !== undefined) updateFields.plotInfo = plotInfo;
    if (status !== undefined) updateFields.status = status;
    if (followupDate !== undefined) updateFields.followupDate = followupDate;
    if (visitDate !== undefined) updateFields.visitDate = visitDate;
    if (assignedAgentName !== undefined) updateFields.assignedAgentName = assignedAgentName;
    if (assignedTo !== undefined) updateFields.assignedTo = assignedTo;
    if (notes !== undefined) updateFields.notes = notes;

    // 1. Full Name Change Logging
    const oldFirstName = existing.firstName || '';
    const oldLastName = existing.lastName || '';
    const oldFullName = `${oldFirstName} ${oldLastName}`.trim() || 'N/A';
    const newFirstName = firstName !== undefined ? firstName : oldFirstName;
    const newLastName = lastName !== undefined ? lastName : oldLastName;
    const newFullName = `${newFirstName} ${newLastName}`.trim() || 'N/A';

    if ((firstName !== undefined || lastName !== undefined) && oldFullName !== newFullName) {
      newHistoryEntries.push({
        actionType: 'NAME_CHANGE',
        title: 'Full Name Updated',
        description: `Full name changed from '${oldFullName}' to '${newFullName}'`,
        performedBy: performer,
        oldValue: oldFullName,
        newValue: newFullName,
        createdAt: new Date()
      });
    }

    // 2. Mobile No (Phone) Change Logging
    if (phone !== undefined && phone !== existing.phone) {
      newHistoryEntries.push({
        actionType: 'PHONE_CHANGE',
        title: 'Mobile No Updated',
        description: `Mobile number changed from '${existing.phone || 'N/A'}' to '${phone}'`,
        performedBy: performer,
        oldValue: existing.phone || 'N/A',
        newValue: phone,
        createdAt: new Date()
      });
    }

    // 3. Email Address Change Logging
    if (email !== undefined && email !== existing.email) {
      newHistoryEntries.push({
        actionType: 'EMAIL_CHANGE',
        title: 'Email Address Updated',
        description: `Email address changed from '${existing.email || 'N/A'}' to '${email || 'N/A'}'`,
        performedBy: performer,
        oldValue: existing.email || 'N/A',
        newValue: email || 'N/A',
        createdAt: new Date()
      });
    }

    // 4. Plot Info / Guntha Change Logging
    const oldPlotVal = existing.plotsCount || existing.plotInfo || '1 Guntha';
    const newPlotVal = plotsCount || plotInfo || oldPlotVal;
    if ((plotsCount !== undefined || plotInfo !== undefined) && oldPlotVal !== newPlotVal) {
      newHistoryEntries.push({
        actionType: 'PLOT_CHANGE',
        title: 'No. of Guntha Updated',
        description: `Plot info changed from '${oldPlotVal}' to '${newPlotVal}'`,
        performedBy: performer,
        oldValue: oldPlotVal,
        newValue: newPlotVal,
        createdAt: new Date()
      });
    }

    // 5. Status Change Logging
    if (status !== undefined && status !== existing.status) {
      updateFields.status = status;
      newHistoryEntries.push({
        actionType: 'STATUS_CHANGE',
        title: 'Status Updated',
        description: `Status changed from '${existing.status || 'New'}' to '${status}'`,
        performedBy: performer,
        oldValue: existing.status || 'New',
        newValue: status,
        createdAt: new Date()
      });
    }

    // 6. Followup Date Logging
    if (followupDate !== undefined && followupDate !== existing.followupDate) {
      updateFields.followupDate = followupDate;
      newHistoryEntries.push({
        actionType: 'FOLLOWUP_CHANGE',
        title: 'Followup Date Updated',
        description: `Followup date changed from '${existing.followupDate || 'None'}' to '${followupDate || 'None'}'`,
        performedBy: performer,
        oldValue: existing.followupDate || 'None',
        newValue: followupDate || 'None',
        createdAt: new Date()
      });
    }

    // 7. Visit Date Logging
    if (visitDate !== undefined && visitDate !== existing.visitDate) {
      updateFields.visitDate = visitDate;
      newHistoryEntries.push({
        actionType: 'VISIT_CHANGE',
        title: 'Site Visit Date Updated',
        description: `Site visit date changed from '${existing.visitDate || 'None'}' to '${visitDate || 'None'}'`,
        performedBy: performer,
        oldValue: existing.visitDate || 'None',
        newValue: visitDate || 'None',
        createdAt: new Date()
      });
    }

    // 8. Assigned Agent Logging
    if (assignedAgentName !== undefined && assignedAgentName !== existing.assignedAgentName) {
      updateFields.assignedAgentName = assignedAgentName;
      if (assignedTo !== undefined) updateFields.assignedTo = assignedTo;
      newHistoryEntries.push({
        actionType: 'AGENT_CHANGE',
        title: 'Assigned Agent Changed',
        description: `Agent reassigned from '${existing.assignedAgentName || 'Unassigned'}' to '${assignedAgentName}'`,
        performedBy: performer,
        oldValue: existing.assignedAgentName || 'Unassigned',
        newValue: assignedAgentName,
        createdAt: new Date()
      });
    }

    // 9. Notes Logging
    if (notes !== undefined && notes !== existing.notes && notes.trim() !== '') {
      updateFields.notes = notes;
      newHistoryEntries.push({
        actionType: 'NOTE',
        title: 'Note / Remark Updated',
        description: `Note: "${notes}"`,
        performedBy: performer,
        oldValue: existing.notes || 'None',
        newValue: notes,
        createdAt: new Date()
      });
    }

    if (historyEntry) {
      newHistoryEntries.push({
        actionType: historyEntry.actionType || 'NOTE',
        title: historyEntry.title || 'Activity Logged',
        description: historyEntry.description || historyEntry.text || '',
        performedBy: historyEntry.performedBy || performer,
        oldValue: historyEntry.oldValue || '',
        newValue: historyEntry.newValue || '',
        createdAt: new Date()
      });
    }

    let updateQuery = { $set: updateFields };
    if (newHistoryEntries.length > 0) {
      updateQuery.$push = { history: { $each: newHistoryEntries } };
    }

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      existing._id,
      updateQuery,
      { new: true }
    );

    return res.json({ success: true, message: 'Enquiry updated in MongoDB', data: updatedEnquiry });
  } catch (error) {
    console.error('Error updating enquiry in MongoDB:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   POST /api/admin/enquiries/:id/history
// @desc    Add quick activity / call note to enquiry history
// @access  Protected
router.post('/enquiries/:id/history', protectAdmin, async (req, res) => {
  try {
    const { actionType, title, description, performedBy, oldValue, newValue } = req.body;
    const performer = performedBy || (req.admin ? (req.admin.name || req.admin.username) : 'System');

    const historyRecord = {
      actionType: actionType || 'NOTE',
      title: title || 'Activity Logged',
      description: description || '',
      performedBy: performer,
      oldValue: oldValue || '',
      newValue: newValue || '',
      createdAt: new Date()
    };

    const updated = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { $push: { history: [historyRecord] } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Enquiry record not found' });
    }

    return res.json({ success: true, message: 'History record added', data: updated });
  } catch (err) {
    console.error('Error adding history entry:', err.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
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

module.exports = router;
