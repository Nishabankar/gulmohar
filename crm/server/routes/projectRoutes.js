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
    projectStatus: row.project_status || 'Under Construction',
    landArea: row.land_area || '',
    targetPossession: row.target_possession || '',
    reraPossession: row.rera_possession || '',
    towers: row.towers || '',
    floors: row.floors || '',
    description: row.description || '',
    projectUrl: row.project_url || '',
    area: row.area || '',
    address: row.address || '',
    assignedLeadsCount: Number(row.assigned_leads_count || 0),
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
    let sql = `SELECT p.*, 
      (SELECT COUNT(*) FROM leads l WHERE LOWER(TRIM(l.project_name)) = LOWER(TRIM(p.name))) AS assigned_leads_count
    FROM projects p WHERE 1=1`;
    const params = [];

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(developer_name) LIKE ? OR LOWER(address) LIKE ? OR LOWER(area) LIKE ? OR LOWER(rera_number) LIKE ?)';
      params.push(q, q, q, q, q);
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
    const [rows] = await query(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM leads l WHERE LOWER(TRIM(l.project_name)) = LOWER(TRIM(p.name))) AS assigned_leads_count
      FROM projects p WHERE p.id = ? LIMIT 1`,
      [id]
    );
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

// @route   POST /api/projects/import & POST /api/projects/bulk-import
// @desc    Bulk import projects from CSV (Exact same logic as Lead Table Import)
// @access  Protected
const handleBulkImportProjects = async (req, res) => {
  try {
    const { projects } = req.body;
    if (!Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({ success: false, message: 'No projects provided for import' });
    }

    const createdBy = req.admin?.username || 'Admin';

    let importedCount = 0;
    let invalidCount = 0;
    const duplicateRows = []; // sheet row indexes (project.row) skipped because project already exists

    // Duplicate check on project name (case-insensitive & trimmed)
    const nameKey = (n) => (n || '').toString().toLowerCase().trim();
    const [nameRows] = await query('SELECT name FROM projects');
    const knownNames = new Set(nameRows.map(r => nameKey(r.name)));

    const str = (v) => (v === null || v === undefined ? '' : String(v)).trim();

    for (const project of projects) {
      const cleanName = str(project.name !== undefined ? project.name : project.projectName);
      if (!cleanName) {
        invalidCount++;
        continue;
      }

      if (knownNames.has(nameKey(cleanName))) {
        duplicateRows.push(project.row);
        continue;
      }
      knownNames.add(nameKey(cleanName));

      const cleanDeveloper = str(project.developerName !== undefined ? project.developerName : project.developer);
      const cleanRera = str(project.reraNumber !== undefined ? project.reraNumber : (project.reraNo || project.rera));
      const cleanArea = str(project.area);
      const cleanAddress = str(project.address !== undefined ? project.address : project.location);

      // Normalize projectType array
      let typeArr = [];
      if (Array.isArray(project.projectType)) {
        typeArr = project.projectType.map(t => str(t)).filter(Boolean);
      } else if (typeof project.projectType === 'string' && project.projectType.trim()) {
        typeArr = project.projectType.split(/[,;|]/).map(t => str(t)).filter(Boolean);
      }
      if (typeArr.length === 0) {
        typeArr = ['Apartment'];
      }

      // Normalize typography array
      let typoArr = [];
      if (Array.isArray(project.typography)) {
        typoArr = project.typography.map(t => str(t)).filter(Boolean);
      } else if (typeof project.typography === 'string' && project.typography.trim()) {
        typoArr = project.typography.split(/[,;|]/).map(t => str(t)).filter(Boolean);
      }
      if (typoArr.length === 0) {
        typoArr = ['2 BHK'];
      }

      const projectTypeJson = JSON.stringify(typeArr);
      const typographyJson = JSON.stringify(typoArr);

      try {
        const cleanStatus = str(project.projectStatus !== undefined ? project.projectStatus : (project.status || 'Under Construction'));
        const cleanLandArea = str(project.landArea !== undefined ? project.landArea : (project.land || project.plotArea));
        const cleanTargetPoss = str(project.targetPossession !== undefined ? project.targetPossession : project.possession);
        const cleanReraPoss = str(project.reraPossession !== undefined ? project.reraPossession : project.reraPoss);
        const cleanTowers = str(project.towers !== undefined ? project.towers : project.totalTowers);
        const cleanFloors = str(project.floors !== undefined ? project.floors : project.totalFloors);
        const cleanDesc = str(project.description !== undefined ? project.description : project.desc);
        const cleanProjectUrl = str(project.projectUrl !== undefined ? project.projectUrl : (project.url !== undefined ? project.url : (project.projectLink || project.link)));

        await query(
          `INSERT INTO projects 
            (name, developer_name, project_type, project_status, typography, land_area, rera_number, target_possession, rera_possession, towers, floors, area, address, description, project_url, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [cleanName, cleanDeveloper, projectTypeJson, cleanStatus, typographyJson, cleanLandArea, cleanRera, cleanTargetPoss, cleanReraPoss, cleanTowers, cleanFloors, cleanArea || cleanAddress || 'Pune', cleanAddress, cleanDesc, cleanProjectUrl, createdBy]
        );
        importedCount++;
      } catch (err) {
        console.error('Insert project error:', err.message);
        invalidCount++;
      }
    }

    // Fetch all current projects formatted
    const [allRows] = await query(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM leads l WHERE LOWER(TRIM(l.project_name)) = LOWER(TRIM(p.name))) AS assigned_leads_count
      FROM projects p ORDER BY id DESC
    `);
    const allFormatted = (allRows || []).map(formatProjectRow);

    return res.json({
      success: true,
      message: `${importedCount} ${importedCount === 1 ? 'project' : 'projects'} imported successfully.${duplicateRows.length > 0 ? ` ${duplicateRows.length} ${duplicateRows.length === 1 ? 'duplicate was' : 'duplicates were'} skipped.` : ''}`,
      importedCount,
      duplicateRows,
      data: allFormatted
    });
  } catch (error) {
    console.error('Bulk Import Projects Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to import projects',
      error: error.message
    });
  }
};

router.post('/import', protectAdmin, handleBulkImportProjects);
router.post('/bulk-import', protectAdmin, handleBulkImportProjects);

// @route   POST /api/projects
// @desc    Create a new project
// @access  Protected (SuperAdmin, Admin, SystemAdmin, Manager)
router.post('/', protectAdmin, async (req, res) => {
  try {
    const { 
      name, 
      developerName = '', 
      projectType = [], 
      projectStatus = 'Under Construction', 
      typography = [], 
      landArea = '', 
      reraNumber = '', 
      targetPossession = '', 
      reraPossession = '', 
      towers = '', 
      floors = '', 
      area = '', 
      address = '', 
      description = '',
      projectUrl = '' 
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project name is a required field.'
      });
    }

    const cleanName = name.trim();
    const cleanDeveloper = developerName ? developerName.trim() : '';
    const cleanRera = reraNumber ? reraNumber.trim() : '';
    const cleanArea = area ? area.trim() : '';
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

    if (projectTypeArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Project Type is required. Please select at least one type.'
      });
    }

    if (typographyArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Project Typography is required. Please select at least one typography.'
      });
    }

    if (!cleanArea && !cleanAddress) {
      return res.status(400).json({
        success: false,
        message: 'Area is a required field.'
      });
    }

    const projectTypeJson = JSON.stringify(projectTypeArray);
    const typographyJson = JSON.stringify(typographyArray);
    const createdBy = req.admin?.username || 'Admin';

    const cleanStatus = projectStatus ? projectStatus.trim() : 'Under Construction';
    const cleanLandArea = landArea ? landArea.trim() : '';
    const cleanTargetPoss = targetPossession ? targetPossession.trim() : '';
    const cleanReraPoss = reraPossession ? reraPossession.trim() : '';
    const cleanTowers = towers ? towers.trim() : '';
    const cleanFloors = floors ? floors.trim() : '';
    const cleanDesc = description ? description.trim() : '';
    const cleanProjectUrl = projectUrl ? projectUrl.trim() : '';

    const [result] = await query(
      `INSERT INTO projects 
        (name, developer_name, project_type, project_status, typography, land_area, rera_number, target_possession, rera_possession, towers, floors, area, address, description, project_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cleanName, cleanDeveloper, projectTypeJson, cleanStatus, typographyJson, cleanLandArea, cleanRera, cleanTargetPoss, cleanReraPoss, cleanTowers, cleanFloors, cleanArea, cleanAddress, cleanDesc, cleanProjectUrl, createdBy]
    );

    const newProjectId = result.insertId;

    // Auto-link any unassigned leads that were requested for this project or missing location
    try {
      const typoText = Array.isArray(typographyArray) ? typographyArray.join(', ') : (typographyArray || '');
      const combinedLocation = [cleanArea, cleanAddress].filter(Boolean).join(' - ');
      await query(
        `UPDATE leads 
         SET project_name = ?, 
             typography = CASE WHEN typography IS NULL OR typography = '' THEN ? ELSE typography END,
             location = CASE WHEN location IS NULL OR location = '' THEN ? ELSE location END
         WHERE ((project_name IS NULL OR project_name = '') AND LOWER(notes) LIKE LOWER(?))
            OR ((location IS NULL OR location = '') AND LOWER(TRIM(project_name)) = LOWER(TRIM(?)))`,
        [cleanName, typoText, combinedLocation, `%[requested project: ${cleanName}]%`, cleanName]
      );
    } catch (autoAssignErr) {
      console.warn('Auto-assign pending leads error:', autoAssignErr.message);
    }

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
    const { 
      name, 
      developerName = '', 
      projectType = [], 
      projectStatus = 'Under Construction', 
      typography = [], 
      landArea = '', 
      reraNumber = '', 
      targetPossession = '', 
      reraPossession = '', 
      towers = '', 
      floors = '', 
      area = '', 
      address = '', 
      description = '',
      projectUrl = '' 
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project name is a required field.'
      });
    }

    const cleanName = name.trim();
    const cleanDeveloper = developerName ? developerName.trim() : '';
    const cleanRera = reraNumber ? reraNumber.trim() : '';
    const cleanArea = area ? area.trim() : '';
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

    if (projectTypeArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Project Type is required. Please select at least one type.'
      });
    }

    if (typographyArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Project Typography is required. Please select at least one typography.'
      });
    }

    if (!cleanArea && !cleanAddress) {
      return res.status(400).json({
        success: false,
        message: 'Area is a required field.'
      });
    }

    const projectTypeJson = JSON.stringify(projectTypeArray);
    const typographyJson = JSON.stringify(typographyArray);

    const cleanStatus = projectStatus ? projectStatus.trim() : 'Under Construction';
    const cleanLandArea = landArea ? landArea.trim() : '';
    const cleanTargetPoss = targetPossession ? targetPossession.trim() : '';
    const cleanReraPoss = reraPossession ? reraPossession.trim() : '';
    const cleanTowers = towers ? towers.trim() : '';
    const cleanFloors = floors ? floors.trim() : '';
    const cleanDesc = description ? description.trim() : '';
    const cleanProjectUrl = projectUrl ? projectUrl.trim() : '';

    await query(
      `UPDATE projects 
       SET name = ?, developer_name = ?, project_type = ?, project_status = ?, typography = ?, land_area = ?, rera_number = ?, target_possession = ?, rera_possession = ?, towers = ?, floors = ?, area = ?, address = ?, description = ?, project_url = ?
       WHERE id = ?`,
      [cleanName, cleanDeveloper, projectTypeJson, cleanStatus, typographyJson, cleanLandArea, cleanRera, cleanTargetPoss, cleanReraPoss, cleanTowers, cleanFloors, cleanArea, cleanAddress, cleanDesc, cleanProjectUrl, id]
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

    const projName = existing[0].name;

    // Check if any leads are assigned to this project - if yes, prevent deletion
    const [assignedLeads] = await query(
      'SELECT COUNT(*) as count FROM leads WHERE LOWER(TRIM(project_name)) = LOWER(TRIM(?))',
      [projName]
    );

    const leadCount = assignedLeads && assignedLeads[0] ? Number(assignedLeads[0].count || 0) : 0;
    if (leadCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete project '${projName}'. ${leadCount} ${leadCount === 1 ? 'lead is' : 'leads are'} assigned to this project. Please reassign the leads first.`
      });
    }

    await query('DELETE FROM projects WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: `Project '${projName}' deleted successfully.`
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
