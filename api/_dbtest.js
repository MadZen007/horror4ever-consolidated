const { pool } = require("../lib/db");

module.exports = async function handler(req, res) {
  try {
    const result = await pool.query("SELECT NOW()");
    return res.status(200).json({ ok: true, time: result.rows[0] });
  } catch (err) {
    console.error("DB test failed:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
