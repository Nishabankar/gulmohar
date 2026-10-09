const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { protectAdmin } = require('../middleware/authMiddleware');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { sendPasswordResetEmail, sendPasswordChangedConfirmation } = require('../services/emailService');

// OTP Store Map (key: username, value: { otpCode, expiresAt, email })
const otpStore = new Map();

// Helper function to format SQL enquiry row to JSON matching frontend expectations
const formatEnquiryRow = (row, historyEntries = []) => {
  if (!row) return null;
  return {
    _id: row.id.toString(),
    id: row.id,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    phone: row.phone || '',
    email: row.email || '',
    plotInfo: row.plot_info || '',
    plotsCount: row.plots_count || '1 Plot',
    visitDate: row.visit_date || '',
    followupDate: row.followup_date || '',
    status: row.status || 'New',
    notes: row.notes || '',
    assignedAgentName: row.assigned_agent_name || '',
    assignedTo: row.assigned_to ? row.assigned_to.toString() : '',
    history: historyEntries.map(h => ({
      _id: h.id ? h.id.toString() : undefined,
      id: h.id,
      fieldName: h.field_name,
      oldValue: h.old_value || '—',
      newValue: h.new_value || '—',
      modifiedBy: h.modified_by || 'Admin',
      modifiedDate: h.modified_date ? new Date(h.modified_date).toISOString() : new Date().toISOString()
    })),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
  };
};

// @route   POST /api/admin/login
// @desc    Admin login directly from MySQL database & return JWT token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const [rows] = await query('SELECT * FROM admins WHERE LOWER(username) = ?', [username.toLowerCase().trim()]);
    const admin = rows[0];

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin username or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin username or password' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin.id.toString(),
        username: admin.username,
        name: admin.name || (admin.role === 'SuperAdmin' ? 'Admin Control Panel' : admin.username),
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin Login MySQL Error:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error during Admin Login', error: error.message });
  }
});

// @route   GET /api/admin/verify
// @desc    Verify current admin JWT token
// @access  Protected
router.get('/verify', protectAdmin, async (req, res) => {
  return res.json({ success: true, admin: req.admin });
});

// @route   POST /api/admin/request-password-reset
// @desc    Verify username & email, generate 6-digit OTP, send email confirmation
// @access  Public
router.post('/request-password-reset', async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ success: false, message: 'Please provide registered username and email address.' });
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    const [rows] = await query(
      'SELECT id, name, username, email FROM admins WHERE LOWER(username) = ? AND LOWER(email) = ? LIMIT 1',
      [cleanUsername, cleanEmail]
    );

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No account found with this username and email address.' });
    }

    const adminUser = rows[0];
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(cleanUsername, { otpCode, expiresAt, email: cleanEmail });

    // Send confirmation email
    const emailResult = await sendPasswordResetEmail(cleanEmail, adminUser.name || adminUser.username, otpCode);

    let msg = `Verification OTP email sent to ${cleanEmail}. Please check your inbox.`;
    if (!emailResult.isConfigured) {
      msg = `Verification OTP sent to ${cleanEmail}. [Test OTP Code: ${otpCode}]`;
    }

    return res.json({
      success: true,
      message: msg,
      emailSent: emailResult.success,
      isConfigured: Boolean(emailResult.isConfigured),
      previewUrl: emailResult.previewUrl || null
    });
  } catch (error) {
    console.error('Error requesting password reset:', error.message);
    return res.status(500).json({ success: false, message: 'Error processing password reset request', error: error.message });
  }
});

// @route   POST /api/admin/forgot-password
// @desc    Verify OTP code and reset user password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { username, email, otpCode, newPassword } = req.body;

    if (!username || !email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide username, email, and new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    // Verify OTP if provided
    if (otpCode) {
      const storedOtp = otpStore.get(cleanUsername);
      if (!storedOtp || storedOtp.otpCode !== otpCode.trim()) {
        return res.status(400).json({ success: false, message: 'Invalid verification OTP code. Please check your email.' });
      }
      if (Date.now() > storedOtp.expiresAt) {
        otpStore.delete(cleanUsername);
        return res.status(400).json({ success: false, message: 'Verification OTP code has expired. Please request a new code.' });
      }
      otpStore.delete(cleanUsername);
    }

    const [rows] = await query(
      'SELECT id, name, username, email FROM admins WHERE LOWER(username) = ? AND LOWER(email) = ? LIMIT 1',
      [cleanUsername, cleanEmail]
    );

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid username or registered email address.' });
    }

    const adminUser = rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, adminUser.id]);

    // Send password changed confirmation email
    sendPasswordChangedConfirmation(cleanEmail, adminUser.name || adminUser.username);

    return res.json({
      success: true,
      message: 'Password reset successfully! Confirmation notification sent to your email.'
    });
  } catch (error) {
    console.error('Error in forgot-password:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error during password reset', error: error.message });
  }
});

