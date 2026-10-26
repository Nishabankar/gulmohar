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
    const { firstName, lastName, phone, email, plotInfo, plotsCount, visitDate, visitTime, followupDate, notes, assignedAgentName: rawAgentName, salesPerson, assignedTo, createdBy, modifiedBy, projectName: rawProjName, project, projectType, typography, carpetArea, budget } = req.body;
    const assignedAgentName = rawAgentName !== undefined ? rawAgentName : salesPerson;
    const projectName = rawProjName !== undefined ? rawProjName : project;
    // Default priority for new leads is 'Hot'
    const priority = isDashboardRequest(req) ? (matchOption(req.body.priority, PRIORITY_OPTIONS) || 'Hot') : 'Hot';

    if (!firstName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'First name and phone number are required fields.'
      });
    }

    const cleanPhone = phone.trim();
    const cleanEmail = (email && email.trim()) ? email.toLowerCase().trim() : '';

    // Check for duplicate phone number
    const [existingPhone] = await query('SELECT id FROM leads WHERE phone = ?', [cleanPhone]);
    if (existingPhone && existingPhone.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A lead with mobile number '${cleanPhone}' already exists.`
      });
    }

    // Check for duplicate email address if provided
    if (cleanEmail) {
      const [existingEmail] = await query('SELECT id FROM leads WHERE LOWER(email) = ? AND email != ""', [cleanEmail]);
      if (existingEmail && existingEmail.length > 0) {
        return res.status(400).json({
          success: false,
          message: `A lead with email address '${cleanEmail}' already exists.`
        });
      }
    }

    // Only a real Agent (never an admin) can be assigned; a name alone is not trusted
    let finalAssignedAgentName = '';
    let finalAssignedTo = assignedTo ? parseInt(assignedTo, 10) : null;
    if (isNaN(finalAssignedTo)) finalAssignedTo = null;

    if (finalAssignedTo) {
      const [agentRows] = await query("SELECT id, name, username FROM users WHERE id = ? AND role IN ('SalesExecutive', 'Agent')", [finalAssignedTo]);
      if (!agentRows || agentRows.length === 0) {
        finalAssignedTo = null;
        finalAssignedAgentName = '';
      } else {
        finalAssignedAgentName = agentRows[0].name || agentRows[0].username;
      }
    }

    // If agent name is missing or Unassigned, perform Round-Robin across active Sales Executives in MySQL
    if (!finalAssignedAgentName) {
      const [activeAgents] = await query("SELECT id, name, username FROM users WHERE role IN ('SalesExecutive', 'Agent') ORDER BY id ASC");
      if (activeAgents && activeAgents.length > 0) {
        const [countRows] = await query("SELECT COUNT(*) AS total FROM leads");
        const total = countRows[0]?.total || 0;
        const agentIndex = total % activeAgents.length;
        const selectedAgent = activeAgents[agentIndex];
        finalAssignedAgentName = selectedAgent.name || selectedAgent.username;
        finalAssignedTo = selectedAgent.id;
      }
    }

    let rawCreatedBy = (createdBy || '').trim();
    const lowerCreator = rawCreatedBy.toLowerCase();
    let finalCreatedBy = 'System';
    if (rawCreatedBy && !['super admin', 'superadmin', 'admin', 'system admin', 'systemadmin', 'system', 'client'].includes(lowerCreator)) {
      finalCreatedBy = rawCreatedBy; // Sales Executive name, e.g. Nisha or Mansi
    }

    // Double-check with JWT token: if logged in as a Sales Executive, always attribute to them
    const authToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (authToken) {
      try {
        const decoded = jwt.verify(authToken, JWT_SECRET);
        const callerRole = (decoded.role || '').toLowerCase();
        const callerUsername = (decoded.username || '').toLowerCase();
        const isCallerAdmin = ['superadmin', 'systemadmin', 'admin'].includes(callerRole) || ['admin', 'systemadmin', 'system'].includes(callerUsername);
        if (!isCallerAdmin && decoded.id) {
          const [userRows] = await query('SELECT name, username FROM users WHERE id = ?', [decoded.id]);
          if (userRows && userRows.length > 0) {
            finalCreatedBy = userRows[0].name || userRows[0].username;
          }
        }
      } catch (e) {
        // Token invalid or expired, preserve existing finalCreatedBy
      }
    }

    const noteAuthor = finalCreatedBy !== 'System' ? finalCreatedBy : (createdBy || modifiedBy || 'Client');
    const initialNotes = notes ? notes.trim() : '';

    // Auto-convert plotsCount (Guntha) to carpetArea if carpetArea not explicitly provided
    let finalCarpetArea = (carpetArea || '').trim();
    if (!finalCarpetArea && plotsCount) {
      const match = String(plotsCount).match(/(\d+)/);
      finalCarpetArea = match ? `${parseInt(match[1], 10) * 1000} sqft` : String(plotsCount).trim();
    }

    // Insert into leads table
    const [result] = await query(
      `INSERT INTO leads 
        (first_name, last_name, phone, email, plot_info, visit_date, visit_time, followup_date, status, priority, project_name, typography, carpet_area, budget, notes, assigned_agent_name, assigned_to, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'New', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName.trim(),
        (lastName || '').trim(),
        cleanPhone,
        cleanEmail,
        (plotInfo || '').trim(),
        visitDate || '',
        (visitTime && visitTime.trim()) ? visitTime.trim() : (followupDate ? '11:00' : ''),
        followupDate || '',
        priority,
        (projectName || '').trim(),
        (typography || '').trim(),
        finalCarpetArea,
        (budget || '').trim(),
        initialNotes,
        finalAssignedAgentName,
        finalAssignedTo,
        finalCreatedBy
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
      phone: cleanPhone,
      email: cleanEmail || '',
      plotInfo: plotInfo || '',
      carpetArea: finalCarpetArea,
      visitDate: visitDate || '',
      visitTime: visitTime || '',
      followupDate: followupDate || '',
      status: 'New',
      priority,
      projectName: (projectName || '').trim(),
      projectType: (projectType || '').trim(),
      typography: (typography || '').trim(),
      carpetArea: (carpetArea || '').trim(),
      budget: (budget || '').trim(),
      notes: initialNotes,
      assignedAgentName: finalAssignedAgentName,
      assignedTo: finalAssignedTo ? finalAssignedTo.toString() : '',
      createdBy: finalCreatedBy,
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
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      if (error.message.includes('phone')) {
        return res.status(400).json({ success: false, message: 'A lead with this mobile number already exists.' });
      }
      if (error.message.includes('email')) {
        return res.status(400).json({ success: false, message: 'A lead with this email address already exists.' });
      }
      return res.status(400).json({ success: false, message: 'A lead with this mobile number or email already exists.' });
    }
    return res.status(500).json({
      success: false,
      message: 'Database Error: Could not save enquiry to MySQL',
      error: error.message
    });
  }
});

module.exports = router;
