## Kuro Neko — Japanese Food Ordering (V2.0)

Kuro Neko is a React web app for browsing a Japanese restaurant menu and placing pickup or delivery orders. Customers can manage their cart, profile, saved addresses, and order history. Administrators can manage menu items and review and update order statuses.

> **Version:** 2.0  
> **Project status:** This is currently a frontend demo. App data is saved in the browser with `localStorage`, and payments are simulated. A backend API and SQLite database for menu items and orders are planned; no real payment is processed.

## Team

| Member | Responsibility |
|---|---|
| Sherly | UI/UX design |
| Reynard | Backend, SQLite database, and API |
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

```bash
git clone <repository-url>
cd kuro-neko-food-ordering
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

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
| `npm run deploy` | Publish `dist/` to GitHub Pages using `gh-pages` |

## Deployment

The project is configured for GitHub Pages at the repository path `/kuro-neko-food-ordering/`. After configuring the repository’s Pages source and confirming the repository name matches this path, deploy with:

```bash
npm run deploy
```

**Live site**

The GitHub Pages deployment hosts the frontend only. The planned SQLite-backed API will need to run on a separate backend host; GitHub Pages does not run the API server or SQLite database.

## Planned work

- Add a backend API and SQLite persistence for `menu_items` and `orders`
- Connect the customer and administrator screens to the API
- Document the final database model, API routes, and deployment architecture

## Repository notes

- Do not commit `.env` files, API keys, or `node_modules/`.
- If environment variables are introduced, commit an `.env.example` with placeholder values, never the real credentials.
- Browser `localStorage` is device- and browser-specific; current demo data does not synchronize between users or devices.
