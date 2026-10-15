// Values come from site/.env (local) or site/.env.production (build). Vite only exposes VITE_ variables.
// VITE_API_URL = HouseDeal CRM address the contact form posts to. Empty = same origin (Vite dev proxy locally).
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || '917447212121';
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'housedealofficial@gmail.com';
export const WHATSAPP_URL = (text) => `https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent(text)}`;
export const CONTACT_PHONE_DISPLAY = import.meta.env.VITE_CONTACT_PHONE_DISPLAY || '+91 7447 212121';
export const GOOGLE_MAPS_URL = import.meta.env.VITE_GOOGLE_MAPS_URL || 'https://www.google.com/maps/search/?api=1&query=Malthan+Phata+Road,+Shikrapur,+Maharashtra';

// HouseDeal CRM login page, linked from the navbar "Employee Login" icon (hidden when empty)
export const CRM_URL = import.meta.env.VITE_CRM_URL || '';
