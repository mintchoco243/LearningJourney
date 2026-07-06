import { config } from "./config.js";
import { isMysqlUrl, mysqlPool, mysqlQuery, mysqlTransaction } from "./db-mysql.js";

let pgPool;
let useMockDb = false;

const mockDb = {
  users: [
    {
      id: 1,
      email: "demo@garena.vn",
      full_name: "Demo User",
      team: "L&D",
      rank: "Manager",
      role: "super_admin",
      is_active: true,
      notes: "Local mock admin account",
      xp_total: 150,
      hours_total: 12,
      onboarding_done: 1,
      class_archetype: "explorer",
      learning_formats: JSON.stringify(["Workshop", "Video"]),
      weekly_hours: 4,
      preferred_trainers: JSON.stringify(["L&D Team", "Data Guild"]),
      learning_goals: "Develop general professional skills",
      character: JSON.stringify({ hair: "short", outfit: "red", accessory: "none", skin: "s1" })
    },
    {
      id: 2,
      email: "linh.nguyen@garena.vn",
      full_name: "Linh Nguyen",
      team: "Publishing",
      rank: "Senior Associate",
      role: "Product",
      is_active: true,
      notes: "Prefers short workshop sessions",
      xp_total: 90,
      hours_total: 6,
      onboarding_done: 1,
      class_archetype: "strategist",
      learning_formats: JSON.stringify(["Workshop"]),
      weekly_hours: "2",
      preferred_trainers: JSON.stringify(["Product Guild"]),
      learning_goals: "Product thinking",
      character: JSON.stringify({ hair: "short", outfit: "red", accessory: "none", skin: "s1" })
    },
    {
      id: 3,
      email: "minh.tran@garena.vn",
      full_name: "Minh Tran",
      team: "Operations",
      rank: "Assistant Manager",
      role: "People Manager",
      is_active: false,
      notes: "Inactive mock user",
      xp_total: 40,
      hours_total: 3,
      onboarding_done: 0,
      class_archetype: "operator",
      learning_formats: JSON.stringify(["Online"]),
      weekly_hours: "1",
      preferred_trainers: JSON.stringify(["Ops Excellence"]),
      learning_goals: "Team management",
      character: JSON.stringify({ hair: "short", outfit: "red", accessory: "none", skin: "s1" })
    }
  ],
  courses: [
    {
      id: "00000000-0000-4000-8000-000000000101",
      course_code: "LC-101",
      title: "Product Thinking Foundations",
      trainer: "Product Guild",
      trainer_type: "internal",
      format: "workshop",
      duration_hours: 2,
      rating: 4.6,
      skill_tags: JSON.stringify(["product", "strategy"]),
      rank_targets: JSON.stringify(["Senior Associate", "Assistant Manager"]),
      role_targets: JSON.stringify(["Product"]),
      type: "scheduled",
      min_participants: 8,
      registration_url: "",
      description: "Hands-on product thinking workshop.",
      xp_reward: 80,
      is_active: true,
      status: "open",
      material_url: "",
      session_date: "2026-07-20",
      session_time: "10:00",
      location: "Training Room A",
      max_participants: 24,
      current_count: 1,
      enrolled_count: 1,
      created_at: "2026-07-01T00:00:00.000Z",
      updated_at: "2026-07-01T00:00:00.000Z"
    },
    {
      id: "00000000-0000-4000-8000-000000000102",
      course_code: "LC-102",
      title: "Data Storytelling",
      trainer: "Data Guild",
      trainer_type: "internal",
      format: "online",
      duration_hours: 1.5,
      rating: 4.4,
      skill_tags: JSON.stringify(["data", "communication"]),
      rank_targets: JSON.stringify(["Associate", "Senior Associate"]),
      role_targets: JSON.stringify(["General"]),
      type: "interest",
      min_participants: 10,
      registration_url: "",
      description: "Tell clearer stories with business data.",
      xp_reward: 60,
      is_active: true,
      status: "open",
      material_url: "",
      session_date: "2026-08-05",
      session_time: "14:00",
      location: "Google Meet",
      max_participants: 50,
      current_count: 1,
      enrolled_count: 0,
      created_at: "2026-07-02T00:00:00.000Z",
      updated_at: "2026-07-02T00:00:00.000Z"
    },
    {
      id: "00000000-0000-4000-8000-000000000103",
      course_code: "LC-103",
      title: "Leadership Essentials",
      trainer: "L&D Team",
      trainer_type: "internal",
      format: "elearning",
      duration_hours: 3,
      rating: 4.8,
      skill_tags: JSON.stringify(["leadership"]),
      rank_targets: JSON.stringify(["Assistant Manager", "Manager"]),
      role_targets: JSON.stringify(["People Manager"]),
      type: "elearning",
      min_participants: null,
      registration_url: "",
      description: "Self-paced leadership material.",
      xp_reward: 100,
      is_active: false,
      status: "draft",
      material_url: "https://example.com/material",
      session_date: null,
      session_time: null,
      location: "",
      max_participants: null,
      current_count: 0,
      enrolled_count: 0,
      created_at: "2026-07-03T00:00:00.000Z",
      updated_at: "2026-07-03T00:00:00.000Z"
    }
  ],
  enrollments: [
    { id: "enr-1", user_id: 1, course_id: "00000000-0000-4000-8000-000000000101", completed_at: "2026-07-03T09:00:00.000Z", source: "admin_import", xp_earned: 80, hours_earned: 2 }
  ],
  reservations: [
    { id: "res-1", user_id: 1, session_id: "00000000-0000-4000-8000-000000000101", reserved_at: "2026-07-04T09:00:00.000Z", status: "confirmed", notified_at: null },
    { id: "res-2", user_id: 2, session_id: "00000000-0000-4000-8000-000000000102", reserved_at: "2026-07-05T10:00:00.000Z", status: "pending", notified_at: null }
  ],
  ld_requests: [
    { id: "ldr-1", user_id: 2, full_name: "Linh Nguyen", email: "linh.nguyen@garena.vn", description: "Need advanced product analytics", status: "pending", created_at: "2026-07-04T08:00:00.000Z" }
  ],
  policies: [
    { id: "pol-1", category: "General", title: "Learning Policy", content: "Mock policy content", source_file: "mock", order_index: 1, is_active: true, updated_at: "2026-07-01T00:00:00.000Z" }
  ],
  site_feedback: [
    { id: "fb-1", is_anonymous: false, user_name: "Linh Nguyen", user_team: "Publishing", user_role: "Product", overall_rating: 5, aspect_ratings: JSON.stringify({ visual: 5, content: 4, usability: 5, usefulness: 4 }), aspect_feedback: JSON.stringify({}), additional_feedback: "Great experience.", status: "open", created_at: "2026-07-05T09:00:00.000Z" }
  ],
  testimonials: [
    { id: "tes-1", course_id: "00000000-0000-4000-8000-000000000101", course_code: "LC-101", course_title: "Product Thinking Foundations", user_name: "Demo User", user_role: "L&D", user_team: "L&D", rating: 5, content: "Useful and practical.", aspect_ratings: JSON.stringify({ overall: 5, content: 5, trainer: 5, organization_support: 4 }), applied_learning: "Better framing", improvement_feedback: "More examples", is_featured: true, created_at: "2026-07-04T00:00:00.000Z" }
  ],
  admin_accounts: [
    { email: "demo@garena.vn", full_name: "Demo User", role: "super_admin", is_active: 1 }
  ]
};

