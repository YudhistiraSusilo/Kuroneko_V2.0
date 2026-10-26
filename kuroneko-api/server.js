// ============================================
//  kuroneko-api/server.js — Kuro Neko Food Ordering API
//  Express + SQLite (better-sqlite3) + JWT auth
// ============================================

const express = require("express");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;
const JWT_SECRET = "my-super-secret-key-change-this"; // For learning only
const PAYMENT_WINDOW_MS = 15 * 60 * 1000;

app.use(cors());           // Allow cross-origin requests (needed for the React client)
app.use(express.json());   // Parse JSON request bodies

// ---------- Database setup ----------

// Store the DB next to this file so it works from any terminal location.
const db = new Database(path.join(__dirname, "kuroneko.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('client', 'administrator')),
    display_name TEXT,
    email TEXT,
    phone TEXT,
    profile_picture TEXT,
    addresses TEXT NOT NULL DEFAULT '[]',
    default_address_id TEXT,
    favorite_menu_ids TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price INTEGER NOT NULL,
    category TEXT NOT NULL,
    available INTEGER NOT NULL DEFAULT 1,
    picture TEXT NOT NULL DEFAULT ''
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT NOT NULL UNIQUE,
    client_id INTEGER,
    client_name TEXT NOT NULL,
    items TEXT NOT NULL,          -- JSON array: [{ name, quantity, price }]
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    status_history TEXT NOT NULL DEFAULT '[]',
    service_type TEXT NOT NULL DEFAULT 'Pickup',
    address TEXT,
    notes TEXT,
    payment_status TEXT NOT NULL DEFAULT 'Unpaid',
    payment_method TEXT,
    payer_name TEXT,
    paid_at TEXT,
    created_at TEXT NOT NULL
  )
`);

// Migrate older databases that were created without the profile columns.
function migrateUsersTable() {
  const existingColumns = db.prepare("PRAGMA table_info(users)").all().map((column) => column.name);
  const newColumns = [
    ["email", "TEXT"],
    ["phone", "TEXT"],
    ["profile_picture", "TEXT"],
    ["addresses", "TEXT NOT NULL DEFAULT '[]'"],
    ["default_address_id", "TEXT"],
    ["favorite_menu_ids", "TEXT NOT NULL DEFAULT '[]'"],
    ["created_at", "TEXT NOT NULL DEFAULT (datetime('now'))"],
  ];
  for (const [columnName, definition] of newColumns) {
    if (!existingColumns.includes(columnName)) {
      db.exec(`ALTER TABLE users ADD COLUMN ${columnName} ${definition}`);
      console.log(`Migrated users table: added ${columnName}.`);
    }
  }
}

// Migrate older databases that were created without the order profile columns.
function migrateOrdersTable() {
  const existingColumns = db.prepare("PRAGMA table_info(orders)").all().map((column) => column.name);
  const newColumns = [
    ["status_history", "TEXT NOT NULL DEFAULT '[]'"],
    ["notes", "TEXT"],
  ];
  for (const [columnName, definition] of newColumns) {
    if (!existingColumns.includes(columnName)) {
      db.exec(`ALTER TABLE orders ADD COLUMN ${columnName} ${definition}`);
      console.log(`Migrated orders table: added ${columnName}.`);
    }
  }
}

migrateUsersTable();
migrateOrdersTable();

// ---------- Seed data (only when the tables are empty) ----------

function seedDatabase() {
  const menuCount = db.prepare("SELECT COUNT(*) AS count FROM menu_items").get().count;
  if (menuCount === 0) {
    const insertDish = db.prepare(
      "INSERT INTO menu_items (name, description, price, category, available, picture) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const menuSeed = [
      ["Shoyu Ramen", "Clear soy broth, springy noodles, and tender chashu.", 68000, "Ramen", 1, ""],
      ["Tuna Nigiri", "Fresh tuna over hand-pressed seasoned rice.", 54000, "Sushi", 1, ""],
      ["Salmon Aburi Roll", "Seared salmon roll finished with a savory glaze.", 58000, "Sushi", 1, ""],
      ["Gyoza (5 pcs)", "Pan-seared dumplings served with dipping sauce.", 32000, "Side dishes", 1, ""],
      ["California Roll", "Crab, avocado, and cucumber rolled with seasoned rice.", 52000, "Sushi", 1, ""],
      ["Ebi Tempura Roll", "Crispy prawn tempura with cucumber and house sauce.", 62000, "Sushi", 1, ""],
      ["Hamachi Sashimi", "Five slices of delicately rich yellowtail.", 76000, "Sashimi", 1, ""],
      ["Salmon Sashimi", "Five slices of fresh salmon, served chilled.", 68000, "Sashimi", 1, ""],
      ["Tuna Sashimi", "Five clean, buttery cuts of bluefin tuna.", 78000, "Sashimi", 1, ""],
      ["Saba Sashimi", "Lightly cured mackerel with grated ginger.", 62000, "Sashimi", 1, ""],
      ["Tonkotsu Ramen", "Slow-simmered pork broth with noodles and chashu.", 78000, "Ramen", 1, ""],
      ["Miso Ramen", "Comforting miso broth topped with corn and scallions.", 70000, "Ramen", 1, ""],
      ["Spicy Miso Ramen", "Miso broth with chili oil, noodles, and minced pork.", 74000, "Ramen", 1, ""],
      ["Yuzu Soda", "Sparkling citrus drink with fragrant Japanese yuzu.", 28000, "Drinks", 1, ""],
      ["Matcha Latte", "Smooth green tea with lightly sweetened milk.", 32000, "Drinks", 1, ""],
      ["Iced Genmaicha", "Chilled toasted rice green tea, served unsweetened.", 24000, "Drinks", 1, ""],
      ["Ramune", "Classic Japanese marble soda, served ice cold.", 26000, "Drinks", 1, ""],
      ["Chicken Karaage", "Japanese-style fried chicken with lemon.", 42000, "Side dishes", 1, ""],
      ["Agedashi Tofu", "Crisp tofu in a warm, savory dashi broth.", 36000, "Side dishes", 1, ""],
      ["Edamame", "Steamed young soybeans with flaky sea salt.", 26000, "Side dishes", 1, ""],
      ["Unagi Nigiri", "Grilled eel glazed with sweet soy on seasoned rice.", 64000, "Sushi", 1, ""],
    ];
    const insertMenuSeed = db.transaction(() => {
      for (const dish of menuSeed) insertDish.run(...dish);
    });
    insertMenuSeed();
    console.log(`Seeded ${menuSeed.length} menu items.`);
  }

  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(
      "INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)"
    );
    const userSeed = [
      ["client", "client123", "client", "Aiko Tanaka"],
      ["admin", "admin123", "administrator", "Kuro Neko Admin"],
    ];
    const insertUsers = db.transaction(() => {
      for (const [username, password, role, displayName] of userSeed) {
        insertUser.run(username, bcrypt.hashSync(password, 10), role, displayName);
      }
    });
    insertUsers();
    console.log(`Seeded ${userSeed.length} users.`);
  }

  const orderCount = db.prepare("SELECT COUNT(*) AS count FROM orders").get().count;
  if (orderCount === 0) {
    const clientId = db.prepare("SELECT id FROM users WHERE username = 'client'").get().id;
    const adminName = "Kuro Neko Admin";
    // Keep the seed order inside the live 15-minute payment window so the demo shows a real countdown.
    const createdAtRecent = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const createdAtHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const paidAt45MinAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_code, client_id, client_name, items, total, status, status_history, service_type, address, notes, payment_status, payment_method, payer_name, paid_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const orderSeed = [
      [
        "KN-1001", clientId, "Aiko Tanaka",
        JSON.stringify([{ name: "Shoyu Ramen", quantity: 2, price: 68000 }]),
        136000, "Pending",
        JSON.stringify([{ status: "Pending", changedAt: createdAtRecent, changedBy: "Aiko Tanaka" }]),
        "Pickup", null, null, "Unpaid", null, null, null, createdAtRecent,
      ],
      [
        "KN-1002", null, "Ren Sato",
        JSON.stringify([
          { name: "Chicken Katsu Curry", quantity: 1, price: 72000 },
          { name: "Gyoza (5 pcs)", quantity: 1, price: 32000 },
        ]),
        104000, "Done",
        JSON.stringify([
          { status: "Pending", changedAt: createdAtHourAgo, changedBy: "Ren Sato" },
          { status: "Done", changedAt: paidAt45MinAgo, changedBy: adminName },
        ]),
        "Delivery", "Jl. Melati No. 12, Jakarta", null, "Paid", "Bank transfer (demo)", "Ren Sato", paidAt45MinAgo, createdAtHourAgo,
      ],
    ];
    const insertOrders = db.transaction(() => {
      for (const row of orderSeed) insertOrder.run(...row);
    });
    insertOrders();
    console.log(`Seeded ${orderSeed.length} orders.`);
  }
}

seedDatabase();

// ---------- Helpers ----------

function parseJsonList(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// A user row becomes the profile shape the React app expects.
function formatProfile(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    displayName: row.display_name,
    email: row.email,
    phone: row.phone,
    profilePicture: row.profile_picture,
    addresses: parseJsonList(row.addresses),
    defaultAddressId: row.default_address_id,
    favoriteMenuIds: parseJsonList(row.favorite_menu_ids),
    createdAt: row.created_at,
  };
}

function parseHistory(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendHistory(raw, entry) {
  const history = parseHistory(raw);
  history.push(entry);
  return JSON.stringify(history);
}

// Unpaid orders past their 15-minute payment window are cancelled automatically.
function autoCancelExpiredOrders() {
  const cutoff = new Date(Date.now() - PAYMENT_WINDOW_MS).toISOString();
  const expired = db.prepare(
    "SELECT * FROM orders WHERE payment_status = 'Unpaid' AND status = 'Pending' AND created_at < ?"
  ).all(cutoff);
  const update = db.prepare("UPDATE orders SET status = 'Cancelled', status_history = ? WHERE id = ?");
  for (const row of expired) {
    update.run(appendHistory(row.status_history, {
      status: "Cancelled",
      changedAt: new Date().toISOString(),
      changedBy: "System",
    }), row.id);
  }
}

function findOrder(param) {
  return db.prepare("SELECT * FROM orders WHERE order_code = ? OR id = ?").get(param, param);
}

function formatOrder(row) {
  return {
    id: row.id,
    orderCode: row.order_code,
    clientId: row.client_id,
    clientName: row.client_name,
    items: JSON.parse(row.items),
    total: row.total,
    status: row.status,
    statusHistory: parseHistory(row.status_history),
    serviceType: row.service_type,
    address: row.address,
    notes: row.notes,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    payerName: row.payer_name,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

// ---------- Auth routes ----------

// Register a new user (clients only — administrators are seeded, not created)
app.post("/api/auth/register", (req, res) => {
  const { username, password, displayName } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  if (displayName && (displayName.trim().length < 2 || displayName.trim().length > 60)) {
    return res.status(400).json({ error: "Enter a name between 2 and 60 characters." });
  }

  const cleanUsername = username.trim();
  const cleanDisplayName = (displayName || cleanUsername).trim();

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(cleanUsername);
  if (existing) {
    return res.status(400).json({ error: "That username is already taken. Please choose another." });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    "INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, 'client', ?)"
  ).run(cleanUsername, hash, cleanDisplayName);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, displayName: user.display_name },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.status(201).json({ token, user: formatProfile(user) });
});

// Login — returns a JWT
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username.trim());
  if (!user) {
    return res.status(401).json({ error: "That username and password do not match. Please try again." });
  }

  const match = bcrypt.compareSync(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: "That username and password do not match. Please try again." });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, displayName: user.display_name },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token, user: formatProfile(user) });
});

// ---------- Auth middleware ----------

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided." });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "administrator") {
    return res.status(403).json({ error: "Administrators only." });
  }
  next();
}

// ---------- Menu routes ----------

function formatDish(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    available: Boolean(row.available),
    picture: row.picture,
  };
}

// GET all menu items (public)
app.get("/api/menu", (req, res) => {
  const rows = db.prepare("SELECT * FROM menu_items").all();
  res.json(rows.map(formatDish));
});

// GET one menu item (public)
app.get("/api/menu/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: "Menu item not found." });
  }
  res.json(formatDish(row));
});

// CREATE a menu item (admin)
app.post("/api/menu", requireAuth, requireAdmin, (req, res) => {
  const { name, description, price, category, available, picture } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "`name` is required." });
  }
  if (!Number.isInteger(price) || price <= 0) {
    return res.status(400).json({ error: "`price` must be a positive whole number." });
  }
  if (!category || !["Sushi", "Sashimi", "Ramen", "Drinks", "Side dishes"].includes(category)) {
    return res.status(400).json({ error: "`category` must be one of: Sushi, Sashimi, Ramen, Drinks, Side dishes." });
  }

  const result = db.prepare(
    "INSERT INTO menu_items (name, description, price, category, available, picture) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    name.trim(),
    (description || "").trim(),
    price,
    category,
    available === false ? 0 : 1,
    (picture || "").trim()
  );

  const created = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(formatDish(created));
});

// UPDATE a menu item (admin)
app.put("/api/menu/:id", requireAuth, requireAdmin, (req, res) => {
  const { name, description, price, category, available, picture } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "`name` is required." });
  }
  if (price !== undefined && (!Number.isInteger(price) || price <= 0)) {
    return res.status(400).json({ error: "`price` must be a positive whole number." });
  }
  if (category !== undefined && !["Sushi", "Sashimi", "Ramen", "Drinks", "Side dishes"].includes(category)) {
    return res.status(400).json({ error: "`category` must be one of: Sushi, Sashimi, Ramen, Drinks, Side dishes." });
  }

  const result = db.prepare(
    "UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, available = ?, picture = ? WHERE id = ?"
  ).run(
    name.trim(),
    (description || "").trim(),
    price,
    category,
    available === false ? 0 : 1,
    (picture || "").trim(),
    req.params.id
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: "Menu item not found." });
  }

  const updated = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id);
  res.json(formatDish(updated));
});

// DELETE a menu item (admin)
app.delete("/api/menu/:id", requireAuth, requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM menu_items WHERE id = ?").run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Menu item not found." });
  }

  res.json({ message: "Menu item deleted." });
});

// ---------- Orders routes ----------

// GET orders — admin sees all, a client sees only their own
app.get("/api/orders", requireAuth, (req, res) => {
  autoCancelExpiredOrders();
  const rows = req.user.role === "administrator"
    ? db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all()
    : db.prepare("SELECT * FROM orders WHERE client_id = ? ORDER BY created_at DESC").all(req.user.id);
  res.json(rows.map(formatOrder));
});

// GET one order — admin sees any, a client sees only their own
app.get("/api/orders/:id", requireAuth, (req, res) => {
  autoCancelExpiredOrders();
  const row = findOrder(req.params.id);
  if (!row) {
    return res.status(404).json({ error: "Order not found." });
  }
  if (req.user.role !== "administrator" && row.client_id !== req.user.id) {
    return res.status(403).json({ error: "You can only view your own orders." });
  }
  res.json(formatOrder(row));
});

// CREATE an order (clients only — administrators manage the menu, not orders)
app.post("/api/orders", requireAuth, (req, res) => {
  if (req.user.role !== "client") {
    return res.status(403).json({ error: "Only clients can place orders." });
  }

  const { items, total, serviceType, address, notes } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Your cart is empty. Add an available dish from the menu first." });
  }
  const invalidItem = items.some((item) =>
    !item.name || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price <= 0
  );
  if (invalidItem) {
    return res.status(400).json({ error: "A dish quantity or price is invalid. Review the cart before placing your order." });
  }
  if (!Number.isFinite(total) || total <= 0) {
    return res.status(400).json({ error: "The order total is invalid. Review the cart before placing your order." });
  }
  if (serviceType && !["Pickup", "Delivery"].includes(serviceType)) {
    return res.status(400).json({ error: "`serviceType` must be 'Pickup' or 'Delivery'." });
  }
  if (serviceType === "Delivery" && !(address || "").trim()) {
    return res.status(400).json({ error: "Please enter a delivery address before continuing." });
  }

  const nextNumber = db.prepare("SELECT COALESCE(MAX(id), 0) + 1 AS next FROM orders").get().next;
  const orderCode = `KN-${1000 + nextNumber}`;
  const createdAt = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO orders (order_code, client_id, client_name, items, total, status, status_history, service_type, address, notes, payment_status, created_at)
    VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, 'Unpaid', ?)
  `).run(
    orderCode,
    req.user.id,
    req.user.displayName,
    JSON.stringify(items),
    total,
    JSON.stringify([{ status: "Pending", changedAt: createdAt, changedBy: req.user.displayName }]),
    serviceType || "Pickup",
    (address || "").trim() || null,
    (notes || "").trim() || null,
    createdAt
  );

  const created = db.prepare("SELECT * FROM orders WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(formatOrder(created));
});

