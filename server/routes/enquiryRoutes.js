const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../config/env');
const { PRIORITY_OPTIONS, matchOption } = require('../utils/leadOptions');

// True when the request carries a valid dashboard login token (homepage form has none)
const isDashboardRequest = (req) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  try { jwt.verify(token, JWT_SECRET); return true; } catch (e) { return false; }
};

// @route   POST /api/enquiries
// @desc    Submit a new enquiry directly to MySQL database with dynamic Round-Robin Agent auto-assignment
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, plotInfo, plotsCount, visitDate, followupDate, notes, assignedAgentName, assignedTo, createdBy, modifiedBy } = req.body;
    // Priority is dashboard-only: ignored for public homepage submissions
    const priority = isDashboardRequest(req) ? (matchOption(req.body.priority, PRIORITY_OPTIONS) || '') : '';

    if (!firstName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'First name and phone number are required fields.'
      });
    }

    // Only a real Agent (never an admin) can be assigned; a name alone is not trusted
    let finalAssignedAgentName = '';
    let finalAssignedTo = assignedTo ? parseInt(assignedTo, 10) : null;
    if (isNaN(finalAssignedTo)) finalAssignedTo = null;

    if (finalAssignedTo) {
      const [agentRows] = await query("SELECT id, name, username FROM users WHERE id = ? AND role = 'Agent'", [finalAssignedTo]);
      if (!agentRows || agentRows.length === 0) {
        finalAssignedTo = null;
        finalAssignedAgentName = '';
      } else {
        finalAssignedAgentName = agentRows[0].name || agentRows[0].username;
      }
    }

    // If agent name is missing or Unassigned, perform Round-Robin across active Sales Agents in MySQL
    if (!finalAssignedAgentName) {
      const [activeAgents] = await query("SELECT id, name, username FROM users WHERE role = 'Agent' ORDER BY id ASC");
      if (activeAgents && activeAgents.length > 0) {
        const [countRows] = await query("SELECT COUNT(*) AS total FROM leads");
        const total = countRows[0]?.total || 0;
        const agentIndex = total % activeAgents.length;
        const selectedAgent = activeAgents[agentIndex];
        finalAssignedAgentName = selectedAgent.name || selectedAgent.username;
        finalAssignedTo = selectedAgent.id;
      }
    }

    const noteAuthor = createdBy || modifiedBy || 'Client';
    const initialNotes = notes ? notes.trim() : '';

    // Insert into leads table
    const [result] = await query(
      `INSERT INTO leads 
        (first_name, last_name, phone, email, plot_info, plots_count, visit_date, followup_date, status, priority, notes, assigned_agent_name, assigned_to) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'New', ?, ?, ?, ?)`,
      [
        firstName.trim(),
        (lastName || '').trim(),
        phone.trim(),
        (email || '').trim(),
        (plotInfo || '').trim(),
        plotsCount || '1 Guntha',
        visitDate || '',
        followupDate || '',
        priority,
        initialNotes,
        finalAssignedAgentName,
        finalAssignedTo
      ]
    );

    const newEnquiryId = result.insertId;

    // If notes exist, insert into lead_history table
    let historyEntries = [];
    if (initialNotes !== '') {
      await query(
        `INSERT INTO lead_history (lead_id, field_name, old_value, new_value, modified_by, modified_date) VALUES (?, ?, ?, ?, ?, ?)`,
        [newEnquiryId, 'Notes', '—', initialNotes, noteAuthor, new Date()]
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
      plotsCount: plotsCount || '1 Guntha',
      visitDate: visitDate || '',
      followupDate: followupDate || '',
      status: 'New',
      priority,
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