function handleMockQuery(text, params) {
  const sql = text.replace(/\s+/g, " ").trim();

  const withCounts = (user) => ({
    ...user,
    enrollments_count: mockDb.enrollments.filter((e) => String(e.user_id) === String(user.id)).length,
    completed_courses_count: mockDb.enrollments.filter((e) => String(e.user_id) === String(user.id)).length,
    reservations_count: mockDb.reservations.filter((r) => String(r.user_id) === String(user.id)).length,
    last_activity: mockDb.reservations.find((r) => String(r.user_id) === String(user.id))?.reserved_at || mockDb.enrollments.find((e) => String(e.user_id) === String(user.id))?.completed_at || null,
  });

  if (/admin_accounts/i.test(sql)) {
    const email = params[0] || "demo@garena.vn";
    const found = mockDb.admin_accounts.filter(a => a.email.toLowerCase() === email.toLowerCase());
    return { rows: found, rowCount: found.length };
  }

  if (/^SELECT COUNT\(\*\).*FROM users/i.test(sql)) {
    return { rows: [{ total_users: mockDb.users.length, onboarded_users: mockDb.users.filter((u) => u.onboarding_done).length }], rowCount: 1 };
  }

  if (/^SELECT COUNT\(\*\).*FROM enrollments/i.test(sql)) {
    return { rows: [{ enrollments_this_month: mockDb.enrollments.length, count: mockDb.enrollments.length }], rowCount: 1 };
  }

  if (/FROM enrollments GROUP BY source/i.test(sql)) {
    return { rows: [{ source: "admin_import", count: mockDb.enrollments.length }], rowCount: 1 };
  }

  if (/FROM ld_requests/i.test(sql)) {
    if (/COUNT\(\*\)/i.test(sql)) return { rows: [{ pending_ld_requests: mockDb.ld_requests.filter((r) => r.status === "pending").length }], rowCount: 1 };
    return { rows: mockDb.ld_requests, rowCount: mockDb.ld_requests.length };
  }

  if (/FROM policies/i.test(sql)) {
    return { rows: mockDb.policies, rowCount: mockDb.policies.length };
  }

  if (/UPDATE site_feedback SET status = \$(1|2)/i.test(sql)) {
    const statusIndex = /status = \$2/i.test(sql) ? 1 : 0;
    const idIndex = statusIndex === 1 ? 0 : 1;
    const item = mockDb.site_feedback.find((entry) => String(entry.id) === String(params[idIndex]));
    if (item) item.status = params[statusIndex];
    return { rows: item ? [item] : [], rowCount: item ? 1 : 0 };
  }

  if (/FROM site_feedback/i.test(sql)) {
    if (/WHERE id = \$1/i.test(sql)) {
      const found = mockDb.site_feedback.filter((item) => String(item.id) === String(params[0]));
      return { rows: found, rowCount: found.length };
    }
    return { rows: mockDb.site_feedback, rowCount: mockDb.site_feedback.length };
  }

  if (/FROM testimonials/i.test(sql)) {
    return { rows: mockDb.testimonials, rowCount: mockDb.testimonials.length };
  }

  if (/UPDATE courses SET/i.test(sql)) {
    const ids = params.filter((value) => mockDb.courses.some((course) => String(course.id) === String(value)));
    const updated = mockDb.courses.filter((course) => ids.includes(course.id));
    for (const course of updated) {
      if (/status\s*=\s*\$1/i.test(sql) || /status = 'confirmed'/i.test(sql)) {
        course.status = /status = 'confirmed'/i.test(sql) ? "confirmed" : params[0];
      }
      if (/type\s*=\s*\$1/i.test(sql)) course.type = params[0];
      if (/is_active\s*=\s*FALSE/i.test(sql)) course.is_active = false;
      course.updated_at = new Date().toISOString();
    }
    return { rows: updated, rowCount: updated.length };
  }

  if (/FROM courses/i.test(sql)) {
    if (/WHERE id = \$1/i.test(sql)) {
      const found = mockDb.courses.filter((course) => String(course.id) === String(params[0]));
      return { rows: found, rowCount: found.length };
    }
    if (/ORDER BY enrolled_count DESC/i.test(sql)) {
      const rows = [...mockDb.courses].sort((a, b) => Number(b.enrolled_count || 0) - Number(a.enrolled_count || 0)).slice(0, 5);
      return { rows, rowCount: rows.length };
    }
    return { rows: mockDb.courses, rowCount: mockDb.courses.length };
  }

  if (/FROM enrollments e JOIN courses/i.test(sql)) {
    const userId = params[0];
    const rows = mockDb.enrollments
      .filter((e) => String(e.user_id) === String(userId))
      .map((e) => ({ ...e, ...mockDb.courses.find((c) => c.id === e.course_id), course_title: mockDb.courses.find((c) => c.id === e.course_id)?.title }));
    return { rows, rowCount: rows.length };
  }

  if (/FROM users u/i.test(sql)) {
    return { rows: mockDb.users.map(withCounts), rowCount: mockDb.users.length };
  }

  if (/FROM reservations r JOIN users/i.test(sql)) {
    const courseId = params[0];
    const rows = mockDb.reservations
      .filter((r) => String(r.session_id) === String(courseId))
      .map((r) => ({ ...r, ...mockDb.users.find((u) => String(u.id) === String(r.user_id)) }));
    return { rows, rowCount: rows.length };
  }

  if (/FROM reservations r JOIN courses/i.test(sql) || /FROM reservations r JOIN courses s/i.test(sql)) {
    const userId = params[0];
    const rows = mockDb.reservations
      .filter((r) => String(r.user_id) === String(userId))
      .map((r) => {
        const c = mockDb.courses.find((course) => course.id === r.session_id) || {};
        return { ...r, course_code: c.course_code, course_title: c.title, session_date: c.session_date, session_time: c.session_time, location: c.location };
      });
    return { rows, rowCount: rows.length };
  }

  if (/FROM reservations/i.test(sql)) {
    const rows = mockDb.reservations;
    return { rows, rowCount: rows.length };
  }

  if (/UPDATE\s+reservations\s+SET/i.test(sql)) {
    const reservationId = params.at(-1);
    const reservation = mockDb.reservations.find((item) => String(item.id) === String(reservationId));
    if (reservation) {
      if (/status = \$1/i.test(sql)) reservation.status = params[0];
      if (/notified_at = \$2/i.test(sql)) reservation.notified_at = params[1] || null;
    }
    return { rows: reservation ? [reservation] : [], rowCount: reservation ? 1 : 0 };
  }

  if (/INSERT\s+INTO\s+users/i.test(sql)) {
    const email = (params[0] || "demo@garena.vn").toLowerCase();
    const fullName = params[1] || email.split("@")[0];
    const avatarUrl = params[2] || null;
    let found = mockDb.users.find(u => u.email.toLowerCase() === email);
    if (!found) {
      found = {
        id: mockDb.users.length + 1,
        email,
        full_name: fullName,
        avatar_url: avatarUrl,
        role: "super_admin",
        xp_total: 0,
        onboarding_done: 0,
        class_archetype: null,
        learning_formats: JSON.stringify([]),
        weekly_hours: 0,
        preferred_trainers: JSON.stringify([]),
        learning_goals: "",
        is_active: true,
        team: "Local",
        rank: "Associate",
        character: JSON.stringify({ hair: "short", outfit: "red", accessory: "none", skin: "s1" })
      };
      mockDb.users.push(found);
    } else {
      found.full_name = fullName;
      found.avatar_url = avatarUrl;
    }
    return { rows: [found], rowCount: 1 };
  }

  if (/UPDATE\s+users\s+SET/i.test(sql)) {
    const ids = params.filter((value) => mockDb.users.some((user) => String(user.id) === String(value)));
    const updated = mockDb.users.filter((user) => ids.includes(String(user.id)) || ids.includes(user.id));
    for (const user of updated) {
      if (/team\s*=/i.test(sql)) user.team = params[0] ?? user.team;
      if (/rank\s*=/i.test(sql)) user.rank = params[/team\s*=/i.test(sql) ? 1 : 0] ?? user.rank;
      if (/role\s*=/i.test(sql)) {
        const roleIndex = [/\bteam\s*=/i, /\brank\s*=/i].filter((regex) => regex.test(sql)).length;
        user.role = params[roleIndex] ?? user.role;
      }
      if (/notes\s*=/i.test(sql)) {
        const notesIndex = [/\bteam\s*=/i, /\brank\s*=/i, /\brole\s*=/i].filter((regex) => regex.test(sql)).length;
        user.notes = params[notesIndex] ?? user.notes;
      }
      if (/is_active\s*=/i.test(sql)) {
        const activeIndex = [/\bteam\s*=/i, /\brank\s*=/i, /\brole\s*=/i, /\bnotes\s*=/i].filter((regex) => regex.test(sql)).length;
        user.is_active = Boolean(params[activeIndex]);
      }
      user.updated_at = new Date().toISOString();
    }
    return { rows: updated.map(withCounts), rowCount: updated.length };
  }

  if (/DELETE\s+FROM\s+enrollments/i.test(sql)) {
    const [userId, courseId] = params;
    const before = mockDb.enrollments.length;
    mockDb.enrollments = mockDb.enrollments.filter((item) => !(String(item.user_id) === String(userId) && String(item.course_id) === String(courseId)));
    return { rows: [], rowCount: before - mockDb.enrollments.length };
  }

  if (/INSERT\s+INTO\s+enrollments/i.test(sql)) {
    const [userId, courseId, completedAt, source, xpEarned, hoursEarned] = params;
    let enrollment = mockDb.enrollments.find((item) => String(item.user_id) === String(userId) && String(item.course_id) === String(courseId));
    if (!enrollment) {
      enrollment = { id: `enr-${mockDb.enrollments.length + 1}`, user_id: userId, course_id: courseId };
      mockDb.enrollments.push(enrollment);
    }
    enrollment.completed_at = completedAt || new Date().toISOString();
    enrollment.source = source || "admin";
    enrollment.xp_earned = Number(xpEarned || 0);
    enrollment.hours_earned = Number(hoursEarned || 0);
    return { rows: [enrollment], rowCount: 1 };
  }

  if (/SELECT.*FROM\s+users/i.test(sql)) {
    const emailOrId = params[0];
    if (!emailOrId) return { rows: mockDb.users.map(withCounts), rowCount: mockDb.users.length };
    const found = emailOrId
      ? mockDb.users.find(u => u.email.toLowerCase() === String(emailOrId).toLowerCase() || String(u.id) === String(emailOrId))
      : mockDb.users[0];
    return { rows: found ? [withCounts(found)] : [], rowCount: found ? 1 : 0 };
  }

  return { rows: [], rowCount: 0 };
}

