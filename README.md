# DataTime Machine

## Overview

**DataTime Machine** is a full-stack, hackathon-ready analytics platform that treats real-time time series data as version-controlled "commits." It ingests live data from external APIs, captures regular snapshots, detects large shifts, generates event records, and visualizes everything in a premium dark-mode interface.

This repository contains two core applications:
- `BACKEND/` — Node.js + Express + MongoDB REST API, scheduled data polling, analytics, event generation, and auth.
- `FRONTEND/` — React + Vite + Tailwind CSS dashboard, charting, geospatial visualization, login/signup flows, and AI-enabled event interaction.

## Team

- **Rishab** — Frontend lead
- **Vineet** — Backend lead

## URLs

- **Frontend (deployed)**: `https://pixel-pwnz.vercel.app/`
- **Frontend (local dev)**: `http://localhost:5173`
- **Backend (local dev)**: `http://localhost:5000`

## Tech Stack

- Backend: `Node.js`, `Express`, `MongoDB`, `Mongoose`, `Axios`, `node-cron`, `dotenv`
- Frontend: `React`, `Vite`, `Tailwind CSS v4`, `Recharts`, `Framer Motion`, `React Leaflet`
- Package manager: `pnpm`

## Repository Structure

```text
DataTimeMachine/
├── BACKEND/
│   ├── config/          # MongoDB connection and environment loaders
│   ├── controllers/     # HTTP request handlers
│   ├── middlewares/     # auth and error handling middleware
│   ├── models/          # Mongoose data models
│   ├── routes/          # Express route definitions
│   ├── services/        # business logic and third-party integrations
│   ├── utils/           # logger and error utilities
│   ├── index.js         # server entrypoint and scheduler setup
│   ├── seed.js          # seeded dataset and snapshot generator
│   └── package.json
└── FRONTEND/
    ├── public/         # static assets
    ├── src/
    │   ├── components/  # reusable UI primitives and cards
    │   ├── contexts/    # React context providers for auth and app state
    │   ├── lib/         # API client and shared libraries
    │   ├── pages/       # route-based page components
    │   ├── services/    # client-side service helpers
    │   └── utils/       # formatters and helpers
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.mjs
```

---

## Architecture Overview

### Backend Architecture

The backend is responsible for:
- connecting to MongoDB
- defining normalized dataset models
- polling live APIs on a schedule
- storing dataset snapshots
- comparing values and generating events
- supporting authenticated actions like flagging and notes
- exposing a stable REST API for the frontend

Core backend files:
- `BACKEND/index.js` — configures Express, CORS, routes, and scheduler startup
- `BACKEND/config/db.js` — opens a MongoDB connection using `MONGO_URI`
- `BACKEND/models/` — schema definitions for datasets, snapshots, events, and users
- `BACKEND/routes/` — route maps for auth, datasets, snapshots, events, meta, and manual operations
- `BACKEND/controllers/` — controller logic that translates requests into service calls
- `BACKEND/services/` — data ingestion, change detection, forecasting, and AI-prompt orchestration
- `BACKEND/middlewares/authMiddleware.js` — protects sensitive endpoints
- `BACKEND/utils/` — centralized error and logging helpers

### Frontend Architecture

The frontend provides an immersive dashboard experience with:
- a sidebar-driven navigation layout
- dashboard metrics and sparkline charts
- dataset detail pages with snapshot history
- event log and flagged event workflows
- a map page for geospatial insights
- login/signup authentication
- AI-style event explanation and annotations

Key frontend files:
- `FRONTEND/src/main.jsx` — React entry point
- `FRONTEND/src/App.jsx` — route definitions and top-level layout
- `FRONTEND/src/lib/api.js` — API client for all backend requests
- `FRONTEND/src/context/*` — auth provider and app state
- `FRONTEND/src/pages/*` — high-level page views
- `FRONTEND/src/components/*` — design system components, charts, and cards

---

## Backend Data Models

### Dataset
A dataset stores metadata for each tracked series.

Fields:
- `name` — human-friendly dataset name
- `category` — category, e.g. `crypto`, `weather`, `aqi`
- `source_api` — origin of the data
- `location` — region or city label
- `unit` — unit of measurement
- `createdAt` / `updatedAt`

### Snapshot
A snapshot is a single time-stamped data point.

Fields:
- `dataset_id` — reference to a dataset
- `value` — numeric measurement
- `timestamp` — when the snapshot was taken
- `metadata` — optional extra payload or source details
- `createdAt`

### Event
An event records a significant change.

Fields:
- `dataset_id` — reference to a dataset
- `type` — event type (e.g. `spike`, `drop`, `forecast`)
- `percentage_change` — change magnitude
- `previous_value` — prior snapshot value
- `current_value` — current snapshot value
- `message` — human-readable event description
- `severity` — impact level, such as `low`, `medium`, `high`
- `flagged` — boolean marker for review
- `note` — developer/analyst note
- `createdAt`

