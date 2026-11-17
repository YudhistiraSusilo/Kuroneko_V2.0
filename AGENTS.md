# Kuro Neko V2.0 — Team Handoff & Progress

> **For:** the rest of the team (Sherly, Yuris, Bunga) and any AI agent picking up this project.
> **Read this top to bottom before touching the code.** It captures what we've done, the current
> state of the site, and exactly what's left to do next.
>
> Last updated: 2026-11-17 (frontend/API integration handoff).
> Companion doc: `../project-submission-guide.md` (the course submission requirements).

---

## 1. Project at a glance

**Kuro Neko V2.0** is a Japanese restaurant food-ordering web app.
- **Frontend:** React 18 + Vite + react-router (HashRouter), 3-language UI (EN/ID/JA).
- **Backend:** Node/Express + Turso/libSQL + JWT auth + bcrypt. `kuroneko.db` is imported only when Turso has no application tables.
- **Roles:** `client` (customers) and `administrator` (staff).
- **Scope:** browse/search/filter menu, cart, pickup or delivery orders, simulated payment,
  order history, favorites, profile/addresses, admin menu + order management.

> **Current state:** the frontend now calls the API for authentication, menu, orders, payments,
> and profile updates. Cart contents and language preference remain in browser `localStorage`;
> JWTs are held in memory, so users sign in again after a page refresh. The API still needs a
> public host before the deployed frontend can use it.

---

## 2. Repository layout

```
Kuroneko_V2.0/
├── index.html, vite.config.js, package.json   # Vite frontend (base: /Kuroneko_V2.0/)
├── src/
│   ├── main.jsx            # entry; HashRouter
│   ├── App.jsx             # global state, routing, order/payment/favorite handlers
│   ├── pages/              # Login, Dashboard, Menu, Cart, Orders, Payment, Profile, OrderConfirmation
│   ├── components/         # Navbar, modals, dashboard/ + profile/ sub-components
│   ├── data/               # menuItems.js, users.js, orders.js  (starter data)
│   ├── utils/storage.js    # local cart persistence
│   └── utils/translations.js, orderHelpers.js, format.js
├── menu pictures/          # dish + hero PNGs (food photos; referenced by src/data/menuItems.js)
├── backend/
│   ├── server.js           # Express API (port 3000) + auto-migrate + auto-seed
│   ├── kuroneko.db        # Local SQLite source/import (seeded: 2 users, 21 menu items, 2 orders)
│   └── package.json        # npm start = node server.js
├── .github/workflows/deploy.yml   # build + deploy frontend to GitHub Pages
├── .gitignore, .gitattributes     # node_modules ignored; LF line endings; dist/ not tracked
└── README.md
```

**Run it:**
```
# Backend (port 3000)
cd backend && npm ci && Copy-Item .env.example .env && npm start

# Frontend (port 5173, served under /Kuroneko_V2.0/)
cd <repo root> && Copy-Item .env.example .env && npm ci && npm run dev
# → http://localhost:5173/Kuroneko_V2.0/   (logins: client/client123, admin/admin123)
```

---

## 3. What's DONE

### 3.1 Frontend (functional, API-connected)
- All pages/routes work: login, dashboard, menu, cart, orders, payment, profile, order-confirmation.
- Customer + admin flows: add to cart, pickup/delivery, place order, simulated 15-min payment
  window, auto-cancel expired unpaid orders, cancel own order, admin updates order status.
- Profile edits, saved addresses, and favorites use the API; carts and language preference stay in `localStorage`.
- Verified end-to-end in a real browser (build + login + dashboard navigation pass).

### 3.2 Backend (built, running, and wired to UI)
- Express + Turso/libSQL + JWT + bcrypt; auto-migrates schema, imports the local DB only into an empty Turso database, then seeds empty tables.
- **API endpoints (port 3000):**

  | Method | Endpoint | Auth |
  |---|---|---|
  | `POST` | `/api/auth/register` | public |
  | `POST` | `/api/auth/login` | public (returns `{token, user}`) |
  | `GET`  | `/api/menu`, `/api/menu/:id` | public |
  | `POST` / `PUT` / `DELETE` | `/api/menu`, `/api/menu/:id` | admin |
  | `GET`  | `/api/orders`, `/api/orders/:id` | auth (admin = all, client = own) |
  | `POST` | `/api/orders` | client |
  | `PUT`  | `/api/orders/:id/status` | admin |
  | `PUT`  | `/api/orders/:id/cancel` | client |
  | `PUT`  | `/api/orders/:id/payment` | client |
  | `PUT`  | `/api/profile/:id` | auth |
  | `GET`  | `/` | public (health message) |

  CORS is enabled, so the `:5173` frontend is allowed to call `:3000`.
  **Database schema** (`users`, `menu_items`, `orders`): see
  `backend/server.js` for column definitions.

### 3.3 Menu images
- 18 of 21 dishes now show real photos: `src/data/menuItems.js` imports them from
  `menu pictures/` (committed).
- **3 dishes still show the "和" placeholder** (no photo file exists yet): **Tuna Nigiri,
  Yuzu Soda, Matcha Latte.** Left intentionally for now.