// UPDATE order status (admin only)
app.put("/api/orders/:id/status", requireAuth, requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ["Pending", "Preparing", "Ready", "Done"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Choose a valid order status." });
  }

  const row = findOrder(req.params.id);
  if (!row) {
    return res.status(404).json({ error: "This order could not be found. Refresh the page and try again." });
  }
  if (row.status === "Cancelled") {
    return res.status(400).json({ error: "Cancelled orders cannot be changed." });
  }
  if (row.payment_status === "Unpaid") {
    return res.status(400).json({ error: "This order must be paid before its kitchen status can change." });
  }

  const result = db.prepare("UPDATE orders SET status = ?, status_history = ? WHERE id = ?").run(
    status,
    appendHistory(row.status_history, {
      status,
      changedAt: new Date().toISOString(),
      changedBy: req.user.displayName,
    }),
    row.id
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: "Order not found." });
  }

  res.json(formatOrder(db.prepare("SELECT * FROM orders WHERE id = ?").get(row.id)));
});

// CANCEL an order (clients cancel their own pending orders)
app.put("/api/orders/:id/cancel", requireAuth, (req, res) => {
  if (req.user.role !== "client") {
    return res.status(403).json({ error: "Only clients can cancel an order." });
  }

  const row = findOrder(req.params.id);
  if (!row) {
    return res.status(404).json({ error: "This order could not be found. Refresh the page and try again." });
  }
  if (row.client_id !== req.user.id) {
    return res.status(403).json({ error: "You can only cancel orders placed by your account." });
  }
  if (row.status !== "Pending") {
    return res.status(400).json({ error: "Only pending orders can be cancelled." });
  }
  if (row.payment_status === "Paid") {
    return res.status(400).json({ error: "Paid orders cannot be cancelled here. Please contact the restaurant about a refund." });
  }

  db.prepare("UPDATE orders SET status = 'Cancelled', status_history = ? WHERE id = ?").run(
    appendHistory(row.status_history, {
      status: "Cancelled",
      changedAt: new Date().toISOString(),
      changedBy: req.user.displayName,
    }),
    row.id
  );

  res.json(formatOrder(db.prepare("SELECT * FROM orders WHERE id = ?").get(row.id)));
});

