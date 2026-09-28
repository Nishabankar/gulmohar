# Gulmohar City Real Estate Platform - Architecture & Structure Guide

This document provides a deep, comprehensive overview of the **Gulmohar City Real Estate** project architecture, detailing the **Frontend**, **Backend**, **Database Schemas**, and the **End-to-End Connectivity & Data Flow**.

---

## 📑 Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Directory Tree Structure](#2-directory-tree-structure)
3. [Frontend Architecture (`/src`)](#3-frontend-architecture-src)
4. [Backend Architecture (`/server`)](#4-backend-architecture-server)
5. [Database Architecture (`MongoDB & Mongoose`)](#5-database-architecture-mongodb--mongoose)
6. [End-to-End Connectivity & Data Flow](#6-end-to-end-connectivity--data-flow)
   - [Enquiry Submission Flow (Public User)](#a-enquiry-submission-flow-public-user)
   - [Admin Authentication & JWT Session Flow](#b-admin-authentication--jwt-session-flow)
   - [Lead CRM & Agent Assignment Flow](#c-lead-crm--agent-assignment-flow)
7. [Offline Fallback & Resilience Strategy](#7-offline-fallback--resilience-strategy)
8. [Environment Setup & API Endpoints](#8-environment-setup--api-endpoints)

---

## 1. System Architecture Overview

The application follows a full-stack **MERN-style (MongoDB, Express.js, React.js, Node.js)** architecture, designed with high reliability, dynamic lead distribution (Round-Robin sales assignment), role-based CRM capabilities, and graceful offline fallback mechanisms.

```
+-------------------------------------------------------------------------------+
|                               FRONTEND (Vite + React 18)                      |
|                                                                               |
|   +-------------------+    +--------------------+    +--------------------+   |
|   |   Public Website  |    | Lightbox & Modals  |    |  Admin CRM Portal  |   |
|   |  (Landings/Plots) |    |  (MasterPlan/Plot) |    | (Dashboard/Agents) |   |
|   +---------+---------+    +---------+----------+    +---------+----------+   |
+-------------|------------------------|-------------------------|--------------+
              |                        |                         |
              | POST /api/enquiries    |                         | Bearer Token API
              v                        v                         v
+-------------------------------------------------------------------------------+
|                               BACKEND (Node.js + Express.js)                  |
|                                                                               |
|   +-------------------+    +--------------------+    +--------------------+   |
|   | Express Middleware|    | Auth Middleware    |    |  Storage Fallback  |   |
|   | (CORS, JSON Parser)|   | (JWT Verification) |    | (In-Memory Sync)   |   |
|   +---------+---------+    +---------+----------+    +---------+----------+   |
|             |                        |                         |              |
|             +------------------------+-------------------------+              |
|                                      |                                        |
|   +----------------------------------+------------------------------------+   |
|   |  Routes: /api/enquiries (Public) | /api/admin (Protected CRM APIs)   |   |
|   +----------------------------------+------------------------------------+   |
+--------------------------------------|----------------------------------------+
                                       |
                                       | Mongoose ODM (MongoDB Driver)
                                       v
+-------------------------------------------------------------------------------+
|                             DATABASE (MongoDB 6.0+)                           |
|                                                                               |
|   +----------------------------------+------------------------------------+   |
|   |  Collection: `enquiries`         | Collection: `admins`               |   |
|   |  (Customer Leads & Status)       | (SuperAdmin, Managers, Sales)      |   |
|   +----------------------------------+------------------------------------+   |
+-------------------------------------------------------------------------------+
```

---

## 2. Directory Tree Structure

```
gulmohar-city-react/
│
├── index.html                  # HTML entry point (SEO metadata, FontAwesome, Google Fonts)
├── package.json                # Frontend dependencies (React 18, Vite, TailwindCSS)
├── postcss.config.js           # PostCSS configuration for Tailwind integration
├── tailwind.config.js          # Tailwind CSS design system tokens (Custom colors, fonts)
├── vite.config.js              # Vite build tool setup & dev server config
│
├── public/                     # Static media assets, icons, plot maps
│
├── src/                        # React Frontend Source Code
│   ├── main.jsx                # React app DOM mount entry point
│   ├── App.jsx                 # Master application controller, state & view router
│   ├── index.css               # Global Tailwind CSS directives & custom styling
│   │
│   └── components/             # Modular UI Components
│       ├── Navbar.jsx          # Top navigation bar, mobile drawer & admin trigger
│       ├── HeroBanner.jsx      # High-impact promotional hero section
│       ├── About.jsx           # Project highlights & developer credibility
│       ├── MasterPlan.jsx      # Interactive plot map layout & selector
│       ├── LocationSection.jsx # Connectivity map & nearby landmarks
│       ├── Gallery.jsx         # Site photography & video gallery
│       ├── FAQSection.jsx      # Frequently asked questions accordion
│       ├── ContactForm.jsx     # Enquiry form with validation & API submission
│       ├── PoweredBySlider.jsx # Partner logos & developer branding ticker
│       ├── Footer.jsx          # Site footer, quick links & disclaimer modal launcher
│       ├── WhatsAppButton.jsx  # Floating WhatsApp direct click-to-chat button
│       ├── LightboxModal.jsx   # Fullscreen media modal for plot maps & images
│       ├── PolicyModal.jsx     # Terms, Privacy Policy & Disclaimer modal
│       ├── AdminLogin.jsx      # Modal dialog for Admin authentication
│       └── AdminDashboard.jsx  # Lead CRM dashboard, metrics, table & agent portal
│
└── server/                     # Node.js + Express Backend Source Code
    ├── server.js               # Server initialization, MongoDB connect & route registry
    ├── package.json            # Backend dependencies (Express, Mongoose, JWT, Bcryptjs)
    ├── .env                    # Environment variables (PORT, MONGO_URI, JWT_SECRET)
    │
    ├── config/
    │   └── db.js               # MongoDB Mongoose connection handler with retry logic
    │
    ├── middleware/
    │   └── authMiddleware.js   # JWT authentication verification middleware
    │
    ├── models/                 # Mongoose Database Data Models
    │   ├── Enquiry.js          # Lead/Enquiry schema definition
    │   └── Admin.js            # Admin & Sales Agent user account schema
    │
    ├── routes/                 # Express API Endpoint Controllers
    │   ├── enquiryRoutes.js    # Public lead creation & Round-Robin agent assignment
    │   └── adminRoutes.js      # Admin authentication, lead CRM & agent management
    │
    └── services/
        └── storageService.js   # Hybrid storage layer (MongoDB primary + In-Memory fallback)
```

---

## 3. Frontend Architecture (`/src`)

The frontend is built using **React 18** and **Vite**, styled using **Tailwind CSS** for responsive, mobile-first performance.

### Key Components & Responsibilities

1. **`App.jsx` (Central Orchestrator)**:
   - Manages state for Lightbox modals, Policy modals, and selected plots.
   - Manages **Admin Session State**: Checks `localStorage.getItem('adminToken')` and toggles between the **Public Website View** and **Admin Dashboard View**.
   - Handles login/logout events cleanly.

2. **`ContactForm.jsx` (Lead Capture Engine)**:
   - Collects user inputs (`firstName`, `lastName`, `phone`, `email`, `plotsCount`, `visitDate`, `plotInfo`).
   - Performs mobile number regex validation (`^[6-9]\d{9}$`).
   - Submits payloads to `POST http://localhost:5000/api/enquiries`.
   - Contains automatic client-side fallback: If backend server is unreachable, saves lead to `localStorage` key `localEnquiriesCache` so no lead is ever lost.

3. **`AdminDashboard.jsx` (CRM & Lead Management System)**:
   - Features real-time statistics counters (Total Leads, New Leads, Scheduled Visits, Closed Deals).
   - Provides search, status filtering (`New`, `Contacted`, `Interested`, `Site Visit Scheduled`, `Closed`), and full edit capabilities.
   - Includes **Sales Agent Management**: Admin can create agents, assign leads manually or rely on backend dynamic auto-assignment.

4. **`MasterPlan.jsx` & `Gallery.jsx`**:
   - Interactive plot layout allowing users to select specific plots (e.g., Plot #12 - 1200 Sq.Ft) which pre-fills `ContactForm.jsx`.

---

## 4. Backend Architecture (`/server`)

The backend is built with **Node.js** and **Express.js**, adhering to RESTful API conventions and clean separation of concerns.

### Key Architectural Files

1. **`server/server.js`**:
   - Entry point for the server application.
   - Initializes Express middleware (`cors()`, `express.json()`).
   - Connects to MongoDB via `connectDB()`.
   - Executes `seedAdminUser()`: Automatically seeds a default SuperAdmin user (`username='admin'`, `password='admin123'`) into MongoDB if no admin accounts exist.
   - Binds route endpoints: `/api/enquiries` and `/api/admin`.

2. **`server/middleware/authMiddleware.js`**:
   - Intercepts requests to protected admin routes (`/api/admin/enquiries`, `/api/admin/agents`, etc.).
   - Extracts `Bearer <token>` from HTTP `Authorization` header.
   - Decodes and verifies JWT signature using `process.env.JWT_SECRET`.
   - Attaches decoded admin identity to `req.admin` or responds with HTTP `401 Unauthorized`.

---

## 5. Database Architecture (`MongoDB & Mongoose`)

Database connectivity is managed using **Mongoose ORM**, providing schema validation, type safety, and lifecycle hooks.

### Database Connection Configuration (`server/config/db.js`)

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gulmohar_city_db';
  try {
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
  }
};
```

---

### Data Models & Schemas

#### A. Enquiry Schema (`server/models/Enquiry.js`)

Stores customer lead submissions, plot interests, visit schedules, and CRM assignment status.

| Field Name | Type | Validation / Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated by MongoDB | Primary Key | Unique document identifier |
| `firstName` | String | Required, Trimmed | N/A | Customer first name |
| `lastName` | String | Trimmed | `""` | Customer last name |
| `phone` | String | Required, Trimmed | N/A | 10-digit mobile number |
| `email` | String | Trimmed | `""` | Customer email address |
| `plotInfo` | String | String | `""` | Selected plot number & price info |
| `plotsCount` | String | String | `"1 Plot"` | Area interest (e.g., "1 Guntha", "2 Guntha") |
| `visitDate` | String | String | `""` | Preferred site visit date |
| `status` | String | Enum: `['New', 'Contacted', 'Interested', 'Site Visit Scheduled', 'Closed']` | `"New"` | Current CRM pipeline state |
| `notes` | String | String | `""` | Agent notes / call logs |
| `assignedAgentName` | String | String | `""` | Name of assigned Sales Agent |
| `assignedTo` | String | String / ObjectId | `""` | Foreign Key reference to Admin/Agent |
| `createdAt` | Date | Timestamp | `now` | Lead creation time |
| `updatedAt` | Date | Timestamp | `now` | Last update time |

#### B. Admin Schema (`server/models/Admin.js`)

Stores credentials and roles for system admins and sales team members.

| Field Name | Type | Validation / Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated by MongoDB | Primary Key | Unique document identifier |
| `name` | String | Trimmed | `""` | Full name of admin/agent |
| `username` | String | Required, Unique, Lowercase, Trimmed | N/A | Login username |
| `email` | String | Lowercase, Trimmed | `""` | Email address |
| `phone` | String | Trimmed | `""` | Agent phone number |
| `password` | String | Required | N/A | Hashed password (Bcrypt salt factor 10) |
| `role` | String | Enum: `['SuperAdmin', 'Manager', 'Agent', 'Admin']` | `"Agent"` | Access control role |
| `createdAt` | Date | Timestamp | `now` | Account creation timestamp |
| `updatedAt` | Date | Timestamp | `now` | Account modification timestamp |

---

## 6. End-to-End Connectivity & Data Flow

### A. Enquiry Submission Flow (Public User)

```
[ User Action ] -> Fills ContactForm.jsx & Clicks "Submit Enquiry"
        │
        ▼
[ Client Validation ] -> Validates 10-digit Phone Number format
        │
        ▼
[ HTTP Request ] -> POST http://localhost:5000/api/enquiries
                    Payload: { firstName, lastName, phone, email, plotInfo, plotsCount, visitDate }
        │
        ▼
[ Backend Express Route ] -> router.post('/', enquiryRoutes.js)
        │
        ├─> Reads Active Agents from MongoDB: Admin.find({ role: 'Agent' })
        ├─> Dynamic Round-Robin Assignment: (TotalEnquiries % ActiveAgentsCount)
        └─> Inserts record into MongoDB: Enquiry.create(payload)
        │
        ▼
[ Database Persistence ] -> Saved into `gulmohar_city_db.enquiries` collection
        │
        ▼
[ HTTP Response ] -> 201 Created `{ success: true, message: 'Enquiry saved directly in MongoDB!' }`
        │
        ▼
[ Client UI Update ] -> ContactForm resets input fields & displays green success banner
```

---

### B. Admin Authentication & JWT Session Flow

```
[ Admin Action ] -> Enters Username & Password in AdminLogin.jsx
        │
        ▼
[ HTTP Request ] -> POST http://localhost:5000/api/admin/login
                    Payload: { username, password }
        │
        ▼
[ Backend Auth Route ] -> router.post('/login', adminRoutes.js)
        │
        ├─> Searches MongoDB Admin collection: Admin.findOne({ username })
        ├─> Compares Hash: bcrypt.compare(password, admin.password)
        └─> Generates JWT Token: jwt.sign({ id, username, role }, JWT_SECRET, { expiresIn: '24h' })
        │
        ▼
[ HTTP Response ] -> 200 OK `{ success: true, token: 'eyJhbG...', admin: {...} }`
        │
        ▼
[ Client Persistence ] -> Stores in localStorage:
                            localStorage.setItem('adminToken', token);
                            localStorage.setItem('adminView', 'dashboard');
        │
        ▼
[ UI Switch ] -> App.jsx renders <AdminDashboard /> with protected view
```

---

### C. Lead CRM & Agent Assignment Flow

```
[ Admin Dashboard ] -> Calls GET http://localhost:5000/api/admin/enquiries
                       Header: Authorization: Bearer <adminToken>
        │
        ▼
[ Middleware Guard ] -> protectAdmin (authMiddleware.js) verifies JWT validity
        │
        ▼
[ Express Handler ] -> Queries MongoDB Enquiry.find(query).sort({ createdAt: -1 })
        │
        ▼
[ React CRM UI ] -> Renders interactive data table, metric cards, status badges
        │
        ▼
[ Lead Status Update ] -> Admin changes status to "Site Visit Scheduled"
        │
        ▼
[ HTTP Request ] -> PATCH http://localhost:5000/api/admin/enquiries/:id
                    Payload: { status: 'Site Visit Scheduled', notes: 'Client visiting Saturday' }
        │
        ▼
[ MongoDB Update ] -> Enquiry.findByIdAndUpdate(id, { $set: updateFields })
        │
        ▼
[ Real-time Sync ] -> State updates across Dashboard analytics cards & lead listing
```

---

## 7. Offline Fallback & Resilience Strategy

To guarantee zero data loss during network outages or database maintenance, the platform implements a **Dual-Layer Fallback Architecture**:

1. **Client-Side Storage Fallback (`ContactForm.jsx`)**:
   - If `fetch('http://localhost:5000/api/enquiries')` fails due to network downtime, the catch block intercepts the payload and caches it directly into `localStorage.getItem('localEnquiriesCache')`.
   - The user receives an immediate positive confirmation without error interruption.

2. **Server-Side In-Memory Service Fallback (`storageService.js`)**:
   - The backend checks `mongoose.connection.readyState === 1`.
   - If MongoDB disconnects temporarily, `storageService.js` routes operations to an internal in-memory array structure, maintaining seamless HTTP API availability.

---

## 8. Environment Setup & API Endpoints

### Server Environment File (`server/.env`)

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/gulmohar_city_db
JWT_SECRET=gulmohar_city_super_secret_jwt_key_2026
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Complete API Endpoint Registry

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Public | Health Check & API endpoint status |
| **POST** | `/api/enquiries` | Public | Submit new customer enquiry (Round-Robin agent assignment) |
| **POST** | `/api/admin/login` | Public | Authenticate admin/agent & receive JWT bearer token |
| **GET** | `/api/admin/verify` | Protected | Validate active JWT session token |
| **GET** | `/api/admin/enquiries` | Protected | Fetch all leads (Supports search & status filter) |
| **GET** | `/api/admin/stats` | Protected | Aggregate analytics summary (Total, New, Visited, Closed) |
| **PATCH** | `/api/admin/enquiries/:id` | Protected | Update lead fields, status, notes, or assigned agent |
| **DELETE** | `/api/admin/enquiries/:id` | Protected | Remove enquiry record from MongoDB |
| **GET** | `/api/admin/agents` | Protected | Fetch list of registered Sales Agents |
| **POST** | `/api/admin/agents` | Protected | Create new Sales Agent account in MongoDB |
| **PATCH** | `/api/admin/agents/:id` | Protected | Update agent credentials/info in MongoDB |
| **DELETE** | `/api/admin/agents/:id` | Protected | Remove Sales Agent from MongoDB database |

---
*Documented for Gulmohar City Real Estate Platform.*
