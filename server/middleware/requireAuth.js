import { verifyToken } from "../auth.js";
import { query } from "../db.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.get("authorization") || "";
    const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
    const token = bearer || req.cookies?.glh_token;
    if (!token) return res.status(401).json({ error: "AUTH_REQUIRED" });

    const payload = verifyToken(token);
    const result = await query("SELECT id, email, full_name, is_active FROM users WHERE id = $1", [payload.userId]);
    if (!result.rowCount) return res.status(401).json({ error: "AUTH_REQUIRED" });
    if (result.rows[0].is_active === false || result.rows[0].is_active === 0) {
      return res.status(403).json({ error: "USER_INACTIVE" });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ error: "AUTH_REQUIRED" });
  }
}