// PAY an order (clients, within the 15-minute payment window)
app.put("/api/orders/:id/payment", requireAuth, (req, res) => {
  if (req.user.role !== "client") {
    return res.status(403).json({ error: "Only clients can update payment details." });
  }

  const row = findOrder(req.params.id);
  if (!row) {
    return res.status(404).json({ error: "This order could not be found in your account." });
  }
  if (row.client_id !== req.user.id) {
    return res.status(403).json({ error: "This order could not be found in your account." });
  }
  if (row.payment_status === "Paid") {
    return res.status(400).json({ error: "This order has already been paid." });
  }
  if (row.status === "Cancelled") {
    return res.status(400).json({ error: "Cancelled orders cannot be paid." });
  }
  if (Date.parse(row.created_at) + PAYMENT_WINDOW_MS <= Date.now()) {
    return res.status(400).json({ error: "The 15-minute payment window has expired. This order is being cancelled." });
  }

  const { method, payerName } = req.body;
  if (!["Bank transfer (demo)", "E-wallet (demo)"].includes(method)) {
    return res.status(400).json({ error: "Choose a valid payment method." });
  }
  if (typeof payerName !== "string" || payerName.trim().length < 2 || payerName.trim().length > 60) {
    return res.status(400).json({ error: "Enter a payer name with at least 2 characters." });
  }

  const paidAt = new Date().toISOString();
  db.prepare(
    "UPDATE orders SET payment_status = 'Paid', payment_method = ?, payer_name = ?, paid_at = ? WHERE id = ?"
  ).run(method, payerName.trim(), paidAt, row.id);

  res.json(formatOrder(db.prepare("SELECT * FROM orders WHERE id = ?").get(row.id)));
});