async function getPgPool() {
  const pg = await import("pg");
  const { Pool } = pg.default || pg;
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.nodeEnv === "production" ? { rejectUnauthorized: false } : false,
    });
  }
  return pgPool;
}

export const pool = {
  query: async (text, params = []) => query(text, params),
  end: async () => {
    if (useMockDb) return;
    if (isMysqlUrl()) return mysqlPool().end();
    if (pgPool) return pgPool.end();
  },
};

export async function query(text, params = []) {
  if (useMockDb) {
    return handleMockQuery(text, params);
  }
  try {
    if (isMysqlUrl()) return await mysqlQuery(text, params);
    const pgPool = await getPgPool();
    return await pgPool.query(text, params);
  } catch (error) {
    if (error.code === "ECONNREFUSED" || error.message.includes("ECONNREFUSED") ||
        error.message.includes("Access denied") || error.message.includes("connect")) {
      console.warn("\n========================================================");
      console.warn("⚠️  DATABASE CONNECTION FAILED! Running in Local Mock Mode.");
      console.warn("========================================================\n");
      useMockDb = true;
      return handleMockQuery(text, params);
    }
    throw error;
  }
}

export async function withTransaction(fn) {
  if (useMockDb) {
    const client = {
      query: async (sql, params = []) => handleMockQuery(sql, params),
    };
    return fn(client);
  }
  try {
    if (isMysqlUrl()) return await mysqlTransaction(fn);
    const pgPool = await getPgPool();
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.code === "ECONNREFUSED" || error.message.includes("ECONNREFUSED") ||
        error.message.includes("Access denied") || error.message.includes("connect")) {
      console.warn("\n========================================================");
      console.warn("⚠️  DATABASE CONNECTION FAILED! Running in Local Mock Mode.");
      console.warn("========================================================\n");
      useMockDb = true;
      const client = {
        query: async (sql, params = []) => handleMockQuery(sql, params),
      };
      return fn(client);
    }
    throw error;
  }
}
