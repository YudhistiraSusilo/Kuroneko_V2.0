# Kuro Neko V2.0 — Team Handoff & Progress

> **For:** the rest of the team (Sherly, Yuris, Bunga) and any AI agent picking up this project.
> **Read this top to bottom before touching the code.** It captures what we've done, the current
> state of the site, and exactly what's left to do next.
>
> Last updated: 2026-11-09 (session handoff by Reynard + agent).
> Companion doc: `../project-submission-guide.md` (the course submission requirements).

---

## 1. Project at a glance

**Kuro Neko V2.0** is a Japanese restaurant food-ordering web app.
- **Frontend:** React 18 + Vite + react-router (HashRouter), 3-language UI (EN/ID/JA).
- **Backend:** Node/Express + SQLite (`better-sqlite3`) + JWT auth + bcrypt.
- **Roles:** `client` (customers) and `administrator` (staff).
- **Scope:** browse/search/filter menu, cart, pickup or delivery orders, simulated payment,
  order history, favorites, profile/addresses, admin menu + order management.

> ⚠️ **Current big caveat:** the frontend and backend are **not yet connected**. The React app
> runs entirely on browser `localStorage`; the Express API is built and running but the UI does
> not call it. That connection is the main remaining piece of work.

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
│   ├── utils/storage.js    # <== localStorage layer TO BE REPLACED by API client
│   └── utils/translations.js, orderHelpers.js, format.js
├── menu pictures/          # dish + hero PNGs (food photos; referenced by src/data/menuItems.js)
├── backend/
│   ├── server.js           # Express API (port 3000) + auto-migrate + auto-seed
│   ├── kuroneko.db        # SQLite DB (seeded: 2 users, 21 menu items, 2 orders)
│   └── package.json        # npm start = node server.js
├── .github/workflows/deploy.yml   # build + deploy frontend to GitHub Pages
├── .gitignore, .gitattributes     # node_modules ignored; LF line endings; dist/ not tracked
└── README.md
```

**Run it:**
```
# Backend (port 3000)
cd backend && node server.js          # (deps already installed)

# Frontend (port 5173, served under /Kuroneko_V2.0/)
cd <repo root> && npm run dev
# → http://localhost:5173/Kuroneko_V2.0/   (logins: client/client123, admin/admin123)
```

---

## 3. What's DONE

### 3.1 Frontend (functional, self-contained)
- All pages/routes work: login, dashboard, menu, cart, orders, payment, profile, order-confirmation.
- Customer + admin flows: add to cart, pickup/delivery, place order, simulated 15-min payment
  window, auto-cancel expired unpaid orders, cancel own order, admin updates order status.
- Favorites, saved addresses, profile editing, 3-language toggle — all working on `localStorage`.
- Verified end-to-end in a real browser (build + login + dashboard navigation pass).

### 3.2 Backend (built & running, not yet wired to UI)
- Express + SQLite + JWT + bcrypt; auto-migrates schema and auto-seeds when tables are empty.
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
  **SQLite schema** (in `backend/kuroneko.db`): `users`, `menu_items`, `orders`. See
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

### P0 — Frontend ↔ Backend integration (the core remaining task)
**Owner: Yuris (frontend) + Reynard (backend).** Replace the `localStorage` data layer with the API:
1. Add an API client (e.g. `src/utils/api.js`) that stores the JWT (e.g. in memory / a token
   state) and wraps `fetch` to `http://localhost:3000` (or the deployed backend URL via a
   build-time env var, NOT hardcoded).
2. **Auth:** `LoginPage` → call `POST /api/auth/login` (and `/register`); on success store the
   returned `user` + token; drop `src/data/users.js` seeding and the localStorage user lookup.
3. **Menu:** `MenuPage`/`DashboardPage` load `GET /api/menu`; admin create/edit/delete dish →
   the `POST/PUT/DELETE /api/menu` routes. Remove `src/data/menuItems.js` as the source of truth
   (keep it only as a dev seed if needed).
