import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';
import PolicyModal from './PolicyModal';

const getAgentProfilePhoto = (agentObj) => {
  if (!agentObj) return '';
  if (agentObj.profileImage) return agentObj.profileImage;

  const uname = (agentObj.username || '').toLowerCase();
  const name = (agentObj.name || '').toLowerCase();

  if (uname.includes('mohini') || name.includes('mohini')) {
    return '/assets/images/mohini-profile.jpeg';
  }
  if (uname.includes('sarika') || name.includes('sarika')) {
    return '/assets/images/sarika-profile.jpeg';
  }
  if (uname.includes('tejashree') || name.includes('tejashree') || uname.includes('nisha') || name.includes('nisha')) {
    return '/assets/images/tejashree-profile.jpeg';
  }
  return '';
};

const formatDateShortMonth = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && /^\d{2}\s[A-Za-z]{3}\s\d{4}$/.test(dateStr.trim())) {
    return dateStr.trim();
  }
  try {
    let d;
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      const [year, month, day] = dateStr.trim().split('-').map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

const formatToInputDate = (dateStr) => {
  if (!dateStr) return '';
  const str = dateStr.toString().trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  try {
    let d;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [year, month, day] = str.split('-').map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(str);
    }
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (e) {
    return '';
  }
};

const DEFAULT_COLUMNS = [
  { id: 'leadId', label: 'Lead ID', visible: true },
  { id: 'fullName', label: 'Full Name', visible: true },
  { id: 'mobile', label: 'Mobile No.', visible: true },
  { id: 'email', label: 'Email Address', visible: true },
  { id: 'enquiryDate', label: 'Enquiry Date', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'followupDate', label: 'Followup Date', visible: true },
  { id: 'plotsCount', label: 'No. of Guntha', visible: true },
  { id: 'visitDate', label: 'Visit Date', visible: true },
  { id: 'assignedAgent', label: 'Assigned Agent', visible: true },
  { id: 'notes', label: 'Notes', visible: true },
  { id: 'actions', label: 'Actions', visible: true }
];


export default function AdminDashboard({ onLogout }) {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('New');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [agentFilter, setAgentFilter] = useState('All');
  const [visitDateFilter, setVisitDateFilter] = useState('All'); // 'All' | 'Today' | 'Tomorrow' | 'ThisWeek'
  const [followupDateFilter, setFollowupDateFilter] = useState('All'); // 'All' | 'Today' | 'Tomorrow' | 'ThisWeek'
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);

  // Column Configuration State & Persistence
  const [columnConfig, setColumnConfig] = useState(() => {
    try {
      const stored = localStorage.getItem('leadsTableColumnConfig');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_COLUMNS;
  });
  const [showColumnConfigModal, setShowColumnConfigModal] = useState(false);
  const [draggedColumnIndex, setDraggedColumnIndex] = useState(null);

  useEffect(() => {
    const fetchColumnPreferences = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/column-preferences`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.columnPreferences) && data.columnPreferences.length > 0) {
          const merged = data.columnPreferences.map(col => {
            const def = DEFAULT_COLUMNS.find(d => d.id === col.id);
            return {
              id: col.id,
              label: col.label || (def ? def.label : col.id),
              visible: col.visible !== undefined ? col.visible : true
            };
          });
          DEFAULT_COLUMNS.forEach(def => {
            if (!merged.some(m => m.id === def.id)) {
              merged.push(def);
            }
          });
          setColumnConfig(merged);
          localStorage.setItem('leadsTableColumnConfig', JSON.stringify(merged));
        }
      } catch (e) {
        console.warn('Could not fetch column preferences from MongoDB:', e);
      }
    };
    fetchColumnPreferences();
  }, []);

  const handleUpdateColumnConfig = async (newConfig) => {
    setColumnConfig(newConfig);
    localStorage.setItem('leadsTableColumnConfig', JSON.stringify(newConfig));

    const token = localStorage.getItem('adminToken');
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/column-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ columnPreferences: newConfig })
      });
    } catch (e) {
      console.warn('Could not save column preferences to MongoDB Atlas:', e);
    }
  };

  const toggleColumnVisibility = (colId) => {
    const updated = columnConfig.map(col => 
      col.id === colId ? { ...col, visible: !col.visible } : col
    );
    handleUpdateColumnConfig(updated);
  };

  const moveColumn = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= columnConfig.length) return;
    const updated = [...columnConfig];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    handleUpdateColumnConfig(updated);
  };

  const resetColumnConfig = () => {
    handleUpdateColumnConfig(DEFAULT_COLUMNS);
  };

  const statusDropdownRef = useRef(null);
  const agentDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target)) {
        setIsAgentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Logged in user info & Role
  const rawUser = (() => {
    try {
      const stored = localStorage.getItem('adminUser');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  })();

  const registeredAgentsList = (() => {
    try {
      const stored = localStorage.getItem('registeredAgents');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  })();
  const matchedAgentObj = registeredAgentsList.find(a => 
    (a.username && a.username.toLowerCase() === (rawUser.username || '').toLowerCase()) ||
    (a.id && (a.id === rawUser.id || a.id === rawUser._id))
  );

  const isAdmin = !rawUser.role || rawUser.role === 'Admin' || rawUser.role === 'SuperAdmin' || (rawUser.username && rawUser.username.toLowerCase() === 'admin');
  
  const currentUser = {
    ...rawUser,
    role: isAdmin ? 'Admin' : 'Agent',
    name: isAdmin ? 'Admin' : (rawUser.name && rawUser.name !== 'Admin Control Panel' ? rawUser.name : 'Sales Executive'),
    phone: rawUser.phone || (matchedAgentObj ? matchedAgentObj.phone : ''),
    email: rawUser.email || (matchedAgentObj ? matchedAgentObj.email : ''),
    password: rawUser.password || (matchedAgentObj ? matchedAgentObj.password : ''),
    profileImage: !isAdmin ? (rawUser.profileImage || getAgentProfilePhoto(rawUser)) : ''
  };

  // State for Agents List (Default Agents + Admin Created Agents)
  const [registeredAgents, setRegisteredAgents] = useState(() => {
    return JSON.parse(localStorage.getItem('registeredAgents') || '[]');
  });

  const allAgents = registeredAgents;

  // State for Navigation Tabs & Registered Users Directory
  const [activeTab, setActiveTab] = useState('enquiries'); // 'enquiries' | 'users'
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'leads'
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [savingUserEdit, setSavingUserEdit] = useState(false);
  const [userEditSuccessMsg, setUserEditSuccessMsg] = useState('');

  // State for Create Lead Modal (Homepage 6 Fields)
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [newLeadFormData, setNewLeadFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    plotsCount: '1 Guntha',
    visitDate: '',
    followupDate: '',
    notes: ''
  });
  const [submittingLead, setSubmittingLead] = useState(false);
  const [createLeadMsg, setCreateLeadMsg] = useState('');

  // State for Create Agent Modal (Admin Only)
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [showAgentsListModal, setShowAgentsListModal] = useState(false);
  const [newAgentData, setNewAgentData] = useState({ name: '', phone: '', email: '', username: '', password: '' });
  const [agentCreateMsg, setAgentCreateMsg] = useState('');

  // State for Full Lead Edit Modal & Floating Note Popover
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [activeNotePopover, setActiveNotePopover] = useState(null);
  // State for Lead Activity History View & Tracking Map
  const [selectedHistoryLead, setSelectedHistoryLead] = useState(null);

  const handleOpenHistoryModal = async (leadItem) => {
    if (!leadItem) return;
    setSelectedHistoryLead({ ...leadItem });
    const targetId = leadItem._id || leadItem.id;
    if (!targetId) return;

    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/enquiries/${targetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedHistoryLead(data.data);
      }
    } catch (e) {
      console.warn('Could not fetch single lead history from MongoDB Atlas:', e);
    }
  };



  // State for Lead Note Popover Timeline & Input
  const [popoverNoteInput, setPopoverNoteInput] = useState('');
  const [savingPopoverNote, setSavingPopoverNote] = useState(false);

  const handleSavePopoverNote = async (leadId) => {
    if (!popoverNoteInput || !popoverNoteInput.trim()) return;
    const newNoteContent = popoverNoteInput.trim();
    const performer = currentUser.name || (isAdmin ? 'Admin' : 'Sales Executive');
    const targetItem = activeNotePopover ? activeNotePopover.item : null;

    setSavingPopoverNote(true);

    // 1. Create a local history entry for immediate timeline UI update
    const newHistoryEntry = {
      _id: `note-hist-${Date.now()}`,
      fieldName: 'Notes',
      oldValue: targetItem ? (targetItem.notes || '—') : '—',
      newValue: newNoteContent,
      modifiedBy: performer,
      modifiedDate: new Date().toISOString()
    };

    // 2. Optimistic local update in React state
    setEnquiries(prev => prev.map(item => {
      const itemKey = item._id || item.id;
      if (itemKey === leadId || (targetItem && (itemKey === (targetItem._id || targetItem.id) || (item.phone && targetItem.phone && item.phone === targetItem.phone)))) {
        const updatedHistory = Array.isArray(item.history) ? [newHistoryEntry, ...item.history] : [newHistoryEntry];
        return {
          ...item,
          notes: newNoteContent,
          history: updatedHistory
        };
      }
      return item;
    }));

    // 3. Optimistic local update in activeNotePopover
    setActiveNotePopover(prev => {
      if (!prev || !prev.item) return prev;
      const updatedHistory = Array.isArray(prev.item.history) ? [newHistoryEntry, ...prev.item.history] : [newHistoryEntry];
      return {
        ...prev,
        item: {
          ...prev.item,
          notes: newNoteContent,
          history: updatedHistory
        }
      };
    });

    // 4. Update local storage cache
    const localCache = JSON.parse(localStorage.getItem('localEnquiriesCache') || '[]');
    const updatedCache = localCache.map(item => {
      const itemKey = item._id || item.id;
      if (itemKey === leadId || (targetItem && (itemKey === (targetItem._id || targetItem.id) || (item.phone && targetItem.phone && item.phone === targetItem.phone)))) {
        const updatedHistory = Array.isArray(item.history) ? [newHistoryEntry, ...item.history] : [newHistoryEntry];
        return {
          ...item,
          notes: newNoteContent,
          history: updatedHistory
        };
      }
      return item;
    });
    localStorage.setItem('localEnquiriesCache', JSON.stringify(updatedCache));

    // 5. Clear input immediately so user gets instant UI feedback
    setPopoverNoteInput('');

    // 6. Send PATCH request to backend (with phone fallback lookup)
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/enquiries/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: newNoteContent,
          phone: targetItem ? targetItem.phone : undefined,
          oldPhone: targetItem ? targetItem.phone : undefined,
          updatedBy: performer
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        // Sync with official backend returned object
        setEnquiries(prev => prev.map(item => (item._id === leadId || item.id === leadId || (targetItem && item.phone === targetItem.phone)) ? data.data : item));
        setActiveNotePopover(prev => prev ? { ...prev, item: data.data } : null);
      }
    } catch (err) {
      console.warn('Backend popover note patch error:', err);
    } finally {
      setSavingPopoverNote(false);
    }
  };

  const handleOpenNotePopover = async (e, item) => {
    e.stopPropagation();
    setPopoverNoteInput('');
    const targetId = item._id || item.id;
    
    if (activeNotePopover && (activeNotePopover.item._id === targetId || activeNotePopover.item.id === targetId)) {
      setActiveNotePopover(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const popoverWidth = 320;
      let left = rect.right - popoverWidth;
      if (left < 10) left = 10;
      if (left + popoverWidth > window.innerWidth - 10) {
        left = window.innerWidth - popoverWidth - 10;
      }
      let top = 80;
      if (rect.top > 250) {
        top = Math.max(75, rect.top - 200);
      }

      setActiveNotePopover({
        item,
        top,
        left,
        positionAbove: false
      });

      if (targetId) {
        const token = localStorage.getItem('adminToken');
        try {
          const res = await fetch(`${API_BASE_URL}/api/admin/enquiries/${targetId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.data) {
            setActiveNotePopover(prev => (prev && (prev.item._id === targetId || prev.item.id === targetId)) ? { ...prev, item: data.data } : prev);
          }
        } catch (e) {
          console.warn('Could not fetch fresh lead notes popover history:', e);
        }
      }
    }
  };
  const [policyModal, setPolicyModal] = useState({ isOpen: false, type: 'privacy' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editModalSuccessMsg, setEditModalSuccessMsg] = useState('');

  // State for Profile Dropdown & Edit Profile Modal (Admin & Sales Agents)
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', username: '', password: '', phone: '', email: '', profileImage: '' });
  const [profileSaveMsg, setProfileSaveMsg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (showEditProfileModal) {
      setProfileForm({
        name: currentUser.name || '',
        username: currentUser.username || '',
        password: currentUser.password || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        profileImage: currentUser.profileImage || ''
      });
    }
  }, [showEditProfileModal]);

  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.phone || !/^[6-9]\d{9}$/.test(profileForm.phone.trim())) {
      setProfileSaveMsg('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    if (!profileForm.email || !profileForm.email.trim()) {
      setProfileSaveMsg('Please enter a valid email address.');
      return;
    }
    setSavingProfile(true);
    setProfileSaveMsg('');

    const updatedUser = {
      ...rawUser,
      name: profileForm.name.trim(),
      username: profileForm.username.trim().toLowerCase(),
      password: profileForm.password || rawUser.password,
      phone: profileForm.phone ? profileForm.phone.trim() : '',
      email: profileForm.email ? profileForm.email.trim() : '',
      profileImage: profileForm.profileImage || rawUser.profileImage || ''
    };

    localStorage.setItem('adminUser', JSON.stringify(updatedUser));

    if (!isAdmin) {
      const storedAgents = JSON.parse(localStorage.getItem('registeredAgents') || '[]');
      const updatedAgents = storedAgents.map(a => {
        if (
          (a.username && a.username.toLowerCase() === (currentUser.username || '').toLowerCase()) ||
          (a.id && a.id.toString() === (currentUser.id || currentUser._id || '').toString())
        ) {
          return {
            ...a,
            name: updatedUser.name,
            username: updatedUser.username,
            password: updatedUser.password,
            phone: updatedUser.phone,
            email: updatedUser.email,
            profileImage: updatedUser.profileImage
          };
        }
        return a;
      });

      setRegisteredAgents(updatedAgents);
      localStorage.setItem('registeredAgents', JSON.stringify(updatedAgents));

      try {
        const token = localStorage.getItem('adminToken');
        const agentId = currentUser.id || currentUser._id;
        if (agentId && agentId.length > 10) {
          await fetch(`${API_BASE_URL}/api/admin/agents/${agentId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: updatedUser.name,
              username: updatedUser.username,
              password: updatedUser.password,
              phone: updatedUser.phone,
              email: updatedUser.email,
              profileImage: updatedUser.profileImage
            })
          });
        }
      } catch (err) {
        console.warn('Backend agent edit note:', err);
      }
    }

    setSavingProfile(false);
    setProfileSaveMsg('Profile updated successfully!');
    setTimeout(() => {
      setShowEditProfileModal(false);
      setProfileSaveMsg('');
      window.location.reload();
    }, 1200);
  };

  // Initial mock data fallback if offline
  const mockEnquiries = [];

  const applyRoundRobinAssignments = (leadsList, agents = null) => {
    const agentsList = agents || JSON.parse(localStorage.getItem('registeredAgents') || '[]');
    if (!agentsList || agentsList.length === 0) return leadsList;

    const validAgentNames = agentsList.map(a => (a.name || a.username || '').toLowerCase().trim());

    return leadsList.map((item, index) => {
      const currentAssigned = (item.assignedAgentName || '').toLowerCase().trim();
      // If unassigned or assigned to an agent not in active agents list, distribute round-robin
      if (!currentAssigned || currentAssigned === 'unassigned' || !validAgentNames.some(name => currentAssigned.includes(name) || name.includes(currentAssigned))) {
        const assignedAgent = agentsList[index % agentsList.length];
        return { ...item, assignedAgentName: assignedAgent.name };
      }
      return item;
    });
  };

  const fetchEnquiries = async () => {
    setLoading(true);
    setErrorMsg('');
    const token = localStorage.getItem('adminToken');

    const localCache = JSON.parse(localStorage.getItem('localEnquiriesCache') || '[]');
    const deletedIds = JSON.parse(localStorage.getItem('deletedEnquiryIds') || '[]');
    const filteredLocal = localCache.filter(item => !deletedIds.includes(item._id));

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/enquiries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const filteredMongo = data.data.filter(item => !deletedIds.includes(item._id));
        // Only merge unsynced offline leads (id starting with 'lead-'). If database is online, MongoDB Atlas is single source of truth.
        const unsyncedLocalLeads = filteredLocal.filter(l => (l._id || l.id || '').toString().startsWith('lead-'));
        const combined = [...unsyncedLocalLeads, ...filteredMongo];
        const uniqueLeads = Array.from(new Map(combined.map(item => [(item._id || item.id), item])).values());
        localStorage.setItem('localEnquiriesCache', JSON.stringify(uniqueLeads));
        setEnquiries(applyRoundRobinAssignments(uniqueLeads));
      } else {
        const fallbackSource = filteredLocal.length > 0 ? filteredLocal : mockEnquiries.filter(item => !deletedIds.includes(item._id));
        const uniqueLeads = Array.from(new Map(fallbackSource.map(item => [item._id, item])).values());
        setEnquiries(applyRoundRobinAssignments(uniqueLeads));
      }
    } catch (err) {
      console.warn('Backend server connection note:', err);
      const fallbackSource = filteredLocal.length > 0 ? filteredLocal : mockEnquiries.filter(item => !deletedIds.includes(item._id));
      const uniqueLeads = Array.from(new Map(fallbackSource.map(item => [item._id, item])).values());
      setEnquiries(applyRoundRobinAssignments(uniqueLeads));
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/agents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mongoAgents = data.data.map(a => ({
          id: a._id || a.id,
          name: a.name || a.username,
          phone: a.phone || '',
          email: a.email || '',
          username: a.username,
          password: a.password || '••••••••',
          role: 'Agent'
        }));
        const localAgents = JSON.parse(localStorage.getItem('registeredAgents') || '[]');
        const combined = [...mongoAgents, ...localAgents];
        const unique = Array.from(new Map(combined.map(item => [item.username, item])).values());
        setRegisteredAgents(unique);
        localStorage.setItem('registeredAgents', JSON.stringify(unique));
        setEnquiries(prev => applyRoundRobinAssignments(prev, unique));
      }
    } catch (err) {
      console.warn('Backend agents fetch note:', err);
    }
  };

  useEffect(() => {
    fetchEnquiries();
    fetchAgents();
  }, []);



  // Handler: Create New Lead (Identical 6 Homepage Fields + Auto Agent Assignment)
  const handleCreateLeadSubmit = async (e) => {
    e.preventDefault();
    if (!newLeadFormData.firstName || !newLeadFormData.phone) return;

    if (!/^[6-9]\d{9}$/.test(newLeadFormData.phone.trim())) {
      setCreateLeadMsg('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    // Duplicate Lead Prevention Check
    const existingDuplicate = enquiries.find(item => item.phone && item.phone.trim() === newLeadFormData.phone.trim());
    if (existingDuplicate) {
      const confirmCreate = window.confirm(
        `A lead with mobile number "${newLeadFormData.phone.trim()}" already exists for ${existingDuplicate.firstName} ${existingDuplicate.lastName || ''} (Assigned to: ${existingDuplicate.assignedAgentName || 'Agent'}).\n\nDo you still want to create another lead record for this mobile number?`
      );
      if (!confirmCreate) return;
    }

    setSubmittingLead(true);
    setCreateLeadMsg('');

    // Dynamic Round-Robin Agent Auto-Assignment
    let registeredAgentsList = JSON.parse(localStorage.getItem('registeredAgents') || '[]');
    let assignedAgentId = null;
    let assignedAgentName = '';

    if (registeredAgentsList.length > 0) {
      const lastAssignedIndex = parseInt(localStorage.getItem('lastAssignedAgentIndex') || '-1', 10);
      const nextIndex = (lastAssignedIndex + 1) % registeredAgentsList.length;
      const assignedAgent = registeredAgentsList[nextIndex];
      localStorage.setItem('lastAssignedAgentIndex', nextIndex.toString());
      assignedAgentId = assignedAgent.id || assignedAgent._id;
      assignedAgentName = assignedAgent.name;
    }

    const payload = {
      firstName: newLeadFormData.firstName.trim(),
      lastName: newLeadFormData.lastName.trim(),
      phone: newLeadFormData.phone.trim(),
      email: newLeadFormData.email.trim(),
      plotsCount: newLeadFormData.plotsCount || '1 Guntha',
      visitDate: newLeadFormData.visitDate || '',
      followupDate: newLeadFormData.followupDate || '',
      notes: newLeadFormData.notes ? newLeadFormData.notes.trim() : '',
      status: 'New',
      assignedTo: assignedAgentId,
      assignedAgentName: assignedAgentName
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success && data.data) {
        setEnquiries(prev => [data.data, ...prev]);
        const cached = JSON.parse(localStorage.getItem('localEnquiriesCache') || '[]');
        localStorage.setItem('localEnquiriesCache', JSON.stringify([data.data, ...cached]));
      } else {
        const localLead = {
          _id: `lead-${Date.now()}`,
          id: `lead-${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString()
        };
        setEnquiries(prev => [localLead, ...prev]);
        const cached = JSON.parse(localStorage.getItem('localEnquiriesCache') || '[]');
        localStorage.setItem('localEnquiriesCache', JSON.stringify([localLead, ...cached]));
      }
    } catch (err) {
      console.warn('Backend server connecting... saving locally:', err);
      const localLead = {
        _id: `lead-${Date.now()}`,
        id: `lead-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString()
      };
      setEnquiries(prev => [localLead, ...prev]);
      const cached = JSON.parse(localStorage.getItem('localEnquiriesCache') || '[]');
      localStorage.setItem('localEnquiriesCache', JSON.stringify([localLead, ...cached]));
    } finally {
      setSubmittingLead(false);
      setCreateLeadMsg('Lead Created Successfully!');
      setTimeout(() => {
        setShowCreateLeadModal(false);
        setCreateLeadMsg('');
        setNewLeadFormData({ firstName: '', lastName: '', phone: '', email: '', plotsCount: '1 Guntha', visitDate: '', followupDate: '', notes: '' });
      }, 1000);
    }
  };

  // Handler: Create New Agent (Admin Only) - Saves directly to MongoDB & LocalStorage
  const handleCreateAgentSubmit = async (e) => {
    e.preventDefault();
    if (!newAgentData.name || !newAgentData.username || !newAgentData.password || !newAgentData.phone || !newAgentData.email) return;

    if (!/^[6-9]\d{9}$/.test(newAgentData.phone.trim())) {
      setAgentCreateMsg('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    const newAgentObj = {
      id: `agent-${Date.now()}`,
      name: newAgentData.name.trim(),
      phone: newAgentData.phone.trim(),
      email: newAgentData.email.trim(),
      username: newAgentData.username.trim().toLowerCase(),
      password: newAgentData.password,
      role: 'Agent'
    };

    const updated = [...registeredAgents, newAgentObj];
    setRegisteredAgents(updated);
    localStorage.setItem('registeredAgents', JSON.stringify(updated));

    // Save directly to MongoDB database
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newAgentData.name.trim(),
          phone: newAgentData.phone.trim(),
          email: newAgentData.email.trim(),
          username: newAgentData.username.trim().toLowerCase(),
          password: newAgentData.password
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Update with MongoDB ID
        const mongoAgent = {
          id: data.data.id || data.data._id,
          name: data.data.name,
          phone: data.data.phone || newAgentData.phone.trim(),
          email: data.data.email || newAgentData.email.trim(),
          username: data.data.username,
          password: newAgentData.password,
          role: 'Agent'
        };
        const synced = updated.map(a => a.username === mongoAgent.username ? mongoAgent : a);
        setRegisteredAgents(synced);
        localStorage.setItem('registeredAgents', JSON.stringify(synced));
      }
    } catch (err) {
      console.warn('Backend create agent MongoDB note:', err);
    }

    setAgentCreateMsg('Sales Agent Created & Saved to Database Successfully!');
    setNewAgentData({ name: '', phone: '', email: '', username: '', password: '' });
    setTimeout(() => {
      setShowCreateAgentModal(false);
      setAgentCreateMsg('');
    }, 1500);
  };

  // Handler: Delete / Remove Sales Agent (Admin Only) - Removes from MongoDB & LocalStorage
  const handleDeleteAgent = async (agentIdOrUsername) => {
    if (!window.confirm('Are you sure you want to remove this Sales Agent account?')) return;
    const agentToDelete = registeredAgents.find(a => a.id === agentIdOrUsername || a.username === agentIdOrUsername);
    const updated = registeredAgents.filter(a => (a.id !== agentIdOrUsername && a.username !== agentIdOrUsername));
    setRegisteredAgents(updated);
    localStorage.setItem('registeredAgents', JSON.stringify(updated));

    if (agentToDelete && agentToDelete.id && agentToDelete.id.length > 10) {
      try {
        const token = localStorage.getItem('adminToken');
        await fetch(`${API_BASE_URL}/api/admin/agents/${agentToDelete.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.warn('Backend delete agent MongoDB note:', err);
      }
    }
  };

  // Handler: Edit & Save Registered User Account Details
  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editingUser.phone && !/^[6-9]\d{9}$/.test(editingUser.phone.trim())) {
      setUserEditSuccessMsg('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setSavingUserEdit(true);
    setUserEditSuccessMsg('');

    const cleanedEditingUser = {
      ...editingUser,
      name: (editingUser.name || '').trim(),
      username: (editingUser.username || '').trim().toLowerCase(),
      phone: (editingUser.phone || '').trim(),
      email: (editingUser.email || '').trim()
    };

    const oldAgent = registeredAgents.find(a => a.id === cleanedEditingUser.id || a.username === cleanedEditingUser.username);
    const oldName = oldAgent ? (oldAgent.name || '').toLowerCase().trim() : '';
    const oldUsername = oldAgent ? (oldAgent.username || '').toLowerCase().trim() : '';

    const updatedAgents = registeredAgents.map(a => 
      (a.id === cleanedEditingUser.id || a.username === cleanedEditingUser.username) ? cleanedEditingUser : a
    );
    setRegisteredAgents(updatedAgents);
    localStorage.setItem('registeredAgents', JSON.stringify(updatedAgents));

    // Update leads assigned to old agent name/username to the updated agent name
    if (cleanedEditingUser.name && (oldName || oldUsername)) {
      setEnquiries(prev => prev.map(lead => {
        const leadAgent = (lead.assignedAgentName || '').toLowerCase().trim();
        if (leadAgent === oldName || leadAgent === oldUsername || (oldName.length >= 3 && leadAgent.includes(oldName))) {
          return { ...lead, assignedAgentName: cleanedEditingUser.name };
        }
        return lead;
      }));

      const localCache = JSON.parse(localStorage.getItem('localEnquiriesCache') || '[]');
      if (localCache.length > 0) {
        const updatedCache = localCache.map(lead => {
          const leadAgent = (lead.assignedAgentName || '').toLowerCase().trim();
          if (leadAgent === oldName || leadAgent === oldUsername || (oldName.length >= 3 && leadAgent.includes(oldName))) {
            return { ...lead, assignedAgentName: cleanedEditingUser.name };
          }
          return lead;
        });
        localStorage.setItem('localEnquiriesCache', JSON.stringify(updatedCache));
      }
    }

    // Update in MongoDB database via PATCH endpoint
    if (editingUser.id && editingUser.id.length > 10) {
      try {
        const token = localStorage.getItem('adminToken');
        await fetch(`${API_BASE_URL}/api/admin/agents/${editingUser.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: editingUser.name,
            phone: editingUser.phone,
            email: editingUser.email,
            username: editingUser.username,
            password: editingUser.password
          })
        });
      } catch (err) {
        console.warn('Backend patch user error:', err);
      }
    }

    setSavingUserEdit(false);
    setUserEditSuccessMsg('User Details Updated Successfully!');
    setTimeout(() => {
      setEditingUser(null);
      setUserEditSuccessMsg('');
    }, 1500);
  };

  // Handler: Reassign Lead to Agent (Admin Only)
  const handleReassignAgent = async (leadId, newAgentName) => {
    const targetAgent = registeredAgents.find(a => 
      (a.name && a.name.toLowerCase().trim() === newAgentName.toLowerCase().trim()) ||
      (a.username && a.username.toLowerCase().trim() === newAgentName.toLowerCase().trim())
    );
    const newAssignedTo = targetAgent ? (targetAgent.id || targetAgent._id || targetAgent.username || '') : '';

    setEnquiries(prev => prev.map(item => item._id === leadId ? { ...item, assignedAgentName: newAgentName, assignedTo: newAssignedTo } : item));
    
    // Update local enquiries cache if stored
    const localCache = JSON.parse(localStorage.getItem('localEnquiriesCache') || '[]');
    if (localCache.length > 0) {
      const updatedCache = localCache.map(item => item._id === leadId ? { ...item, assignedAgentName: newAgentName, assignedTo: newAssignedTo } : item);
      localStorage.setItem('localEnquiriesCache', JSON.stringify(updatedCache));
    }

    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE_URL}/api/admin/enquiries/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignedAgentName: newAgentName, assignedTo: newAssignedTo })
      });
    } catch (err) {
      console.warn('Backend reassign patch note:', err);
    }
  };

  // Update Status handler
  const handleStatusChange = async (id, newStatus) => {
    const token = localStorage.getItem('adminToken');
    const performer = currentUser.name || (isAdmin ? 'Admin' : 'Sales Executive');

    setEnquiries(prev => prev.map(item => {
      if (item._id === id || item.id === id) {
        return { ...item, status: newStatus };
      }
      return item;
    }));

    const localCache = JSON.parse(localStorage.getItem('localEnquiriesCache') || '[]');
    const updatedCache = localCache.map(item => {
      if (item._id === id || item.id === id) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    localStorage.setItem('localEnquiriesCache', JSON.stringify(updatedCache));

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, updatedBy: performer })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setEnquiries(prev => prev.map(item => (item._id === id || item.id === id) ? data.data : item));
      }
    } catch (err) {
      console.warn('Backend status patch error:', err);
    }
  };

  // Generic handler for inline editing table fields (followupDate, plotsCount, visitDate, etc.)
  const handleInlineFieldChange = async (id, fieldName, fieldValue) => {
    const token = localStorage.getItem('adminToken');
    const performer = currentUser.name || (isAdmin ? 'Admin' : 'Sales Executive');

    const targetItem = enquiries.find(item => (item._id || item.id) === id);

    setEnquiries(prev => prev.map(item => {
      if (item._id === id || item.id === id) {
        return { ...item, [fieldName]: fieldValue };
      }
      return item;
    }));

    const localCache = JSON.parse(localStorage.getItem('localEnquiriesCache') || '[]');
    const updatedCache = localCache.map(item => {
      if (item._id === id || item.id === id) {
        return { ...item, [fieldName]: fieldValue };
      }
      return item;
    });
    localStorage.setItem('localEnquiriesCache', JSON.stringify(updatedCache));

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          [fieldName]: fieldValue,
          phone: targetItem ? targetItem.phone : undefined,
          oldPhone: targetItem ? targetItem.phone : undefined,
          updatedBy: performer
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setEnquiries(prev => prev.map(item => (item._id === id || item.id === id) ? data.data : item));
      }
    } catch (err) {
      console.warn(`Backend inline ${fieldName} patch note:`, err);
    }
  };

  // Save Note handler
  const handleSaveNote = async (id) => {
    const token = localStorage.getItem('adminToken');
    setEnquiries(prev => prev.map(item => item._id === id ? { ...item, notes: noteText } : item));
    setEditingNoteId(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: noteText })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setEnquiries(prev => prev.map(item => item._id === id ? data.data : item));
      }
    } catch (err) {
      console.warn('Backend note patch error:', err);
    }
  };

  // Save Full Edit Modal Changes handler
  const handleSaveFullEdit = async (e) => {
    e.preventDefault();
    if (!editingEnquiry) return;

    if (editingEnquiry.phone && !/^[6-9]\d{9}$/.test(editingEnquiry.phone.trim())) {
      setEditModalSuccessMsg('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setSavingEdit(true);
    setEditModalSuccessMsg('');
    const token = localStorage.getItem('adminToken');

    // Instant local UI state update with Multi-Field History Logging
    const leadKey = editingEnquiry._id || editingEnquiry.id;
    const existingLead = enquiries.find(item => (item._id || item.id) === leadKey);
    const updatedLead = { ...editingEnquiry };


    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/enquiries/${leadKey}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: updatedLead.firstName,
          lastName: updatedLead.lastName,
          phone: updatedLead.phone,
          oldPhone: existingLead ? existingLead.phone : '',
          email: updatedLead.email,
          plotsCount: updatedLead.plotsCount,
          plotInfo: updatedLead.plotInfo,
          visitDate: updatedLead.visitDate,
          followupDate: updatedLead.followupDate || '',
          status: updatedLead.status,
          notes: updatedLead.notes,
          assignedAgentName: updatedLead.assignedAgentName,
          updatedBy: currentUser.name || 'Sales Executive'
        })
      });

      const data = await res.json();

      if (res.status === 401) {
        setEditModalSuccessMsg('Session Expired / Invalid Token. Please Log Out & Log In again.');
        alert('Your session has expired or token is invalid. Please Log Out and Log In again to save changes to MongoDB Atlas.');
        return;
      }

      if (res.ok && data.success && data.data) {
        const finalSynced = { ...data.data, followupDate: updatedLead.followupDate || data.data.followupDate || '' };
        
        // 1. Sync React state strictly with MongoDB Atlas returned record
        setEnquiries(prev => prev.map(item => {
          const itemKey = item._id || item.id;
          return itemKey === leadKey ? finalSynced : item;
        }));

        // 2. Sync Local Cache strictly with MongoDB Atlas returned record
        const localCache = JSON.parse(localStorage.getItem('localEnquiriesCache') || '[]');
        let foundInCache = false;
        const updatedCache = localCache.map(item => {
          const itemKey = item._id || item.id;
          if (itemKey === leadKey) {
            foundInCache = true;
            return finalSynced;
          }
          return item;
        });
        if (!foundInCache) {
          updatedCache.push(finalSynced);
        }
        localStorage.setItem('localEnquiriesCache', JSON.stringify(updatedCache));

        if (statusFilter !== 'All' && statusFilter !== finalSynced.status) {
          setStatusFilter(finalSynced.status);
        }

        setEditModalSuccessMsg(`Enquiry Updated Successfully in Database!`);
        setTimeout(() => {
          setEditingEnquiry(null);
          setEditModalSuccessMsg('');
        }, 1200);
      } else {
        alert(`Database Update Error: ${data.message || 'Could not update lead in database'}`);
        setEditModalSuccessMsg(`Error: ${data.message || 'Database update failed'}`);
      }
    } catch (err) {
      console.error('Backend patch update error:', err);
      alert(`Network / Database Connection Error: ${err.message}`);
      setEditModalSuccessMsg(`Connection Error: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Enquiry handler
  const handleDeleteEnquiry = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this enquiry record?')) return;
    
    // Remove from UI state
    setEnquiries(prev => prev.filter(item => (item._id || item.id) !== id));
    setSelectedLeadIds(prev => prev.filter(selectedId => selectedId !== id));

    // Persist deletion in local cache & deleted IDs list
    const localCache = JSON.parse(localStorage.getItem('localEnquiriesCache') || '[]');
    const updatedCache = localCache.filter(item => (item._id || item.id) !== id);
    localStorage.setItem('localEnquiriesCache', JSON.stringify(updatedCache));

    const deletedIds = JSON.parse(localStorage.getItem('deletedEnquiryIds') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('deletedEnquiryIds', JSON.stringify(deletedIds));
    }

    const token = localStorage.getItem('adminToken');
    try {
      await fetch(`${API_BASE_URL}/api/admin/enquiries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.warn('Backend delete error:', err);
    }
  };

  // Bulk Select Toggle Lead handler
  const handleToggleSelectLead = (id) => {
    if (!id) return;
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Select All / Deselect All handler
  const handleToggleSelectAll = () => {
    if (!filteredEnquiries || filteredEnquiries.length === 0) return;
    const currentFilteredIds = filteredEnquiries.map(item => item._id || item.id).filter(Boolean);
    const allSelected = currentFilteredIds.every(id => selectedLeadIds.includes(id));

    if (allSelected) {
      setSelectedLeadIds(prev => prev.filter(id => !currentFilteredIds.includes(id)));
    } else {
      setSelectedLeadIds(prev => Array.from(new Set([...prev, ...currentFilteredIds])));
    }
  };

  // Bulk Delete Selected Enquiries handler (Admin Only)
  const handleBulkDeleteEnquiries = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedLeadIds.length} selected lead(s)?`)) return;

    const idsToDelete = [...selectedLeadIds];

    // Remove from UI state
    setEnquiries(prev => prev.filter(item => !idsToDelete.includes(item._id || item.id)));
    setSelectedLeadIds([]);

    // Persist deletion in local cache & deleted IDs list
    const localCache = JSON.parse(localStorage.getItem('localEnquiriesCache') || '[]');
    const updatedCache = localCache.filter(item => !idsToDelete.includes(item._id || item.id));
    localStorage.setItem('localEnquiriesCache', JSON.stringify(updatedCache));

    const deletedIds = JSON.parse(localStorage.getItem('deletedEnquiryIds') || '[]');
    const newDeletedIds = Array.from(new Set([...deletedIds, ...idsToDelete]));
    localStorage.setItem('deletedEnquiryIds', JSON.stringify(newDeletedIds));

    const token = localStorage.getItem('adminToken');
    try {
      await Promise.all(
        idsToDelete.map(id =>
          fetch(`${API_BASE_URL}/api/admin/enquiries/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );
    } catch (err) {
      console.warn('Backend bulk delete note:', err);
    }
  };

  // Helper to generate consistent Customer/User ID and Lead ID in chronological order (Oldest Created First)
  const getChronologicalLeads = (allLeads = enquiries) => {
    return [...(allLeads || [])].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeA - timeB;
    });
  };

  const getAgentUserId = (item, registeredAgentsList = registeredAgents) => {
    if (!item) return '01';

    const assignedName = (item.assignedAgentName || '').toLowerCase().trim();
    const assignedTo = (item.assignedTo || '').toString().toLowerCase().trim();

    const agentsList = (registeredAgentsList && registeredAgentsList.length > 0) 
      ? registeredAgentsList 
      : JSON.parse(localStorage.getItem('registeredAgents') || '[]');

    const agentIndex = (agentsList || []).findIndex(agent => {
      if (!agent) return false;
      const name = (agent.name || '').toLowerCase().trim();
      const username = (agent.username || '').toLowerCase().trim();
      const id = (agent.id || agent._id || '').toString().toLowerCase().trim();

      if (id && assignedTo && id === assignedTo) return true;
      if (username && (assignedTo === username || assignedName === username)) return true;
      if (name && assignedName && (name === assignedName || name.includes(assignedName) || assignedName.includes(name))) return true;
      if (name.split(' ')[0] && assignedName.split(' ')[0] && name.split(' ')[0] === assignedName.split(' ')[0]) return true;

      return false;
    });

    if (agentIndex >= 0) {
      return String(agentIndex + 1).padStart(2, '0');
    }

    return '01';
  };

  const getCustomerUserId = getAgentUserId;

  const getLeadDisplayId = (item, index = 0, allLeads = enquiries) => {
    if (!item) return String(index + 1).padStart(2, '0');
    if (item.leadId) return (item.leadId || '').replace(/^#?LD-?/i, '');
    
    const sortedLeads = getChronologicalLeads(allLeads);
    const leadIndex = sortedLeads.findIndex(l => (l._id || l.id) === (item._id || item.id));
    const finalIndex = leadIndex >= 0 ? leadIndex : index;
    return String(finalIndex + 1).padStart(2, '0');
  };

  // Export CSV handler
  const handleExportCSV = () => {
    if (filteredEnquiries.length === 0) {
      alert('No enquiries available to export.');
      return;
    }

    const headers = ['Lead ID', 'Full Name', 'Mobile No', 'Email Address', 'Number of Guntha', 'Selected Plot', 'Submitted Date', 'Visit Date', 'Status', 'Assigned Agent', 'Notes'];
    const rows = filteredEnquiries.map((item, idx) => [
      `"${getLeadDisplayId(item, idx, enquiries)}"`,
      `"${item.firstName || ''} ${item.lastName || ''}"`,
      `"${item.phone || ''}"`,
      `"${item.email || ''}"`,
      `"${item.plotsCount || '1 Guntha'}"`,
      `"${item.plotInfo || ''}"`,
      `"${new Date(item.createdAt).toLocaleString()}"`,
      `"${item.visitDate || 'N/A'}"`,
      `"${item.status || 'New'}"`,
      `"${item.assignedAgentName || 'Rahul Patil'}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gulmohar_City_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Role-based Enquiries Scoping (Exact Current Assigned Agent Ownership)
  const scopedEnquiries = (enquiries || []).filter(item => {
    if (!item) return false;
    if (isAdmin) return true;

    const currentName = (currentUser.name || '').toLowerCase().trim();
    const currentUsername = (currentUser.username || '').toLowerCase().trim();
    const currentId = (currentUser.id || currentUser._id || '').toString().toLowerCase().trim();

    // Look up agent record in registeredAgents for current user aliases
    const matchedAgent = (registeredAgents || []).find(a => 
      a && (
        (a.id && a.id.toString().toLowerCase() === currentId) ||
        (a.username && a.username.toLowerCase().trim() === currentUsername) ||
        (a.name && a.name.toLowerCase().trim() === currentName) ||
        (a.name && currentName && (a.name.toLowerCase().includes(currentName) || currentName.includes(a.name.toLowerCase())))
      )
    );

    const userAliases = new Set();
    if (currentName) userAliases.add(currentName);
    if (currentUsername) userAliases.add(currentUsername);
    if (matchedAgent) {
      if (matchedAgent.name) userAliases.add(matchedAgent.name.toLowerCase().trim());
      if (matchedAgent.username) userAliases.add(matchedAgent.username.toLowerCase().trim());
      if (matchedAgent.id) userAliases.add(matchedAgent.id.toString().toLowerCase().trim());
    }

    const assignedName = (item.assignedAgentName || '').toLowerCase().trim();

    // 1. Primary check: if assignedAgentName is specified, verify if it belongs to current user
    if (assignedName) {
      for (const alias of userAliases) {
        if (!alias) continue;
        if (assignedName === alias) return true;

        const aliasFirstName = alias.split(' ')[0];
        const assignedFirstName = assignedName.split(' ')[0];
        if (aliasFirstName && assignedFirstName && aliasFirstName.length >= 3 && aliasFirstName === assignedFirstName) {
          return true;
        }

        if (assignedName.length >= 3 && alias.length >= 3 && (assignedName.includes(alias) || alias.includes(assignedName))) {
          return true;
        }
      }
      // If assignedAgentName belongs to ANOTHER agent, exclude from this agent's panel
      return false;
    }

    // 2. Fallback check on assignedTo if assignedAgentName is blank
    const assignedTo = (item.assignedTo || '').toString().toLowerCase().trim();
    if (assignedTo && (assignedTo === currentId || assignedTo === currentUsername)) {
      return true;
    }

    return false;
  });

  // Date Helpers for Visit Filtering
  const formatDateToYYYYMMDD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayString = () => formatDateToYYYYMMDD(new Date());

  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateToYYYYMMDD(tomorrow);
  };

  const isDateInThisWeek = (dateStr) => {
    if (!dateStr) return false;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return false;

    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const distanceToMonday = (currentDayOfWeek + 6) % 7;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return target >= startOfWeek && target <= endOfWeek;
  };

  // Helpers for Status filtering
  const isPendingVisitStatus = (status) => !['Site Visit Done', 'Won', 'Closed', 'Lost', 'Not Interested'].includes(status);
  const isFollowupStatus = (status) => ['Contacted', 'Interested', 'Details Provided'].includes(status);

  // Filtered enquiries by Search, Status, Agent & Visit Date
  const filteredEnquiries = (scopedEnquiries || []).filter(item => {
    if (!item) return false;
    const firstName = item.firstName || '';
    const lastName = item.lastName || '';
    const phone = item.phone || '';
    const email = item.email || '';
    const plotInfo = item.plotInfo || '';
    const query = (searchQuery || '').toLowerCase();

    const displayLeadId = getLeadDisplayId(item, 0, enquiries).toLowerCase();
    const displayUserId = getCustomerUserId(item, enquiries).toLowerCase();

    const matchesSearch = 
      `${firstName} ${lastName}`.toLowerCase().includes(query) ||
      phone.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      plotInfo.toLowerCase().includes(query) ||
      displayLeadId.includes(query) ||
      displayUserId.includes(query);

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    // Visit Date Filter Matching
    let matchesVisitDate = true;
    if (visitDateFilter !== 'All') {
      const isPending = isPendingVisitStatus(item.status);
      if (visitDateFilter === 'Today') {
        matchesVisitDate = isPending && !!item.visitDate && item.visitDate === getTodayString();
      } else if (visitDateFilter === 'Tomorrow') {
        matchesVisitDate = isPending && !!item.visitDate && item.visitDate === getTomorrowString();
      } else if (visitDateFilter === 'ThisWeek') {
        matchesVisitDate = isPending && !!item.visitDate && isDateInThisWeek(item.visitDate);
      } else if (visitDateFilter === 'AllScheduled') {
        matchesVisitDate = isPending && !!item.visitDate && item.visitDate.trim() !== '';
      }
    }

    // Followup Date Filter Matching
    let matchesFollowupDate = true;
    if (followupDateFilter !== 'All') {
      const isStatusMatched = isFollowupStatus(item.status);
      if (followupDateFilter === 'Today') {
        matchesFollowupDate = isStatusMatched && item.followupDate === getTodayString();
      } else if (followupDateFilter === 'Tomorrow') {
        matchesFollowupDate = isStatusMatched && item.followupDate === getTomorrowString();
      } else if (followupDateFilter === 'ThisWeek') {
        matchesFollowupDate = isStatusMatched && isDateInThisWeek(item.followupDate);
      } else if (followupDateFilter === 'AllScheduled') {
        matchesFollowupDate = isStatusMatched && !!item.followupDate && item.followupDate.trim() !== '';
      }
    }

    const assignedAgentName = (item.assignedAgentName || '').toLowerCase().trim();
    const targetAgentFilter = agentFilter.toLowerCase().trim();
    const matchesAgent = agentFilter === 'All' || 
      assignedAgentName === targetAgentFilter ||
      (assignedAgentName && targetAgentFilter && (assignedAgentName.includes(targetAgentFilter) || targetAgentFilter.includes(assignedAgentName)));

    return matchesSearch && matchesStatus && matchesAgent && matchesVisitDate && matchesFollowupDate;
  }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Filtered registered users by search query
  const filteredUsers = (registeredAgents || []).filter(agent => {
    if (!agent) return false;
    const query = (userSearchQuery || '').toLowerCase();
    return (
      (agent.name && agent.name.toLowerCase().includes(query)) ||
      (agent.username && agent.username.toLowerCase().includes(query)) ||
      (agent.phone && agent.phone.toLowerCase().includes(query)) ||
      (agent.email && agent.email.toLowerCase().includes(query))
    );
  });

  // Calculate stats
  const totalLeads = scopedEnquiries.length;
  const newLeadsCount = scopedEnquiries.filter(e => e.status === 'New').length;
  const todaysFollowupCount = scopedEnquiries.filter(e => isFollowupStatus(e.status) && e.followupDate === getTodayString()).length;
  const tomorrowsFollowupCount = scopedEnquiries.filter(e => isFollowupStatus(e.status) && e.followupDate === getTomorrowString()).length;
  const thisWeekFollowupCount = scopedEnquiries.filter(e => isFollowupStatus(e.status) && isDateInThisWeek(e.followupDate)).length;
  const allFollowupsCount = scopedEnquiries.filter(e => isFollowupStatus(e.status) && !!e.followupDate && e.followupDate.trim() !== '').length;

  const interestedLeadsCount = scopedEnquiries.filter(e => e.status === 'Interested').length;
  const siteVisitDoneCount = scopedEnquiries.filter(e => e.status === 'Site Visit Done').length;
  const wonDealsCount = scopedEnquiries.filter(e => e.status === 'Won' || e.status === 'Closed').length;
  const lostDealsCount = scopedEnquiries.filter(e => e.status === 'Lost').length;

  const siteVisitsCount = scopedEnquiries.filter(e => isPendingVisitStatus(e.status) && !!e.visitDate && e.visitDate.trim() !== '').length;
  const todayVisitsCount = scopedEnquiries.filter(e => isPendingVisitStatus(e.status) && !!e.visitDate && e.visitDate === getTodayString()).length;
  const tomorrowVisitsCount = scopedEnquiries.filter(e => isPendingVisitStatus(e.status) && !!e.visitDate && e.visitDate === getTomorrowString()).length;
  const thisWeekVisitsCount = scopedEnquiries.filter(e => isPendingVisitStatus(e.status) && !!e.visitDate && isDateInThisWeek(e.visitDate)).length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Contacted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Interested':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Details Provided':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'Site Visit Scheduled':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Site Visit Done':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'Won':
      case 'Closed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Not Interested':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Lost':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div class="h-screen max-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col justify-between overflow-hidden w-full max-w-full">
      
      {/* Admin Top Navbar */}
      <header class="bg-gradient-to-r from-[#B30E2E] via-[#8A0B22] to-[#590414] text-white flex-shrink-0 shadow-xl border-b border-rose-900/40">
        <div class="w-full px-2.5 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Left: Branding & System Title */}
          <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <img 
              src="/assets/images/gulmohar-city-footer-logo.png" 
              alt="Gulmohar City" 
              class="h-9 sm:h-11 w-auto object-contain flex-shrink-0 py-0.5"
            />
            <h1 class="hidden md:block text-base sm:text-lg font-serif font-bold text-white tracking-wide">
              Lead Management System
            </h1>
          </div>

          {/* Right: View Navigation Tabs & Logout Button (Separate Standalone Buttons) */}
          <div class="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
            
            {/* Dashboard View Standalone Button */}
            <button 
              onClick={() => { setActiveTab('enquiries'); setActiveView('dashboard'); }}
              class={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition shadow-md border cursor-pointer ${
                activeTab === 'enquiries' && activeView === 'dashboard'
                  ? 'bg-amber-400 text-slate-900 border-amber-300 ring-2 ring-amber-300/50 font-extrabold scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title="Dashboard"
            >
              <i class="fa-solid fa-chart-pie text-xs sm:text-sm"></i>
            </button>

            {/* Leads View Standalone Button */}
            <button 
              onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('New'); setVisitDateFilter('All'); }}
              class={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition shadow-md border cursor-pointer relative ${
                activeTab === 'enquiries' && activeView === 'leads'
                  ? 'bg-amber-400 text-slate-900 border-amber-300 ring-2 ring-amber-300/50 font-extrabold scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title="Lead Management"
            >
              <i class="fa-solid fa-address-book text-xs sm:text-sm"></i>
              {scopedEnquiries.length > 0 && (
                <span class={`absolute -top-1 -right-1 font-extrabold text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow ${
                  activeTab === 'enquiries' && activeView === 'leads'
                    ? 'bg-[#B30E2E] text-white'
                    : 'bg-amber-400 text-slate-900'
                }`}>
                  {scopedEnquiries.length}
                </span>
              )}
            </button>

            {/* Registered Users Directory Button (Admin Only) */}
            {isAdmin && (
              <button 
                onClick={() => setActiveTab('users')}
                class={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition shadow-md border cursor-pointer relative ${
                  activeTab === 'users'
                    ? 'bg-amber-400 text-slate-900 border-amber-300 ring-2 ring-amber-300/50 font-extrabold scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title="User Management"
              >
                <i class="fa-solid fa-users text-xs sm:text-sm"></i>
              </button>
            )}

            {/* Profile Avatar / Symbol Menu Button */}
            <div class="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                class={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition shadow-md border cursor-pointer overflow-hidden ${
                  showProfileMenu 
                    ? 'ring-2 ring-amber-300 border-amber-400 bg-white/20' 
                    : 'border-white/20 bg-white/10 hover:bg-white/20'
                }`}
                title="Profile & Options"
              >
                {isAdmin ? (
                  /* Admin: User Symbol Icon */
                  <i class="fa-solid fa-circle-user text-lg text-amber-300"></i>
                ) : currentUser.profileImage ? (
                  /* Agent: Custom Uploaded Profile Picture */
                  <img src={currentUser.profileImage} alt={currentUser.name} class="w-full h-full object-cover" />
                ) : (
                  /* Agent: Initial Letter Circle */
                  <span class="text-sm font-extrabold text-amber-300">{(currentUser.name || 'S')[0].toUpperCase()}</span>
                )}
              </button>

              {/* Profile Dropdown Box */}
              {showProfileMenu && (
                <>
                  {/* Backdrop to dismiss on click outside */}
                  <div class="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>

                  <div class="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in text-gray-800">
                    
                    {/* User info header */}
                    <div class="p-3.5 bg-gradient-to-r from-gray-50 to-rose-50/50 border-b border-gray-100 flex items-center gap-2.5">
                      <div class="w-9 h-9 rounded-xl bg-[#FFF0F2] border border-[#FCD6DC] text-[#B30E2E] flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden">
                        {isAdmin ? (
                          <i class="fa-solid fa-user-gear text-sm"></i>
                        ) : currentUser.profileImage ? (
                          <img src={currentUser.profileImage} alt={currentUser.name} class="w-full h-full object-cover" />
                        ) : (
                          <span>{(currentUser.name || 'S')[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-xs font-bold text-gray-900 truncate">{isAdmin ? 'Admin' : currentUser.name}</p>
                        <p class="text-[10px] text-gray-500 font-medium capitalize truncate">{isAdmin ? 'Super Admin' : 'Sales Executive'}</p>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div class="p-1.5 space-y-1 text-xs font-semibold">
                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowEditProfileModal(true);
                        }}
                        class="w-full px-3 py-2 rounded-xl text-left text-gray-700 hover:bg-gray-100 hover:text-[#B30E2E] transition flex items-center gap-2.5 cursor-pointer"
                      >
                        <i class="fa-solid fa-user-pen text-gray-500 text-xs"></i>
                        <span>Edit Profile</span>
                      </button>

                      <div class="border-t border-gray-100 my-1"></div>

                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        class="w-full px-3 py-2 rounded-xl text-left text-rose-600 hover:bg-rose-50 transition flex items-center gap-2.5 cursor-pointer font-bold"
                      >
                        <i class="fa-solid fa-right-from-bracket text-rose-500 text-xs"></i>
                        <span>Log Out</span>
                      </button>
                    </div>

                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Main Dashboard Container */}
      {/* Main Dashboard Container */}
      <main class="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 flex-1 flex flex-col min-h-0 overflow-hidden space-y-2 sm:space-y-3">
        
        {activeTab === 'enquiries' || !isAdmin ? (
          <>
            {/* Dashboard View Tab: 3 Distinct Sections (Aligned to Red Line Level) */}
            {activeView === 'dashboard' && (
              <div class="space-y-5.5 sm:space-y-6 animate-fade-in flex-1 flex flex-col overflow-y-auto custom-scrollbar py-1">
                
                {/* SECTION 1: Status */}
                <div class="space-y-1 sm:space-y-2">
                  <div class="flex items-center gap-1.5 border-b border-gray-200/80 pb-0.5 sm:pb-1">
                    <div class="w-1.5 h-3.5 sm:w-2 sm:h-4.5 rounded-full bg-[#B30E2E]"></div>
                    <h2 class="text-xs sm:text-base font-serif font-bold text-gray-900 tracking-wide">
                      Status
                    </h2>
                  </div>

                  <div class="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-3">
                    
                    {/* Card 1: New */}
                    <div 
                      onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('New'); setVisitDateFilter('All'); }}
                      class="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-xs border border-gray-200/80 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-amber-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                      title="Click to view New leads"
                    >
                      <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                        <p class="text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase tracking-wider truncate">New</p>
                        <h3 class="text-sm sm:text-xl font-bold text-gray-900 mt-0.5">{newLeadsCount}</h3>
                        <p class="hidden sm:block text-[9.5px] text-gray-500 mt-0.5 truncate">Fresh enquiries</p>
                      </div>
                      <div class="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-md sm:rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors flex-shrink-0">
                        <i class="fa-solid fa-bell text-[11px] sm:text-sm"></i>
                      </div>
                    </div>

                    {/* Card 3: Interested */}
                    <div 
                      onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('Interested'); setVisitDateFilter('All'); }}
                      class="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-xs border border-gray-200/80 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-purple-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                      title="Click to view Interested leads"
                    >
                      <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                        <p class="text-[9px] sm:text-[10px] font-bold text-purple-600 uppercase tracking-wider truncate">Interested</p>
                        <h3 class="text-sm sm:text-xl font-bold text-gray-900 mt-0.5">{interestedLeadsCount}</h3>
                        <p class="hidden sm:block text-[9.5px] text-gray-500 mt-0.5 truncate">Interested prospects</p>
                      </div>
                      <div class="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-md sm:rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors flex-shrink-0">
                        <i class="fa-solid fa-thumbs-up text-[11px] sm:text-sm"></i>
                      </div>
                    </div>

                    {/* Card 4: Site Visit Done */}
                    <div 
                      onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('Site Visit Done'); setVisitDateFilter('All'); }}
                      class="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-xs border border-gray-200/80 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-sky-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                      title="Click to view Completed Visits"
                    >
                      <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                        <p class="text-[9px] sm:text-[10px] font-bold text-sky-600 uppercase tracking-wider truncate">Visit Done</p>
                        <h3 class="text-sm sm:text-xl font-bold text-gray-900 mt-0.5">{siteVisitDoneCount}</h3>
                        <p class="hidden sm:block text-[9.5px] text-gray-500 mt-0.5 truncate">Visited project site</p>
                      </div>
                      <div class="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-md sm:rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors flex-shrink-0">
                        <i class="fa-solid fa-location-dot text-[11px] sm:text-sm"></i>
                      </div>
                    </div>

                    {/* Card 5: Won */}
                    <div 
                      onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('Won'); setVisitDateFilter('All'); }}
                      class="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-xs border border-gray-200/80 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-emerald-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                      title="Click to view Won/Booked deals"
                    >
                      <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                        <p class="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-wider truncate">Won</p>
                        <h3 class="text-sm sm:text-xl font-bold text-gray-900 mt-0.5">{wonDealsCount}</h3>
                        <p class="hidden sm:block text-[9.5px] text-gray-500 mt-0.5 truncate">Booked plot deals</p>
                      </div>
                      <div class="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-md sm:rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
                        <i class="fa-solid fa-trophy text-[11px] sm:text-sm"></i>
                      </div>
                    </div>

                    {/* Card 6: Lost */}
                    <div 
                      onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('Lost'); setVisitDateFilter('All'); }}
                      class="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-xs border border-gray-200/80 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-rose-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                      title="Click to view Lost leads"
                    >
                      <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                        <p class="text-[9px] sm:text-[10px] font-bold text-rose-600 uppercase tracking-wider truncate">Lost</p>
                        <h3 class="text-sm sm:text-xl font-bold text-gray-900 mt-0.5">{lostDealsCount}</h3>
                        <p class="hidden sm:block text-[9.5px] text-gray-500 mt-0.5 truncate">Dropped / Cancelled</p>
                      </div>
                      <div class="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-md sm:rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors flex-shrink-0">
                        <i class="fa-solid fa-thumbs-down text-[11px] sm:text-sm"></i>
                      </div>
                    </div>

                  </div>
                </div>

                {/* SECTION 2: Followup Schedule */}
                <div class="space-y-1 sm:space-y-1.5 pt-0.5">
                  <div class="flex items-center gap-1.5 border-b border-gray-200/80 pb-0.5 sm:pb-1">
                    <div class="w-1.5 h-3.5 sm:w-2 sm:h-4.5 rounded-full bg-teal-600"></div>
                    <h2 class="text-xs sm:text-base font-serif font-bold text-gray-900 tracking-wide">
                      Followup Schedule
                    </h2>
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    
                    {/* Card 1: All Followup Scheduled */}
                    <div 
                      onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('All'); setVisitDateFilter('All'); setFollowupDateFilter('AllScheduled'); }}
                      class="bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 shadow-xs border border-gray-200/80 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-teal-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                      title="Click to view all scheduled follow-ups"
                    >
                      <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                        <p class="text-[9.5px] sm:text-[11px] font-bold text-teal-600 uppercase tracking-wider truncate">All Followup</p>
                        <h3 class="text-base sm:text-2xl font-bold text-gray-900 mt-0.5">{allFollowupsCount}</h3>
                        <p class="hidden sm:block text-[10px] text-gray-500 mt-0.5 truncate">All follow-up reminders</p>
                      </div>
                      <div class="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors flex-shrink-0">
                        <i class="fa-solid fa-phone-volume text-xs sm:text-base"></i>
                      </div>
                    </div>

                    {/* Card 2: Today's Followup */}
                    <div 
                      onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('All'); setVisitDateFilter('All'); setFollowupDateFilter('Today'); }}
                      class="bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 shadow-xs border border-gray-200/80 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-blue-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                      title="Click to view today's scheduled follow-ups"
                    >
                      <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                        <p class="text-[9.5px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-wider truncate">Today's Followup</p>
                        <h3 class="text-base sm:text-2xl font-bold text-blue-600 mt-0.5">{todaysFollowupCount}</h3>
                        <p class="hidden sm:block text-[10px] text-blue-700/80 mt-0.5 truncate">Scheduled for today</p>
                      </div>
                      <div class="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                        <i class="fa-solid fa-clock text-xs sm:text-base"></i>
                      </div>
                    </div>

                    {/* Card 3: Tomorrow's Followup */}
                    <div 
                      onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('All'); setVisitDateFilter('All'); setFollowupDateFilter('Tomorrow'); }}
                      class="bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 shadow-xs border border-gray-200/80 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-cyan-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                      title="Click to view tomorrow's scheduled follow-ups"
                    >
                      <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                        <p class="text-[9.5px] sm:text-[11px] font-bold text-cyan-600 uppercase tracking-wider truncate">Tomorrow's Followup</p>
                        <h3 class="text-base sm:text-2xl font-bold text-cyan-600 mt-0.5">{tomorrowsFollowupCount}</h3>
                        <p class="hidden sm:block text-[10px] text-cyan-700/80 mt-0.5 truncate">Scheduled for tomorrow</p>
                      </div>
                      <div class="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors flex-shrink-0">
                        <i class="fa-solid fa-calendar-plus text-xs sm:text-base"></i>
                      </div>
                    </div>

                    {/* Card 4: This Week's Followup */}
                    <div 
                      onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('All'); setVisitDateFilter('All'); setFollowupDateFilter('ThisWeek'); }}
                      class="bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 shadow-xs border border-gray-200/80 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-emerald-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                      title="Click to view this week's scheduled follow-ups"
                    >
                      <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                        <p class="text-[9.5px] sm:text-[11px] font-bold text-emerald-600 uppercase tracking-wider truncate">This Week's Followup</p>
                        <h3 class="text-base sm:text-2xl font-bold text-emerald-600 mt-0.5">{thisWeekFollowupCount}</h3>
                        <p class="hidden sm:block text-[10px] text-emerald-700/80 mt-0.5 truncate">Current week follow-ups</p>
                      </div>
                      <div class="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
                        <i class="fa-solid fa-calendar-week text-xs sm:text-base"></i>
                      </div>
                    </div>

                  </div>
                </div>

                {/* SECTION 3: Visit Schedule */}
                <div class="space-y-1 sm:space-y-1.5 pt-0.5">
                  <div class="flex items-center gap-1.5 border-b border-gray-200/80 pb-0.5 sm:pb-1">
                    <div class="w-1.5 h-3.5 sm:w-2 sm:h-4.5 rounded-full bg-indigo-600"></div>
                    <h2 class="text-xs sm:text-base font-serif font-bold text-gray-900 tracking-wide">
                      Visit Schedule
                    </h2>
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    
                    {/* Card 1: All Site Visit Scheduled */}
                    <div 
                      onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('All'); setFollowupDateFilter('All'); setVisitDateFilter('AllScheduled'); }}
                      class="bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 shadow-xs border border-gray-200/80 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-indigo-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                      title="Click to view all scheduled site visits"
                    >
                      <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                        <p class="text-[9.5px] sm:text-[11px] font-bold text-indigo-600 uppercase tracking-wider truncate">All Visit Scheduled</p>
                        <h3 class="text-base sm:text-2xl font-bold text-gray-900 mt-0.5">{siteVisitsCount}</h3>
                        <p class="hidden sm:block text-[10px] text-gray-500 mt-0.5 truncate">All site appointments</p>
                      </div>
                      <div class="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0">
                        <i class="fa-solid fa-calendar-check text-xs sm:text-base"></i>
                      </div>
                    </div>

                    {/* Card 2: Today's Visit */}
                    <div 
                      onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('All'); setFollowupDateFilter('All'); setVisitDateFilter('Today'); }}
                      class="bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 shadow-xs border border-gray-200/80 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-purple-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                      title="Click to view today's scheduled visits"
                    >
                      <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                        <p class="text-[9.5px] sm:text-[11px] font-bold text-purple-600 uppercase tracking-wider truncate">Today's Visit</p>
                        <h3 class="text-base sm:text-2xl font-bold text-purple-600 mt-0.5">{todayVisitsCount}</h3>
                        <p class="hidden sm:block text-[10px] text-purple-700/80 mt-0.5 truncate">Scheduled for today</p>
                      </div>
                      <div class="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors flex-shrink-0">
                        <i class="fa-solid fa-calendar-day text-xs sm:text-base"></i>
                      </div>
                    </div>

                    {/* Card 3: Tomorrow's Visit */}
                    <div 
                      onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('All'); setFollowupDateFilter('All'); setVisitDateFilter('Tomorrow'); }}
                      class="bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 shadow-xs border border-gray-200/80 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-blue-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                      title="Click to view tomorrow's scheduled visits"
                    >
                      <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                        <p class="text-[9.5px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-wider truncate">Tomorrow's Visit</p>
                        <h3 class="text-base sm:text-2xl font-bold text-blue-600 mt-0.5">{tomorrowVisitsCount}</h3>
                        <p class="hidden sm:block text-[10px] text-blue-700/80 mt-0.5 truncate">Scheduled for tomorrow</p>
                      </div>
                      <div class="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                        <i class="fa-solid fa-calendar-plus text-xs sm:text-base"></i>
                      </div>
                    </div>

                    {/* Card 4: This Week's Visit */}
                    <div 
                      onClick={() => { setActiveTab('enquiries'); setActiveView('leads'); setStatusFilter('All'); setFollowupDateFilter('All'); setVisitDateFilter('ThisWeek'); }}
                      class="bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 shadow-xs border border-gray-200/80 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-[#B30E2E]/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                      title="Click to view this week's scheduled visits"
                    >
                      <div class="min-w-0 flex-1 pr-1 sm:pr-2">
                        <p class="text-[9.5px] sm:text-[11px] font-bold text-[#B30E2E] uppercase tracking-wider truncate">This Week's Visit</p>
                        <h3 class="text-base sm:text-2xl font-bold text-[#B30E2E] mt-0.5">{thisWeekVisitsCount}</h3>
                        <p class="hidden sm:block text-[10px] text-[#B30E2E]/80 mt-0.5 truncate">Current week appointments</p>
                      </div>
                      <div class="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#B30E2E] group-hover:bg-[#B30E2E] group-hover:text-white transition-colors flex-shrink-0">
                        <i class="fa-solid fa-calendar-week text-xs sm:text-base"></i>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* Leads View Tab: Only Leads Table Container */}
            {activeView === 'leads' && (
              selectedHistoryLead ? (
                /* FULL PAGE LEAD ACTIVITY HISTORY VIEW (1:1 LEADS TABLE SEQUENCE) */
                <div class="space-y-3 animate-fade-in flex-1 flex flex-col min-h-0 overflow-hidden">
                  
                  {/* Lead History Title Section */}
                  <div class="flex-shrink-0 flex items-start justify-between px-1">
                    <div class="flex flex-col gap-2 min-w-0 flex-1">
                      <div class="flex items-center gap-2 text-base sm:text-lg font-serif font-bold text-gray-900 tracking-wide">
                        <span>Lead :</span>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs sm:text-sm font-mono font-bold bg-rose-50 text-[#B30E2E] border border-rose-200/80">
                          {getLeadDisplayId(selectedHistoryLead, 0, enquiries)}
                        </span>
                      </div>
                      
                      {/* Extensible Tab Navigation Bar */}
                      <div class="flex items-center gap-2 pt-0.5">
                        <button 
                          type="button"
                          class="px-2.5 py-1 text-[11px] font-bold text-[#B30E2E] bg-rose-50 border border-rose-200/80 rounded-lg shadow-2xs hover:bg-rose-100 hover:border-rose-300 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none"
                        >
                          History
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedHistoryLead(null)}
                      class="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition shadow cursor-pointer mt-1 flex-shrink-0 ml-3"
                      title="Back to Leads"
                    >
                      <i class="fa-solid fa-arrow-left text-xs"></i>
                    </button>
                  </div>

                  {/* Lead History Table Container */}
                  <div class="relative flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div class="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                      {(() => {
                        if (!selectedHistoryLead) return null;
                        const mongoHistory = selectedHistoryLead.history || [];

                        if (mongoHistory.length === 0) {
                          return (
                            <div class="py-16 text-center text-slate-400 space-y-2">
                              <div class="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto text-purple-500">
                                <i class="fa-solid fa-clock-rotate-left text-xl"></i>
                              </div>
                              <h4 class="text-sm font-bold text-slate-700">No Edit History Recorded Yet in MongoDB Database</h4>
                              <p class="text-xs text-slate-400 max-w-sm mx-auto">
                                Edits saved via the edit form or status changes for this lead will appear here directly from MongoDB Atlas schema as Old Value ➔ New Value history entries.
                              </p>
                            </div>
                          );
                        }

                        // Group history items by modification timestamp (exact edit session & modifiedBy)
                        const groupedHistory = [];
                        mongoHistory.forEach((item) => {
                          const dateObj = item.modifiedDate ? new Date(item.modifiedDate) : new Date();
                          const dateKey = isNaN(dateObj.getTime())
                            ? (item.modifiedDate || 'N/A')
                            : dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                          const timeKey = isNaN(dateObj.getTime())
                            ? ''
                            : dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                          const key = `${item.modifiedDate || dateKey}_${item.modifiedBy || 'Admin'}`;
                          
                          let existingGroup = groupedHistory.find(g => g.key === key);
                          if (existingGroup) {
                            existingGroup.items.push(item);
                          } else {
                            groupedHistory.push({
                              key,
                              dateKey,
                              timeKey,
                              modifiedDate: item.modifiedDate,
                              modifiedBy: item.modifiedBy || 'Admin',
                              items: [item]
                            });
                          }
                        });

                        // Show newest edit sessions at top
                        groupedHistory.reverse();

                        return (
                          <div class="space-y-3.5 py-1 px-0 overflow-y-auto custom-scrollbar flex-1 w-full">
                            {groupedHistory.map((group, groupIdx) => {
                              const modDate = group.dateKey || 'N/A';
                              const modTime = group.timeKey || '';

                              return (
                                <div key={groupIdx} class="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden">
                                  {/* Section Header: Date & User */}
                                  <div class="bg-gray-50/90 border-b border-gray-200/80 px-3.5 py-2 flex items-center justify-between gap-2 text-xs">
                                    <span class="inline-flex items-center gap-1.5 font-medium text-gray-500">
                                      <i class="fa-regular fa-calendar-check text-[#B30E2E]"></i>
                                      <span>{modDate}{modTime ? `, ${modTime}` : ''}</span>
                                    </span>
                                    <span class="inline-flex items-center gap-1.5 font-bold text-gray-800">
                                      <i class="fa-solid fa-user-circle text-purple-600"></i>
                                      <span class="px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200 font-bold text-[11px]">
                                        {group.modifiedBy}
                                      </span>
                                    </span>
                                  </div>

                                  {/* Table for Modified Fields */}
                                  <div class="overflow-x-auto">
                                    <table class="w-full text-left border-collapse">
                                      <tbody class="divide-y divide-gray-100 text-[11.5px] bg-white">
                                        {group.items.map((item, itemIdx) => (
                                          <tr key={item._id || itemIdx} class="hover:bg-purple-50/15 transition">
                                            {/* Field Name */}
                                            <td class="py-2.5 px-4 font-bold text-gray-800 whitespace-nowrap w-1/3 text-left">
                                              {item.fieldName || '—'}
                                            </td>

                                            {/* Old Value */}
                                            <td class="py-2.5 px-4 whitespace-normal text-gray-700 font-medium w-1/3 text-left break-words break-all whitespace-pre-wrap">
                                              {item.oldValue || '—'}
                                            </td>

                                            {/* New Value */}
                                            <td class="py-2.5 px-4 whitespace-normal text-gray-700 font-medium w-1/3 text-left break-words break-all whitespace-pre-wrap">
                                              {item.newValue || '—'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                </div>
              ) : (
                <div class="space-y-3 animate-fade-in flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Leads Title Section */}
                  <div class="flex-shrink-0">
                    <h2 class="text-base sm:text-lg font-serif font-bold text-gray-900 tracking-wide">
                      Leads
                    </h2>
                  </div>

            {/* Leads Table Container */}
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200/80 relative flex-1 flex flex-col min-h-0 overflow-hidden">
              
              {/* Card Header Bar with Search, Status Filter & Export CSV */}
              <div class="px-4 py-2.5 border-b border-gray-100 bg-gray-50/70 rounded-t-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
                
                {/* Left/Center: Search & Filter */}
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
                  
                  {/* Search Box */}
                  <div class="relative flex-1">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <i class="fa-solid fa-magnifying-glass text-xs"></i>
                    </div>
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search lead by Lead ID, name, mobile..."
                      class="w-full pl-9 pr-7 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-xs bg-white font-medium shadow-xs"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 text-xs"
                      >
                        <i class="fa-solid fa-circle-xmark"></i>
                      </button>
                    )}
                  </div>

                  {/* Status Filter Custom Dropdown */}
                  <div ref={statusDropdownRef} class="w-full sm:w-44 flex-shrink-0 relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsStatusDropdownOpen(!isStatusDropdownOpen);
                        setIsAgentDropdownOpen(false);
                      }}
                      class="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-xs bg-white hover:bg-gray-50 font-bold text-gray-700 cursor-pointer shadow-xs flex items-center justify-between"
                    >
                      <span>{statusFilter}</span>
                      <i class={`fa-solid fa-chevron-down text-xs text-gray-400 transition transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}></i>
                    </button>

                    {isStatusDropdownOpen && (
                      <div class="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 max-h-48 overflow-y-auto custom-scrollbar animate-fade-in">
                        {['All', 'New', 'Contacted', 'Interested', 'Details Provided', 'Not Interested', 'Site Visit Scheduled', 'Site Visit Done', 'Won', 'Lost'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              setStatusFilter(status);
                              setIsStatusDropdownOpen(false);
                            }}
                            class={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-rose-50 hover:text-[#B30E2E] transition flex items-center justify-between cursor-pointer ${
                              statusFilter === status ? 'bg-[#FFF0F2] text-[#B30E2E] font-bold' : 'text-gray-700'
                            }`}
                          >
                            <span>{status}</span>
                            {statusFilter === status && <i class="fa-solid fa-check text-xs"></i>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Agent Filter Custom Dropdown (Admin Only) */}
                  {isAdmin && (
                    <div ref={agentDropdownRef} class="w-full sm:w-48 flex-shrink-0 relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAgentDropdownOpen(!isAgentDropdownOpen);
                          setIsStatusDropdownOpen(false);
                        }}
                        class="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-xs bg-white hover:bg-gray-50 font-bold text-gray-700 cursor-pointer shadow-xs flex items-center justify-between"
                        title="Filter leads by Agent"
                      >
                        <span class="flex items-center gap-1.5 truncate">
                          <i class="fa-solid fa-user-group text-xs text-[#B30E2E]"></i>
                          <span class="truncate">{agentFilter === 'All' ? 'All Agents' : agentFilter}</span>
                        </span>
                        <i class={`fa-solid fa-chevron-down text-xs text-gray-400 transition transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`}></i>
                      </button>

                      {isAgentDropdownOpen && (
                        <div class="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 max-h-56 overflow-y-auto custom-scrollbar animate-fade-in">
                          {/* Option 1: All Agents */}
                          <button
                            type="button"
                            onClick={() => {
                              setAgentFilter('All');
                              setIsAgentDropdownOpen(false);
                            }}
                            class={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-rose-50 hover:text-[#B30E2E] transition flex items-center justify-between cursor-pointer ${
                              agentFilter === 'All' ? 'bg-[#FFF0F2] text-[#B30E2E] font-bold' : 'text-gray-700'
                            }`}
                          >
                            <span class="flex items-center gap-1.5 truncate">
                              <i class="fa-solid fa-users text-xs text-rose-500"></i>
                              <span>All Agents</span>
                            </span>
                            {agentFilter === 'All' && <i class="fa-solid fa-check text-xs"></i>}
                          </button>

                          {/* Dynamic Registered Agent Options */}
                          {registeredAgents.map((agent) => {
                            const agentName = agent.name || agent.username;
                            const isSelected = agentFilter.toLowerCase().trim() === agentName.toLowerCase().trim();
                            return (
                              <button
                                key={agent.id || agent._id || agent.username}
                                type="button"
                                onClick={() => {
                                  setAgentFilter(agentName);
                                  setIsAgentDropdownOpen(false);
                                }}
                                class={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-rose-50 hover:text-[#B30E2E] transition flex items-center justify-between cursor-pointer ${
                                  isSelected ? 'bg-[#FFF0F2] text-[#B30E2E] font-bold' : 'text-gray-700'
                                }`}
                              >
                                <span class="flex items-center gap-1.5 truncate">
                                  <i class="fa-solid fa-circle-user text-xs text-emerald-600"></i>
                                  <span class="truncate">{agentName}</span>
                                </span>
                                {isSelected && <i class="fa-solid fa-check text-xs"></i>}
                              </button>
                            );
                            })}
                          </div>
                        )}
                      </div>
                    )}



                </div>

                {/* Right: Bulk Delete (Admin), Create Lead & Export CSV Buttons */}
                <div class="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">

                  {/* Bulk Delete Selected Leads Icon Button (Admin Only) */}
                  {isAdmin && selectedLeadIds.length > 0 && (
                    <button 
                      onClick={handleBulkDeleteEnquiries}
                      class="w-9 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition shadow-sm border border-rose-500/40 cursor-pointer flex-shrink-0 transform hover:scale-105 active:scale-95 animate-fade-in"
                      title={`Delete selected leads (${selectedLeadIds.length})`}
                    >
                      <i class="fa-regular fa-trash-can text-sm"></i>
                    </button>
                  )}

                  {/* Create Lead Icon Button */}
                  <button 
                    onClick={() => setShowCreateLeadModal(true)}
                    class="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition shadow-sm border border-emerald-500/40 cursor-pointer flex-shrink-0 transform hover:scale-105 active:scale-95"
                    title="Create New Lead"
                  >
                    <i class="fa-solid fa-user-pen text-sm"></i>
                  </button>

                  {/* Column Config Icon Button */}
                  <button 
                    onClick={() => setShowColumnConfigModal(true)}
                    class="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition shadow-sm border border-emerald-500/40 cursor-pointer flex-shrink-0 transform hover:scale-105 active:scale-95"
                    title="Column Configuration"
                  >
                    <i class="fa-solid fa-sliders text-sm"></i>
                  </button>

                  {/* Export CSV Icon Button (Admin Only) */}
                  {isAdmin && (
                    <button 
                      onClick={handleExportCSV}
                      class="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition shadow-sm border border-emerald-500/40 cursor-pointer flex-shrink-0 transform hover:scale-105 active:scale-95"
                      title="Export"
                    >
                      <i class="fa-solid fa-file-excel text-sm"></i>
                    </button>
                  )}
                </div>

              </div>

              {loading ? (
                <div class="p-12 text-center text-gray-500 space-y-3">
                  <i class="fa-solid fa-circle-notch fa-spin text-3xl text-[#B30E2E]"></i>
                  <p class="text-xs font-semibold">Loading enquiries data...</p>
                </div>
              ) : filteredEnquiries.length === 0 ? (
                <div class="p-12 text-center text-gray-400 space-y-3">
                  <i class="fa-solid fa-inbox text-4xl"></i>
                  <p class="text-sm font-medium text-gray-600">No matching lead records found.</p>
                  <p class="text-xs text-gray-400">Try adjusting your search query or status filter.</p>
                </div>
              ) : (
                <div class="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar w-full rounded-b-2xl">
                  <table class="w-full min-w-full text-left border-collapse">
                    <thead class="sticky top-0 z-10 bg-gray-100 shadow-2xs">
                      <tr class="bg-gray-100 border-b border-gray-200 text-[10px] font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {isAdmin && (
                          <th class="py-2.5 px-2 text-center whitespace-nowrap w-8">
                            <input 
                              type="checkbox"
                              checked={filteredEnquiries.length > 0 && filteredEnquiries.every(item => selectedLeadIds.includes(item._id || item.id))}
                              onChange={handleToggleSelectAll}
                              class="w-3.5 h-3.5 rounded border-gray-300 text-[#B30E2E] focus:ring-[#B30E2E] cursor-pointer accent-[#B30E2E]"
                              title="Select All / Deselect All Leads"
                            />
                          </th>
                        )}
                        {columnConfig.filter(c => c.visible).map(col => {
                          switch (col.id) {
                            case 'leadId':
                              return <th key="leadId" class="py-2.5 px-2.5 whitespace-nowrap w-16 min-w-[60px]">Lead ID</th>;
                            case 'fullName':
                              return <th key="fullName" class="py-2.5 px-3 whitespace-nowrap w-44 min-w-[165px]">Full Name</th>;
                            case 'mobile':
                              return <th key="mobile" class="py-2.5 px-3 whitespace-nowrap w-36 min-w-[142px]">Mobile No</th>;
                            case 'email':
                              return <th key="email" class="py-2.5 px-2.5 whitespace-nowrap min-w-[155px]">Email Address</th>;
                            case 'enquiryDate':
                              return <th key="enquiryDate" class="py-2.5 px-2.5 whitespace-nowrap min-w-[145px]">Enquiry Date</th>;
                            case 'status':
                              return <th key="status" class="py-2.5 px-2.5 whitespace-nowrap min-w-[130px]">Status</th>;
                            case 'followupDate':
                              return <th key="followupDate" class="py-2.5 px-2.5 whitespace-nowrap min-w-[115px]">Followup Date</th>;
                            case 'plotsCount':
                              return <th key="plotsCount" class="py-2.5 px-2.5 whitespace-nowrap min-w-[110px]">No. of Guntha</th>;
                            case 'visitDate':
                              return <th key="visitDate" class="py-2.5 px-2.5 whitespace-nowrap min-w-[110px]">Visit Date</th>;
                            case 'assignedAgent':
                              return <th key="assignedAgent" class="py-2.5 px-2.5 whitespace-nowrap min-w-[145px]">Assigned Agent</th>;
                            case 'notes':
                              return <th key="notes" class="py-2.5 px-2 text-center whitespace-nowrap w-12">Notes</th>;
                            case 'actions':
                              return <th key="actions" class="py-2.5 px-2 text-center whitespace-nowrap w-16">Actions</th>;
                            default:
                              return null;
                          }
                        })}
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-[11.5px]">
                      {filteredEnquiries.map((item, idx) => {
                        const currentId = item._id || item.id || `lead-row-${idx}`;
                        const displayLeadId = getLeadDisplayId(item, idx, enquiries);
                        const displayUserId = getCustomerUserId(item, enquiries);
                        return (
                          <tr key={currentId} class={`hover:bg-rose-50/20 transition ${selectedLeadIds.includes(currentId) ? 'bg-rose-50/40' : ''}`}>
                            {isAdmin && (
                              <td class="py-2.5 px-2 text-center whitespace-nowrap w-8">
                                <input 
                                  type="checkbox"
                                  checked={selectedLeadIds.includes(currentId)}
                                  onChange={() => handleToggleSelectLead(currentId)}
                                  class="w-3.5 h-3.5 rounded border-gray-300 text-[#B30E2E] focus:ring-[#B30E2E] cursor-pointer accent-[#B30E2E]"
                                />
                              </td>
                            )}

                            {columnConfig.filter(c => c.visible).map(col => {
                              switch (col.id) {
                                case 'leadId':
                                  return (
                                    <td key="leadId" class="py-2.5 px-2.5 whitespace-nowrap w-16 min-w-[60px]">
                                      <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-50 text-[#B30E2E] border border-rose-200/80 shadow-xs">
                                        {displayLeadId}
                                      </span>
                                    </td>
                                  );
                                case 'fullName':
                                  return (
                                    <td key="fullName" class="py-2.5 px-3 font-bold text-gray-800 whitespace-nowrap w-44 min-w-[165px] max-w-[165px]">
                                      <div class="flex items-center gap-1 truncate">
                                        <div class="w-5 h-5 rounded-full bg-[#FCD6DC] text-[#B30E2E] font-bold text-[10px] flex items-center justify-center flex-shrink-0 border border-[#FCD6DC]">
                                          {(item.firstName || 'C')[0].toUpperCase()}
                                        </div>
                                        <span class="capitalize text-[11.5px] text-gray-900 font-bold whitespace-nowrap truncate">
                                          {item.firstName || ''} {item.lastName || ''}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                case 'mobile':
                                  return (
                                    <td key="mobile" class="py-2.5 px-3 whitespace-nowrap w-36 min-w-[142px]">
                                      {item.phone ? (
                                        <div class="flex items-center gap-1.5 whitespace-nowrap">
                                          <a 
                                            href={`tel:${item.phone}`} 
                                            class="text-[#B30E2E] hover:underline font-bold flex items-center gap-1 whitespace-nowrap text-[11.5px] w-[90px] shrink-0"
                                            title="Call Lead"
                                          >
                                            <i class="fa-solid fa-phone text-[8.5px] text-[#B30E2E]"></i>
                                            <span>{item.phone}</span>
                                          </a>
                                          {(() => {
                                            const cleanPhone = (item.phone || '').replace(/\D/g, '');
                                            const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                                            const formatCapitalizedName = (str) => {
                                              if (!str) return '';
                                              return str.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
                                            };
                                            const rawName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Customer';
                                            const customerName = formatCapitalizedName(rawName);
                                            const waMsg = encodeURIComponent(`Hello ${customerName}, Thank you for your enquiry at Gulmohar City!`);
                                            const waUrl = `https://wa.me/${formattedPhone}?text=${waMsg}`;
                                            return (
                                              <a
                                                href={waUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="w-5 h-5 rounded-full bg-emerald-100 hover:bg-emerald-600 text-emerald-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs border border-emerald-200 cursor-pointer shrink-0"
                                                title={`Chat on WhatsApp with ${customerName}`}
                                              >
                                                <i class="fa-brands fa-whatsapp text-[11px]"></i>
                                              </a>
                                            );
                                          })()}
                                        </div>
                                      ) : (
                                        <span class="text-gray-400 italic text-[10.5px]">N/A</span>
                                      )}
                                    </td>
                                  );
                                case 'email':
                                  return (
                                    <td key="email" class="py-2.5 px-2.5 whitespace-nowrap min-w-[155px]">
                                      {item.email ? (
                                        <a 
                                          href={`mailto:${item.email}`}
                                          class="text-gray-600 hover:text-[#B30E2E] flex items-center gap-1 text-[10.5px] whitespace-nowrap"
                                          title={item.email}
                                        >
                                          <i class="fa-regular fa-envelope text-[9.5px] text-gray-400"></i>
                                          <span>{item.email}</span>
                                        </a>
                                      ) : (
                                        <span class="text-gray-400 italic text-[10px]">Optional / None</span>
                                      )}
                                    </td>
                                  );
                                case 'enquiryDate':
                                  return (
                                    <td key="enquiryDate" class="py-2.5 px-2.5 whitespace-nowrap min-w-[145px]">
                                      <div class="font-semibold text-gray-800 text-[10px] whitespace-nowrap">
                                        <i class="fa-regular fa-clock text-[8.5px] text-gray-400 mr-0.5"></i>
                                        {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        <span class="text-[9px] text-gray-400 ml-1 font-normal">
                                          {new Date(item.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                case 'status':
                                  return (
                                    <td key="status" class="py-2.5 px-2.5 whitespace-nowrap min-w-[130px]">
                                      <select
                                        value={item.status || 'New'}
                                        onChange={(e) => handleStatusChange(currentId, e.target.value)}
                                        class={`px-1 py-0.5 rounded-md border text-[10px] font-bold outline-none cursor-pointer transition ${getStatusBadge(item.status || 'New')}`}
                                      >
                                        <option value="New" class="bg-white text-gray-800 font-medium">New</option>
                                        <option value="Contacted" class="bg-white text-gray-800 font-medium">Contacted</option>
                                        <option value="Interested" class="bg-white text-gray-800 font-medium">Interested</option>
                                        <option value="Details Provided" class="bg-white text-gray-800 font-medium">Details Provided</option>
                                        <option value="Not Interested" class="bg-white text-gray-800 font-medium">Not Interested</option>
                                        <option value="Site Visit Scheduled" class="bg-white text-gray-800 font-medium">Site Visit Scheduled</option>
                                        <option value="Site Visit Done" class="bg-white text-gray-800 font-medium">Site Visit Done</option>
                                        <option value="Won" class="bg-white text-gray-800 font-medium">Won</option>
                                        <option value="Lost" class="bg-white text-gray-800 font-medium">Lost</option>
                                      </select>
                                    </td>
                                  );
                                case 'followupDate':
                                  return (
                                    <td key="followupDate" class="py-2.5 px-2.5 whitespace-nowrap min-w-[115px]">
                                      <input
                                        type="date"
                                        value={formatToInputDate(item.followupDate)}
                                        onChange={(e) => handleInlineFieldChange(currentId, 'followupDate', e.target.value)}
                                        class="px-1.5 py-0.5 rounded-md border border-amber-300 text-[10px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 outline-none cursor-pointer transition shadow-2xs"
                                        title="Click to edit Followup Date inline"
                                      />
                                    </td>
                                  );
                                case 'plotsCount':
                                  return (
                                    <td key="plotsCount" class="py-2.5 px-2.5 whitespace-nowrap min-w-[110px]">
                                      <div class="flex items-center gap-1 whitespace-nowrap">
                                        <select
                                          value={item.plotsCount || '1 Guntha'}
                                          onChange={(e) => handleInlineFieldChange(currentId, 'plotsCount', e.target.value)}
                                          class="px-1.5 py-0.5 rounded-md border border-amber-300 text-[10px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 outline-none cursor-pointer transition shadow-2xs"
                                          title="Click to edit No. of Guntha inline"
                                        >
                                          <option value="1 Guntha" class="bg-white text-gray-800 font-medium">1 Guntha</option>
                                          <option value="2 Guntha" class="bg-white text-gray-800 font-medium">2 Guntha</option>
                                          <option value="3 Guntha" class="bg-white text-gray-800 font-medium">3 Guntha</option>
                                          <option value="4 Guntha" class="bg-white text-gray-800 font-medium">4 Guntha</option>
                                          <option value="5 Guntha" class="bg-white text-gray-800 font-medium">5 Guntha</option>
                                          <option value="6 Guntha" class="bg-white text-gray-800 font-medium">6 Guntha</option>
                                          <option value="7 Guntha" class="bg-white text-gray-800 font-medium">7 Guntha</option>
                                          <option value="8 Guntha" class="bg-white text-gray-800 font-medium">8 Guntha</option>
                                          <option value="9 Guntha" class="bg-white text-gray-800 font-medium">9 Guntha</option>
                                          <option value="10 Guntha" class="bg-white text-gray-800 font-medium">10 Guntha</option>
                                          <option value="11+ Guntha (Bulk / Investment)" class="bg-white text-gray-800 font-medium">11+ Guntha</option>
                                        </select>
                                        {item.plotInfo && (
                                          <span class="text-[9px] text-gray-500 font-medium whitespace-nowrap" title={item.plotInfo}>
                                            ({item.plotInfo})
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  );
                                case 'visitDate':
                                  return (
                                    <td key="visitDate" class="py-2.5 px-2.5 whitespace-nowrap min-w-[110px]">
                                      <input
                                        type="date"
                                        value={formatToInputDate(item.visitDate)}
                                        onChange={(e) => handleInlineFieldChange(currentId, 'visitDate', e.target.value)}
                                        class="px-1.5 py-0.5 rounded-md border border-indigo-300 text-[10px] font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 outline-none cursor-pointer transition shadow-2xs"
                                        title="Click to edit Visit Date inline"
                                      />
                                    </td>
                                  );
                                case 'assignedAgent':
                                  return (
                                    <td key="assignedAgent" class="py-2.5 px-2.5 whitespace-nowrap min-w-[145px]">
                                      {isAdmin ? (
                                        <select
                                          value={item.assignedAgentName || (allAgents[0] ? allAgents[0].name : '')}
                                          onChange={(e) => handleReassignAgent(currentId, e.target.value)}
                                          class="px-1.5 py-0.5 rounded-lg border border-emerald-300 text-[10px] font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 outline-none cursor-pointer transition shadow-2xs"
                                          title="Re-assign lead to salesperson"
                                        >
                                          {allAgents.map(agent => (
                                            <option key={agent.id || agent.username} value={agent.name} class="bg-white text-gray-800 font-semibold">
                                              👤 {agent.name}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <span class="px-1.5 py-0.5 rounded-lg border border-emerald-300 text-[10px] font-bold text-emerald-900 bg-emerald-50 inline-flex items-center gap-1 shadow-2xs">
                                          <i class="fa-solid fa-user-check text-[8.5px] text-emerald-600"></i>
                                          <span>{item.assignedAgentName || currentUser.name}</span>
                                        </span>
                                      )}
                                    </td>
                                  );
                                case 'notes':
                                  return (
                                    <td key="notes" class="py-2.5 px-2 text-center whitespace-nowrap w-12">
                                      <button 
                                        type="button"
                                        onClick={(e) => handleOpenNotePopover(e, item)}
                                        class={`w-6 h-6 rounded-md flex items-center justify-center transition shadow-2xs cursor-pointer mx-auto transform hover:scale-105 active:scale-95 ${
                                          item.notes && item.notes.trim() !== ''
                                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/70'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-500 border border-gray-200'
                                        }`}
                                        title={item.notes && item.notes.trim() !== '' ? "Click to view note" : "Empty note - Click to view/add note"}
                                      >
                                        <i class={`fa-solid fa-note-sticky text-[10.5px] ${
                                          item.notes && item.notes.trim() !== '' ? 'text-amber-700' : 'text-gray-400'
                                        }`}></i>
                                      </button>
                                    </td>
                                  );
                                case 'actions':
                                  return (
                                    <td key="actions" class="py-2.5 px-2 text-center whitespace-nowrap w-24">
                                      <div class="flex items-center justify-center gap-1">
                                        <button 
                                          onClick={() => { setEditingEnquiry({ ...item }); setEditModalSuccessMsg(''); }}
                                          class="w-6 h-6 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center transition cursor-pointer"
                                          title="Edit Lead Details"
                                        >
                                          <i class="fa-solid fa-pen-to-square text-[10.5px]"></i>
                                        </button>
                                        <button 
                                          onClick={() => handleOpenHistoryModal(item)}
                                          class="w-6 h-6 rounded-md bg-purple-100 hover:bg-purple-600 text-purple-800 hover:text-white flex items-center justify-center transition cursor-pointer border border-purple-200"
                                          title="View Lead Activity History"
                                        >
                                          <i class="fa-solid fa-clock-rotate-left text-[10.5px]"></i>
                                        </button>
                                        {isAdmin && (
                                          <button 
                                            onClick={() => handleDeleteEnquiry(currentId)}
                                            class="w-6 h-6 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center transition cursor-pointer"
                                            title="Delete Lead"
                                          >
                                            <i class="fa-regular fa-trash-can text-[10.5px]"></i>
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
                </div>
              )}
            </div>
          </div>
        )
      )}
          </>
        ) : (
          <>
            {/* Registered Users View Tab */}
            {/* Users Title Section */}
            <div class="pt-2">
              <h2 class="text-base sm:text-lg font-serif font-bold text-gray-900 tracking-wide">
                User Management
              </h2>
            </div>

            {/* Registered Users Table Card */}
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
              
              {/* Search Header Bar */}
              <div class="px-4 py-3 border-b border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div class="relative flex-1 max-w-md">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <i class="fa-solid fa-magnifying-glass text-xs"></i>
                  </div>
                  <input 
                    type="text" 
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search user by name, username, mobile, email..."
                    class="w-full pl-9 pr-7 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-xs bg-white font-medium shadow-xs"
                  />
                  {userSearchQuery && (
                    <button 
                      onClick={() => setUserSearchQuery('')}
                      class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 text-xs"
                    >
                      <i class="fa-solid fa-circle-xmark"></i>
                    </button>
                  )}
                </div>

                {/* Right Side: Create User Icon Button */}
                {isAdmin && (
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button 
                      onClick={() => setShowCreateAgentModal(true)}
                      class="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/40 font-extrabold flex items-center justify-center transition shadow-sm cursor-pointer flex-shrink-0 transform hover:scale-105 active:scale-95"
                      title="Create User Account"
                    >
                      <i class="fa-solid fa-user-plus text-sm"></i>
                    </button>
                  </div>
                )}
              </div>

              {/* Users Table */}
              {filteredUsers.length === 0 ? (
                <div class="p-12 text-center text-gray-400 space-y-3">
                  <i class="fa-solid fa-user-slash text-4xl"></i>
                  <p class="text-sm font-medium text-gray-600">No matching user accounts found.</p>
                  <p class="text-xs text-gray-400">Click "+ Create User" button to create a user.</p>
                </div>
              ) : (
                <div class="overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)] custom-scrollbar w-full rounded-b-2xl">
                  <table class="w-full min-w-[700px] text-left border-collapse">
                      <thead class="sticky top-0 z-10 bg-gray-100 shadow-2xs">
                        <tr class="bg-gray-100 border-b border-gray-200 text-[10.5px] font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                          <th class="py-2.5 px-3 whitespace-nowrap">User ID</th>
                          <th class="py-2.5 px-3 whitespace-nowrap">Full Name</th>
                          <th class="py-2.5 px-3 whitespace-nowrap">Username</th>
                          <th class="py-2.5 px-3 whitespace-nowrap">Password</th>
                          <th class="py-2.5 px-3 whitespace-nowrap">Mobile No</th>
                          <th class="py-2.5 px-3 whitespace-nowrap">Email Address</th>
                          <th class="py-2.5 px-3 whitespace-nowrap">Assigned Leads</th>
                          <th class="py-2.5 px-3 text-center whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100 text-xs">
                        {filteredUsers.map((agent, agentIdx) => {
                          const assignedCount = enquiries.filter(e => {
                            const leadAgent = (e.assignedAgentName || '').toLowerCase().trim();
                            const agentName = (agent.name || '').toLowerCase().trim();
                            const agentUsername = (agent.username || '').toLowerCase().trim();
                            const agentId = (agent.id || agent._id || '').toString().toLowerCase().trim();
                            const assignedTo = (e.assignedTo || '').toString().toLowerCase().trim();

                            if (assignedTo && (assignedTo === agentId || assignedTo === agentUsername)) return true;
                            if (!leadAgent) return false;

                            return (
                              leadAgent === agentName ||
                              leadAgent === agentUsername ||
                              (agentName.length >= 3 && leadAgent.length >= 3 && (leadAgent.includes(agentName) || agentName.includes(leadAgent))) ||
                              (agentUsername.length >= 3 && leadAgent.length >= 3 && (leadAgent.includes(agentUsername) || agentUsername.includes(leadAgent))) ||
                              (agentName.split(' ')[0] && leadAgent.split(' ')[0] && agentName.split(' ')[0] === leadAgent.split(' ')[0])
                            );
                          }).length;
                          return (
                            <tr key={agent.id || agent.username} class="hover:bg-slate-50/80 transition">
                              
                              {/* User ID */}
                              <td class="py-3 px-3 whitespace-nowrap">
                                <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
                                  {String(agentIdx + 1).padStart(2, '0')}
                                </span>
                              </td>
                              
                              {/* Full Name */}
                              <td class="py-3 px-3 font-bold text-gray-900 whitespace-nowrap">
                                <div class="flex items-center gap-2">
                                  {getAgentProfilePhoto(agent) ? (
                                    <img 
                                      src={getAgentProfilePhoto(agent)} 
                                      alt={agent.name} 
                                      class="w-7 h-7 rounded-full object-cover border border-gray-200 shadow-xs flex-shrink-0" 
                                    />
                                  ) : (
                                    <div class="w-7 h-7 rounded-full bg-[#B30E2E] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                                      {((agent.name || agent.username || 'U').trim()[0] || 'U').toUpperCase()}
                                    </div>
                                  )}
                                  <span class="text-xs font-bold text-gray-900">{agent.name}</span>
                                </div>
                              </td>

                              {/* Username */}
                              <td class="py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                <span class="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md text-[11px] font-mono text-gray-800">
                                  {agent.username}
                                </span>
                              </td>

                              {/* Password */}
                              <td class="py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                <span class="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md text-[11px] font-mono text-gray-700">
                                  {agent.password || '••••••••'}
                                </span>
                              </td>

                              {/* Mobile No */}
                              <td class="py-3 px-3 whitespace-nowrap">
                                {agent.phone ? (
                                  <a href={`tel:${agent.phone}`} class="text-[#B30E2E] font-bold hover:underline flex items-center gap-1 text-xs">
                                    <i class="fa-solid fa-phone text-[9px]"></i>
                                    <span>{agent.phone}</span>
                                  </a>
                                ) : (
                                  <span class="text-gray-400 italic text-[11px]">N/A</span>
                                )}
                              </td>

                              {/* Email Address */}
                              <td class="py-3 px-3 whitespace-nowrap">
                                {agent.email ? (
                                  <a href={`mailto:${agent.email}`} class="text-gray-700 hover:text-[#B30E2E] flex items-center gap-1 text-[11px]">
                                    <i class="fa-regular fa-envelope text-[10px] text-gray-400"></i>
                                    <span>{agent.email}</span>
                                  </a>
                                ) : (
                                  <span class="text-gray-400 italic text-[11px]">N/A</span>
                                )}
                              </td>

                              {/* Assigned Leads */}
                              <td class="py-3 px-3 whitespace-nowrap">
                                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <i class="fa-solid fa-list-check text-[9px]"></i>
                                  <span>{assignedCount} Leads</span>
                                </span>
                              </td>

                              {/* Actions */}
                              <td class="py-3 px-3 text-center whitespace-nowrap">
                                <div class="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => { setEditingUser({ ...agent }); setUserEditSuccessMsg(''); }}
                                    class="w-7 h-7 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 flex items-center justify-center transition cursor-pointer"
                                    title="Edit User Details"
                                  >
                                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAgent(agent.id || agent.username)}
                                    class="w-7 h-7 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center transition cursor-pointer"
                                    title="Delete User Account"
                                  >
                                    <i class="fa-regular fa-trash-can text-xs"></i>
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

            </div>
          </>
        )}

      </main>

      {/* Dashboard Bottom Legal Footer Strip (Identical to Homepage Footer) */}
      <footer class="bg-white border-t border-gray-200 text-gray-700 min-h-[36px] py-1 sm:py-1.5 flex items-center mt-auto z-10 w-full overflow-hidden">
        <div class="w-full max-w-full px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-[11px] sm:text-xs gap-2 text-center sm:text-left font-medium">
          
          {/* Copyright & Legal Links grouped together on the left side */}
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] sm:text-xs text-gray-600">
            <span>© 2026 Gulmohar City. All Rights Reserved.</span>
            <span class="text-gray-300">|</span>
            <button 
              type="button"
              onClick={() => setPolicyModal({ isOpen: true, type: 'privacy' })}
              class="text-[#B30E2E] hover:text-[#8A0B22] font-semibold hover:underline transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <span class="text-gray-300">|</span>
            <button 
              type="button"
              onClick={() => setPolicyModal({ isOpen: true, type: 'disclaimer' })}
              class="text-[#B30E2E] hover:text-[#8A0B22] font-semibold hover:underline transition cursor-pointer"
            >
              Disclaimer
            </button>
          </div>

        </div>
      </footer>

      {/* Create New Agent Modal (Admin Only) */}
      {showCreateAgentModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div class="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col relative">
            
            <div class="bg-gradient-to-r from-[#B30E2E] via-[#8A0B22] to-[#590414] p-4 sm:p-5 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h3 class="font-serif font-bold text-base">Create User</h3>
              </div>
              <button 
                onClick={() => setShowCreateAgentModal(false)}
                class="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
              >
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleCreateAgentSubmit} class="p-4 sm:p-5 space-y-3.5 overflow-y-auto max-h-[calc(90vh-70px)]">
              
              {agentCreateMsg && (
                <div class="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <i class="fa-solid fa-check text-emerald-600"></i>
                  <span>{agentCreateMsg}</span>
                </div>
              )}

              {/* 1. Full Name */}
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required 
                  value={newAgentData.name}
                  onChange={(e) => setNewAgentData({ ...newAgentData, name: e.target.value })}
                  placeholder="Enter full name"
                  class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                />
              </div>

              {/* 2. Username & 3. Password */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Username *</label>
                  <input 
                    type="text" 
                    required 
                    value={newAgentData.username}
                    onChange={(e) => setNewAgentData({ ...newAgentData, username: e.target.value })}
                    placeholder="Enter username"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                  <input 
                    type="password" 
                    required 
                    value={newAgentData.password}
                    onChange={(e) => setNewAgentData({ ...newAgentData, password: e.target.value })}
                    placeholder="Enter password"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
              </div>

              {/* 4. Mobile Number & 5. Email Address */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
                  <input 
                    type="tel" 
                    required
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    value={newAgentData.phone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewAgentData({ ...newAgentData, phone: cleaned });
                    }}
                    placeholder="Enter mobile number"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    value={newAgentData.email}
                    onChange={(e) => setNewAgentData({ ...newAgentData, email: e.target.value })}
                    placeholder="Enter email address"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
              </div>

              <div class="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowCreateAgentModal(false)}
                  class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="px-5 py-2 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white text-xs font-bold flex items-center justify-center shadow cursor-pointer"
                >
                  <span>Create</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Edit User Details Modal (Admin Only) */}
      {editingUser && isAdmin && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div class="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden relative">
            
            {/* Header */}
            <div class="bg-gradient-to-r from-[#B30E2E] via-[#8A0B22] to-[#590414] p-5 text-white flex items-center justify-between">
              <div>
                <h3 class="font-serif font-bold text-base">Edit User Details</h3>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                class="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
              >
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveUserEdit} class="p-5 space-y-3.5">
              
              {userEditSuccessMsg && (
                <div class="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <i class="fa-solid fa-check text-emerald-600"></i>
                  <span>{userEditSuccessMsg}</span>
                </div>
              )}

              {/* 1. Full Name */}
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required 
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="Enter full name"
                  class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                />
              </div>

              {/* 2. Username & 3. Password */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Username *</label>
                  <input 
                    type="text" 
                    required 
                    value={editingUser.username || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    placeholder="Enter username"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                  <input 
                    type="text" 
                    required 
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    placeholder="Enter password"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
              </div>

              {/* 4. Mobile Number & 5. Email Address */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
                  <input 
                    type="tel" 
                    required
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    value={editingUser.phone || ''}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setEditingUser({ ...editingUser, phone: cleaned });
                    }}
                    placeholder="Enter mobile number"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    placeholder="Enter email address"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
              </div>

              <div class="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingUserEdit}
                  class="px-5 py-2 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white text-xs font-bold flex items-center justify-center shadow cursor-pointer"
                >
                  {savingUserEdit ? (
                    <>
                      <i class="fa-solid fa-spinner fa-spin text-xs"></i> Saving...
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
      {editingEnquiry && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div class="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden relative">
            
            {/* Header */}
            <div class="bg-gradient-to-r from-[#B30E2E] via-[#8A0B22] to-[#590414] p-5 text-white flex items-center justify-between">
              <div>
                <h3 class="font-serif font-bold text-base">Edit Enquiry</h3>
              </div>
              <button 
                onClick={() => setEditingEnquiry(null)}
                class="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveFullEdit} class="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              
              {/* Success Alert inside Modal */}
              {editModalSuccessMsg && (
                <div class="bg-emerald-100 border border-emerald-300 text-emerald-950 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm animate-fade-in">
                  <div class="flex items-center gap-2.5">
                    <div class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs flex-shrink-0">
                      <i class="fa-solid fa-check"></i>
                    </div>
                    <span class="text-xs font-bold text-emerald-900">{editModalSuccessMsg}</span>
                  </div>
                </div>
              )}

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={editingEnquiry.firstName || ''} 
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, firstName: e.target.value })}
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Last Name</label>
                  <input 
                    type="text" 
                    value={editingEnquiry.lastName || ''} 
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, lastName: e.target.value })}
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
                  <input 
                    type="tel" 
                    required 
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    value={editingEnquiry.phone || ''} 
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setEditingEnquiry({ ...editingEnquiry, phone: cleaned });
                    }}
                    disabled={!isAdmin}
                    class={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${!isAdmin ? 'bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed font-semibold' : 'border-gray-300 focus:border-[#B30E2E]'}`}
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={editingEnquiry.email || ''} 
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, email: e.target.value })}
                    disabled={!isAdmin}
                    class={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${!isAdmin ? 'bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed font-semibold' : 'border-gray-300 focus:border-[#B30E2E]'}`}
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Number of Guntha</label>
                <select 
                  value={editingEnquiry.plotsCount || '1 Guntha'} 
                  onChange={(e) => setEditingEnquiry({ ...editingEnquiry, plotsCount: e.target.value })}
                  class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                >
                  <option value="1 Guntha">1 Guntha</option>
                  <option value="2 Guntha">2 Guntha</option>
                  <option value="3 Guntha">3 Guntha</option>
                  <option value="4 Guntha">4 Guntha</option>
                  <option value="5 Guntha">5 Guntha</option>
                  <option value="6 Guntha">6 Guntha</option>
                  <option value="7 Guntha">7 Guntha</option>
                  <option value="8 Guntha">8 Guntha</option>
                  <option value="9 Guntha">9 Guntha</option>
                  <option value="10 Guntha">10 Guntha</option>
                  <option value="11+ Guntha (Bulk / Investment)">11+ Guntha (Bulk / Investment)</option>
                </select>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Site Visit Date</label>
                  <input 
                    type="date" 
                    value={editingEnquiry.visitDate || ''} 
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, visitDate: e.target.value })}
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Followup Date</label>
                  <input 
                    type="date" 
                    value={editingEnquiry.followupDate || ''} 
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, followupDate: e.target.value })}
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Status</label>
                  <select 
                    value={editingEnquiry.status || 'New'} 
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, status: e.target.value })}
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:border-[#B30E2E]"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Details Provided">Details Provided</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                    <option value="Site Visit Done">Site Visit Done</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Assigned Agent</label>
                  {isAdmin ? (
                    <select 
                      value={editingEnquiry.assignedAgentName || ''} 
                      onChange={(e) => setEditingEnquiry({ ...editingEnquiry, assignedAgentName: e.target.value })}
                      class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:border-[#B30E2E]"
                    >
                      {allAgents.map(agent => (
                        <option key={agent.id || agent.username} value={agent.name}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      disabled 
                      value={editingEnquiry.assignedAgentName || currentUser.name} 
                      class="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  )}
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Notes</label>
                <textarea 
                  rows="2"
                  value={editingEnquiry.notes || ''} 
                  onChange={(e) => setEditingEnquiry({ ...editingEnquiry, notes: e.target.value })}
                  placeholder="Enter notes"
                  class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                ></textarea>
              </div>

              <div class="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setEditingEnquiry(null)}
                  class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingEdit}
                  class="px-5 py-2 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  {savingEdit ? (
                    <>
                      <i class="fa-solid fa-spinner fa-spin"></i> Saving...
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Edit Profile Modal (Admin & Sales Agents) */}
      {showEditProfileModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div class="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col relative">
            
            {/* Header */}
            <div class="bg-gradient-to-r from-[#B30E2E] via-[#8A0B22] to-[#590414] p-4 sm:p-5 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h3 class="font-serif font-bold text-base">Edit Profile</h3>
              </div>
              <button 
                onClick={() => setShowEditProfileModal(false)}
                class="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
              >
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfileSubmit} class="p-4 sm:p-5 space-y-3.5 overflow-y-auto max-h-[calc(90vh-70px)]">
              
              {profileSaveMsg && (
                <div class="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <i class="fa-solid fa-check text-emerald-600"></i>
                  <span>{profileSaveMsg}</span>
                </div>
              )}

              {/* Agent Profile Picture Upload (Sales Agents Only) */}
              {!isAdmin && (
                <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-200/80">
                  <div class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-extrabold text-xl overflow-hidden border border-amber-300 shadow-sm flex-shrink-0">
                    {profileForm.profileImage ? (
                      <img src={profileForm.profileImage} alt="Profile Preview" class="w-full h-full object-cover" />
                    ) : (
                      <span>{(profileForm.name || 'S')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div class="flex-1">
                    <label class="block text-xs font-bold text-gray-700 mb-1">Profile Picture</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      class="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#FFF0F2] file:text-[#B30E2E] hover:file:bg-[#FCD6DC] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* 1. Full Name */}
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required 
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Enter full name"
                  class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                />
              </div>

              {/* 2. Username & 3. Password */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Username *</label>
                  <input 
                    type="text" 
                    required 
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    placeholder="Enter username"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                  <input 
                    type="password" 
                    required 
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                    placeholder="Enter password"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
              </div>

              {/* 4. Mobile Number & 5. Email Address */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
                  <input 
                    type="tel" 
                    required
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    value={profileForm.phone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setProfileForm({ ...profileForm, phone: cleaned });
                    }}
                    placeholder="Enter mobile number"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="Enter email address"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E]"
                  />
                </div>
              </div>

              <div class="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowEditProfileModal(false)}
                  class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingProfile}
                  class="px-5 py-2 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white text-xs font-bold flex items-center justify-center shadow cursor-pointer"
                >
                  {savingProfile ? (
                    <>
                      <i class="fa-solid fa-spinner fa-spin text-xs"></i> Saving...
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Create New Lead Modal (6 Homepage Fields) */}
      {showCreateLeadModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div class="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col relative">
            
            {/* Header */}
            <div class="bg-gradient-to-r from-[#B30E2E] via-[#8A0B22] to-[#590414] p-4 sm:p-5 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h3 class="font-serif font-bold text-base">New Lead</h3>
              </div>
              <button 
                onClick={() => setShowCreateLeadModal(false)}
                class="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
              >
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateLeadSubmit} class="p-4 sm:p-5 space-y-3.5 overflow-y-auto max-h-[calc(90vh-70px)]">
              
              {createLeadMsg && (
                <div class="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <i class="fa-solid fa-check text-emerald-600"></i>
                  <span>{createLeadMsg}</span>
                </div>
              )}

              {/* 1. First Name & Last Name */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={newLeadFormData.firstName}
                    onChange={(e) => setNewLeadFormData({ ...newLeadFormData, firstName: e.target.value })}
                    placeholder="Enter first name"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC]"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Last Name</label>
                  <input 
                    type="text" 
                    value={newLeadFormData.lastName}
                    onChange={(e) => setNewLeadFormData({ ...newLeadFormData, lastName: e.target.value })}
                    placeholder="Enter last name"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC]"
                  />
                </div>
              </div>

              {/* 2. Mobile Number & Email Address */}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
                  <input 
                    type="tel" 
                    required 
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    value={newLeadFormData.phone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewLeadFormData({ ...newLeadFormData, phone: cleaned });
                    }}
                    placeholder="Enter mobile number"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC]"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={newLeadFormData.email}
                    onChange={(e) => setNewLeadFormData({ ...newLeadFormData, email: e.target.value })}
                    placeholder="Enter email address"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC]"
                  />
                </div>
              </div>

              {/* 3. Number of Guntha */}
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Number of Guntha</label>
                <select 
                  value={newLeadFormData.plotsCount}
                  onChange={(e) => setNewLeadFormData({ ...newLeadFormData, plotsCount: e.target.value })}
                  class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-gray-800"
                >
                  <option value="1 Guntha">1 Guntha</option>
                  <option value="2 Guntha">2 Guntha</option>
                  <option value="3 Guntha">3 Guntha</option>
                  <option value="4 Guntha">4 Guntha</option>
                  <option value="5 Guntha">5 Guntha</option>
                  <option value="6 Guntha">6 Guntha</option>
                  <option value="7 Guntha">7 Guntha</option>
                  <option value="8 Guntha">8 Guntha</option>
                  <option value="9 Guntha">9 Guntha</option>
                  <option value="10 Guntha">10 Guntha</option>
                  <option value="11+ Guntha (Bulk / Investment)">11+ Guntha (Bulk / Investment)</option>
                </select>
              </div>

              {/* 4. Followup Date */}
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Followup Date</label>
                <input 
                  type="date" 
                  value={newLeadFormData.followupDate || ''}
                  onChange={(e) => setNewLeadFormData({ ...newLeadFormData, followupDate: e.target.value })}
                  class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] text-gray-800"
                />
              </div>

              {/* 4. Notes */}
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Notes</label>
                <textarea 
                  rows="2"
                  value={newLeadFormData.notes || ''}
                  onChange={(e) => setNewLeadFormData({ ...newLeadFormData, notes: e.target.value })}
                  placeholder="Enter notes"
                  class="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC]"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div class="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowCreateLeadModal(false)}
                  class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingLead}
                  class="px-5 py-2 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  {submittingLead ? (
                    <>
                      <i class="fa-solid fa-spinner fa-spin text-xs"></i>
                      <span>Saving Lead...</span>
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

      {/* Small Floating Lead Note Popover with History Timeline & Quick Add (Gulmohar Maroon & White Theme) */}
      {activeNotePopover && (
        <>
          <div class="fixed inset-0 z-40" onClick={() => setActiveNotePopover(null)}></div>
          <div 
            style={{ 
              top: `${activeNotePopover.top}px`, 
              left: `${activeNotePopover.left}px`,
              transform: activeNotePopover.positionAbove ? 'translateY(-100%)' : 'none'
            }}
            class="fixed w-84 max-w-[340px] h-[520px] max-h-[calc(100vh-120px)] flex flex-col bg-white rounded-2xl shadow-2xl z-50 text-left border border-rose-100 overflow-hidden animate-fade-in pointer-events-auto"
          >
            {/* Header: Gulmohar Maroon Gradient */}
            <div class="bg-gradient-to-r from-[#B30E2E] via-[#8A0B22] to-[#590414] px-3.5 py-2.5 text-white flex items-center justify-between flex-shrink-0">
              <span class="flex items-center gap-2 text-xs font-bold text-amber-300">
                <i class="fa-solid fa-note-sticky text-amber-300 text-xs"></i>
                <span>Lead Note & Activity</span>
              </span>
              <button 
                type="button"
                onClick={() => setActiveNotePopover(null)}
                class="text-white/80 hover:text-white w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
              >
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            {/* Note Content Body: Timeline List of Notes (Custom Scrollbar when notes exceed height) */}
            <div class="flex-1 p-3 bg-[#FFFDFD] overflow-y-scroll custom-scrollbar space-y-2.5 [scrollbar-gutter:stable]">
              {(() => {
                const targetLead = activeNotePopover.item;
                
                // Chronological note history logs (oldest first)
                const chronologicalNoteLogs = (targetLead.history || [])
                  .filter(h => (h.fieldName || '').toLowerCase() === 'notes' || (h.fieldName || '').toLowerCase() === 'note')
                  .slice();

                const timeline = [];

                // 1. Check if the very first edit log has an oldValue that was the initial note
                if (chronologicalNoteLogs.length > 0) {
                  const firstOldVal = (chronologicalNoteLogs[0].oldValue || '').trim();
                  if (firstOldVal && firstOldVal !== '—') {
                    timeline.push({
                      _id: 'initial-oldval-note',
                      content: firstOldVal,
                      modifiedBy: 'Admin',
                      modifiedDate: targetLead.createdAt ? new Date(targetLead.createdAt) : null
                    });
                  }
                  
                  // Add all history log new values
                  chronologicalNoteLogs.forEach(log => {
                    if (log.newValue && log.newValue.trim() && log.newValue !== '—') {
                      timeline.push({
                        _id: log._id,
                        content: log.newValue.trim(),
                        modifiedBy: log.modifiedBy || 'Admin',
                        modifiedDate: log.modifiedDate ? new Date(log.modifiedDate) : null
                      });
                    }
                  });
                } else if (targetLead.notes && targetLead.notes.trim() !== '' && targetLead.notes.trim() !== '—') {
                  // No history log yet, but targetLead.notes exists
                  timeline.push({
                    _id: 'initial-lead-notes',
                    content: targetLead.notes.trim(),
                    modifiedBy: 'Admin',
                    modifiedDate: targetLead.createdAt ? new Date(targetLead.createdAt) : null
                  });
                }

                // Show newest note at top, oldest initial note at bottom
                const sortedTimeline = timeline.reverse();

                if (sortedTimeline.length > 0) {
                  return sortedTimeline.map((log, nIdx) => {
                    const nDate = log.modifiedDate ? new Date(log.modifiedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                    const nTime = log.modifiedDate ? new Date(log.modifiedDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

                    return (
                      <div key={log._id || nIdx} class="p-2.5 rounded-xl bg-white border border-rose-200/80 text-xs text-slate-800 space-y-1.5 shadow-2xs">
                        <div class="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                          <span class="flex items-center gap-1 font-mono text-slate-600 font-semibold">
                            <i class="fa-regular fa-clock text-[9.5px] text-[#B30E2E]"></i>
                            <span>{nDate ? `${nDate}${nTime ? `, ${nTime}` : ''}` : 'Initial Note'}</span>
                          </span>
                          <span class="px-1.5 py-0.5 rounded-md bg-rose-50 text-[#B30E2E] font-bold text-[9.5px] border border-rose-100">
                            {log.modifiedBy}
                          </span>
                        </div>
                        <p class="text-[11.5px] font-medium leading-relaxed break-words break-all text-slate-800 pt-0.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                          {log.content}
                        </p>
                      </div>
                    );
                  });
                } else {
                  return (
                    <div class="my-auto text-center py-6 px-2 space-y-2">
                      <div class="w-10 h-10 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center mx-auto text-amber-600">
                        <i class="fa-regular fa-note-sticky text-base"></i>
                      </div>
                      <h4 class="text-xs font-bold text-gray-800">No Note Added Yet</h4>
                      <p class="text-[10.5px] text-gray-400 leading-normal">
                        Add a new note description below. It will save to MongoDB Atlas and appear in history.
                      </p>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Bottom Quick Add Note Field */}
            <div class="p-2.5 bg-gray-50 border-t border-gray-200/80 flex flex-col gap-1.5 flex-shrink-0">
              <span class="text-[10.5px] font-bold text-gray-700 flex items-center gap-1">
                <i class="fa-solid fa-pen text-[9.5px] text-[#B30E2E]"></i>
                <span>Add Note Description:</span>
              </span>
              <div class="flex items-center gap-1.5">
                <input 
                  type="text"
                  value={popoverNoteInput}
                  onChange={(e) => setPopoverNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSavePopoverNote(activeNotePopover.item._id || activeNotePopover.item.id);
                    }
                  }}
                  placeholder="Type note description..."
                  class="flex-1 px-2.5 py-1.5 text-xs bg-white rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] font-medium shadow-2xs"
                />
                <button 
                  type="button"
                  disabled={savingPopoverNote || !popoverNoteInput.trim()}
                  onClick={() => handleSavePopoverNote(activeNotePopover.item._id || activeNotePopover.item.id)}
                  class="px-3 py-1.5 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] disabled:opacity-50 text-white text-xs font-bold transition shadow cursor-pointer flex-shrink-0 flex items-center justify-center"
                >
                  {savingPopoverNote ? (
                    <i class="fa-solid fa-spinner fa-spin text-xs"></i>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </>
      )}

      {/* Column Configuration Modal (Show/Hide & Drag-Drop Reorder) */}
      {showColumnConfigModal && (
        <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div class="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            {/* Modal Header */}
            <div class="px-5 py-3.5 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
              <h3 class="font-bold text-slate-800 text-sm sm:text-base">Table Columns</h3>
              <div class="flex items-center gap-2">
                <button
                  onClick={resetColumnConfig}
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                  title="Reset to default columns"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowColumnConfigModal(false)}
                  class="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition cursor-pointer"
                >
                  <i class="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>
            </div>

            {/* Columns List with Drag & Drop + Arrows + Checkbox */}
            <div class="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-2">
              {columnConfig.map((col, idx) => (
                <div
                  key={col.id}
                  draggable
                  onDragStart={() => setDraggedColumnIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedColumnIndex !== null && draggedColumnIndex !== idx) {
                      moveColumn(draggedColumnIndex, idx);
                      setDraggedColumnIndex(null);
                    }
                  }}
                  class={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                    col.visible ? 'bg-white border-gray-200 hover:border-purple-300' : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div class="flex items-center gap-3">
                    <span class="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 px-1">
                      <i class="fa-solid fa-grip-vertical text-xs"></i>
                    </span>
                    <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 select-none">
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumnVisibility(col.id)}
                        class="w-4 h-4 rounded text-[#B30E2E] focus:ring-[#B30E2E] cursor-pointer accent-[#B30E2E]"
                      />
                      <span>{col.label}</span>
                    </label>
                  </div>

                  <div class="flex items-center gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveColumn(idx, idx - 1)}
                      class="w-6 h-6 rounded-md bg-slate-100 hover:bg-purple-100 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-600 hover:text-purple-700 flex items-center justify-center text-[10px] transition cursor-pointer"
                      title="Move Up"
                    >
                      <i class="fa-solid fa-arrow-up"></i>
                    </button>
                    <button
                      disabled={idx === columnConfig.length - 1}
                      onClick={() => moveColumn(idx, idx + 1)}
                      class="w-6 h-6 rounded-md bg-slate-100 hover:bg-purple-100 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-600 hover:text-purple-700 flex items-center justify-center text-[10px] transition cursor-pointer"
                      title="Move Down"
                    >
                      <i class="fa-solid fa-arrow-down"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div class="px-5 py-3 bg-slate-50 border-t border-gray-200 flex items-center justify-end">
              <button
                onClick={() => setShowColumnConfigModal(false)}
                class="px-4 py-1.5 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B2E] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy & Disclaimer Terms Modal */}
      <PolicyModal 
        isOpen={policyModal.isOpen}
        type={policyModal.type}
        onClose={() => setPolicyModal({ ...policyModal, isOpen: false })}
      />

    </div>
  );
}

