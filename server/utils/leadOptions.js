// Allowed lead statuses / priorities (must match STATUS_OPTIONS / PRIORITY_OPTIONS in AdminDashboard.jsx)
const STATUS_OPTIONS = ['New', 'Contacted', 'Interested', 'Details Provided', 'Not Interested', 'Site Visit Scheduled', 'Site Visit Done', 'Won', 'Lost', 'Closed'];
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];

// Case/spacing-insensitive match: "site visit scheduled" -> "Site Visit Scheduled", "HIGH" -> "High"
const matchOption = (value, options) => {
  const key = (value || '').toString().toLowerCase().replace(/[^a-z]/g, '');
  return options.find(o => o.toLowerCase().replace(/[^a-z]/g, '') === key) || null;
};

module.exports = { STATUS_OPTIONS, PRIORITY_OPTIONS, matchOption };
