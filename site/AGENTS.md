# site/ — Gulmohar City public website

Static React + Vite site. Deployed as plain files to Hostinger `public_html` (no Node, no database).

## Rules
- No admin/dashboard/login code here. That lives in `../crm/`. The navbar "Employee Login" icon just links to `VITE_CRM_URL`.
- Leads go to the CRM API only: `ContactForm.jsx` → `POST ${VITE_API_URL}/api/enquiries`.
- Never put secrets in env files here. Everything in `VITE_*` ends up public in the browser bundle.
- Never import from `../crm/`.

## Env
| File | Used by | Committed |
|---|---|---|
| `.env` | `npm run dev` (local) | no |
| `.env.production` | `npm run package` (build for Hostinger) | yes (public values only) |
| `.env.example` | template | yes |

Keys: `VITE_API_URL` (CRM address, required for production), `VITE_CRM_URL` (login link, empty hides it), `VITE_CONTACT_PHONE`, `VITE_CONTACT_PHONE_DISPLAY`, `VITE_CONTACT_EMAIL`.

## Commands
- `npm run dev`: local dev on :5173, `/api` proxied to the CRM API on :5000
- `npm run package`: builds with `.env.production` and writes `../gulmohar-site.zip` (contains built `dist/`, incl. `.htaccess`)
