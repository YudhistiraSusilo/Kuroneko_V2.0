## Kuro Neko — Japanese Food Ordering (V2.0)

Kuro Neko is a React web app for browsing a Japanese restaurant menu and placing pickup or delivery orders. Customers can manage their cart, profile, saved addresses, and order history. Administrators can manage menu items and review and update order statuses.

> **Version:** 2.0  
> **Project status:** The React frontend is connected to the Express/Turso API for authentication, menu, orders, demo payments, and profile data. Cart contents and language preference remain in browser `localStorage`. Payments are simulated; no real payment is processed.

## Team

| Member | Responsibility |
|---|---|
| Sherly | UI/UX design |
| Reynard | Backend, Turso database, and API |
| Yuris | Frontend and backend integration |
| Bunga | Testing, documentation, and deployment support |

## Features

- Customer registration and sign-in, plus an administrator demo account
- Browse, search, filter, and view menu items
- Add dishes to a per-account cart and choose pickup or delivery
- Submit orders and complete a simulated payment
- View order history and order status
- Save favorite dishes and manage profile information and addresses
- Administrator tools for menu item management and order status updates
- English, Indonesian, and Japanese interface translations

## Run locally

### Requirements

- Node.js (LTS recommended)
- npm

### Setup

Install dependencies in the repository root and backend, then configure the frontend API URL:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

In a second terminal, run `cd backend`, `npm ci`, copy `backend/.env.example` to `backend/.env`, and fill in `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and a strong `JWT_SECRET`. Then run `npm start`. On first startup, if the Turso database has no application tables, the backend imports `kuroneko.db`; if Turso already has application tables, it preserves and uses that data. Open the Vite URL, usually `http://localhost:5173/Kuroneko_V2.0/`.

### Demo accounts

| Role | Username | Password |
|---|---|---|
| Customer | `client` | `client123` |
| Administrator | `admin` | `admin123` |

These credentials are for the demo only. The current frontend authentication is not suitable for production use.

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production frontend into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Legacy manual `gh-pages` deployment; the Actions workflow is the current path |

## Deployment

The project is configured for GitHub Pages at `/Kuroneko_V2.0/`. Set the Pages build and deployment source to **GitHub Actions**, and add the repository Actions variable `VITE_API_BASE_URL` with the public API URL. Pushes to `main` deploy through `.github/workflows/deploy.yml`.

**Live site**

GitHub Pages hosts the frontend only. Deploy the API separately and set `VITE_API_BASE_URL` to its public URL for the frontend build. Set the API host's `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `JWT_SECRET` secrets; never place them in frontend build variables. The backend uses Turso for live reads and writes.

## Planned work

- Host the API and set `VITE_API_BASE_URL` for the deployed frontend
- Document the final database model, API routes, and deployment architecture

## Repository notes

- Do not commit `.env` files, API keys, or `node_modules/`.
- If environment variables are introduced, commit an `.env.example` with placeholder values, never the real credentials.
- Cart contents and language preference are browser-specific; API-backed accounts, menu, orders, and profiles are shared through the backend.
