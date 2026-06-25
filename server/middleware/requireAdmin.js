import { query } from "../db.js";

export async function requireAdmin(req, res, next) {
  const result = await query(
    `SELECT role FROM admin_accounts
     WHERE email = $1 AND is_active = TRUE`,
    [req.user.email]
  );

  if (!result.rowCount) return res.status(403).json({ error: "ADMIN_REQUIRED" });
  req.adminRole = result.rows[0].role;
  next();
}
