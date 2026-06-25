import express from "express";
import { query } from "../db.js";

export const policiesRouter = express.Router();

policiesRouter.get("/", async (req, res) => {
  const result = await query(
    `SELECT * FROM policies
     WHERE is_active = TRUE
     ORDER BY category ASC, order_index ASC, title ASC`
  );
  const grouped = result.rows.reduce((acc, policy) => {
    acc[policy.category] ||= [];
    acc[policy.category].push(policy);
    return acc;
  }, {});
  res.json({ policies: grouped });
});

policiesRouter.get("/:id", async (req, res) => {
  const result = await query("SELECT * FROM policies WHERE id = $1 AND is_active = TRUE", [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: "POLICY_NOT_FOUND" });
  res.json({ policy: result.rows[0] });
});
