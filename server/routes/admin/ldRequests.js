import express from "express";
import { query, withTransaction } from "../../db.js";
import { sendMail } from "../../services/mail.js";

export const adminLdRequestsRouter = express.Router();

// GET /admin/api/ld-requests -> List L&D requests with status and date filters
adminLdRequestsRouter.get("/", async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const params = [];
    let sql = `
      SELECT r.*, u.full_name, u.email
      FROM ld_requests r
      JOIN users u ON r.user_id = u.id
    `;

    const clauses = [];
    if (status) {
      params.push(status);
      clauses.push(`r.status = $${params.length}`);
    }
    if (date) {
      params.push(date);
      clauses.push(`DATE(r.created_at) = $${params.length}`);
    }

    if (clauses.length) {
      sql += " WHERE " + clauses.join(" AND ");
    }

    sql += " ORDER BY r.created_at DESC";

    const result = await query(sql, params);
    res.json({ requests: result.rows });
  } catch (error) {
    next(error);
  }
});

// PUT /admin/api/ld-requests/:id -> Update L&D request status and admin notes
adminLdRequestsRouter.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    if (!status) {
      return res.status(400).json({ error: "STATUS_REQUIRED" });
    }

    const check = await query(
      `SELECT r.*, u.email, u.full_name
       FROM ld_requests r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [id]
    );
    if (!check.rowCount) return res.status(404).json({ error: "REQUEST_NOT_FOUND" });
    const request = check.rows[0];

    await query(
      `UPDATE ld_requests
       SET status = $2,
           admin_note = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [id, status, admin_note || null]
    );

    // Send email notification to user
    await sendMail({
      to: request.email,
      subject: `Cập nhật yêu cầu L&D của bạn: [${status}]`,
      html: `<p>Chào ${request.full_name},</p><p>Yêu cầu đào tạo của bạn gửi ngày <strong>${request.created_at}</strong> đã được cập nhật trạng thái mới: <strong>${status}</strong>.</p>${admin_note ? `<p>Ghi chú từ admin: <em>"${admin_note}"</em></p>` : ""}`,
    });

    const result = await query("SELECT * FROM ld_requests WHERE id = $1", [id]);
    res.json({ request: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
