import React, { useState, useEffect, useRef, useMemo } from 'react';
import { API_BASE_URL } from '../config';

export const PROJECT_TYPES = [
  'Apartment',
  'Villa',
  'Plots'
];

export const PROJECT_AREAS = [
  'Kharadi',
  'Upper Kharadi',
  'Hadapsar',
  'Mundhwa',
  'Keshavnagar',
  'Wagholi',
  'Shikrapur'
];

export const APARTMENT_TYPOGRAPHY_GROUPS = [
  {
    group: 'Studio',
    items: ['Studio']
  },
  {
    group: '1 BHK',
    items: ['1 BHK', '1 BHK Duplex', '1 BHK Penthouse', '1 BHK Garden']
  },
  {
    group: '1.5 BHK',
    items: ['1.5 BHK', '1.5 BHK Duplex', '1.5 BHK Penthouse', '1.5 BHK Garden']
  },
  {
    group: '2 BHK',
    items: ['2 BHK', '2 BHK Duplex', '2 BHK Penthouse', '2 BHK Garden']
  },
  {
    group: '2.5 BHK',
    items: ['2.5 BHK', '2.5 BHK Duplex', '2.5 BHK Penthouse', '2.5 BHK Garden']
  },
  {
    group: '3 BHK',
    items: ['3 BHK', '3 BHK Duplex', '3 BHK Penthouse', '3 BHK Garden']
  },
  {
    group: '3.5 BHK',
    items: ['3.5 BHK', '3.5 BHK Duplex', '3.5 BHK Penthouse', '3.5 BHK Garden']
  },
  {
    group: '4 BHK',
    items: ['4 BHK', '4 BHK Duplex', '4 BHK Penthouse', '4 BHK Garden']
  },
  {
    group: '4.5 BHK',
    items: ['4.5 BHK', '4.5 BHK Duplex', '4.5 BHK Penthouse', '4.5 BHK Garden']
  },
  {
    group: '5 BHK',
    items: ['5 BHK', '5 BHK Duplex', '5 BHK Penthouse', '5 BHK Garden']
  }
];

export const TYPOGRAPHY_BY_TYPE = {
  Apartment: [
    'Studio',
    '1 BHK', '1 BHK Duplex', '1 BHK Penthouse', '1 BHK Garden',
    '1.5 BHK', '1.5 BHK Duplex', '1.5 BHK Penthouse', '1.5 BHK Garden',
    '2 BHK', '2 BHK Duplex', '2 BHK Penthouse', '2 BHK Garden',
    '2.5 BHK', '2.5 BHK Duplex', '2.5 BHK Penthouse', '2.5 BHK Garden',
    '3 BHK', '3 BHK Duplex', '3 BHK Penthouse', '3 BHK Garden',
    '3.5 BHK', '3.5 BHK Duplex', '3.5 BHK Penthouse', '3.5 BHK Garden',
    '4 BHK', '4 BHK Duplex', '4 BHK Penthouse', '4 BHK Garden',
    '4.5 BHK', '4.5 BHK Duplex', '4.5 BHK Penthouse', '4.5 BHK Garden',
    '5 BHK', '5 BHK Duplex', '5 BHK Penthouse', '5 BHK Garden',
    'Penthouse / Duplex'
  ],
  Villa: [
    '1 BHK',
    '1.5 BHK',
    '2 BHK',
    '2.5 BHK',
    '3 BHK',
    '3.5 BHK',
    '4 BHK',
    '4.5 BHK',
    '5 BHK'
  ],
  Plots: [
    'Residential',
    'Industrial',
    'Agriculture',
    'Non-Agriculture'
  ],
  Studio: [
    'Studio', '1 RK Studio', 'Executive Studio'
  ],
  'Farm House': []
};

const TYPE_BADGE_STYLE = {
  Apartment: 'bg-blue-50 text-blue-700 border-blue-200',
  Villa: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Plots: 'bg-amber-50 text-amber-800 border-amber-200',
  Industrial: 'bg-slate-100 text-slate-800 border-slate-300',
  Agriculture: 'bg-green-50 text-green-800 border-green-200',
  'Non-Agriculture': 'bg-teal-50 text-teal-800 border-teal-200',
  Residential: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  Studio: 'bg-purple-50 text-purple-700 border-purple-200',
  'Farm House': 'bg-amber-50 text-amber-800 border-amber-200'
};

const PROJECT_COLUMN_WIDTH_MAP = {
  projectId: 85,
  projectName: 195,
  developerName: 165,
  projectType: 160,
  typography: 150,
  reraNumber: 140,
  location: 280,
  actions: 105
};

const DEFAULT_PROJECT_COLUMNS = [
  { id: 'projectId', label: '# ID', visible: true, pinned: true },
  { id: 'projectName', label: 'Project', visible: true, pinned: true },
  { id: 'developerName', label: 'Developer', visible: true, pinned: false },
  { id: 'projectType', label: 'Project Type', visible: true, pinned: false },
  { id: 'typography', label: 'Typography', visible: true, pinned: false },
  { id: 'reraNumber', label: 'RERA No', visible: true, pinned: false },
  { id: 'location', label: 'Area / Address', visible: true, pinned: false },
  { id: 'actions', label: 'Actions', visible: true, pinned: true }
];