### User
Used for authentication and protected actions.

Fields:
- `name`
- `email`
- `password` — hashed
- `createdAt`

---

## Change Detection & Scheduler

### Detection Logic

The app detects events by comparing consecutive snapshots:
1. Fetch the latest metric value.
2. Store a new `Snapshot`.
3. Compare the new value with the previous snapshot.
4. Calculate percent change: `(current - previous) / previous * 100`.
5. If the change exceeds a configured threshold, create an `Event`.

Typical thresholds used in the project:
- `> 15%` → create an event
- `> 25%` → mark severity as high

### Scheduler

The backend uses a cron-based scheduler to poll external data sources at regular intervals. This enables the platform to act like a real-time analytics engine and continuously generate new snapshots and events.

---

## Backend API Reference

### Authentication
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Datasets
- `GET /api/datasets`
- `GET /api/datasets/:id/snapshots`
- `GET /api/datasets/:id/events`
- `GET /api/datasets/:id/export`

### Events
- `GET /api/events`
- `GET /api/events/flagged`
- `POST /api/events/:id/flag`
- `POST /api/events/:id/note`

### Metadata & Operations
- `GET /api/meta/time-bounds`
- `POST /api/fetch-now/:id`

### Notes
- The backend supports CORS via `CLIENT_URL`.
- Protected endpoints require a JWT in `Authorization: Bearer <token>`.

---

## Frontend Pages & Components

### Landing Page
- Marketing-first hero section
- Demo dashboard preview
- GitHub CTA and login flow
- Designed to onboard users into the analytics experience

### Dashboard Page
- Dataset summary cards with sparklines
- Real-time metric overview
- Activity feed of recent events
- Time-range selectors and chart controls

### Dataset Detail Page
- Full snapshot history table
- Dataset-specific event stream
- Manual refresh and export actions

### Event Log Page
- Filterable event list
- Flagged event review
- Event notes and annotations

### Map Page
- Geospatial dataset visualization using React-Leaflet
- Region-based markers for data events

### Auth Pages
- Login and signup flows
- Authentication state managed in `src/contexts/AuthContext.jsx`

### Shared Components
- `DatasetCard.jsx`
- `TimelineChart.jsx`
- `BeforeAfterChart.jsx`
- `Navbar.jsx`
- `Sidebar.jsx`
- `Loader.jsx`
- `Button.jsx`
- `Input.jsx`
- `Select.jsx`

---

## Environment Configuration

### Backend `.env`

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/Pixel
GROQ_API_KEY=<your-groq-api-key>
JWT_SECRET=<your-jwt-secret>
CLIENT_URL=https://pixel-pwnz.vercel.app/
```

### Frontend `.env` (optional)

If using environment variables in the frontend, Vite expects `VITE_` prefixes, for example:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Local Development

### Backend

```bash
cd DataTimeMachine/BACKEND
pnpm install
pnpm dev
```

### Frontend

```bash
cd DataTimeMachine/FRONTEND
pnpm install
pnpm dev
```

### Full Stack Workflow
1. Start MongoDB and ensure `MONGO_URI` is reachable.
2. Run backend from `DataTimeMachine/BACKEND`.
3. Run frontend from `DataTimeMachine/FRONTEND`.
4. Open `http://localhost:5173`.

---

## Build & Deployment

### Frontend
- Build production assets with `pnpm build`.
- Deploy to Vercel or any static host.
- Ensure the built app points to the backend API URL.

### Backend
- Deploy a Node.js backend to a cloud provider such as Heroku, Railway, Render, or DigitalOcean.
- Set environment variables in the target host.
- Ensure CORS allows the frontend deployed URL.

### Important Production Notes
- Keep `JWT_SECRET` secure.
- Keep `GROQ_API_KEY` private.
- Use a production-grade MongoDB cluster.
- Configure `CLIENT_URL` to the deployed frontend domain.

---

## Troubleshooting

### Vite build fails
- Check `FRONTEND/src/lib/api.js` for syntax errors.
- Ensure the frontend code is valid JSX and the module type is correct.

### Authentication issues
- Verify `BACKEND/.env` contains `JWT_SECRET`.
- Confirm the frontend sends `Authorization` header correctly.

### CORS or network errors
- Confirm `CLIENT_URL` matches the frontend origin.
- Verify the backend allows requests from deployed and local frontend URLs.

---

## Future Enhancements

- Add dataset configuration UI for custom tracked sources
- Support graph zoom and replay controls on timeline charts
- Add AI-based root-cause event explanations
- Add mobile-responsive dashboard refinements
- Add deployment scripts for one-click staging

---

## Notes

- DataTime Machine is designed to make dataset shifts visible and actionable.
- The platform is built for rapid hackathon delivery while preserving architectural separation.
- Use this README as the canonical guide for running and extending the codebase.
