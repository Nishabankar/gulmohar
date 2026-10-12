// Allowed lead statuses / priorities (must match STATUS_OPTIONS / PRIORITY_OPTIONS in AdminDashboard.jsx)
const STATUS_OPTIONS = ['New', 'Contacted', 'Interested', 'Details Provided', 'Not Interested', 'Site Visit Scheduled', 'Site Visit Done', 'Won', 'Lost', 'Closed'];
const PRIORITY_OPTIONS = ['Hot', 'Cold'];

// Case/spacing-insensitive match with backward-compatibility for legacy High/Medium/Low
const matchOption = (value, options) => {
  const key = (value || '').toString().toLowerCase().replace(/[^a-z]/g, '');
  if (options === PRIORITY_OPTIONS) {
    if (key === 'cold' || key === 'low') return 'Cold';
    if (key === 'hot' || key === 'high' || key === 'medium') return 'Hot';
  }
  return options.find(o => o.toLowerCase().replace(/[^a-z]/g, '') === key) || null;
};

module.exports = { STATUS_OPTIONS, PRIORITY_OPTIONS, matchOption };