4. **Orders:** `CartPage` place order → `POST /api/orders`; `OrdersPage`/`DashboardPage` →
   `GET /api/orders`; pay → `PUT /api/orders/:id/payment`; cancel → `.../cancel`;
   admin status → `PUT /api/orders/:id/status`.
5. **Profile:** `ProfilePage` save → `PUT /api/profile/:id` (addresses, favorites, contact).
6. Drop the `saveAppData`/`loadSaved*` persistence in `src/utils/storage.js` once each page is
   backed by the API (or keep it as an offline fallback — decide with the team).

> Do this **page by page and verify each in the browser against the live API** (run both servers).

### P1 — GitHub Pages: enable it (one-time, needs repo Settings access)
The workflow is committed, but Pages isn't enabled yet (the live URL 404s). Someone with repo
admin must: **Settings → Pages → "Build and deployment" → Source = "Deploy from a branch" →
branch `gh-pages` (root) → Save.** Then the next push to `main` deploys automatically.

### P1 — Backend hosting (Reynard; course deadline ~Week 13)
GitHub Pages only hosts the static frontend. The Express+SQLite API needs its own host
(Render / Railway / a VPS). **Watch out:** free-tier Render gives an **ephemeral filesystem**,
so a file-based `kuroneko.db` gets wiped on rebuild — prefer a managed database (e.g. Postgres)
or a host with persistent disk, or accept re-seeding on each cold start.

### P2 — The 3 missing dish images (anyone)
Source real photos for **Tuna Nigiri, Yuzu Soda, Matcha Latte** into `menu pictures/`, then add
their `import` + `picture` field in `src/data/menuItems.js` (mirror the existing 18 entries),
rebuild. (Or point the backend seed at real image URLs when the API is wired.)

### P2 — Course deliverables (map to `project-submission-guide.md`)
- **Design Document (.docx/.pdf)** — 8 sections; the code/API/DB here is the source for
  Sections 3 (architecture), 4 (data model/ER), 5 (API endpoints — table above is ready to paste).
- **README** should note how to run backend + frontend and the (eventual) deployment links.
- **Testing** (Bunga): cover the integration end-to-end once P0 lands.

---

## 5. Team role → what to own next

| Member | Role | Suggested next task |
|---|---|---|
| **Reynard** | Backend / API / DB | Backend hosting (P1); support integration on the API side (P0) |
| **Yuris** | Frontend↔backend integration | The P0 wiring (client + API layer), page by page |
| **Sherly** | UI/UX | Polish post-integration UI; the 3 missing dish images (P2) |
| **Bunga** | Testing / docs / deploy | Enable GitHub Pages (P1); update Design Doc sections; E2E test P0 |

---

## 6. Gotchas & caveats (don't step on these)

- **Two data sources exist right now:** the UI uses `localStorage`, the API uses `kuroneko.db`.
  They only reconcile once P0 is done. Don't "fix" one and assume the other follows.
- **localStorage is per-browser:** cached menus/users persist per device/browser (old data can
  even hide new menu images). Clearing site data resets it. This goes away after P0.
- **`vite.config.js` base is `/Kuroneko_V2.0/`** — matches the GitHub repo name. If the repo is
  renamed, update `base` and the Pages config together or the deployed assets 404.
- **`dist/` is intentionally untracked** (rebuilt by CI). Don't re-add it to git.
- **WSL git has no GitHub creds** — commits/pushes are done from the Windows side. Backend
  `package.json` "dev" script uses `nodemon` (not installed); use `npm start` / `node server.js`.
- **The `gh-pages` script + `gh-pages` npm dep are now redundant** (superseded by the
  Actions workflow) — harmless, but can be removed later.
- Menu `picture` in the **DB** is empty (`''`); the photos live in the frontend. When wiring the
  API, decide whether dish pictures are stored as DB image paths/URLs.

---

## 7. Command cheat-sheet (for an agent)

```
# run everything
cd backend && node server.js            # API on :3000
cd <root> && npm run dev                 # UI on :5173/Kuroneko_V2.0/

# build / preview the production bundle
npm run build && npm run preview

# inspect the SQLite DB
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
