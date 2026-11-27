// backend/check-mongo.js
// Quick check: does this backend's MONGODB_URI (from .env) reach the
// Kuroneko Atlas cluster? Run from the backend folder:
//
//   node check-mongo.js
//
// Exits 0 and prints collections when the connection works, exits 1 with
// the error message otherwise. Safe to run repeatedly — a ping also
// wakes a suspended M0 cluster (first call right after suspend can take
// up to ~60 s).
const fs = require("fs");
const path = require("path");

// Load .env manually (no dotenv dependency in this project).
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const { getMongoStatus } = require("./mongo");

getMongoStatus()
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ok || !r.configured ? 0 : 1);
  })
  .catch((e) => {
    console.error("check-mongo failed:", e.message);
    process.exit(1);
  });