// @route   PUT /api/admin/profile
// @desc    Update logged-in admin/agent profile details and optional password change
// @access  Protected
router.put('/profile', protectAdmin, async (req, res) => {
  try {
    const adminId = req.admin.id;
    const adminUsername = (req.admin.username || '').toLowerCase().trim();
    const { name, email, phone, currentPassword, newPassword } = req.body;

    const [rows] = await query(
      'SELECT * FROM admins WHERE id = ? OR LOWER(username) = ? LIMIT 1',
      [adminId, adminUsername]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found in database' });
    }

    const adminUser = rows[0];
    const targetId = adminUser.id;
    let updateCols = [];
    let updateVals = [];

    if (name !== undefined && name.trim()) { updateCols.push('name = ?'); updateVals.push(name.trim()); }
    if (email !== undefined && email.trim()) { updateCols.push('email = ?'); updateVals.push(email.toLowerCase().trim()); }
    if (phone !== undefined && phone.trim()) { updateCols.push('phone = ?'); updateVals.push(phone.trim()); }

    // If changing password
    if (newPassword && newPassword.trim()) {
      if (!currentPassword || !currentPassword.trim()) {
        return res.status(400).json({ success: false, message: 'Current password is required to change password.' });
      }

      const isMatch = await bcrypt.compare(currentPassword.trim(), adminUser.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }

      if (newPassword.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
      updateCols.push('password = ?');
      updateVals.push(hashedPassword);
    }

    if (updateCols.length > 0) {
      updateVals.push(targetId);
      await query(`UPDATE admins SET ${updateCols.join(', ')} WHERE id = ?`, updateVals);
    }

    const [updatedRows] = await query('SELECT id, name, username, email, phone, role FROM admins WHERE id = ?', [targetId]);
    const updatedUser = updatedRows[0];

    const token = jwt.sign(
      { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const userObj = {
      id: updatedUser.id.toString(),
      _id: updatedUser.id.toString(),
      username: updatedUser.username,
      name: updatedUser.name || updatedUser.username,
      email: updatedUser.email || '',
      phone: updatedUser.phone || '',
      role: updatedUser.role
    };

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      token,
      admin: userObj,
      user: userObj
    });
  } catch (error) {
    console.error('Error updating profile:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error updating profile', error: error.message });
  }
});

// @route   GET /api/admin/enquiries
// @desc    Get all leads directly from MySQL database
// @access  Protected
router.get('/enquiries', protectAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = 'SELECT * FROM enquiries WHERE 1=1';
    let params = [];

    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ? OR plot_info LIKE ?)';
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY created_at DESC';

    const [enquiries] = await query(sql, params);

    // Fetch all history entries for these enquiries
    let enquiryIds = enquiries.map(e => e.id);
    let historyMap = {};
    if (enquiryIds.length > 0) {
      const placeholders = enquiryIds.map(() => '?').join(',');
      const [allHistory] = await query(
        `SELECT * FROM enquiry_history WHERE enquiry_id IN (${placeholders}) ORDER BY modified_date ASC`,
        enquiryIds
      );
      allHistory.forEach(h => {
        if (!historyMap[h.enquiry_id]) historyMap[h.enquiry_id] = [];
        historyMap[h.enquiry_id].push(h);
      });
    }

    const formattedData = enquiries.map(e => formatEnquiryRow(e, historyMap[e.id] || []));
    return res.json({ success: true, count: formattedData.length, data: formattedData });
  } catch (error) {
    console.error('Error fetching enquiries from MySQL:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error: Could not fetch enquiries from MySQL', error: error.message });
  }
});

