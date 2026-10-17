const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { protectAdmin } = require('../middleware/authMiddleware');

// Helper to safely parse JSON or comma-separated list into string array
const parseList = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return String(val)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
};

// Helper to format DB row to clean JSON for frontend
const formatProjectRow = (row) => {
  if (!row) return null;
  return {
    _id: row.id.toString(),
    id: row.id,
    name: row.name || '',
    developerName: row.developer_name || '',
    projectType: parseList(row.project_type),
    typography: parseList(row.typography),
    reraNumber: row.rera_number || '',
    address: row.address || '',
    createdBy: row.created_by || 'Admin',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
  };
};

// @route   GET /api/projects
// @desc    Get all projects with optional search & filter
// @access  Protected
router.get('/', protectAdmin, async (req, res) => {
  try {
    const { search = '', type = '' } = req.query;
    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(developer_name) LIKE ? OR LOWER(address) LIKE ? OR LOWER(rera_number) LIKE ?)';
      params.push(q, q, q, q);
    }

    if (type && type.trim() && type !== 'All') {
      const t = `%${type.trim().toLowerCase()}%`;
      sql += ' AND LOWER(project_type) LIKE ?';
      params.push(t);
    }

    sql += ' ORDER BY id DESC';

    const [rows] = await query(sql, params);
    const projects = (rows || []).map(formatProjectRow);

    return res.json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('Fetch Projects Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch projects from database',
      error: error.message
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project by ID
// @access  Protected
router.get('/:id', protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await query('SELECT * FROM projects WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    return res.json({
      success: true,
      project: formatProjectRow(rows[0])
    });
  } catch (error) {
    console.error('Get Project By ID Error:', error.message);
    return res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Protected (SuperAdmin, Admin, SystemAdmin, Manager)
router.post('/', protectAdmin, async (req, res) => {
  try {
    const { name, developerName = '', projectType = [], typography = [], reraNumber = '', address = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project name is a required field.'
      });
    }

    const cleanName = name.trim();
    const cleanDeveloper = developerName ? developerName.trim() : '';
    const cleanRera = reraNumber ? reraNumber.trim() : '';
    const cleanAddress = address ? address.trim() : '';

    // Check for duplicate project name
    const [existing] = await query('SELECT id FROM projects WHERE LOWER(name) = ? LIMIT 1', [cleanName.toLowerCase()]);
    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A project with the name '${cleanName}' already exists.`
      });
    }

    const projectTypeArray = Array.isArray(projectType) ? projectType : (projectType ? [projectType] : []);
    const typographyArray = Array.isArray(typography) ? typography : (typography ? [typography] : []);

    const projectTypeJson = JSON.stringify(projectTypeArray);
    const typographyJson = JSON.stringify(typographyArray);
    const createdBy = req.admin?.username || 'Admin';

    const [result] = await query(
      `INSERT INTO projects (name, developer_name, project_type, typography, rera_number, address, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cleanName, cleanDeveloper, projectTypeJson, typographyJson, cleanRera, cleanAddress, createdBy]
    );

    const newProjectId = result.insertId;
    const [createdRows] = await query('SELECT * FROM projects WHERE id = ? LIMIT 1', [newProjectId]);

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: formatProjectRow(createdRows[0])
    });
  } catch (error) {
    console.error('Create Project Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create project in database',
      error: error.message
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project details
// @access  Protected
router.put('/:id', protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, developerName = '', projectType = [], typography = [], reraNumber = '', address = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project name is a required field.'
      });
    }

    const cleanName = name.trim();
    const cleanDeveloper = developerName ? developerName.trim() : '';
    const cleanRera = reraNumber ? reraNumber.trim() : '';
    const cleanAddress = address ? address.trim() : '';

    // Check if project exists
    const [existing] = await query('SELECT id FROM projects WHERE id = ? LIMIT 1', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Check duplicate name on another project
    const [duplicateName] = await query('SELECT id FROM projects WHERE LOWER(name) = ? AND id != ? LIMIT 1', [cleanName.toLowerCase(), id]);
    if (duplicateName && duplicateName.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Another project with the name '${cleanName}' already exists.`
      });
    }

    const projectTypeArray = Array.isArray(projectType) ? projectType : (projectType ? [projectType] : []);
    const typographyArray = Array.isArray(typography) ? typography : (typography ? [typography] : []);

    const projectTypeJson = JSON.stringify(projectTypeArray);
    const typographyJson = JSON.stringify(typographyArray);

    await query(
      `UPDATE projects 
       SET name = ?, developer_name = ?, project_type = ?, typography = ?, rera_number = ?, address = ?
       WHERE id = ?`,
      [cleanName, cleanDeveloper, projectTypeJson, typographyJson, cleanRera, cleanAddress, id]
    );

    const [updatedRows] = await query('SELECT * FROM projects WHERE id = ? LIMIT 1', [id]);

    return res.json({
      success: true,
      message: 'Project updated successfully',
      project: formatProjectRow(updatedRows[0])
    });
  } catch (error) {
    console.error('Update Project Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Protected (SuperAdmin, Admin, SystemAdmin)
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT id, name FROM projects WHERE id = ? LIMIT 1', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await query('DELETE FROM projects WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: `Project '${existing[0].name}' deleted successfully.`
    });
  } catch (error) {
    console.error('Delete Project Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
});

module.exports = router;