// UPDATE the signed-in user's profile (name, contact, picture, addresses, favorites)
app.put("/api/profile/:id", requireAuth, (req, res) => {
  if (req.user.role !== "client" && req.params.id !== String(req.user.id)) {
    return res.status(403).json({ error: "You can only update your own profile." });
  }

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: "Profile not found." });
  }

  const { displayName, email, phone, profilePicture, addresses, defaultAddressId, favoriteMenuIds } = req.body;

  if (displayName !== undefined && (displayName.trim().length < 2 || displayName.trim().length > 60)) {
    return res.status(400).json({ error: "Enter a name between 2 and 60 characters." });
  }
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (phone !== undefined && (String(phone).trim().length < 7 || String(phone).trim().length > 24)) {
    return res.status(400).json({ error: "Enter a phone number between 7 and 24 characters." });
  }
  if (addresses !== undefined && !Array.isArray(addresses)) {
    return res.status(400).json({ error: "`addresses` must be an array." });
  }

  db.prepare(`
    UPDATE users SET display_name = ?, email = ?, phone = ?, profile_picture = ?, addresses = ?, default_address_id = ?, favorite_menu_ids = ?
    WHERE id = ?
  `).run(
    displayName !== undefined ? displayName.trim() : row.display_name,
    email !== undefined ? String(email).trim() : row.email,
    phone !== undefined ? String(phone).trim() : row.phone,
    profilePicture !== undefined ? profilePicture : row.profile_picture,
    addresses !== undefined ? JSON.stringify(addresses) : row.addresses,
    defaultAddressId !== undefined ? defaultAddressId : row.default_address_id,
    favoriteMenuIds !== undefined ? JSON.stringify(favoriteMenuIds) : row.favorite_menu_ids,
    row.id
  );

  res.json(formatProfile(db.prepare("SELECT * FROM users WHERE id = ?").get(row.id)));
});

// ---------- Start server ----------

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Kuro Neko Food Ordering API" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
