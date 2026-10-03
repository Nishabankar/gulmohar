// Values come from the root .env (Vite only exposes variables prefixed with VITE_)
// Empty API URL means "same origin": the Vite dev proxy locally, or Express serving the build in production
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || '917447212121';
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'housedealofficial@gmail.com';
export const WHATSAPP_URL = (text) => `https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent(text)}`;
export const CONTACT_PHONE_DISPLAY = import.meta.env.VITE_CONTACT_PHONE_DISPLAY || '+91 7447 212121';
export const GOOGLE_MAPS_URL = import.meta.env.VITE_GOOGLE_MAPS_URL || 'https://www.google.com/maps/search/?api=1&query=Malthan+Phata+Road,+Shikrapur,+Maharashtra';
