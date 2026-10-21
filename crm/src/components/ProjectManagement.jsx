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
    items: ['Studio Apartment']
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
    'Studio Apartment',
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
    'Studio Apartment', '1 RK Studio', 'Executive Studio'
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

export default function ProjectManagement({ currentUser, isSuperAdmin, isAdmin }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [isCustomArea, setIsCustomArea] = useState(false);

  // Floating Dropdown State (Fixed Positioning so it floats in FRONT without overflow clipping)
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isTypoDropdownOpen, setIsTypoDropdownOpen] = useState(false);
  const [typeCoords, setTypeCoords] = useState(null);
  const [typoCoords, setTypoCoords] = useState(null);
  const [typoSearch, setTypoSearch] = useState('');

  const typeDropdownRef = useRef(null);
  const typoDropdownRef = useRef(null);

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

  // Toggle Type Dropdown with smart viewport calculation
  const handleToggleTypeDropdown = (e) => {
    e.stopPropagation();
    if (isTypeDropdownOpen) {
      setIsTypeDropdownOpen(false);
      return;
    }
    setIsTypoDropdownOpen(false);

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

    // If space below is limited, open UPWARDS in front of modal content
    if (spaceBelow < (isMobile ? 180 : 240) && spaceAbove > spaceBelow) {
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
          e.target.closest('.custom-table-typo-menu') ||
          e.target.closest('.project-modal-scrollable')
        ) {
          return;
        }
      }
      setIsTypeDropdownOpen(false);
      setIsTypoDropdownOpen(false);
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

  // Filtered Projects for Table
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Type Filter
      if (typeFilter !== 'All') {
        const types = Array.isArray(p.projectType) ? p.projectType : [p.projectType];
        const hasType = types.some(t => String(t).toLowerCase() === typeFilter.toLowerCase());
        if (!hasType) return false;
      }

      // Area Filter
      if (areaFilter !== 'All') {
        if ((p.area || '').toLowerCase() !== areaFilter.toLowerCase()) return false;
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
    });
  }, [projects, searchQuery, typeFilter, areaFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingProjectId(null);
    setFormData(initialFormState);
    setIsCustomArea(false);
    setFormMsg('');
    setIsTypeDropdownOpen(false);
    setIsTypoDropdownOpen(false);
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
    // If old test project had sub-types in projectType, migrate them into typography
    const oldPlotTypes = rawTypes.filter(t => ['Industrial', 'Commercial / Industrial', 'Agriculture', 'Non-Agriculture', 'Residential'].includes(t));
    oldPlotTypes.forEach(st => {
      const mapped = st === 'Industrial' ? 'Commercial / Industrial' : st;
      if (!initialTypos.includes(mapped)) {
        initialTypos.push(mapped);
      }
    });

    const projectArea = project.area || '';
    setIsCustomArea(Boolean(projectArea && !PROJECT_AREAS.includes(projectArea)));

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
      setFormMsg('Project Name is required.');
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
      fetchProjects();
    } catch (err) {
      showToast(err.message || 'Failed to delete project', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const canManage = isSuperAdmin || isAdmin;

  return (
    <div className="space-y-3 animate-fade-in flex-1 flex flex-col min-h-0 overflow-hidden">
      
      {/* Toast Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-bold ${
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
        <div className="px-3 sm:px-4 py-2.5 border-b border-gray-100 bg-gray-50/70 rounded-t-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 flex-shrink-0">
          
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
                >
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              )}
            </div>

            {/* Area Filter Select */}
            <div className="w-36 flex-shrink-0 relative">
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-xs bg-white hover:bg-gray-50 font-bold text-gray-700 cursor-pointer shadow-xs"
              >
                <option value="All">All Areas</option>
                {PROJECT_AREAS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Type Filter Select */}
            <div className="w-36 flex-shrink-0 relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-xs bg-white hover:bg-gray-50 font-bold text-gray-700 cursor-pointer shadow-xs"
              >
                <option value="All">All Types</option>
                {PROJECT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Action Symbol Buttons (Exact Lead Table style) */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {/* Create Project Button (Exact Create Lead Icon Button with + badge) */}
            {canManage && (
              <button 
                type="button" 
                onClick={handleOpenCreateModal}
                className="w-9 h-9 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white flex items-center justify-center transition shadow-sm border border-rose-900/40 cursor-pointer flex-shrink-0 transform hover:scale-105 active:scale-95"
                title="Create New Project"
              >
                <div className="relative inline-flex items-center justify-center">
                  <i className="fa-solid fa-building text-xs sm:text-sm"></i>
                  <span className="absolute -top-1.5 -right-2 bg-white text-[#B30E2E] font-black text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#8A0B22] leading-none shadow-sm">+</span>
                </div>
              </button>
            )}
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
            <table className="w-full min-w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-100 shadow-2xs">
                <tr className="bg-gray-100 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-3 text-center whitespace-nowrap w-14 min-w-[56px] max-w-[56px]">
                    # ID
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[150px] max-w-[160px]">
                    Project Name
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[130px]">Developer</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[130px]">Project Type</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[180px]">Typography</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[120px]">RERA No</th>
                  <th className="py-2.5 px-3 whitespace-nowrap min-w-[170px]">Area / Address</th>
                  {canManage && (
                    <th className="py-2.5 px-3 text-center whitespace-nowrap w-20 min-w-[80px] max-w-[80px]">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredProjects.map((project, idx) => {
                  const types = Array.isArray(project.projectType) ? project.projectType : [project.projectType].filter(Boolean);
                  const typos = Array.isArray(project.typography) ? project.typography : [project.typography].filter(Boolean);
                  const displayTypo = typos.length === 0 ? '—' : typos.join(', ');
                  const isTypoOpen = activeTableTypoDropdown?.projectId === (project.id || project._id || idx);

                  return (
                    <tr 
                      key={project.id || project._id || idx}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* ID */}
                      <td className="py-2.5 px-3 text-center text-gray-400 font-mono text-[10.5px] w-14 min-w-[56px] max-w-[56px]">
                        #{project.id || idx + 1}
                      </td>

                      {/* Project Name */}
                      <td className="py-2.5 px-3 font-bold text-gray-900 whitespace-nowrap min-w-[150px] max-w-[160px]">
                        <span className="hover:text-[#B30E2E] transition-colors">
                          {project.name}
                        </span>
                      </td>

                      {/* Developer Name */}
                      <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap font-medium">
                        {project.developerName || <span className="text-gray-400 italic">—</span>}
                      </td>

                      {/* Project Type */}
                      <td className="py-2.5 px-3">
                        {types.length === 0 ? (
                          <span className="text-gray-400 italic">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {types.map(t => (
                              <span 
                                key={t}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_BADGE_STYLE[t] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Typography */}
                      <td className="py-2.5 px-3 w-52 min-w-[150px] max-w-[220px]">
                        {typos.length > 0 ? (
                          <span 
                            className="text-[11px] font-semibold text-gray-800 whitespace-normal break-words leading-tight block"
                            title={displayTypo}
                          >
                            {displayTypo}
                          </span>
                        ) : (
                          <div className="w-full flex items-center justify-center py-0.5">
                            <span className="text-gray-400 italic text-[10.5px]">—</span>
                          </div>
                        )}
                      </td>

                      {/* RERA Number */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {project.reraNumber ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10.5px] font-semibold text-slate-800">
                            {project.reraNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>

                      {/* Location & Area */}
                      <td className="py-2.5 px-3 max-w-xs" title={`${project.area ? project.area + ' - ' : ''}${project.address || ''}`}>
                        {project.area || project.address ? (
                          <div className="flex flex-col gap-0.5">
                            {project.area && (
                              <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                                <i className="fa-solid fa-location-dot text-[#B30E2E] text-[10px]"></i>
                                <span>{project.area}</span>
                              </span>
                            )}
                            {project.address && (
                              <span className="text-[11px] text-gray-500 truncate" title={project.address}>
                                {project.address}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="py-2.5 px-3 text-center whitespace-nowrap w-20 min-w-[80px] max-w-[80px]">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(project)}
                              className="w-7 h-7 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 flex items-center justify-center transition cursor-pointer"
                              title="Edit Project"
                            >
                              <i className="fa-solid fa-pen-to-square text-xs"></i>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmation({ isOpen: true, project })}
                              className="w-7 h-7 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center transition cursor-pointer"
                              title="Delete Project"
                            >
                              <i className="fa-regular fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                    <label className="block text-xs font-bold text-gray-700 mb-1">Project Name *</label>
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
                      placeholder="Enter project name"
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
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-700">
                        Area <span className="text-rose-500">*</span>
                      </label>
                      {isCustomArea ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomArea(false);
                            setFormData(prev => ({ ...prev, area: '' }));
                          }}
                          className="text-[10px] text-[#B30E2E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <i className="fa-solid fa-list text-[9px]"></i>
                          <span>Area List</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomArea(true);
                            setFormData(prev => ({ ...prev, area: '' }));
                          }}
                          className="text-[10px] text-gray-500 hover:text-[#B30E2E] font-medium flex items-center gap-1 cursor-pointer"
                          title="Type custom area"
                        >
                          <i className="fa-solid fa-plus text-[9px]"></i>
                          <span>Custom Area</span>
                        </button>
                      )}
                    </div>

                    {isCustomArea ? (
                      <div className="relative flex items-center">
                        <input 
                          type="text"
                          required
                          autoFocus
                          value={formData.area}
                          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                          placeholder="Type custom area..."
                          className="w-full h-[38px] px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-gray-800 bg-white"
                        />
                      </div>
                    ) : (
                      <select 
                        required
                        value={formData.area}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomArea(true);
                            setFormData({ ...formData, area: '' });
                          } else {
                            setFormData({ ...formData, area: e.target.value });
                          }
                        }}
                        className="w-full h-[38px] px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-gray-800 bg-white cursor-pointer"
                      >
                        <option value="">Select Area</option>
                        {formData.area && !PROJECT_AREAS.includes(formData.area) && (
                          <option value={formData.area}>{formData.area}</option>
                        )}
                        {PROJECT_AREAS.map(areaName => (
                          <option key={areaName} value={areaName}>{areaName}</option>
                        ))}
                        <option value="__custom__">+ Other / Custom Area</option>
                      </select>
                    )}
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

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full p-5 space-y-4 text-center animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-[#B30E2E] mx-auto flex items-center justify-center text-xl">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-gray-900 text-base">Delete Project?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to delete project <strong className="text-gray-800">"{deleteConfirmation.project?.name}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmation({ isOpen: false, project: null })}
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
          </div>
        </div>
      )}

    </div>
  );
}