export default function ProjectManagement({ currentUser, isSuperAdmin, isAdmin }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Project Column Configuration State & Persistence
  const [projectColumnConfig, setProjectColumnConfig] = useState(() => {
    try {
      const stored = localStorage.getItem('projectManagementColumnConfig');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(parsed.map(c => c.id));
          const missing = DEFAULT_PROJECT_COLUMNS.filter(c => !ids.has(c.id));
          return [...parsed, ...missing];
        }
      }
    } catch (e) {}
    return DEFAULT_PROJECT_COLUMNS;
  });
  const [showProjectColumnConfigModal, setShowProjectColumnConfigModal] = useState(false);
  const [draggedProjectColumnIndex, setDraggedProjectColumnIndex] = useState(null);
  const [isDesktopScreen, setIsDesktopScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopScreen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleUpdateProjectColumnConfig = (newConfig) => {
    setProjectColumnConfig(newConfig);
    try {
      localStorage.setItem('projectManagementColumnConfig', JSON.stringify(newConfig));
    } catch (e) {}
  };

  const toggleProjectColumnVisibility = (colId) => {
    const updated = projectColumnConfig.map(col => 
      col.id === colId ? { ...col, visible: !col.visible } : col
    );
    handleUpdateProjectColumnConfig(updated);
  };

  const toggleProjectColumnPin = (colId) => {
    const updated = projectColumnConfig.map(col => {
      if (col.id === colId) {
        return { ...col, pinned: !col.pinned };
      }
      return col;
    });

    const actionsCol = updated.find(c => c.id === 'actions');
    const nonActions = updated.filter(c => c.id !== 'actions');
    const pinnedNonActions = nonActions.filter(c => c.pinned);
    const unpinnedNonActions = nonActions.filter(c => !c.pinned);
    const sorted = [...pinnedNonActions, ...unpinnedNonActions];
    if (actionsCol) sorted.push(actionsCol);

    handleUpdateProjectColumnConfig(sorted);
  };

  const unpinAllProjectColumns = () => {
    const updated = projectColumnConfig.map(col => ({ ...col, pinned: false }));
    handleUpdateProjectColumnConfig(updated);
  };

  const moveProjectColumn = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= projectColumnConfig.length) return;
    const updated = [...projectColumnConfig];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    handleUpdateProjectColumnConfig(updated);
  };

  const resetProjectColumnConfig = () => {
    handleUpdateProjectColumnConfig(DEFAULT_PROJECT_COLUMNS);
  };

  const [projectSortConfig, setProjectSortConfig] = useState({ key: null, direction: 'asc' });

  const handleProjectSort = (colId) => {
    setProjectSortConfig(prev => {
      if (prev.key !== colId) {
        return { key: colId, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key: colId, direction: 'desc' };
      }
      return { key: null, direction: 'asc' };
    });
  };

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingProjectId, setEditingProjectId] = useState(null);

  // Floating Dropdown State (Fixed Positioning so it floats in FRONT without overflow clipping)
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isTypoDropdownOpen, setIsTypoDropdownOpen] = useState(false);
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [typeCoords, setTypeCoords] = useState(null);
  const [typoCoords, setTypoCoords] = useState(null);
  const [areaCoords, setAreaCoords] = useState(null);
  const [typoSearch, setTypoSearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');

  const typeDropdownRef = useRef(null);
  const typoDropdownRef = useRef(null);
  const areaDropdownRef = useRef(null);
  const [isMobileTypeDropdownOpen, setIsMobileTypeDropdownOpen] = useState(false);
  const [isDesktopTypeDropdownOpen, setIsDesktopTypeDropdownOpen] = useState(false);
  const mobileFilterTypeDropdownRef = useRef(null);
  const desktopFilterTypeDropdownRef = useRef(null);

  // Form State
  const initialFormState = {
    name: '',
    developerName: '',
    projectType: [],
    typography: [],
    reraNumber: '',
    area: '',
    address: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formMsg, setFormMsg] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Table Typography Popover State
  const [activeTableTypoDropdown, setActiveTableTypoDropdown] = useState(null); // { projectId, coords }
  const [tableTypoFilter, setTableTypoFilter] = useState('');

  // Delete Confirmation Modal State
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    project: null
  });
  const [deleting, setDeleting] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');

  // Toast / Alert Notification State
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' // 'success' | 'error'
  });

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  const getAuthToken = () => localStorage.getItem('adminToken') || '';

  // CSV Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [importSheet, setImportSheet] = useState({ headers: [], rows: [] });
  const [importDuplicates, setImportDuplicates] = useState([]);
  const [unmappedColumns, setUnmappedColumns] = useState([]);
  const [mappedColumns, setMappedColumns] = useState([]);
  const [showColumnMappingPopover, setShowColumnMappingPopover] = useState(false);

  // Export CSV handler (Standard RFC-4180 with UTF-8 BOM for Microsoft Excel)
  const handleExportProjectCSV = () => {
    const targetList = (filteredProjects && filteredProjects.length > 0) ? filteredProjects : projects;
    if (!targetList || targetList.length === 0) {
      alert('No projects available to export.');
      return;
    }

    const headers = [
      '# ID',
      'Project',
      'Developer',
      'Project Type',
      'Typography',
      'RERA No',
      'Area',
      'Address',
      'Assigned Leads',
      'Created By',
      'Created At'
    ];

    const escapeCell = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = targetList.map((project, idx) => {
      const displayId = getProjectDisplayId(project, projects);
      const types = Array.isArray(project.projectType) ? project.projectType.join(', ') : (project.projectType || '');
      const typos = Array.isArray(project.typography) ? project.typography.join(', ') : (project.typography || '');
      const createdAt = project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-GB') : '';

      return [
        escapeCell(displayId),
        escapeCell(project.name || ''),
        escapeCell(project.developerName || ''),
        escapeCell(types),
        escapeCell(typos),
        escapeCell(project.reraNumber || ''),
        escapeCell(project.area || ''),
        escapeCell(project.address || ''),
        escapeCell(project.assignedLeadsCount || 0),
        escapeCell(project.createdBy || 'Admin'),
        escapeCell(createdAt)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `Projects_Export_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Sample CSV Template
  const handleDownloadSampleCSV = () => {
    const headers = ['Project', 'Developer', 'Project Type', 'Typography', 'RERA No', 'Area', 'Address'];
    const sampleRows = [
      ['"Gulmohar City"', '"Gulmohar Group"', '"Apartment"', '"1 BHK, 2 BHK, 3 BHK"', '"P52100012345"', '"Kharadi"', '"Survey No 45, Near IT Park, Kharadi, Pune"'],
      ['"Greenfield Villas"', '"Apex Builders"', '"Villa"', '"3 BHK, 4 BHK"', '"P52100067890"', '"Wagholi"', '"Gate No 12, Nagar Road, Wagholi, Pune"'],
      ['"Royal Palms"', '"Shree Developers"', '"Plots"', '"Residential, Non-Agriculture"', '"P52100099887"', '"Shikrapur"', '"Pune-Nagar Highway, Shikrapur"']
    ];
    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Projects_Sample_Template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV/TSV tokenizer: quoted cells, "" escapes, commas and line breaks inside quotes
  const parseCSVRows = (text) => {
    text = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const firstLine = text.split('\n', 1)[0];
    const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',');
    const rows = [];
    let row = [], cell = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') inQuotes = false;
        else cell += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === delimiter) { row.push(cell.trim()); cell = ''; }
      else if (ch === '\n') {
        row.push(cell.trim()); cell = '';
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
      } else if (ch !== '\r') cell += ch;
    }
    row.push(cell.trim());
    if (row.some(c => c !== '')) rows.push(row);
    return rows;
  };

  // Map sheet columns to project fields (Exact same logic as Lead Table Import)
  const parseProjectCSVText = (text) => {
    const allRows = parseCSVRows(text);
    if (allRows.length < 2) {
      return { headers: [], rows: [], projects: [], unmappedColumns: [], mappedColumns: [] };
    }
    const headers = allRows[0];
    const rows = allRows.slice(1);
    const keys = headers.map(h => (h || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
    const used = new Set();
    const find = (exact, partial = []) => {
      let idx = keys.findIndex((k, i) => !used.has(i) && exact.includes(k));
      if (idx === -1) idx = keys.findIndex((k, i) => !used.has(i) && partial.some(p => k.includes(p)));
      if (idx !== -1) used.add(idx);
      return idx;
    };

    const idIdx = find(['id', 'projectid', 'srno', 'sno', 'slno', 'serialno', 'serialnumber', 'no', 'row'], ['id', 'projectid']);
    const nameIdx = find(['project', 'projectname', 'name', 'title'], ['project', 'name']);
    const devIdx = find(['developer', 'developername', 'builder', 'company'], ['dev', 'build']);
    const typeIdx = find(['projecttype', 'type', 'types', 'category'], ['type']);
    const typoIdx = find(['typography', 'typo', 'configuration', 'bhk', 'unit'], ['typo', 'config', 'bhk']);
    const reraIdx = find(['reranumber', 'rerano', 'rera', 'registrationno'], ['rera']);
    const areaIdx = find(['area', 'locationarea', 'locality', 'suburb'], ['area', 'loc']);
    const addressIdx = find(['address', 'projectaddress', 'fulladdress', 'siteaddress'], ['address', 'site']);
    const leadsIdx = find(['assignedleads', 'assignedleadscount', 'leads', 'totalleads', 'leadscount'], ['leads']);
    const createdByIdx = find(['createdby', 'creator', 'source', 'author', 'user'], ['createdby', 'creator']);
    const createdAtIdx = find(['createdat', 'createdtime', 'created', 'date', 'creationdate'], ['created', 'date']);
    const agentIdx = find(['salesperson', 'salespersonname', 'salesman', 'caller', 'agent', 'assignedagent'], ['salesperson', 'sales', 'agent']);

    const mappedColumns = [];
    const unmappedColumns = [];
    headers.forEach((h, i) => {
      if (used.has(i)) mappedColumns.push(h);
      else unmappedColumns.push(h);
    });

    const projectsList = [];

    rows.forEach((row, rowIdx) => {
      const getVal = (idx) => (idx !== -1 && row[idx] !== undefined) ? String(row[idx]).trim() : '';
      const rawName = nameIdx !== -1 ? getVal(nameIdx) : (row[0] || '').trim();
      if (!rawName) return;

      const developerName = devIdx !== -1 ? getVal(devIdx) : '';
      const rawType = typeIdx !== -1 ? getVal(typeIdx) : '';
      const rawTypo = typoIdx !== -1 ? getVal(typoIdx) : '';
      const reraNumber = reraIdx !== -1 ? getVal(reraIdx) : '';
      const area = areaIdx !== -1 ? getVal(areaIdx) : '';
      const address = addressIdx !== -1 ? getVal(addressIdx) : '';

      let projectType = rawType ? rawType.split(/[,;|]/).map(s => s.trim()).filter(Boolean) : ['Apartment'];
      let typography = rawTypo ? rawTypo.split(/[,;|]/).map(s => s.trim()).filter(Boolean) : ['2 BHK'];

      projectsList.push({
        id: idIdx !== -1 ? getVal(idIdx) : undefined,
        row: rowIdx,
        name: rawName,
        developerName,
        projectType,
        typography,
        reraNumber,
        area: area || address || 'Pune',
        address
      });
    });

    return { headers, rows, projects: projectsList, unmappedColumns, mappedColumns };
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    setImportMsg('');
    setImportDuplicates([]);
    setUnmappedColumns([]);
    setMappedColumns([]);
    setShowColumnMappingPopover(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const { headers, rows, projects: parsedProjects, unmappedColumns: unmapped, mappedColumns: mapped } = parseProjectCSVText(evt.target.result);
      setImportSheet({ headers, rows });
      setImportPreview(parsedProjects);
      setUnmappedColumns(unmapped || []);
      setMappedColumns(mapped || []);
      if (parsedProjects.length === 0) {
        setImportMsg('Error: No valid project records found in CSV file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // allow picking the same file again via "Change file"
  };

  // Download the skipped duplicate rows exactly as they were in the uploaded sheet
  const handleDownloadDuplicates = () => {
    const esc = (v) => `"${(v || '').toString().replace(/"/g, '""')}"`;
    const csv = [importSheet.headers, ...importDuplicates].map(r => r.map(esc).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Duplicate_Projects_${(importFile?.name || 'import').replace(/\.csv$/i, '')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportPreview([]);
    setImportMsg('');
    setImportSheet({ headers: [], rows: [] });
    setImportDuplicates([]);
    setUnmappedColumns([]);
    setMappedColumns([]);
    setShowColumnMappingPopover(false);
  };

  const handleConfirmImportProjects = async () => {
    if (importPreview.length === 0) return;
    setIsImporting(true);
    setImportMsg('');

    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ projects: importPreview })
      });

      const resText = await res.text();
      let data;
      try {
        data = JSON.parse(resText);
      } catch (jsonErr) {
        throw new Error(`Server returned HTML response (${res.status} ${res.statusText}). Please restart Node.js server (npm run dev:api locally or Restart in Hostinger).`);
      }

      if (data.success) {
        setImportMsg(data.message);
        if (Array.isArray(data.data)) {
          setProjects(data.data);
        }
        const duplicates = (data.duplicateRows || []).map(i => importSheet.rows[i]).filter(Boolean);
        setImportDuplicates(duplicates);
        setImportPreview([]);
        // Keep the modal open when there are duplicates to download or unmapped columns to review
        if (duplicates.length === 0 && (!unmappedColumns || unmappedColumns.length === 0)) {
          setTimeout(resetImportModal, 1800);
        }
      } else {
        setImportMsg(`Error: ${data.message || 'Import failed'}`);
      }
    } catch (err) {
      setImportMsg(`Error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Toggle Type Dropdown with smart viewport calculation
  const handleToggleTypeDropdown = (e) => {
    e.stopPropagation();
    if (isTypeDropdownOpen) {
      setIsTypeDropdownOpen(false);
      return;
    }
    setIsTypoDropdownOpen(false);
    setIsAreaDropdownOpen(false);

    const btn = e.currentTarget;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const dropdownHeight = Math.min(260, PROJECT_TYPES.length * 40 + 60);
    const dropdownWidth = Math.min(rect.width, Math.max(200, window.innerWidth - 24));
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;

    let top = rect.bottom + 4;
    let maxHeight = dropdownHeight;

    if (spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight) {
      top = Math.max(10, rect.top - dropdownHeight - 4);
    } else {
      maxHeight = Math.max(140, Math.min(spaceBelow, dropdownHeight));
    }

    if (top + maxHeight > window.innerHeight - 12) {
      top = Math.max(10, window.innerHeight - maxHeight - 12);
    }

    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - dropdownWidth - 12);
    }
    if (left < 12) left = 12;

    setTypeCoords({
      top,
      left,
      width: dropdownWidth,
      maxHeight
    });
    setIsTypeDropdownOpen(true);
  };

  // Toggle Typography Dropdown with smart viewport calculation (Compact Box)
  const handleToggleTypoDropdown = (e) => {
    e.stopPropagation();
    if (formData.projectType.length === 0) return;
    if (isTypoDropdownOpen) {
      setIsTypoDropdownOpen(false);
      setTypoSearch('');
      return;
    }
    setIsTypeDropdownOpen(false);
    setIsAreaDropdownOpen(false);

    const btn = e.currentTarget;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;

    // Compact box dimensions
    const dropdownHeight = isMobile ? Math.min(250, window.innerHeight - 80) : Math.min(320, window.innerHeight - 80);
    const dropdownWidth = isMobile
      ? Math.min(rect.width > 200 ? rect.width : 290, window.innerWidth - 24)
      : Math.min(Math.max(rect.width, 320), window.innerWidth - 24);

    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;

    let top;
    let maxHeight = dropdownHeight;

    // In mobile view or when space below is limited: OPEN UPWARDS ("upper ki side")
    const shouldOpenUpwards = (isMobile && spaceAbove >= 140) || (spaceBelow < 260 && spaceAbove > spaceBelow);

    if (shouldOpenUpwards) {
      maxHeight = Math.min(dropdownHeight, Math.max(140, spaceAbove));
      top = Math.max(8, rect.top - maxHeight - 4);
    } else {
      maxHeight = Math.min(dropdownHeight, Math.max(140, spaceBelow));
      top = rect.bottom + 4;
    }

    // Clamp top so it never overflows bottom of screen
    if (top + maxHeight > window.innerHeight - 10) {
      top = Math.max(8, window.innerHeight - maxHeight - 10);
    }
    if (top < 8) top = 8;

    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - dropdownWidth - 12);
    }
    if (left < 12) left = 12;

    setTypoCoords({
      top,
      left,
      width: dropdownWidth,
      maxHeight
    });
    setTypoSearch('');
    setIsTypoDropdownOpen(true);
  };

  // Toggle Area Dropdown with smart viewport calculation
  const handleToggleAreaDropdown = (e) => {
    e.stopPropagation();
    if (isAreaDropdownOpen) {
      setIsAreaDropdownOpen(false);
      setAreaSearch('');
      return;
    }
    setIsTypeDropdownOpen(false);
    setIsTypoDropdownOpen(false);

    const btn = e.currentTarget;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;

    const availableAreas = [...PROJECT_AREAS];
    if (formData.area && !availableAreas.includes(formData.area)) {
      availableAreas.unshift(formData.area);
    }

    const dropdownHeight = isMobile
      ? Math.min(260, window.innerHeight - 80)
      : Math.min(280, availableAreas.length * 40 + 70);

    const dropdownWidth = isMobile
      ? Math.min(Math.max(rect.width, 260), window.innerWidth - 24)
      : Math.min(Math.max(rect.width, 240), window.innerWidth - 24);

    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;

    let top;
    let maxHeight = dropdownHeight;

    // In mobile view or when space below is limited: OPEN UPWARDS ("upper ki side")
    const shouldOpenUpwards = (isMobile && spaceAbove >= 120) || (spaceBelow < dropdownHeight && spaceAbove > spaceBelow);

    if (shouldOpenUpwards) {
      maxHeight = Math.min(dropdownHeight, Math.max(140, spaceAbove));
      top = Math.max(8, rect.top - maxHeight - 4);
    } else {
      maxHeight = Math.min(dropdownHeight, Math.max(140, spaceBelow));
      top = rect.bottom + 4;
    }

    // Clamp top so it never overflows bottom of screen
    if (top + maxHeight > window.innerHeight - 10) {
      top = Math.max(8, window.innerHeight - maxHeight - 10);
    }
    if (top < 8) top = 8;

    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - dropdownWidth - 12);
    }
    if (left < 12) left = 12;

    setAreaCoords({
      top,
      left,
      width: dropdownWidth,
      maxHeight
    });
    setAreaSearch('');
    setIsAreaDropdownOpen(true);
  };

  // Close dropdowns on outside click or scroll
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        typeDropdownRef.current && 
        !typeDropdownRef.current.contains(event.target) && 
        !event.target.closest('.project-type-dropdown-menu')
      ) {
        setIsTypeDropdownOpen(false);
      }
      if (
        typoDropdownRef.current && 
        !typoDropdownRef.current.contains(event.target) && 
        !event.target.closest('.project-typo-dropdown-menu')
      ) {
        setIsTypoDropdownOpen(false);
        setTypoSearch('');
      }
      if (
        areaDropdownRef.current && 
        !areaDropdownRef.current.contains(event.target) && 
        !event.target.closest('.project-area-dropdown-menu')
      ) {
        setIsAreaDropdownOpen(false);
        setAreaSearch('');
      }
      if (
        mobileFilterTypeDropdownRef.current &&
        !mobileFilterTypeDropdownRef.current.contains(event.target)
      ) {
        setIsMobileTypeDropdownOpen(false);
      }
      if (
        desktopFilterTypeDropdownRef.current &&
        !desktopFilterTypeDropdownRef.current.contains(event.target)
      ) {
        setIsDesktopTypeDropdownOpen(false);
      }
      if (
        !event.target.closest('.custom-table-typo-menu') &&
        !event.target.closest('.custom-table-typo-toggle')
      ) {
        setActiveTableTypoDropdown(null);
        setTableTypoFilter('');
      }
    };

    const handleScrollOrResize = (e) => {
      // Never close dropdowns on mobile viewport resize (e.g. keyboard open/close)
      if (e && e.type === 'resize' && typeof window !== 'undefined' && window.innerWidth < 640) {
        return;
      }

      // If the scroll happened inside the dropdown menu itself or inside the modal content, DO NOT close it!
      if (e && e.target && e.target.closest) {
        if (
          e.target.closest('.project-type-dropdown-menu') || 
          e.target.closest('.project-typo-dropdown-menu') ||
          e.target.closest('.project-area-dropdown-menu') ||
          e.target.closest('.custom-table-typo-menu') ||
          e.target.closest('.project-modal-scrollable')
        ) {
          return;
        }
      }
      setIsTypeDropdownOpen(false);
      setIsTypoDropdownOpen(false);
      setIsAreaDropdownOpen(false);
      setAreaSearch('');
      setActiveTableTypoDropdown(null);
      setTableTypoFilter('');
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, []);

  // Toggle Typography popover for Table Row
  const toggleTableTypoDropdown = (e, projectId) => {
    e.stopPropagation();
    if (activeTableTypoDropdown?.projectId === projectId) {
      setActiveTableTypoDropdown(null);
      setTableTypoFilter('');
      return;
    }

    setTableTypoFilter('');
    const btn = e.currentTarget;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const targetHeight = 360;
    const dropdownWidth = Math.max(340, rect.width);

    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    let top;
    let bottom;
    let maxHeight = targetHeight;

    if (spaceBelow >= 240 || spaceBelow >= spaceAbove) {
      top = rect.bottom + 4;
      maxHeight = Math.min(targetHeight, Math.max(140, spaceBelow));
    } else {
      bottom = window.innerHeight - rect.top + 4;
      maxHeight = Math.min(targetHeight, Math.max(140, spaceAbove));
    }

    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 12) {
      left = Math.max(8, window.innerWidth - dropdownWidth - 12);
    }
    if (left < 8) left = 8;

    setActiveTableTypoDropdown({
      projectId,
      coords: { top, bottom, left, width: dropdownWidth, maxHeight }
    });
  };

  // Fetch Projects from API
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      showToast('Failed to load projects from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getProjectDisplayId = (project, baseList = projects) => {
    if (!project) return 1;
    if (project.id) {
      const num = parseInt(project.id, 10);
      if (!isNaN(num) && num > 0) return num;
      return project.id;
    }
    if (project._id) {
      const num = parseInt(project._id, 10);
      if (!isNaN(num) && num > 0) return num;
    }
    const idx = (baseList || []).findIndex(p => 
      (p.id && p.id === project.id) || 
      (p._id && p._id === project._id) || 
      (p.name && p.name === project.name)
    );
    return idx >= 0 ? (idx + 1) : 1;
  };

  // Filtered Projects for Table
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Type Filter
      if (typeFilter !== 'All') {
        const types = Array.isArray(p.projectType) ? p.projectType : [p.projectType];
        const hasType = types.some(t => String(t).toLowerCase() === typeFilter.toLowerCase());
        if (!hasType) return false;
      }

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const name = (p.name || '').toLowerCase();
      const dev = (p.developerName || '').toLowerCase();
      const area = (p.area || '').toLowerCase();
      const addr = (p.address || '').toLowerCase();
      const rera = (p.reraNumber || '').toLowerCase();
      const typesStr = (Array.isArray(p.projectType) ? p.projectType.join(' ') : '').toLowerCase();
      const typoStr = (Array.isArray(p.typography) ? p.typography.join(' ') : '').toLowerCase();

      return name.includes(q) || dev.includes(q) || area.includes(q) || addr.includes(q) || rera.includes(q) || typesStr.includes(q) || typoStr.includes(q);
    }).sort((a, b) => {
      if (!projectSortConfig.key) return 0;
      const sortMultiplier = projectSortConfig.direction === 'asc' ? 1 : -1;
      switch (projectSortConfig.key) {
        case 'projectId': {
          const idA = getProjectDisplayId(a);
          const idB = getProjectDisplayId(b);
          const numA = parseInt(idA, 10);
          const numB = parseInt(idB, 10);
          if (!isNaN(numA) && !isNaN(numB)) return (numA - numB) * sortMultiplier;
          return String(idA).localeCompare(String(idB)) * sortMultiplier;
        }
        case 'projectName': {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          return nameA.localeCompare(nameB) * sortMultiplier;
        }
        case 'developerName': {
          const devA = (a.developerName || '').toLowerCase();
          const devB = (b.developerName || '').toLowerCase();
          return devA.localeCompare(devB) * sortMultiplier;
        }
        case 'projectType': {
          const typesA = (Array.isArray(a.projectType) ? a.projectType.join(', ') : (a.projectType || '')).toLowerCase();
          const typesB = (Array.isArray(b.projectType) ? b.projectType.join(', ') : (b.projectType || '')).toLowerCase();
          return typesA.localeCompare(typesB) * sortMultiplier;
        }
        case 'typography': {
          const typoA = (Array.isArray(a.typography) ? a.typography.join(', ') : (a.typography || '')).toLowerCase();
          const typoB = (Array.isArray(b.typography) ? b.typography.join(', ') : (b.typography || '')).toLowerCase();
          return typoA.localeCompare(typoB) * sortMultiplier;
        }
        case 'reraNumber': {
          const reraA = (a.reraNumber || '').toLowerCase();
          const reraB = (b.reraNumber || '').toLowerCase();
          return reraA.localeCompare(reraB) * sortMultiplier;
        }
        case 'location': {
          const locA = `${a.area || ''} ${a.address || ''}`.trim().toLowerCase();
          const locB = `${b.area || ''} ${b.address || ''}`.trim().toLowerCase();
          return locA.localeCompare(locB) * sortMultiplier;
        }
        default:
          return 0;
      }
    });
  }, [projects, searchQuery, typeFilter, projectSortConfig]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingProjectId(null);
    setFormData(initialFormState);
    setFormMsg('');
    setIsTypeDropdownOpen(false);
    setIsTypoDropdownOpen(false);
    setIsAreaDropdownOpen(false);
    setAreaSearch('');
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (project) => {
    setModalMode('edit');
    setEditingProjectId(project.id || project._id);

    const rawTypes = Array.isArray(project.projectType) ? project.projectType : (project.projectType ? [project.projectType] : []);
    const mainTypes = rawTypes.filter(t => PROJECT_TYPES.includes(t) || t === 'Studio' || t === 'Farm House');

    if (mainTypes.includes('Farm House') && !mainTypes.includes('Plots')) {
      mainTypes.push('Plots');
    }

    let initialTypos = Array.isArray(project.typography) ? [...project.typography] : (project.typography ? [project.typography] : []);
    initialTypos = initialTypos.map(t => (t && t.trim().toLowerCase() === 'studio apartment') ? 'Studio' : t);
    // If old test project had sub-types in projectType, migrate them into typography
    const oldPlotTypes = rawTypes.filter(t => ['Industrial', 'Commercial / Industrial', 'Agriculture', 'Non-Agriculture', 'Residential'].includes(t));
    oldPlotTypes.forEach(st => {
      const mapped = st === 'Industrial' ? 'Commercial / Industrial' : st;
      if (!initialTypos.includes(mapped)) {
        initialTypos.push(mapped);
      }
    });

    const projectArea = project.area || '';

    setFormData({
      name: project.name || '',
      developerName: project.developerName || '',
      projectType: mainTypes,
      typography: initialTypos,
      reraNumber: project.reraNumber || '',
      area: projectArea,
      address: project.address || ''
    });
    setFormMsg('');
    setIsTypeDropdownOpen(false);
    setIsTypoDropdownOpen(false);
    setIsAreaDropdownOpen(false);
    setAreaSearch('');
    setShowModal(true);
  };

  // Toggle Project Type
  const handleToggleProjectType = (type) => {
    setFormData(prev => {
      const exists = prev.projectType.includes(type);
      const nextTypes = exists 
        ? prev.projectType.filter(t => t !== type)
        : [...prev.projectType, type];

      let nextTypo = [...prev.typography];
      if (exists) {
        const remainingOptions = new Set();
        nextTypes.forEach(remType => {
          if (remType === 'Apartment') {
            APARTMENT_TYPOGRAPHY_GROUPS.forEach(grp => grp.items.forEach(it => remainingOptions.add(it)));
          }
          (TYPOGRAPHY_BY_TYPE[remType] || []).forEach(it => remainingOptions.add(it));
        });
        nextTypo = nextTypo.filter(t => remainingOptions.has(t));
      }

      return {
        ...prev,
        projectType: nextTypes,
        typography: nextTypo
      };
    });
  };

  // Toggle Typography
  const handleToggleTypography = (typo) => {
    setFormData(prev => {
      const exists = prev.typography.includes(typo);
      const nextTypo = exists
        ? prev.typography.filter(t => t !== typo)
        : [...prev.typography, typo];
      return {
        ...prev,
        typography: nextTypo
      };
    });
  };

  // Select All or Deselect All Project Types
  const handleToggleSelectAllProjectTypes = () => {
    setFormData(prev => {
      const isAllSelected = PROJECT_TYPES.every(t => prev.projectType.includes(t));
      if (isAllSelected) {
        return {
          ...prev,
          projectType: [],
          typography: []
        };
      }
      return {
        ...prev,
        projectType: [...PROJECT_TYPES]
      };
    });
  };

  // Only Miscellaneous projects allow "Select All"
  const isMiscellaneousProject = (formData.name || '').trim().toLowerCase().includes('miscellaneous');

  // Get all available typographies for current selected project types
  const allAvailableTypographies = useMemo(() => {
    const list = [];
    formData.projectType.forEach(pType => {
      if (pType === 'Apartment') {
        APARTMENT_TYPOGRAPHY_GROUPS.forEach(grp => {
          grp.items.forEach(item => {
            if (!list.includes(item)) list.push(item);
          });
        });
      } else {
        const opts = TYPOGRAPHY_BY_TYPE[pType] || [];
        opts.forEach(item => {
          if (!list.includes(item)) list.push(item);
        });
      }
    });
    return list;
  }, [formData.projectType]);

  // Select All or Deselect All Typographies across selected project types
  const handleToggleSelectAllTypography = () => {
    const query = typoSearch.trim().toLowerCase();
    let targetItems = allAvailableTypographies;
    if (query) {
      targetItems = targetItems.filter(item => item.toLowerCase().includes(query));
    }
    if (targetItems.length === 0) return;

    setFormData(prev => {
      const isAllTargetSelected = targetItems.every(item => prev.typography.includes(item));
      if (isAllTargetSelected) {
        return {
          ...prev,
          typography: prev.typography.filter(item => !targetItems.includes(item))
        };
      }
      const combined = [...new Set([...prev.typography, ...targetItems])];
      return {
        ...prev,
        typography: combined
      };
    });
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormMsg('');

    if (!formData.name.trim()) {
      setFormMsg('Project is required.');
      return;
    }

    if (formData.projectType.length === 0) {
      setFormMsg('Project Type is required. Please select at least one type.');
      return;
    }

    if (formData.typography.length === 0) {
      setFormMsg('Project Typography is required. Please select at least one typography.');
      return;
    }

    if (!formData.area.trim() && !formData.address.trim()) {
      setFormMsg('Area is required.');
      return;
    }

    setFormSubmitting(true);
    try {
      const token = getAuthToken();

      const payload = {
        name: formData.name.trim(),
        developerName: formData.developerName.trim(),
        projectType: formData.projectType,
        typography: formData.typography,
        reraNumber: formData.reraNumber.trim(),
        area: formData.area.trim(),
        address: formData.address.trim()
      };

      const url = modalMode === 'create'
        ? `${API_BASE_URL}/api/projects`
        : `${API_BASE_URL}/api/projects/${editingProjectId}`;

      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save project');
      }

      setFormSubmitting(false);
      setFormMsg(modalMode === 'create' ? 'Project Created Successfully!' : 'Project Updated Successfully!');
      fetchProjects();

      setTimeout(() => {
        setShowModal(false);
        setFormMsg('');
        setFormData(initialFormState);
      }, 1200);
    } catch (err) {
      setFormSubmitting(false);
      setFormMsg(err.message || 'Something went wrong while saving the project.');
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.project) return;
    const pId = deleteConfirmation.project.id || deleteConfirmation.project._id;
    setDeleting(true);
    setDeleteErrorMsg('');
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/projects/${pId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete project');
      }
      showToast(data.message || 'Project deleted successfully!');
      setDeleteConfirmation({ isOpen: false, project: null });
      setDeleteErrorMsg('');
      fetchProjects();
    } catch (err) {
      setDeleteErrorMsg(err.message || 'Cannot delete project: Leads are currently assigned to this project.');
      showToast(err.message || 'Cannot delete project: Leads are currently assigned to this project.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const canManage = true; // SuperAdmin, Admin, and Sales Executive can create & edit projects
  const canDelete = isSuperAdmin || isAdmin; // Only SuperAdmin and Admin can delete projects

  return (
    <div className="space-y-3 animate-fade-in flex-1 flex flex-col min-h-0 overflow-hidden">
      
      {/* Toast Notification */}
      {notification.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in pointer-events-none max-w-[90vw]">
          <div className={`px-5 py-2.5 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-bold backdrop-blur-md pointer-events-auto ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <i className={`fa-solid ${notification.type === 'success' ? 'fa-circle-check text-emerald-600' : 'fa-circle-exclamation text-rose-600'} text-sm`}></i>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Projects Title Section */}
      <div className="flex-shrink-0">
        <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900 tracking-wide">
          Projects
        </h2>
      </div>

      {/* Projects Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 relative flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Card Header Bar with Search, Type Filter & Action Buttons */}
        <div className="px-3 sm:px-4 py-2.5 border-b border-gray-100 bg-gray-50/70 rounded-t-2xl flex-shrink-0">
          
          {/* MOBILE VIEW (sm:hidden): 2 Rows - Row 1 Search Bar, Row 2 All Types Dropdown + Action Buttons */}
          <div className="flex sm:hidden flex-col gap-2.5 w-full">
            {/* ROW 1: Full-width Search Input */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <i className="fa-solid fa-magnifying-glass text-xs"></i>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search project by name, developer, area..."
                className="w-full pl-9 pr-7 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-xs bg-white font-medium shadow-xs"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                  title="Clear search"
                >
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              )}
            </div>

            {/* ROW 2: All Types Dropdown (Left) + Action Buttons (Right) */}
            <div className="flex items-center justify-between gap-2 w-full">
              {/* Type Filter Custom Dropdown */}
              <div ref={mobileFilterTypeDropdownRef} className="flex-1 min-w-0 relative">
                <button
                  type="button"
                  onClick={() => setIsMobileTypeDropdownOpen(!isMobileTypeDropdownOpen)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-xs bg-white hover:bg-gray-50 font-bold text-gray-700 cursor-pointer shadow-xs flex items-center justify-between gap-1.5"
                  title="Filter projects by Type"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#B30E2E] flex-shrink-0"></span>
                    <span className="truncate">{typeFilter === 'All' ? 'All Types' : typeFilter}</span>
                  </span>
                  <i className={`fa-solid fa-chevron-down text-[11px] text-gray-400 transition transform flex-shrink-0 ${isMobileTypeDropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>

                {isMobileTypeDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-full min-w-[170px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 max-h-56 overflow-y-auto custom-scrollbar animate-fade-in">
                    {/* Option: All Types */}
                    <button
                      type="button"
                      onClick={() => {
                        setTypeFilter('All');
                        setIsMobileTypeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-rose-50 hover:text-[#B30E2E] transition flex items-center justify-between cursor-pointer ${
                        typeFilter === 'All' ? 'bg-[#FFF0F2] text-[#B30E2E] font-bold' : 'text-gray-700'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${typeFilter === 'All' ? 'bg-[#B30E2E]' : 'bg-gray-300'}`}></span>
                        <span>All Types</span>
                      </span>
                      {typeFilter === 'All' && <i className="fa-solid fa-check text-xs text-[#B30E2E]"></i>}
                    </button>

                    {/* Dynamic Project Types */}
                    {PROJECT_TYPES.map((type) => {
                      const isSelected = typeFilter === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setTypeFilter(type);
                            setIsMobileTypeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-rose-50 hover:text-[#B30E2E] transition flex items-center justify-between cursor-pointer ${
                            isSelected ? 'bg-[#FFF0F2] text-[#B30E2E] font-bold' : 'text-gray-700'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-[#B30E2E]' : 'bg-gray-300'}`}></span>
                            <span className="truncate">{type}</span>
                          </span>
                          {isSelected && <i className="fa-solid fa-check text-xs text-[#B30E2E]"></i>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Action Symbol Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Create Project Button */}
                {canManage && (
                  <button 
                    type="button" 
                    onClick={handleOpenCreateModal}
                    className="w-8 h-8 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white flex items-center justify-center transition shadow-sm border border-rose-900/40 cursor-pointer flex-shrink-0 transform active:scale-95"
                    title="Create New Project"
                  >
                    <div className="relative inline-flex items-center justify-center">
                      <i className="fa-solid fa-building text-xs"></i>
                      <span className="absolute -top-1.5 -right-2 bg-white text-[#B30E2E] font-black text-[9px] w-3 h-3 rounded-full flex items-center justify-center border border-[#8A0B22] leading-none">+</span>
                    </div>
                  </button>
                )}

                {/* Column Configuration Button */}
                <button 
                  type="button"
                  onClick={() => setShowProjectColumnConfigModal(true)}
                  className="w-8 h-8 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white flex items-center justify-center transition shadow-sm border border-rose-900/40 cursor-pointer flex-shrink-0 transform active:scale-95"
                  title="Column Configuration"
                >
                  <i className="fa-solid fa-sliders text-xs"></i>
                </button>

                {/* Export CSV Button */}
                {canManage && (
                  <button 
                    type="button" 
                    onClick={handleExportProjectCSV}
                    className="w-8 h-8 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white flex items-center justify-center transition shadow-sm border border-rose-900/40 cursor-pointer flex-shrink-0 transform active:scale-95"
                    title="Export"
                  >
                    <i className="fa-solid fa-file-excel text-xs"></i>
                  </button>
                )}

                {/* Import CSV Button */}
                {canManage && (
                  <button 
                    type="button" 
                    onClick={() => setShowImportModal(true)}
                    className="w-8 h-8 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white flex items-center justify-center transition shadow-sm border border-rose-900/40 cursor-pointer flex-shrink-0 transform active:scale-95"
                    title="Import"
                  >
                    <i className="fa-solid fa-file-import text-xs"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DESKTOP VIEW (hidden sm:flex): Single Row */}
          <div className="hidden sm:flex items-center justify-between gap-3 w-full">
            {/* Search Box & Type Filter */}
            <div className="flex items-center gap-2.5 flex-1 max-w-2xl">
              {/* Search Input */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <i className="fa-solid fa-magnifying-glass text-xs"></i>
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search project by name, developer, area, rera, location..."
                  className="w-full pl-9 pr-7 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-xs bg-white font-medium shadow-xs"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                    title="Clear search"
                  >
                    <i className="fa-solid fa-circle-xmark"></i>
                  </button>
                )}
              </div>

              {/* Type Filter Custom Dropdown */}
              <div ref={desktopFilterTypeDropdownRef} className="w-36 flex-shrink-0 relative">
                <button
                  type="button"
                  onClick={() => setIsDesktopTypeDropdownOpen(!isDesktopTypeDropdownOpen)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-xs bg-white hover:bg-gray-50 font-bold text-gray-700 cursor-pointer shadow-xs flex items-center justify-between gap-1.5"
                  title="Filter projects by Type"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#B30E2E] flex-shrink-0"></span>
                    <span className="truncate">{typeFilter === 'All' ? 'All Types' : typeFilter}</span>
                  </span>
                  <i className={`fa-solid fa-chevron-down text-[11px] text-gray-400 transition transform flex-shrink-0 ${isDesktopTypeDropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>

                {isDesktopTypeDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-full min-w-[160px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 max-h-56 overflow-y-auto custom-scrollbar animate-fade-in">
                    {/* Option: All Types */}
                    <button
                      type="button"
                      onClick={() => {
                        setTypeFilter('All');
                        setIsDesktopTypeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-rose-50 hover:text-[#B30E2E] transition flex items-center justify-between cursor-pointer ${
                        typeFilter === 'All' ? 'bg-[#FFF0F2] text-[#B30E2E] font-bold' : 'text-gray-700'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${typeFilter === 'All' ? 'bg-[#B30E2E]' : 'bg-gray-300'}`}></span>
                        <span>All Types</span>
                      </span>
                      {typeFilter === 'All' && <i className="fa-solid fa-check text-xs text-[#B30E2E]"></i>}
                    </button>

                    {/* Dynamic Project Types */}
                    {PROJECT_TYPES.map((type) => {
                      const isSelected = typeFilter === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setTypeFilter(type);
                            setIsDesktopTypeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-rose-50 hover:text-[#B30E2E] transition flex items-center justify-between cursor-pointer ${
                            isSelected ? 'bg-[#FFF0F2] text-[#B30E2E] font-bold' : 'text-gray-700'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-[#B30E2E]' : 'bg-gray-300'}`}></span>
                            <span className="truncate">{type}</span>
                          </span>
                          {isSelected && <i className="fa-solid fa-check text-xs text-[#B30E2E]"></i>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Action Symbol Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              {/* Create Project Button */}
              {canManage && (
                <button 
                  type="button" 
                  onClick={handleOpenCreateModal}
                  className="w-9 h-9 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white flex items-center justify-center transition shadow-sm border border-rose-900/40 cursor-pointer flex-shrink-0 transform hover:scale-105 active:scale-95"
                  title="Create New Project"
                >
                  <div className="relative inline-flex items-center justify-center">
                    <i className="fa-solid fa-building text-sm"></i>
                    <span className="absolute -top-1.5 -right-2 bg-white text-[#B30E2E] font-black text-[9px] w-3 h-3 rounded-full flex items-center justify-center border border-[#8A0B22] leading-none">+</span>
                  </div>
                </button>
              )}

              {/* Column Configuration Button */}
              <button 
                type="button"
                onClick={() => setShowProjectColumnConfigModal(true)}
                className="w-9 h-9 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white flex items-center justify-center transition shadow-sm border border-rose-900/40 cursor-pointer flex-shrink-0 transform hover:scale-105 active:scale-95"
                title="Column Configuration"
              >
                <i className="fa-solid fa-sliders text-sm"></i>
              </button>

              {/* Export CSV Button */}
              {canManage && (
                <button 
                  type="button" 
                  onClick={handleExportProjectCSV}
                  className="w-9 h-9 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white flex items-center justify-center transition shadow-sm border border-rose-900/40 cursor-pointer flex-shrink-0 transform hover:scale-105 active:scale-95"
                  title="Export"
                >
                  <i className="fa-solid fa-file-excel text-sm"></i>
                </button>
              )}

              {/* Import CSV Button */}
              {canManage && (
                <button 
                  type="button" 
                  onClick={() => setShowImportModal(true)}
                  className="w-9 h-9 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white flex items-center justify-center transition shadow-sm border border-rose-900/40 cursor-pointer flex-shrink-0 transform hover:scale-105 active:scale-95"
                  title="Import"
                >
                  <i className="fa-solid fa-file-import text-sm"></i>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Projects Table Body */}
        {loading ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <i className="fa-solid fa-circle-notch fa-spin text-3xl text-[#B30E2E]"></i>
            <p className="text-xs font-semibold">Loading projects data...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <i className="fa-solid fa-building text-4xl"></i>
            <p className="text-sm font-medium text-gray-600">No matching project records found.</p>
            <p className="text-xs text-gray-400">Click the "+ " button above to create a new project.</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar w-full rounded-b-2xl">
            {(() => {
              const visibleProjectCols = projectColumnConfig.filter(c => c.visible && (c.id !== 'actions' || canManage));
              const isProjectActionsPinned = isDesktopScreen && (projectColumnConfig.find(c => c.id === 'actions')?.pinned && canManage);

              let projectCurrentLeft = 0;
              const projectColLeftMap = {};
              if (isDesktopScreen) {
                visibleProjectCols.forEach(c => {
                  if (c.id !== 'actions' && c.pinned) {
                    projectColLeftMap[c.id] = projectCurrentLeft;
                    projectCurrentLeft += (PROJECT_COLUMN_WIDTH_MAP[c.id] || 150);
                  }
                });
              }

              const isProjectColPinned = (colId) => {
                if (!isDesktopScreen) return false;
                if (colId === 'actions') return isProjectActionsPinned;
                return projectColLeftMap[colId] !== undefined;
              };

              const getProjectThStyle = (colId) => {
                const width = PROJECT_COLUMN_WIDTH_MAP[colId] || 150;
                const pinned = isProjectColPinned(colId);
                const style = { width: `${width}px`, minWidth: `${width}px` };
                if (pinned) style.maxWidth = `${width}px`;
                if (colId === 'actions') {
                  if (isProjectActionsPinned) style.right = 0;
                  return style;
                }
                if (projectColLeftMap[colId] !== undefined) {
                  style.left = `${projectColLeftMap[colId]}px`;
                }
                return style;
              };

              const getProjectThClass = (colId, isSorted = false, extra = '') => {
                const pinned = isProjectColPinned(colId);
                const stickyClass = pinned 
                  ? (colId === 'actions' ? 'sticky top-0 right-0 z-30 bg-gray-100' : 'sticky top-0 z-30 bg-gray-100')
                  : '';
                const sortBg = isSorted ? 'bg-rose-50/70 text-[#B30E2E]' : '';
                const isSortable = colId !== 'actions';
                const cursorClass = isSortable ? 'cursor-pointer select-none group transition-colors hover:bg-gray-200/70' : 'select-none';
                return `${stickyClass} py-3 px-3.5 whitespace-nowrap border-b border-gray-200 ${cursorClass} ${sortBg} ${extra}`.trim();
              };

              const getProjectTdStyle = (colId) => {
                const width = PROJECT_COLUMN_WIDTH_MAP[colId] || 150;
                const pinned = isProjectColPinned(colId);
                const style = { width: `${width}px`, minWidth: `${width}px` };
                if (pinned) style.maxWidth = `${width}px`;
                if (colId === 'actions') {
                  if (isProjectActionsPinned) style.right = 0;
                  return style;
                }
                if (projectColLeftMap[colId] !== undefined) {
                  style.left = `${projectColLeftMap[colId]}px`;
                }
                return style;
              };

              const getProjectTdClass = (colId, extra = '') => {
                const pinned = isProjectColPinned(colId);
                const stickyClass = pinned 
                  ? (colId === 'actions' ? 'sticky right-0 z-20 bg-white group-hover:bg-slate-50' : 'sticky z-20 bg-white group-hover:bg-slate-50')
                  : '';
                return `${stickyClass} py-2.5 px-3.5 whitespace-nowrap transition-colors ${extra}`.trim();
              };

              const totalProjectTableWidth = visibleProjectCols.reduce((sum, c) => sum + (PROJECT_COLUMN_WIDTH_MAP[c.id] || 150), 0);

              return (
                <table 
                  className="w-full min-w-full text-left border-collapse table-fixed"
                  style={{ minWidth: `${totalProjectTableWidth}px` }}
                >
                  <thead className="sticky top-0 z-10 bg-gray-100 shadow-2xs">
                    <tr className="bg-gray-100 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      {visibleProjectCols.map(col => {
                        const isSorted = projectSortConfig.key === col.id;
                        const isAsc = isSorted && projectSortConfig.direction === 'asc';
                        const isDesc = isSorted && projectSortConfig.direction === 'desc';

                        const renderSortIndicator = () => {
                          if (isAsc) {
                            return <i className="fa-solid fa-arrow-up text-[#B30E2E] text-[9.5px]"></i>;
                          }
                          if (isDesc) {
                            return <i className="fa-solid fa-arrow-down text-[#B30E2E] text-[9.5px]"></i>;
                          }
                          return <i className="fa-solid fa-sort text-gray-300 group-hover:text-gray-500 text-[9px] transition-colors"></i>;
                        };

                        const getSortTitle = (label) => {
                          if (!isSorted) return `Click to sort by ${label} (A-Z / Ascending)`;
                          if (isAsc) return `Sorted Ascending. Click for Descending (Z-A)`;
                          return `Sorted Descending. Click to reset to default order`;
                        };

                        switch (col.id) {
                          case 'projectId':
                            return (
                              <th 
                                key="projectId" 
                                onClick={() => handleProjectSort('projectId')}
                                className={getProjectThClass('projectId', isSorted, 'text-center')} 
                                style={getProjectThStyle('projectId')}
                                title={getSortTitle('Project ID')}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <span># ID</span>
                                  {renderSortIndicator()}
                                </div>
                              </th>
                            );
                          case 'projectName':
                            return (
                              <th 
                                key="projectName" 
                                onClick={() => handleProjectSort('projectName')}
                                className={getProjectThClass('projectName', isSorted)} 
                                style={getProjectThStyle('projectName')}
                                title={getSortTitle('Project')}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>Project</span>
                                  {renderSortIndicator()}
                                </div>
                              </th>
                            );
                          case 'developerName':
                            return (
                              <th 
                                key="developerName" 
                                onClick={() => handleProjectSort('developerName')}
                                className={getProjectThClass('developerName', isSorted)} 
                                style={getProjectThStyle('developerName')}
                                title={getSortTitle('Developer')}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>Developer</span>
                                  {renderSortIndicator()}
                                </div>
                              </th>
                            );
                          case 'projectType':
                            return (
                              <th 
                                key="projectType" 
                                onClick={() => handleProjectSort('projectType')}
                                className={getProjectThClass('projectType', isSorted)} 
                                style={getProjectThStyle('projectType')}
                                title={getSortTitle('Project Type')}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>Project Type</span>
                                  {renderSortIndicator()}
                                </div>
                              </th>
                            );
                          case 'typography':
                            return (
                              <th 
                                key="typography" 
                                onClick={() => handleProjectSort('typography')}
                                className={getProjectThClass('typography', isSorted)} 
                                style={getProjectThStyle('typography')}
                                title={getSortTitle('Typography')}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>Typography</span>
                                  {renderSortIndicator()}
                                </div>
                              </th>
                            );
                          case 'reraNumber':
                            return (
                              <th 
                                key="reraNumber" 
                                onClick={() => handleProjectSort('reraNumber')}
                                className={getProjectThClass('reraNumber', isSorted)} 
                                style={getProjectThStyle('reraNumber')}
                                title={getSortTitle('RERA Number')}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>RERA No</span>
                                  {renderSortIndicator()}
                                </div>
                              </th>
                            );
                          case 'location':
                            return (
                              <th 
                                key="location" 
                                onClick={() => handleProjectSort('location')}
                                className={getProjectThClass('location', isSorted)} 
                                style={getProjectThStyle('location')}
                                title={getSortTitle('Area / Address')}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>Area / Address</span>
                                  {renderSortIndicator()}
                                </div>
                              </th>
                            );
                          case 'actions':
                            return (
                              <th 
                                key="actions" 
                                className={getProjectThClass('actions', false, 'text-center')} 
                                style={getProjectThStyle('actions')}
                              >
                                Actions
                              </th>
                            );
                          default:
                            return null;
                        }
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredProjects.map((project, idx) => {
                      const types = Array.isArray(project.projectType) ? project.projectType : [project.projectType].filter(Boolean);
                      let typos = [];
                      if (Array.isArray(project.typography)) {
                        typos = project.typography;
                      } else if (typeof project.typography === 'string') {
                        try {
                          const parsed = JSON.parse(project.typography);
                          if (Array.isArray(parsed)) typos = parsed;
                          else typos = project.typography.split(',').map(s => s.trim()).filter(Boolean);
                        } catch (e) {
                          typos = project.typography.split(',').map(s => s.trim()).filter(Boolean);
                        }
                      }
                      typos = typos.map(t => (t && t.trim().toLowerCase() === 'studio apartment') ? 'Studio' : t);

                      return (
                        <tr 
                          key={project.id || project._id || idx}
                          className="hover:bg-slate-50/80 transition group"
                        >
                          {visibleProjectCols.map(col => {
                            switch(col.id) {
                              case 'projectId':
                                return (
                                  <td key="projectId" className={getProjectTdClass('projectId', 'text-center text-gray-400 font-mono text-[10.5px]')} style={getProjectTdStyle('projectId')}>
                                    #{getProjectDisplayId(project)}
                                  </td>
                                );
                              case 'projectName':
                                return (
                                  <td key="projectName" className={getProjectTdClass('projectName', 'font-bold text-gray-900')} style={getProjectTdStyle('projectName')}>
                                    <span className="hover:text-[#B30E2E] transition-colors whitespace-nowrap">
                                      {project.name}
                                    </span>
                                  </td>
                                );
                              case 'developerName':
                                return (
                                  <td key="developerName" className={getProjectTdClass('developerName', 'text-gray-700 font-medium')} style={getProjectTdStyle('developerName')}>
                                    <span className="whitespace-nowrap">{project.developerName || <span className="text-gray-400 italic">—</span>}</span>
                                  </td>
                                );
                              case 'projectType':
                                return (
                                  <td key="projectType" className={getProjectTdClass('projectType')} style={getProjectTdStyle('projectType')}>
                                    {types.length === 0 ? (
                                      <span className="text-gray-400 italic">—</span>
                                    ) : (
                                      <div className="flex flex-wrap gap-1">
                                        {types.map(t => (
                                          <span 
                                            key={t}
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${TYPE_BADGE_STYLE[t] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                                          >
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                );
                              case 'typography':
                                return (
                                  <td key="typography" className={getProjectTdClass('typography')} style={getProjectTdStyle('typography')}>
                                    {typos.length > 0 ? (
                                      <div className="flex flex-col gap-0.5" title={typos.join('\r\n')}>
                                        {typos.map((t, i) => (
                                          <span 
                                            key={i}
                                            className="text-[11px] font-semibold text-gray-800 leading-tight block whitespace-nowrap"
                                          >
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="w-full flex items-center py-0.5">
                                        <span className="text-gray-400 italic text-[10.5px]">—</span>
                                      </div>
                                    )}
                                  </td>
                                );
                              case 'reraNumber':
                                return (
                                  <td key="reraNumber" className={getProjectTdClass('reraNumber')} style={getProjectTdStyle('reraNumber')}>
                                    {project.reraNumber ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10.5px] font-semibold text-slate-800 whitespace-nowrap">
                                        {project.reraNumber}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 italic">—</span>
                                    )}
                                  </td>
                                );
                              case 'location':
                                return (
                                  <td key="location" className={getProjectTdClass('location')} style={getProjectTdStyle('location')} title={`${project.area ? project.area + ' - ' : ''}${project.address || ''}`}>
                                    {project.area || project.address ? (
                                      <div className="flex items-center gap-1.5 text-xs text-gray-700 truncate max-w-full">
                                        <i className="fa-solid fa-location-dot text-[#B30E2E] text-[10px] shrink-0"></i>
                                        {project.area && (
                                          <span className="font-bold text-gray-900 shrink-0">{project.area}</span>
                                        )}
                                        {project.area && project.address && (
                                          <span className="text-gray-400 shrink-0 font-normal">-</span>
                                        )}
                                        {project.address && (
                                          <span className="text-gray-500 truncate font-normal text-[11px]" title={project.address}>
                                            {project.address}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic text-xs">—</span>
                                    )}
                                  </td>
                                );
                              case 'actions':
                                return (
                                  <td key="actions" className={getProjectTdClass('actions', 'text-center')} style={getProjectTdStyle('actions')}>
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditModal(project)}
                                        className="w-7 h-7 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 flex items-center justify-center transition cursor-pointer"
                                        title="Edit Project"
                                      >
                                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                                      </button>
                                      {canDelete && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDeleteErrorMsg('');
                                            setDeleteConfirmation({ isOpen: true, project });
                                          }}
                                          className="w-7 h-7 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center transition cursor-pointer"
                                          title="Delete Project"
                                        >
                                          <i className="fa-solid fa-trash-can text-xs"></i>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                );
                              default:
                                return null;
                            }
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>
        )}
      </div>

      {/* CREATE / EDIT PROJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden relative">
            
            {/* Header (Exact Lead Modal Gradient) */}
            <div className="bg-gradient-to-r from-[#B30E2E] via-[#8A0B22] to-[#590414] p-4 sm:p-5 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-serif font-bold text-base">
                  {modalMode === 'create' ? 'New Project' : 'Edit Project'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsTypeDropdownOpen(false);
                  setIsTypoDropdownOpen(false);
                  setShowModal(false);
                }}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              
              {/* Middle Scrollable Content */}
              <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar project-modal-scrollable">
                
                {/* In-Form Success / Error Banner (Exact Lead Modal Style) */}
                {formMsg && (() => {
                  const isSuccess = formMsg.toLowerCase().includes('success') && !formMsg.toLowerCase().includes('not') && !formMsg.toLowerCase().includes('error');
                  return (
                    <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
                      isSuccess ? 'bg-emerald-100 border border-emerald-300 text-emerald-900' : 'bg-rose-100 border border-rose-300 text-rose-900'
                    }`}>
                      <i className={`fa-solid ${isSuccess ? 'fa-circle-check text-emerald-600' : 'fa-triangle-exclamation text-rose-600'}`}></i>
                      <span>{formMsg}</span>
                    </div>
                  );
                })()}

                {/* 1. Project Name & Developer Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Project *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const wasMisc = (formData.name || '').trim().toLowerCase().includes('miscellaneous');
                        const isNowMisc = newName.trim().toLowerCase().includes('miscellaneous');

                        if (!wasMisc && isNowMisc) {
                          // Auto-select all project types and all typographies when Miscellaneous is typed
                          const allTypes = [...PROJECT_TYPES];
                          const allTypos = [];
                          allTypes.forEach(pType => {
                            if (pType === 'Apartment') {
                              APARTMENT_TYPOGRAPHY_GROUPS.forEach(grp => grp.items.forEach(it => { if (!allTypos.includes(it)) allTypos.push(it); }));
                            } else {
                              const opts = TYPOGRAPHY_BY_TYPE[pType] || [];
                              opts.forEach(it => { if (!allTypos.includes(it)) allTypos.push(it); });
                            }
                          });
                          setFormData({
                            ...formData,
                            name: newName,
                            projectType: allTypes,
                            typography: allTypos
                          });
                        } else {
                          setFormData({ ...formData, name: newName });
                        }
                      }}
                      placeholder="Enter project"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Developer Name</label>
                    <input 
                      type="text" 
                      value={formData.developerName}
                      onChange={(e) => setFormData({ ...formData, developerName: e.target.value })}
                      placeholder="Enter developer name"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC]"
                    />
                  </div>
                </div>

                {/* 2. Project RERA Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">RERA No</label>
                  <input 
                    type="text" 
                    value={formData.reraNumber}
                    onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value })}
                    placeholder="Enter RERA No"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] font-mono"
                  />
                </div>

                {/* 3. Project Type (Exact Lead Dropdown Trigger Button) */}
                <div ref={typeDropdownRef} className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Project Type *
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleTypeDropdown}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none flex items-center justify-between text-left transition bg-white shadow-xs cursor-pointer ${
                      isTypeDropdownOpen
                        ? 'border-[#B30E2E] ring-1 ring-[#FCD6DC]'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="truncate">
                      {formData.projectType.length === 0 ? (
                        <span className="text-gray-400 font-normal">Select Project Type</span>
                      ) : (
                        <span className="text-gray-800 font-semibold">{formData.projectType.join(', ')}</span>
                      )}
                    </span>
                    <i className={`fa-solid fa-chevron-down text-xs text-gray-400 transition-transform flex-shrink-0 ${isTypeDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </button>
                </div>

                {/* 4. Project Typography (Exact Lead Dropdown Trigger Button) */}
                <div ref={typoDropdownRef} className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Project Typography *
                  </label>
                  <button
                    type="button"
                    disabled={formData.projectType.length === 0}
                    onClick={handleToggleTypoDropdown}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none flex items-center justify-between text-left transition shadow-xs ${
                      formData.projectType.length === 0
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : isTypoDropdownOpen
                          ? 'bg-white border-[#B30E2E] ring-1 ring-[#FCD6DC] cursor-pointer'
                          : 'bg-white border-gray-300 hover:border-gray-400 cursor-pointer'
                    }`}
                  >
                    <span className="truncate">
                      {formData.projectType.length === 0 ? (
                        <span className="text-gray-400 font-normal">Select Project Type first</span>
                      ) : formData.typography.length === 0 ? (
                        <span className="text-gray-400 font-normal">Select Typography</span>
                      ) : (
                        <span className="text-gray-800 font-semibold">{formData.typography.join(', ')}</span>
                      )}
                    </span>
                    <i className={`fa-solid fa-chevron-down text-xs text-gray-400 transition-transform flex-shrink-0 ${isTypoDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </button>
                </div>

                {/* 5. Area & Address (Side by Side) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Area Dropdown */}
                  <div ref={areaDropdownRef} className="relative">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Area <span className="text-rose-500">*</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleToggleAreaDropdown}
                      className={`w-full h-[38px] px-3 py-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition bg-white ${
                        isAreaDropdownOpen
                          ? 'border-[#B30E2E] ring-1 ring-[#FCD6DC]'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className={formData.area ? 'font-semibold text-gray-800 truncate' : 'text-gray-400 truncate'}>
                        {formData.area || 'Select Area'}
                      </span>
                      <i className={`fa-solid fa-chevron-down text-xs text-gray-400 transition-transform flex-shrink-0 ${isAreaDropdownOpen ? 'rotate-180 text-[#B30E2E]' : ''}`}></i>
                    </button>

                    <input
                      type="text"
                      className="sr-only"
                      tabIndex={-1}
                      required
                      value={formData.area}
                      onChange={() => {}}
                    />
                  </div>

                  {/* Address Field */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Address
                    </label>
                    <input 
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter project address"
                      className="w-full h-[38px] px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-gray-800"
                    />
                  </div>
                </div>

              </div>

              {/* Action Buttons: Fixed Bottom Bar (Exact Lead Modal Footer) */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2 flex-shrink-0">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsTypeDropdownOpen(false);
                    setIsTypoDropdownOpen(false);
                    setShowModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                      <span>Saving Project...</span>
                    </>
                  ) : (
                    <span>Submit</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* FLOATING PROJECT TYPE DROPDOWN MENU (position: fixed z-[99999] so it floats in FRONT of modal) */}
      {showModal && isTypeDropdownOpen && typeCoords && (
        <div 
          onWheel={(e) => e.stopPropagation()}
          className="fixed z-[99999] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-y-auto overscroll-contain custom-scrollbar animate-fade-in project-type-dropdown-menu flex flex-col"
          style={{
            top: `${typeCoords.top}px`,
            left: `${typeCoords.left}px`,
            width: `${typeCoords.width}px`,
            maxHeight: `${typeCoords.maxHeight}px`
          }}
        >
          {/* SELECT ALL TOOLBAR (Only shown for Miscellaneous projects) */}
          <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project Types</span>
            {isMiscellaneousProject && (
              <button
                type="button"
                onClick={handleToggleSelectAllProjectTypes}
                className="text-[11px] font-bold text-[#B30E2E] hover:text-[#8A0B22] hover:underline cursor-pointer flex items-center gap-1"
              >
                <i className={`fa-solid ${PROJECT_TYPES.every(t => formData.projectType.includes(t)) ? 'fa-square-check' : 'fa-check-double'} text-[10px]`}></i>
                <span>{PROJECT_TYPES.every(t => formData.projectType.includes(t)) ? 'Deselect All' : 'Select All'}</span>
              </button>
            )}
          </div>

          <div className="py-1">
            {PROJECT_TYPES.map(type => {
              const isChecked = formData.projectType.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleToggleProjectType(type)}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-rose-50 hover:text-[#B30E2E] transition flex items-center gap-2.5 cursor-pointer ${
                    isChecked ? 'bg-[#FFF0F2]/60 text-[#B30E2E] font-bold' : 'text-gray-700'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition flex-shrink-0 ${
                      isChecked
                        ? 'bg-[#B30E2E] border-[#B30E2E] text-white'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {isChecked && <i className="fa-solid fa-check text-[9px]"></i>}
                  </span>
                  <span className="truncate">{type}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FLOATING PROJECT TYPOGRAPHY DROPDOWN MENU (Compact Box) */}
      {showModal && isTypoDropdownOpen && typoCoords && formData.projectType.length > 0 && (() => {
        const query = typoSearch.trim().toLowerCase();

        // Calculate total matches across all selected project types
        let totalMatches = 0;
        formData.projectType.forEach(pType => {
          if (pType === 'Apartment') {
            APARTMENT_TYPOGRAPHY_GROUPS.forEach(grp => {
              if (!query || grp.group.toLowerCase().includes(query)) {
                totalMatches += grp.items.length;
              } else {
                totalMatches += grp.items.filter(item => item.toLowerCase().includes(query)).length;
              }
            });
          } else {
            const opts = TYPOGRAPHY_BY_TYPE[pType] || [];
            totalMatches += query ? opts.filter(item => item.toLowerCase().includes(query)).length : opts.length;
          }
        });

        return (
          <>
            {/* Subtle backdrop on mobile so tapping outside closes it immediately */}
            <div 
              className="fixed inset-0 z-[99998] bg-black/25 sm:hidden animate-fade-in"
              onClick={() => {
                setIsTypoDropdownOpen(false);
                setTypoSearch('');
              }}
            />

            <div 
              onWheel={(e) => e.stopPropagation()}
              className="fixed z-[99999] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in project-typo-dropdown-menu"
              style={{
                top: `${typoCoords.top}px`,
                left: `${typoCoords.left}px`,
                width: `${typoCoords.width}px`,
                maxHeight: `${typoCoords.maxHeight}px`
              }}
            >
              {/* COMPACT HEADER / TITLE */}
              <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-700">Project Typography</span>
                  <span className="text-[10px] bg-rose-100 text-[#B30E2E] px-1.5 py-0.2 rounded-full font-bold">
                    {formData.typography.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsTypoDropdownOpen(false);
                    setTypoSearch('');
                  }}
                  className="w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition cursor-pointer text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* STICKY SEARCH BAR */}
              <div className="p-2 border-b border-gray-100 bg-white flex-shrink-0 space-y-1.5">
                <div className="relative flex items-center">
                  <i className="fa-solid fa-magnifying-glass text-gray-400 text-[10px] absolute left-2.5 pointer-events-none"></i>
                  <input
                    type="text"
                    value={typoSearch}
                    onChange={(e) => setTypoSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Search typography..."
                    className="w-full pl-7 pr-6 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#B30E2E] focus:bg-white transition"
                  />
                  {typoSearch && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTypoSearch('');
                      }}
                      className="absolute right-2 text-gray-400 hover:text-gray-600 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer text-[10px]"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>

                {/* SELECT ALL (Only for Miscellaneous) */}
                {isMiscellaneousProject && (
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {formData.typography.length} of {allAvailableTypographies.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleSelectAllTypography}
                      className="text-[10px] font-bold text-[#B30E2E] hover:underline cursor-pointer"
                    >
                      {allAvailableTypographies.length > 0 && allAvailableTypographies.every(item => formData.typography.includes(item)) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                )}
              </div>

              {/* SCROLLABLE LIST OF TYPOGRAPHIES (COMPACT ROWS) */}
              <div className="overflow-y-auto overscroll-contain custom-scrollbar flex-1 py-0.5">
                {totalMatches === 0 ? (
                  <div className="py-5 px-3 text-center">
                    <p className="text-xs font-bold text-gray-600">No matches</p>
                    <p className="text-[10px] text-gray-400">Try a different search</p>
                  </div>
                ) : (
                  formData.projectType.map(pType => {
                    const options = TYPOGRAPHY_BY_TYPE[pType] || [];

                    if (pType === 'Apartment') {
                      const filteredGroups = APARTMENT_TYPOGRAPHY_GROUPS.map(grp => {
                        if (!query) return grp;
                        if (grp.group.toLowerCase().includes(query)) return grp;
                        const matched = grp.items.filter(it => it.toLowerCase().includes(query));
                        return { ...grp, items: matched };
                      }).filter(grp => grp.items.length > 0);

                      if (filteredGroups.length === 0) return null;

                      return (
                        <div key={pType} className="border-b border-gray-100 last:border-none py-0.5">
                          <div className="px-2.5 py-1 text-[9.5px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70">
                            Apartment
                          </div>
                          {filteredGroups.map(grp => (
                            <div key={grp.group} className="py-0.5">
                              <div className="px-2.5 py-0.5 text-[9px] font-bold text-gray-400 uppercase flex items-center justify-between">
                                <span>{grp.group}</span>
                                <span className="text-[8.5px] text-gray-400 font-normal">
                                  {grp.items.filter(item => formData.typography.includes(item)).length}/{grp.items.length}
                                </span>
                              </div>
                              {grp.items.map(item => {
                                const isChecked = formData.typography.includes(item);
                                return (
                                  <button
                                    key={item}
                                    type="button"
                                    onClick={() => handleToggleTypography(item)}
                                    className={`w-full text-left px-2.5 py-1 text-xs font-medium hover:bg-rose-50 hover:text-[#B30E2E] transition flex items-center gap-2 cursor-pointer ${
                                      isChecked ? 'bg-[#FFF0F2] text-[#B30E2E] font-bold' : 'text-gray-700'
                                    }`}
                                  >
                                    <span
                                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition flex-shrink-0 ${
                                        isChecked
                                          ? 'bg-[#B30E2E] border-[#B30E2E] text-white'
                                          : 'bg-white border-gray-300'
                                      }`}
                                    >
                                      {isChecked && <i className="fa-solid fa-check text-[8px]"></i>}
                                    </span>
                                    <span className="truncate">{item}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // Non-Apartment (Villa, Plots)
                    const filteredOptions = query
                      ? options.filter(item => item.toLowerCase().includes(query))
                      : options;

                    if (filteredOptions.length === 0) return null;

                    return (
                      <div key={pType} className="border-b border-gray-100 last:border-none py-0.5">
                        <div className="px-2.5 py-1 text-[9.5px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70">
                          {pType === 'Plots' ? 'Plot Sub-Types' : pType}
                        </div>
                        {filteredOptions.map(item => {
                          const isChecked = formData.typography.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleToggleTypography(item)}
                              className={`w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-rose-50 hover:text-[#B30E2E] transition flex items-center gap-2 cursor-pointer ${
                                isChecked ? 'bg-[#FFF0F2] text-[#B30E2E] font-bold' : 'text-gray-700'
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition flex-shrink-0 ${
                                  isChecked
                                    ? 'bg-[#B30E2E] border-[#B30E2E] text-white'
                                    : 'bg-white border-gray-300'
                                }`}
                              >
                                {isChecked && <i className="fa-solid fa-check text-[8px]"></i>}
                              </span>
                              <span className="truncate">{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              {/* COMPACT FOOTER */}
              <div className="px-2.5 py-1.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                <span className="text-[11px] font-semibold text-gray-500">
                  {formData.typography.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsTypoDropdownOpen(false);
                    setTypoSearch('');
                  }}
                  className="px-3 py-1 bg-[#B30E2E] hover:bg-[#8A0B22] text-white text-[11px] font-bold rounded-lg transition cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        );
      })()}

      {/* FLOATING AREA DROPDOWN MENU */}
      {showModal && isAreaDropdownOpen && areaCoords && (() => {
        const query = areaSearch.trim().toLowerCase();
        const availableAreas = [...PROJECT_AREAS];
        if (formData.area && !availableAreas.includes(formData.area)) {
          availableAreas.unshift(formData.area);
        }
        const filteredAreas = query 
          ? availableAreas.filter(a => a.toLowerCase().includes(query))
          : availableAreas;

        return (
          <>
            {/* Subtle backdrop on mobile so tapping outside closes it immediately */}
            <div 
              className="fixed inset-0 z-[99998] bg-black/25 sm:hidden animate-fade-in"
              onClick={() => {
                setIsAreaDropdownOpen(false);
                setAreaSearch('');
              }}
            />

            <div 
              onWheel={(e) => e.stopPropagation()}
              className="fixed z-[99999] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in project-area-dropdown-menu"
              style={{
                top: `${areaCoords.top}px`,
                left: `${areaCoords.left}px`,
                width: `${areaCoords.width}px`,
                maxHeight: `${areaCoords.maxHeight}px`
              }}
            >
              {/* Header with Title & Search */}
              <div className="p-2 border-b border-gray-100 bg-gray-50 flex-shrink-0 space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Area</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAreaDropdownOpen(false);
                      setAreaSearch('');
                    }}
                    className="w-4 h-4 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition cursor-pointer text-xs"
                  >
                    <i className="fa-solid fa-xmark text-[10px]"></i>
                  </button>
                </div>

                <div className="relative flex items-center">
                  <i className="fa-solid fa-magnifying-glass text-gray-400 text-[10px] absolute left-2.5 pointer-events-none"></i>
                  <input
                    type="text"
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    placeholder="Search area..."
                    className="w-full pl-7 pr-6 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#B30E2E]"
                  />
                  {areaSearch && (
                    <button
                      type="button"
                      onClick={() => setAreaSearch('')}
                      className="absolute right-2 text-gray-400 hover:text-gray-600 text-[10px] w-4 h-4 flex items-center justify-center cursor-pointer"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Area List */}
              <div className="overflow-y-auto overscroll-contain custom-scrollbar flex-1 py-1">
                {filteredAreas.length === 0 ? (
                  <div className="py-4 px-3 text-center text-gray-400 text-xs">
                    No area found
                  </div>
                ) : (
                  filteredAreas.map(areaName => {
                    const isSelected = formData.area === areaName;
                    return (
                      <button
                        key={areaName}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, area: areaName }));
                          setIsAreaDropdownOpen(false);
                          setAreaSearch('');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-rose-50 hover:text-[#B30E2E] transition flex items-center justify-between cursor-pointer ${
                          isSelected ? 'bg-[#FFF0F2] text-[#B30E2E] font-bold' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <i className={`fa-solid fa-location-dot text-[10.5px] ${isSelected ? 'text-[#B30E2E]' : 'text-gray-400'}`}></i>
                          <span className="truncate">{areaName}</span>
                        </div>
                        {isSelected && (
                          <i className="fa-solid fa-check text-[10px] text-[#B30E2E]"></i>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* Project Table Column Configuration Modal (Show/Hide & Drag-Drop Reorder) */}
      {showProjectColumnConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            {/* Modal Header */}
            <div className="px-5 py-3 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">Project Table Columns</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={unpinAllProjectColumns}
                  className="h-7 px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  title="Unfreeze all columns"
                >
                  <i className="fa-solid fa-thumbtack text-[9.5px] text-slate-400"></i>
                  <span>Unfreeze All</span>
                </button>
                <button
                  type="button"
                  onClick={resetProjectColumnConfig}
                  className="h-7 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer whitespace-nowrap flex items-center"
                  title="Reset to default columns"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowProjectColumnConfigModal(false)}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition cursor-pointer"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>
            </div>

            {/* Columns List with Drag & Drop + Freeze Button + Arrows + Checkbox */}
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-2">
              {projectColumnConfig.filter(col => col.id !== 'actions' || canManage).map((col, idx) => (
                <div
                  key={col.id}
                  draggable
                  onDragStart={() => setDraggedProjectColumnIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedProjectColumnIndex !== null && draggedProjectColumnIndex !== idx) {
                      moveProjectColumn(draggedProjectColumnIndex, idx);
                      setDraggedProjectColumnIndex(null);
                    }
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                    col.visible ? 'bg-white border-gray-200 hover:border-purple-300' : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 px-1">
                      <i className="fa-solid fa-grip-vertical text-xs"></i>
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 select-none truncate">
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleProjectColumnVisibility(col.id)}
                        className="w-4 h-4 rounded text-[#B30E2E] focus:ring-[#B30E2E] cursor-pointer accent-[#B30E2E]"
                      />
                      <span className="truncate">{col.label}</span>
                    </label>
                    {col.pinned && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        <i className="fa-solid fa-thumbtack text-[8px] rotate-45"></i>
                        <span>Frozen</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleProjectColumnPin(col.id)}
                      className={`px-2 py-1 rounded-md text-[10.5px] font-semibold flex items-center gap-1 transition cursor-pointer border ${
                        col.pinned 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-2xs' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                      title={col.pinned ? 'Column is frozen. Click to unfreeze' : 'Click to freeze column while scrolling'}
                    >
                      <i className={`fa-solid fa-thumbtack text-[9px] ${col.pinned ? 'rotate-45' : ''}`}></i>
                      <span>{col.pinned ? 'Frozen' : 'Freeze'}</span>
                    </button>

                    <button
                      disabled={idx === 0}
                      onClick={() => moveProjectColumn(idx, idx - 1)}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-purple-100 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-600 hover:text-purple-700 flex items-center justify-center text-[10px] transition cursor-pointer"
                      title="Move Up"
                    >
                      <i className="fa-solid fa-arrow-up"></i>
                    </button>
                    <button
                      disabled={idx === projectColumnConfig.length - 1}
                      onClick={() => moveProjectColumn(idx, idx + 1)}
                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-purple-100 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-600 hover:text-purple-700 flex items-center justify-center text-[10px] transition cursor-pointer"
                      title="Move Down"
                    >
                      <i className="fa-solid fa-arrow-down"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-gray-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowProjectColumnConfigModal(false)}
                className="px-5 py-1.5 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B2E] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Projects Modal (Exactly matching Lead Table Import Design) */}
      {showImportModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-fade-in"
          onClick={() => !isImporting && resetImportModal()}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col relative"
            onClick={(e) => {
              e.stopPropagation();
              if (showColumnMappingPopover) setShowColumnMappingPopover(false);
            }}
          >
            {/* Header: Exact Lead Table Gradient */}
            <div className="bg-gradient-to-r from-[#B30E2E] via-[#8A0B22] to-[#590414] p-4 sm:p-5 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-file-import text-lg"></i>
                <h3 className="font-serif font-bold text-base">Import Projects from CSV</h3>
              </div>
              <button 
                type="button"
                onClick={resetImportModal}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className={`p-5 space-y-4 overflow-y-auto max-h-[75vh] ${showColumnMappingPopover ? 'min-h-[220px]' : ''}`}>
              {importMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  importMsg.includes('Error') ? 'bg-rose-100 border border-rose-300 text-rose-900' : 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                }`}>
                  <i className={`fa-solid ${importMsg.includes('Error') ? 'fa-triangle-exclamation text-rose-600' : 'fa-circle-check text-emerald-600'}`}></i>
                  <span>{importMsg}</span>
                </div>
              )}

              {importFile ? (
                // File loaded: compact file row with Red/Green column mapping symbol & floating popover
                <div className="relative">
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <i className="fa-solid fa-file-csv text-[#B30E2E] text-base"></i>
                      <span className="text-xs font-bold text-slate-800 truncate" title={importFile.name}>{importFile.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      {importSheet.headers.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowColumnMappingPopover(prev => !prev);
                          }}
                          title={
                            unmappedColumns.length > 0
                              ? `${unmappedColumns.length} unmapped column(s) — Click to view details`
                              : 'All CSV columns mapped — Click to view details'
                          }
                          className={`relative inline-flex items-center justify-center w-7 h-7 rounded-full border transition cursor-pointer shadow-xs ${
                            unmappedColumns.length > 0
                              ? 'bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-600 ring-2 ring-rose-200/70'
                              : 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-600 ring-2 ring-emerald-200/70'
                          }`}
                        >
                          <i className={`fa-solid ${unmappedColumns.length > 0 ? 'fa-triangle-exclamation' : 'fa-circle-check'} text-xs`}></i>
                          {unmappedColumns.length > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center leading-none shadow-xs">
                              {unmappedColumns.length}
                            </span>
                          )}
                        </button>
                      )}
                      {!isImporting && (
                        <label className="text-[11px] font-bold text-[#B30E2E] hover:underline cursor-pointer whitespace-nowrap">
                          Change file
                          <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Floating Popover Message on Symbol Click */}
                  {showColumnMappingPopover && importSheet.headers.length > 0 && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute left-0 right-0 top-full mt-1.5 z-30 px-3 py-2.5 rounded-xl border text-xs shadow-xl animate-fade-in ${
                        unmappedColumns.length > 0
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      }`}
                    >
                      {unmappedColumns.length > 0 ? (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <i className="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5 text-xs flex-shrink-0"></i>
                            <div className="flex-1 space-y-1">
                              <p className="font-bold text-rose-800 text-xs leading-snug">
                                Following {unmappedColumns.length === 1 ? 'field' : 'fields'} cannot be imported:
                              </p>
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {unmappedColumns.map((col, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-rose-300 text-rose-800 font-bold text-[11px] shadow-xs"
                                  >
                                    <i className="fa-solid fa-circle-xmark text-[10px] text-rose-600"></i>
                                    {col}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowColumnMappingPopover(false)}
                            className="text-rose-500 hover:text-rose-800 w-5 h-5 rounded-full hover:bg-rose-100 flex items-center justify-center transition cursor-pointer flex-shrink-0"
                            title="Close"
                          >
                            <i className="fa-solid fa-xmark text-xs"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <i className="fa-solid fa-circle-check text-emerald-600 mt-0.5 text-xs flex-shrink-0"></i>
                            <div className="flex-1 space-y-1">
                              <p className="font-bold text-emerald-800 text-xs leading-snug">
                                All fields will be imported:
                              </p>
                              {mappedColumns.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {mappedColumns.map((col, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold text-[11px] shadow-xs"
                                    >
                                      <i className="fa-solid fa-circle-check text-[10px] text-emerald-600"></i>
                                      {col}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowColumnMappingPopover(false)}
                            className="text-emerald-600 hover:text-emerald-900 w-5 h-5 rounded-full hover:bg-emerald-100 flex items-center justify-center transition cursor-pointer flex-shrink-0"
                            title="Close"
                          >
                            <i className="fa-solid fa-xmark text-xs"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Exact Lead Table Dropzone */
                <div className="border-2 border-dashed border-rose-300 hover:border-[#B30E2E] rounded-2xl p-6 text-center bg-rose-50/40 hover:bg-rose-50 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF0F2] text-[#B30E2E] border border-[#FCD6DC] flex items-center justify-center mx-auto text-xl shadow-xs">
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Click or Drag CSV File Here</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Supports Google Sheets export (.csv)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {importDuplicates.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3">
                  <span className="font-semibold">
                    <i className="fa-solid fa-copy mr-1.5 text-amber-600"></i>
                    {importDuplicates.length} duplicate {importDuplicates.length === 1 ? 'row was' : 'rows were'} skipped (project name already exists)
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadDuplicates}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-download text-[10px]"></i>
                    Download CSV
                  </button>
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
                    <span>Preview Parsed Projects ({importPreview.length} found)</span>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-x-auto overflow-y-auto max-h-48 custom-scrollbar text-[11px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead className="bg-gray-100 text-gray-700 sticky top-0 font-bold z-10">
                        <tr>
                          <th className="p-2 border-b">Project</th>
                          <th className="p-2 border-b">Developer</th>
                          <th className="p-2 border-b">Type</th>
                          <th className="p-2 border-b">Typography</th>
                          <th className="p-2 border-b">Area</th>
                          <th className="p-2 border-b">RERA No</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((project, idx) => (
                          <tr key={idx} className="border-b hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-800">{project.name}</td>
                            <td className="p-2 text-slate-600">{project.developerName || '-'}</td>
                            <td className="p-2 text-slate-600">{Array.isArray(project.projectType) ? project.projectType.join(', ') : project.projectType}</td>
                            <td className="p-2 text-slate-600">{Array.isArray(project.typography) ? project.typography.join(', ') : project.typography}</td>
                            <td className="p-2 text-slate-600">{project.area || project.address || '-'}</td>
                            <td className="p-2 text-slate-500">{project.reraNumber || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Exact Lead Table Footer */}
            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={resetImportModal}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
              >
                {importDuplicates.length > 0 || importMsg ? 'Close' : 'Cancel'}
              </button>
              {(importPreview.length > 0 || isImporting) && (
                <button
                  type="button"
                  disabled={importPreview.length === 0 || isImporting}
                  onClick={handleConfirmImportProjects}
                  className="px-5 py-2 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-file-import text-xs"></i>
                      <span>Import {importPreview.length} Projects</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full p-5 space-y-4 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-[#B30E2E] mx-auto flex items-center justify-center text-xl">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>

            {deleteConfirmation.project?.assignedLeadsCount > 0 ? (
              <>
                <div className="space-y-1.5">
                  <h3 className="font-serif font-bold text-gray-900 text-base">Cannot Delete Project</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    This project has <strong className="text-gray-900">{deleteConfirmation.project.assignedLeadsCount} assigned {deleteConfirmation.project.assignedLeadsCount === 1 ? 'lead' : 'leads'}</strong> and cannot be deleted.
                  </p>
                </div>

                <div className="flex items-center justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmation({ isOpen: false, project: null });
                      setDeleteErrorMsg('');
                    }}
                    className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer transition active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-gray-900 text-base">Delete Project?</h3>
                  <p className="text-xs text-gray-500">
                    Are you sure you want to delete project <strong className="text-gray-800">"{deleteConfirmation.project?.name}"</strong>? This action cannot be undone.
                  </p>
                </div>

                {deleteErrorMsg && (
                  <div className="p-3 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-left animate-fade-in">
                    <i className="fa-solid fa-circle-exclamation text-rose-600 mt-0.5 flex-shrink-0"></i>
                    <span className="leading-relaxed">{deleteErrorMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmation({ isOpen: false, project: null });
                      setDeleteErrorMsg('');
                    }}
                    disabled={deleting}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                    className="px-5 py-2 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white text-xs font-bold shadow cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {deleting && <i className="fa-solid fa-spinner fa-spin text-xs"></i>}
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
