import { pool, query } from "../db.js";
import { sendMail } from "../services/mail.js";

async function run() {
  console.log("⏰ Starting 48h Session Reminder Cron Job...");
  try {
    // Find all sessions happening exactly 2 days from now
    const result = await query(
      `SELECT s.*, c.title AS course_title
       FROM course_sessions s
       JOIN courses c ON s.course_id = c.id
       WHERE s.session_date = DATE_ADD(CURRENT_DATE(), INTERVAL 2 DAY)`
    );

    console.log(`Found ${result.rowCount} session(s) scheduled for 2 days from now.`);

    for (const session of result.rows) {
      console.log(`Processing session: ${session.course_title} (ID: ${session.id})`);
      
      // Get all confirmed reservation holders
      const usersRes = await query(
        `SELECT u.email, u.full_name
         FROM reservations r
         JOIN users u ON r.user_id = u.id
         WHERE r.session_id = $1 AND r.status = 'confirmed'`,
        [session.id]
      );

      console.log(`Sending reminders to ${usersRes.rowCount} confirmed participants...`);

      for (const user of usersRes.rows) {
        await sendMail({
          to: user.email,
          subject: `Nhắc nhở: Khóa học [${session.course_title}] diễn ra sau 2 ngày`,
          html: `
            <p>Chào ${user.full_name},</p>
            <p>Đây là email nhắc nhở từ Ban L&D Garena. Khóa học <strong>${session.course_title}</strong> mà bạn đăng ký sẽ bắt đầu sau 2 ngày nữa:</p>
            <ul>
              <li><strong>Thời gian:</strong> ${session.session_date} lúc ${session.session_time || "Chưa cập nhật"}</li>
              <li><strong>Địa điểm:</strong> ${session.location || "Online"}</li>
            </ul>
            <p>Vui lòng chuẩn bị và sắp xếp thời gian tham gia đầy đủ. Xin cảm ơn!</p>
          `,
        });
      }
    }

    console.log("✅ Cron job finished successfully.");
  } catch (error) {
    console.error("❌ Cron job failed with error:", error);
  } finally {
    await pool.end();
  }
}

run();
