# Repo map (read first)

This repo holds **two separate apps**. Work only inside the folder for the app you are changing.

| Folder | App | Hosted as | Domain |
|---|---|---|---|
| `site/` | Gulmohar City public website (React + Vite) | **Static** files on Hostinger (`public_html`) | gulmoharcity.in |
| `crm/` | HouseDeal CRM: lead dashboard (React + Vite) + API (`crm/server/`, Express + MySQL) | Hostinger **Node.js app** | CRM subdomain (not final) |

Each folder has its own `AGENTS.md`, `package.json` and env files. Read the folder's `AGENTS.md` before editing.

## Hard rules
- `site/` must never import from `crm/` (and the reverse). They are built and deployed separately.
- The site has no database access and no secrets. It sends leads to the CRM API only (`POST /api/enquiries`).
- Only `crm/server/` talks to MySQL.
- Never commit real env values. `.env`, `.env.hostinger` are gitignored; only `*.example` and `site/.env.production` (public, no secrets) are committed.

## Local development
```bash
npm run install:all   # installs site/ and crm/
npm run dev:api       # CRM API on http://localhost:5000 (uses crm/.env)
npm run dev:crm       # CRM dashboard on http://localhost:5174
npm run dev:site      # website on http://localhost:5173 (contact form → API on :5000)
```

## Deploy (zip mode, works on Windows)
Push to GitHub first, then:

| App | Command | Output | Upload to |
|---|---|---|---|
| CRM | `npm run package:crm` | `housedeal-crm.zip` (source only, built on Hostinger, no `dist/`) | Hostinger Node.js app, entry file `server.cjs`; import `crm/.env.hostinger` as environment variables |
| Site | `npm run package:site` | `gulmohar-site.zip` (**built** `site/dist`, static hosting cannot build) | File Manager → `public_html` → extract |

- `package:site` refuses to run until `VITE_API_URL` (the CRM address) is set in `site/.env.production`.
- After changing the CRM domain, also update `CORS_ORIGIN` in the CRM env and `VITE_API_URL` / `VITE_CRM_URL` in `site/.env.production`.