// @route   GET /api/admin/stats
// @desc    Get metrics stats summary directly from MySQL
// @access  Protected
router.get('/stats', protectAdmin, async (req, res) => {
  try {
    const [[{ totalLeads }]] = await query('SELECT COUNT(*) AS totalLeads FROM enquiries');
    const [[{ newLeads }]] = await query("SELECT COUNT(*) AS newLeads FROM enquiries WHERE status = 'New'");
    const [[{ scheduledVisits }]] = await query("SELECT COUNT(*) AS scheduledVisits FROM enquiries WHERE status = 'Site Visit Scheduled'");
    const [[{ closedDeals }]] = await query("SELECT COUNT(*) AS closedDeals FROM enquiries WHERE status = 'Closed'");

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
    console.error('Error fetching stats from MySQL:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   GET /api/admin/enquiries/:id
// @desc    Get single lead details with history directly from MySQL
// @access  Protected
router.get('/enquiries/:id', protectAdmin, async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.id, 10);
    if (isNaN(enquiryId)) {
      return res.status(404).json({ success: false, message: 'Invalid enquiry ID' });
    }

    const [rows] = await query('SELECT * FROM enquiries WHERE id = ?', [enquiryId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Enquiry record not found in MySQL' });
    }

    const [history] = await query('SELECT * FROM enquiry_history WHERE enquiry_id = ? ORDER BY modified_date ASC', [enquiryId]);
    const data = formatEnquiryRow(rows[0], history);

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching single enquiry:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   PATCH /api/admin/enquiries/:id
// @desc    Update lead details directly in MySQL & log history
// @access  Protected
router.patch('/enquiries/:id', protectAdmin, async (req, res) => {
  try {
    const { firstName, lastName, phone, oldPhone, email, plotsCount, plotInfo, visitDate, followupDate, status, notes, assignedAgentName, assignedTo, updatedBy } = req.body;
    
    let enquiryId = parseInt(req.params.id, 10);
    let existing = null;

    if (!isNaN(enquiryId)) {
      const [rows] = await query('SELECT * FROM enquiries WHERE id = ?', [enquiryId]);
      if (rows && rows.length > 0) existing = rows[0];
    }
    if (!existing && oldPhone) {
      const [rows] = await query('SELECT * FROM enquiries WHERE phone = ?', [oldPhone.trim()]);
      if (rows && rows.length > 0) existing = rows[0];
    }
    if (!existing && phone) {
      const [rows] = await query('SELECT * FROM enquiries WHERE phone = ?', [phone.trim()]);
      if (rows && rows.length > 0) existing = rows[0];
    }

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Enquiry record not found in MySQL' });
    }

    const performer = updatedBy || (req.admin ? (req.admin.name || req.admin.username || 'Admin') : 'Admin');
    const targetId = existing.id;

    const fieldsToCompare = [
      { col: 'first_name', label: 'First Name', incoming: firstName },
      { col: 'last_name', label: 'Last Name', incoming: lastName },
      { col: 'phone', label: 'Mobile No.', incoming: phone },
      { col: 'email', label: 'Email Address', incoming: email },
      { col: 'plots_count', label: 'No. of Guntha', incoming: plotsCount },
      { col: 'plot_info', label: 'Plot Info', incoming: plotInfo },
      { col: 'visit_date', label: 'Visit Date', incoming: visitDate },
      { col: 'followup_date', label: 'Followup Date', incoming: followupDate },
      { col: 'status', label: 'Status', incoming: status },
      { col: 'notes', label: 'Notes', incoming: notes },
      { col: 'assigned_agent_name', label: 'Assigned Agent', incoming: assignedAgentName }
    ];

    let newHistoryEntries = [];
    let updateCols = [];
    let updateVals = [];

    fieldsToCompare.forEach(f => {
      if (f.incoming !== undefined) {
        updateCols.push(`${f.col} = ?`);
        updateVals.push((f.incoming || '').toString().trim());

        const oldVal = (existing[f.col] || '').toString().trim();
        const newVal = (f.incoming || '').toString().trim();
        
        if (oldVal !== newVal) {
          newHistoryEntries.push({
            fieldName: f.label,
            oldValue: oldVal || '—',
            newValue: newVal || '—',
            modifiedBy: performer
          });
        }
      }
    });

    if (assignedTo !== undefined) {
      const parsedAssigned = assignedTo ? parseInt(assignedTo, 10) : null;
      updateCols.push('assigned_to = ?');
      updateVals.push(isNaN(parsedAssigned) ? null : parsedAssigned);
    }

    if (updateCols.length > 0) {
      updateVals.push(targetId);
      await query(`UPDATE enquiries SET ${updateCols.join(', ')} WHERE id = ?`, updateVals);
    }

    // Insert history entries into enquiry_history
    for (const h of newHistoryEntries) {
      await query(
        `INSERT INTO enquiry_history (enquiry_id, field_name, old_value, new_value, modified_by, modified_date) VALUES (?, ?, ?, ?, ?, ?)`,
        [targetId, h.fieldName, h.oldValue, h.newValue, h.modifiedBy, new Date()]
      );
    }

    const [updatedRows] = await query('SELECT * FROM enquiries WHERE id = ?', [targetId]);
    const [historyRows] = await query('SELECT * FROM enquiry_history WHERE enquiry_id = ? ORDER BY modified_date ASC', [targetId]);
    const updatedEnquiry = formatEnquiryRow(updatedRows[0], historyRows);

    return res.json({ success: true, message: 'Enquiry updated in MySQL', data: updatedEnquiry });
  } catch (error) {
    console.error('Error updating enquiry in MySQL:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error', error: error.message });
  }
});

// @route   DELETE /api/admin/enquiries/:id
// @desc    Delete an enquiry directly from MySQL
// @access  Protected
router.delete('/enquiries/:id', protectAdmin, async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.id, 10);
    if (isNaN(enquiryId)) {
      return res.status(404).json({ success: false, message: 'Invalid enquiry ID' });
    }

    const [result] = await query('DELETE FROM enquiries WHERE id = ?', [enquiryId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Enquiry record not found in MySQL' });
    }

    return res.json({ success: true, message: 'Enquiry deleted from MySQL' });
  } catch (error) {
    console.error('Error deleting enquiry from MySQL:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   GET /api/admin/agents
// @desc    Get all created sales agents from MySQL database
// @access  Protected
router.get('/agents', protectAdmin, async (req, res) => {
  try {
    const [agents] = await query("SELECT id, name, username, email, phone, role, created_at, updated_at FROM admins WHERE LOWER(role) != 'superadmin' ORDER BY id ASC");
    const data = agents.map(a => ({
      _id: a.id.toString(),
      id: a.id,
      name: a.name || '',
      username: a.username,
      email: a.email || '',
      phone: a.phone || '',
      role: a.role,
      createdAt: a.created_at,
      updatedAt: a.updated_at
    }));
    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Error fetching agents:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   POST /api/admin/agents
// @desc    Create new sales agent in MySQL database
// @access  Protected
router.post('/agents', protectAdmin, async (req, res) => {
  try {
    const { name, username, password, phone, email } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, username, and password' });
    }

    const [existing] = await query('SELECT id FROM admins WHERE LOWER(username) = ?', [username.toLowerCase().trim()]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Agent with this username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const agentEmail = (email && email.trim()) ? email.toLowerCase().trim() : `${username.toLowerCase().trim()}@gulmoharcity.com`;

    const [result] = await query(
      `INSERT INTO admins (name, username, email, phone, password, role) VALUES (?, ?, ?, ?, ?, 'Agent')`,
      [name.trim(), username.toLowerCase().trim(), agentEmail, phone ? phone.trim() : '', hashedPassword]
    );

    const newAgentId = result.insertId;

    return res.json({
      success: true,
      message: 'Sales Agent created successfully in MySQL',
      data: {
        _id: newAgentId.toString(),
        id: newAgentId,
        name: name.trim(),
        username: username.toLowerCase().trim(),
        email: agentEmail,
        phone: phone ? phone.trim() : '',
        role: 'Agent'
      }
    });
  } catch (error) {
    console.error('Error creating agent:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   DELETE /api/admin/agents/:id
// @desc    Delete sales agent from MySQL database
// @access  Protected
router.delete('/agents/:id', protectAdmin, async (req, res) => {
  try {
    const agentId = parseInt(req.params.id, 10);
    if (isNaN(agentId)) {
      return res.status(404).json({ success: false, message: 'Invalid agent ID' });
    }

    await query('DELETE FROM admins WHERE id = ? AND role = "Agent"', [agentId]);
    return res.json({ success: true, message: 'Agent removed successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   PATCH /api/admin/agents/:id
// @desc    Update sales agent details in MySQL database
// @access  Protected
router.patch('/agents/:id', protectAdmin, async (req, res) => {
  try {
    const agentId = parseInt(req.params.id, 10);
    if (isNaN(agentId)) {
      return res.status(404).json({ success: false, message: 'Invalid agent ID' });
    }

    const { name, username, password, phone, email } = req.body;
    let updateCols = [];
    let updateVals = [];

    if (name !== undefined) { updateCols.push('name = ?'); updateVals.push(name.trim()); }
    if (username !== undefined) { updateCols.push('username = ?'); updateVals.push(username.toLowerCase().trim()); }
    if (phone !== undefined) { updateCols.push('phone = ?'); updateVals.push(phone.trim()); }
    if (email !== undefined) { updateCols.push('email = ?'); updateVals.push(email.toLowerCase().trim()); }
    if (password && password.trim() && !password.includes('•••')) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateCols.push('password = ?');
      updateVals.push(hashedPassword);
    }

    if (updateCols.length > 0) {
      updateVals.push(agentId);
      await query(`UPDATE admins SET ${updateCols.join(', ')} WHERE id = ?`, updateVals);
    }

    const [updatedRows] = await query('SELECT id, name, username, email, phone, role FROM admins WHERE id = ?', [agentId]);
    const agent = updatedRows[0];

    return res.json({
      success: true,
      message: 'Agent updated successfully',
      data: {
        _id: agent.id.toString(),
        id: agent.id,
        name: agent.name,
        username: agent.username,
        email: agent.email,
        phone: agent.phone,
        role: agent.role
      }
    });
  } catch (error) {
    console.error('Error updating agent:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error' });
  }
});

// @route   GET /api/admin/column-preferences
// @desc    Get logged-in user's customized column preferences from MySQL
// @access  Protected
router.get('/column-preferences', protectAdmin, async (req, res) => {
  try {
    const adminId = parseInt(req.admin.id, 10) || 0;
    const username = (req.admin.username || '').toLowerCase().trim();

    const [rows] = await query('SELECT column_preferences FROM admins WHERE id = ? OR LOWER(username) = ?', [adminId, username]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let prefs = rows[0].column_preferences;
    if (typeof prefs === 'string') {
      try { prefs = JSON.parse(prefs); } catch (e) { prefs = []; }
    }

    return res.json({ success: true, columnPreferences: prefs || [] });
  } catch (error) {
    console.error('Error fetching column preferences:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error', error: error.message });
  }
});

// @route   PUT /api/admin/column-preferences
// @desc    Update logged-in user's customized column preferences in MySQL
// @access  Protected
router.put('/column-preferences', protectAdmin, async (req, res) => {
  try {
    const adminId = parseInt(req.admin.id, 10) || 0;
    const username = (req.admin.username || '').toLowerCase().trim();
    const { columnPreferences } = req.body;

    if (!Array.isArray(columnPreferences)) {
      return res.status(400).json({ success: false, message: 'columnPreferences must be an array' });
    }

    const [result] = await query(
      'UPDATE admins SET column_preferences = ? WHERE id = ? OR LOWER(username) = ?',
      [JSON.stringify(columnPreferences), adminId, username]
    );

    console.log(`📝 Column preferences updated in MySQL for user '${username}' (ID: ${adminId}, Affected: ${result.affectedRows})`);

    return res.json({ 
      success: true, 
      message: 'Column preferences updated successfully in MySQL', 
      affectedRows: result.affectedRows,
      columnPreferences 
    });
  } catch (error) {
    console.error('Error updating column preferences:', error.message);
    return res.status(500).json({ success: false, message: 'Database Error', error: error.message });
  }
});

// @route   POST /api/admin/enquiries/import
// @desc    Bulk import leads from CSV/Google Sheet with auto alternate agent assignment (Round-Robin)
// @access  Protected (Admin only)
router.post('/enquiries/import', protectAdmin, async (req, res) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ success: false, message: 'No leads provided for import' });
    }

    // 1. Fetch all active non-SuperAdmin Agents for Alternate Round-Robin assignment
    const [agents] = await query("SELECT id, name, username, role FROM admins WHERE LOWER(role) != 'superadmin' ORDER BY id ASC");
    
    // Pick starting Round-Robin index after the last assigned agent in DB for seamless continuation
    const [lastEnquiry] = await query("SELECT assigned_to FROM enquiries WHERE assigned_to IS NOT NULL ORDER BY id DESC LIMIT 1");
    let roundRobinIndex = 0;
    if (lastEnquiry.length > 0 && agents.length > 0) {
      const lastAssignedId = lastEnquiry[0].assigned_to;
      const lastIdx = agents.findIndex(a => a.id === lastAssignedId);
      if (lastIdx !== -1) {
        roundRobinIndex = (lastIdx + 1) % agents.length;
      }
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const lead of leads) {
      const cleanPhone = (lead.phone || '').toString().replace(/\D/g, '').trim();
      if (!cleanPhone || cleanPhone.length < 10) {
        skippedCount++;
        continue;
      }

      // Check if phone number already exists in MySQL database
      const [existing] = await query('SELECT id FROM enquiries WHERE phone = ? LIMIT 1', [cleanPhone]);
      if (existing.length > 0) {
        skippedCount++;
        continue;
      }

      const firstName = (lead.firstName || 'Customer').trim();
      const lastName = (lead.lastName || '').trim();
      const email = (lead.email || '').toLowerCase().trim();
      const plotsCount = (lead.plotsCount || '1 Guntha').trim();
      const status = (lead.status || 'New').trim();
      const notes = (lead.notes || '').trim();
      const visitDate = (lead.visitDate || '').trim();
      const followupDate = (lead.followupDate || '').trim();
      const createdTimeVal = (lead.createdTime && lead.createdTime.trim()) ? lead.createdTime.trim() : null;

      // Determine Assigned Agent (if sheet provided caller name, search matching agent; else Round-Robin)
      let assignedAgent = null;
      if (lead.assignedAgentName && lead.assignedAgentName.trim()) {
        const searchName = lead.assignedAgentName.trim().toLowerCase();
        assignedAgent = agents.find(a => 
          (a.name || '').toLowerCase() === searchName || 
          (a.username || '').toLowerCase() === searchName
        );
      }

      // If no agent matched or none provided, use Alternate Round-Robin
      if (!assignedAgent && agents.length > 0) {
        assignedAgent = agents[roundRobinIndex % agents.length];
        roundRobinIndex++;
      }

      const assignedTo = assignedAgent ? assignedAgent.id : null;
      const assignedAgentName = assignedAgent ? assignedAgent.name : (lead.assignedAgentName || 'Unassigned');

      // Insert into MySQL enquiries table
      const [insertResult] = await query(
        `INSERT INTO enquiries 
         (first_name, last_name, phone, email, plots_count, visit_date, followup_date, status, notes, assigned_to, assigned_agent_name, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, NOW()))`,
        [firstName, lastName, cleanPhone, email, plotsCount, visitDate, followupDate, status, notes, assignedTo, assignedAgentName, createdTimeVal]
      );

      const newId = insertResult.insertId;

      // Log initial history entry
      const performer = req.admin ? (req.admin.name || req.admin.username || 'Admin') : 'Admin';
      await query(
        `INSERT INTO enquiry_history (enquiry_id, field_name, old_value, new_value, modified_by, modified_date) VALUES (?, ?, ?, ?, ?, NOW())`,
        [newId, 'Import', '', `Imported via Google Sheet CSV & assigned to ${assignedAgentName}`, performer]
      );

      importedCount++;
    }

    // Fetch refreshed list of enquiries and history to return to frontend
    const [allRows] = await query('SELECT * FROM enquiries ORDER BY id DESC');
    let historyMap = {};
    if (allRows.length > 0) {
      const placeholders = allRows.map(() => '?').join(',');
      const [allHistory] = await query(
        `SELECT * FROM enquiry_history WHERE enquiry_id IN (${placeholders}) ORDER BY modified_date ASC`,
        allRows.map(r => r.id)
      );
      allHistory.forEach(h => {
        if (!historyMap[h.enquiry_id]) historyMap[h.enquiry_id] = [];
        historyMap[h.enquiry_id].push(h);
      });
    }

    const updatedEnquiries = allRows.map(r => formatEnquiryRow(r, historyMap[r.id] || []));

    console.log(`📥 CSV Import Complete: ${importedCount} leads imported, ${skippedCount} skipped/duplicates.`);

    return res.json({
      success: true,
      message: `Import complete: ${importedCount} leads added successfully (${skippedCount} duplicates/invalid skipped)`,
      importedCount,
      skippedCount,
      data: updatedEnquiries
    });
  } catch (error) {
    console.error('Error importing leads from CSV:', error.message);
    return res.status(500).json({ success: false, message: 'Import Database Error', error: error.message });
  }
});

module.exports = router;
