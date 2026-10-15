// Values come from crm/.env (Vite only exposes variables prefixed with VITE_)
// Empty API URL means "same origin": the Vite dev proxy locally, or Express serving the build in production
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Public website opened from the dashboard logo (optional)
export const SITE_URL = import.meta.env.VITE_SITE_URL || '';