### 3.4 Deployment (GitHub Pages, frontend only)
- `base: '/Kuroneko_V2.0/'` set in `vite.config.js` (matches the repo name `Kuroneko_V2.0`).
- `dist/` is **not tracked**; `.github/workflows/deploy.yml` builds on push to `main` and
  publishes via `actions/deploy-pages`.
- Git hygiene: `.gitignore` (node_modules, .env, dist), `.gitattributes` (LF endings,
  binaries marked) — this killed the CRLF/LF diff churn.

### 3.5 What was verified this session (evidence)
- `npm run build` → 0 errors. Backend boots, `GET /api/menu` returns 21 items, login issues a JWT.
- Frontend login → dashboard renders as the demo client. Menu images load (`naturalWidth > 0`).

---

## 4. What's LEFT (the "what to do next")

### P0 — Frontend ↔ Backend integration
**Implementation complete:** auth, menu, orders, payment, and profile use the API client. Cart
contents remain local because the API has no cart endpoint. `npm run build` passes; browser
verification is still outstanding. Set `VITE_API_BASE_URL` in `.env` locally and as a repository
Actions variable for deployment.

### P1 — GitHub Pages: enable it (one-time, needs repo Settings access)
The workflow is committed, but Pages isn't enabled yet (the live URL 404s). Someone with repo
admin must: **Settings → Pages → Build and deployment → Source = GitHub Actions.** The workflow
uses `actions/deploy-pages`; the next push to `main` deploys automatically.

### P1 — Backend hosting (Reynard; course deadline ~Week 13)
`render.yaml` now defines the Render web service in Singapore using Turso for persistence.
Create the Render Blueprint from the repository, supply `TURSO_DATABASE_URL` and
`TURSO_AUTH_TOKEN`, then set the GitHub Actions variable `VITE_API_BASE_URL` to the deployed
service URL. Free Render instances spin down after 15 minutes idle and can take about a minute
to wake.

### P2 — The 3 missing dish images (anyone)
Source real photos for **Tuna Nigiri, Yuzu Soda, Matcha Latte** into `menu pictures/`, then add
their image mappings in `src/data/menuItems.js` (mirror the existing 18 entries) and rebuild.

### P2 — Course deliverables (map to `project-submission-guide.md`)
- **Design Document (.docx/.pdf)** — 8 sections; the code/API/DB here is the source for
  Sections 3 (architecture), 4 (data model/ER), 5 (API endpoints — table above is ready to paste).
- **README** should note how to run backend + frontend and the (eventual) deployment links.
- **Testing** (Bunga): complete browser end-to-end verification for the integrated flows.

---

## 5. Team role → what to own next

| Member | Role | Suggested next task |
|---|---|---|
| **Reynard** | Backend / API / DB | Backend hosting (P1); support integration on the API side (P0) |
| **Yuris** | Frontend↔backend integration | P0 implementation is complete; support deployment configuration |
| **Sherly** | UI/UX | Polish post-integration UI; the 3 missing dish images (P2) |
| **Bunga** | Testing / docs / deploy | Enable GitHub Pages (P1); update Design Doc sections; verify P0 end-to-end |

---

## 6. Gotchas & caveats (don't step on these)

- Cart contents and language preference are browser-local. Menu, users, orders, and profiles
  come from the API; old local menu/user/order values are no longer read.
- **`vite.config.js` base is `/Kuroneko_V2.0/`** — matches the GitHub repo name. If the repo is
  renamed, update `base` and the Pages config together or the deployed assets 404.
- **`dist/` is intentionally untracked** (rebuilt by CI). Don't re-add it to git.
- **WSL git has no GitHub creds** — commits/pushes are done from the Windows side. Backend
  `package.json` "dev" script uses `nodemon` (not installed); use `npm start` / `node server.js`.
- **The `gh-pages` script + `gh-pages` npm dep are now redundant** (superseded by the
  Actions workflow) — harmless, but can be removed later.
- Seeded menu `picture` fields in the **DB** are empty (`''`); the frontend maps existing photos
  by dish name. Admin-uploaded pictures are saved in the DB.

---

## 7. Command cheat-sheet (for an agent)

```
# run everything
cd backend && node server.js            # API on :3000
cd <root> && npm run dev                 # UI on :5173/Kuroneko_V2.0/

# build / preview the production bundle
npm run build && npm run preview

# inspect the local SQLite import source
cd backend && sqlite3 kuroneko.db ".tables"
sqlite3 -column -header kuroneko.db "SELECT id, name, price, category FROM menu_items;"
sqlite3 -column -header kuroneko.db "SELECT order_code, status, payment_status FROM orders;"

# smoke-test the API
curl http://localhost:3000/api/menu
TOKEN=*** -s -X POST http://localhost:3000/api/auth/login \
        -H 'Content-Type: application/json' \
        -d '{"username":"client","password":"client123"}' | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).token))')
curl -s http://localhost:3000/api/orders -H "Authorization: Bearer $TOKEN"
```
