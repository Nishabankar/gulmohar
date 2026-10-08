const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const Admin = require('../models/Admin');

// @route   POST /api/enquiries
// @desc    Submit a new enquiry directly to MongoDB database with dynamic Round-Robin Agent auto-assignment
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, plotInfo, plotsCount, visitDate, followupDate, notes, assignedAgentName, assignedTo, createdBy, modifiedBy } = req.body;

    if (!firstName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'First name and phone number are required fields.'
      });
    }

    let finalAssignedAgentName = (assignedAgentName && assignedAgentName !== 'Unassigned') ? assignedAgentName : '';
    let finalAssignedTo = assignedTo || '';

    // If agent name is missing or Unassigned, perform Round-Robin across active Sales Agents in MongoDB
    if (!finalAssignedAgentName) {
      const activeAgents = await Admin.find({ role: 'Agent' }).sort({ createdAt: 1 });
      if (activeAgents && activeAgents.length > 0) {
        const totalEnquiries = await Enquiry.countDocuments();
        const agentIndex = totalEnquiries % activeAgents.length;
        const selectedAgent = activeAgents[agentIndex];
        finalAssignedAgentName = selectedAgent.name || selectedAgent.username;
        finalAssignedTo = selectedAgent._id.toString();
      }
    }

    const noteAuthor = createdBy || modifiedBy || 'Client';
    const initialNotes = notes ? notes.trim() : '';
    const initialHistory = initialNotes !== '' ? [{
      fieldName: 'Notes',
      oldValue: '—',
      newValue: initialNotes,
      modifiedBy: noteAuthor,
      modifiedDate: new Date()
    }] : [];

    const newEnquiry = await Enquiry.create({
      firstName,
      lastName: lastName || '',
      phone,
      email: email || '',
      plotInfo: plotInfo || '',
      plotsCount: plotsCount || '1 Plot',
      visitDate: visitDate || '',
      followupDate: followupDate || '',
      notes: initialNotes,
      assignedAgentName: finalAssignedAgentName,
      assignedTo: finalAssignedTo,
      history: initialHistory
    });

    return res.status(201).json({
      success: true,
      message: 'Enquiry saved directly in MongoDB Database!',
      data: newEnquiry
    });
  } catch (error) {
    console.error('MongoDB Insert Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Database Error: Could not save enquiry to MongoDB',
      error: error.message
    });
  }
});

module.exports = router;
