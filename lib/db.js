const { Pool } = require("pg");

if (!process.env.COCKROACHDB_CONNECTION_STRING) {
  throw new Error("Missing COCKROACHDB_CONNECTION_STRING in environment");
}

const pool = new Pool({
  connectionString: process.env.COCKROACHDB_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

module.exports = { pool };
