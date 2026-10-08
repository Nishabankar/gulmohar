const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// @route   POST /api/enquiries
// @desc    Submit a new enquiry directly to MySQL database with dynamic Round-Robin Agent auto-assignment
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
    let finalAssignedTo = assignedTo ? parseInt(assignedTo, 10) : null;
    if (isNaN(finalAssignedTo)) finalAssignedTo = null;

    // If agent name is missing or Unassigned, perform Round-Robin across active Sales Agents in MySQL
    if (!finalAssignedAgentName) {
      const [activeAgents] = await query("SELECT id, name, username FROM admins WHERE role = 'Agent' ORDER BY id ASC");
      if (activeAgents && activeAgents.length > 0) {
        const [[{ total }]] = await query("SELECT COUNT(*) AS total FROM enquiries");
        const agentIndex = total % activeAgents.length;
        const selectedAgent = activeAgents[agentIndex];
        finalAssignedAgentName = selectedAgent.name || selectedAgent.username;
        finalAssignedTo = selectedAgent.id;
      }
    }

    const noteAuthor = createdBy || modifiedBy || 'Client';
    const initialNotes = notes ? notes.trim() : '';

    // Insert into enquiries table
    const [result] = await query(
      `INSERT INTO enquiries 
        (first_name, last_name, phone, email, plot_info, plots_count, visit_date, followup_date, status, notes, assigned_agent_name, assigned_to) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'New', ?, ?, ?)`,
      [
        firstName.trim(),
        (lastName || '').trim(),
        phone.trim(),
        (email || '').trim(),
        (plotInfo || '').trim(),
        plotsCount || '1 Plot',
        visitDate || '',
        followupDate || '',
        initialNotes,
        finalAssignedAgentName,
        finalAssignedTo
      ]
    );

    const newEnquiryId = result.insertId;

    // If notes exist, insert into enquiry_history table
    let historyEntries = [];
    if (initialNotes !== '') {
      await query(
        `INSERT INTO enquiry_history (enquiry_id, field_name, old_value, new_value, modified_by, modified_date) VALUES (?, ?, ?, ?, ?, NOW())`,
        [newEnquiryId, 'Notes', '—', initialNotes, noteAuthor]
      );
      historyEntries.push({
        fieldName: 'Notes',
        oldValue: '—',
        newValue: initialNotes,
        modifiedBy: noteAuthor,
        modifiedDate: new Date().toISOString()
      });
    }

    // Return response formatted with camelCase properties matching frontend expectations
    const responseData = {
      _id: newEnquiryId.toString(),
      id: newEnquiryId,
      firstName,
      lastName: lastName || '',
      phone,
      email: email || '',
      plotInfo: plotInfo || '',
      plotsCount: plotsCount || '1 Plot',
      visitDate: visitDate || '',
      followupDate: followupDate || '',
      status: 'New',
      notes: initialNotes,
      assignedAgentName: finalAssignedAgentName,
      assignedTo: finalAssignedTo ? finalAssignedTo.toString() : '',
      history: historyEntries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      message: 'Enquiry saved directly in MySQL Database!',
      data: responseData
    });
  } catch (error) {
    console.error('MySQL Insert Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Database Error: Could not save enquiry to MySQL',
      error: error.message
    });
  }
});

module.exports = router;
