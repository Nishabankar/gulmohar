# crm/ — HouseDeal CRM (dashboard + API)

One Hostinger Node.js app: Express API in `server/` + React dashboard in `src/` (Express serves the built dashboard from `dist/`). Will serve several property sites (projects); Gulmohar City is the first.

## Layout
- `server.cjs`: Hostinger entry. Builds the dashboard if `dist/` is missing, then starts `server/server.js`.
- `server/`: Express + MySQL (CommonJS, see `server/package.json`). Routes in `server/routes/`, DB in `server/config/db.js`.
- `src/`: dashboard (`App.jsx` = login screen → `AdminDashboard`).
- `server/schema.sql`: tables `users`, `leads`, `lead_history`, `user_column_preferences`.
- `samples/`: example CSV files for the lead import.

## Rules
- Only sales users (role `SalesExecutive`, legacy `Agent`) are assigned leads; SuperAdmin/Admin never get leads. SuperAdmin is global.
- Lead priority is `Hot` / `Cold` (`server/utils/leadOptions.js`); every new lead starts as `Hot`.
- Avoid new Gulmohar-specific hardcoding; site-specific values will become per-project settings.
- Production DB is live: never run destructive SQL without explicit approval.
- Never import from `../site/`.

## Env
| File | Used by | Committed |
|---|---|---|
| `.env` | local dev (`npm run server`, `npm run dev`) | no |
| `.env.hostinger` | import into Hostinger Node app env vars | **no** (secrets) |
| `.env.example` | template with all keys | yes |

Server keys: `NODE_ENV PORT DB_* JWT_SECRET JWT_EXPIRES_IN ADMIN_* CORS_ORIGIN SERVE_FRONTEND SMTP_*`. Dashboard key: `VITE_SITE_URL`.
`CORS_ORIGIN` must list every site that posts leads (e.g. `https://gulmoharcity.in,https://www.gulmoharcity.in`).

## Commands
- `npm run server`: API on :5000 · `npm run dev`: dashboard on :5174 (proxies `/api`)
- Deploy zip: from repo root `npm run package:crm` → `housedeal-crm.zip` (source only; Hostinger runs `npm install` + builds)
