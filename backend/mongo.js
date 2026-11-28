// ============================================
//  kuroneko-api/mongo.js — MongoDB Atlas connection (Kuro Neko)
//
//  Connects to the "Kuroneko" Atlas cluster when MONGODB_URI is set in
//  backend/.env. Without it, everything degrades gracefully: the API
//  still runs on the SQL database and /api/db/mongo-status reports
//  "not configured".
// ============================================

const { MongoClient } = require("mongodb");

const MONGODB_URI = (process.env.MONGODB_URI || "").trim();
const MONGO_DB_NAME = (process.env.MONGO_DB_NAME || "kuroneko").trim();

// A suspended Atlas M0 cluster can take up to a minute to wake up on the
// first connection, so give the client plenty of time.
const SERVER_SELECTION_TIMEOUT_MS = 60 * 1000;

let client = null;

function mongoConfigured() {
  return MONGODB_URI.length > 0;
}

/**
 * Connect to Atlas (and keep the client reused for the process lifetime).
 * A successful ping also wakes a suspended M0 cluster.
 */
async function connectMongo() {
  if (!mongoConfigured()) {
    throw new Error("MONGODB_URI is not set in backend/.env.");
  }

  if (!client) {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS
    });
  }

  await client.connect();
  const db = client.db(MONGO_DB_NAME);
  await db.command({ ping: 1 });
  return db;
}

/**
 * Status report used by the /api/db/mongo-status endpoint.
 */
async function getMongoStatus() {
  if (!mongoConfigured()) {
    return {
      configured: false,
      detail: "MONGODB_URI is not set. Add it to backend/.env to connect to the Kuroneko Atlas cluster."
    };
  }

  try {
    const db = await connectMongo();
    const collections = (await db.listCollections({ nameOnly: true }).toArray()).map((c) => c.name);
    return {
      configured: true,
      ok: true,
      dbName: MONGO_DB_NAME,
      collections,
      ping: "ok",
      detail: "Connected to the Kuroneko Atlas cluster."
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      dbName: MONGO_DB_NAME,
      detail: error.message,
      hint: "If the cluster just woke from suspension, try again in a minute."
    };
  }
}

// Keep a suspended M0 cluster awake: ping it on a regular interval while
// the API process is running. Atlas suspends idle M0 clusters after ~30
// minutes, so a ping every 25 minutes prevents suspension.
let keepAliveTimer = null;

function startKeepAlive(intervalMs = 25 * 60 * 1000) {
  if (!mongoConfigured() || keepAliveTimer) {
    return;
  }

  const ping = async () => {
    try {
      await connectMongo();
      console.log("[mongo] keep-alive ping ok");
    } catch (error) {
      console.log("[mongo] keep-alive ping failed:", error.message);
    }
  };

  ping();
  keepAliveTimer = setInterval(ping, intervalMs);
}

module.exports = { mongoConfigured, connectMongo, getMongoStatus, startKeepAlive, MONGO_DB_NAME };
