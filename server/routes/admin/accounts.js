import express from "express";
import { query } from "../../db.js";
import { isAllowedGarenaEmail } from "../../lib/emailPolicy.js";

export const adminAccountsRouter = express.Router();

// Middleware to restrict access to super_admin only
adminAccountsRouter.use((req, res, next) => {
  if (req.adminRole !== "super_admin") {
    return res.status(403).json({ error: "SUPER_ADMIN_REQUIRED" });
  }
  next();
});

// GET /admin/api/accounts -> List admin whitelist accounts
adminAccountsRouter.get("/", async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM admin_accounts ORDER BY created_at DESC");
    res.json({ accounts: result.rows });
  } catch (error) {
    next(error);
  }
});

// POST /admin/api/accounts -> Add new admin account
adminAccountsRouter.post("/", async (req, res, next) => {
  try {
    const { email, full_name, role, is_active } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: "EMAIL_AND_ROLE_REQUIRED" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!isAllowedGarenaEmail(cleanEmail)) {
      return res.status(400).json({ error: "EMAIL_NOT_ALLOWED" });
    }

    const validRoles = new Set(["super_admin", "admin", "editor", "ld_admin"]);
    if (!validRoles.has(role)) {
      return res.status(400).json({ error: "INVALID_ROLE" });
    }

    const check = await query("SELECT id FROM admin_accounts WHERE email = $1", [cleanEmail]);
    if (check.rowCount) return res.status(409).json({ error: "ACCOUNT_ALREADY_EXISTS" });

    await query(
      `INSERT INTO admin_accounts (email, full_name, \`role\`, is_active, added_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [cleanEmail, full_name || null, role, is_active === undefined ? true : is_active, req.user.id]
    );

    const result = await query("SELECT * FROM admin_accounts WHERE email = $1", [cleanEmail]);
    res.status(201).json({ account: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/api/accounts/:id -> Update admin account role or status
adminAccountsRouter.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, is_active } = req.body;

    const check = await query("SELECT id FROM admin_accounts WHERE id = $1", [id]);
    if (!check.rowCount) return res.status(404).json({ error: "ACCOUNT_NOT_FOUND" });

    const validRoles = new Set(["super_admin", "admin", "editor", "ld_admin"]);
    if (role && !validRoles.has(role)) {
      return res.status(400).json({ error: "INVALID_ROLE" });
    }

    const fields = [];
    const params = [id];

    if (role) {
      params.push(role);
      fields.push(`\`role\` = $${params.length}`);
    }
    if (is_active !== undefined) {
      params.push(is_active);
      fields.push(`is_active = $${params.length}`);
    }

    if (!fields.length) {
      return res.status(400).json({ error: "NO_UPDATES_PROVIDED" });
    }

    await query(`UPDATE admin_accounts SET ${fields.join(", ")} WHERE id = $1`, params);

    const result = await query("SELECT * FROM admin_accounts WHERE id = $1", [id]);
    res.json({ account: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
