# 🏗️ 01 — Architecture

# 01 — Architecture

## Stack

| Layer | Công nghệ | Ghi chú |
|-------|-----------|---------|
| **Frontend** | HTML / CSS / Vanilla JS | Tách thành 3 file: `index.html`, `style.css`, `app.js` |
| **Backend** | Node.js 20 + Express | REST API, xử lý auth, business logic |
| **Database** | PostgreSQL | Relational |
| **Auth** | Google OAuth 2.0 | Chỉ accept `@garena.vn` |
| **Email** | SMTP nội bộ Garena | Trigger theo event tự động |
| **Chat Bot** | Alpha Intelligence API (nội bộ) | Endpoint TBD — xem `06_admin_and_ops` OQ7 |
| **Admin Site** | Trang web riêng | Cùng backend, route `/admin/*`, whitelist theo account |
| **Deploy** | Server nội bộ Garena | Qua anh Kiên |


---

## Cấu trúc File Project

```
garena-learning-hub/
├── .env
├── package.json
│
├── server/
│   ├── index.js                  # Entry point Express
│   ├── db.js                     # PostgreSQL connection pool
│   ├── auth.js                   # Google OAuth setup, JWT helpers
│   ├── middleware/
│   │   ├── requireAuth.js        # Validate JWT, attach req.user
│   │   └── requireAdmin.js       # Check admin_accounts whitelist
│   ├── routes/
│   │   ├── auth.js               # /auth/*
│   │   ├── me.js                 # /api/me/*
│   │   ├── courses.js            # /api/courses/*
│   │   ├── sessions.js           # /api/sessions/*
│   │   ├── ldRequests.js         # /api/ld-requests/*
│   │   ├── policies.js           # /api/policies/*
│   │   └── admin/
│   │       ├── courses.js
│   │       ├── sessions.js
│   │       ├── users.js
│   │       ├── ldRequests.js
│   │       ├── policies.js
│   │       ├── accounts.js
│   │       └── stats.js
│   └── services/
│       ├── mail.js               # SMTP email sender
│       ├── xpCalculator.js       # XP suggestion logic
│       └── importParser.js       # Parse CSV/Excel/Docx
│
├── public/                       # Frontend user
│   ├── index.html
│   ├── style.css
│   └── app.js
│
└── admin/                        # Frontend admin (served riêng)
    ├── index.html
    ├── admin.css
    └── admin.js
```


---

## Auth Flow

```
GET /auth/google
  → redirect Google consent (scope: profile, email)

GET /auth/callback
  → nhận code từ Google
  → lấy profile: { email, name, picture }
  → validate email.endsWith('@garena.vn') → 401 nếu không đúng
  → upsert vào bảng users
  → ký JWT: { userId, email, iat, exp: 7 ngày }
  → set httpOnly cookie hoặc redirect với token

POST /auth/logout
  → xóa cookie
```

### `requireAuth` middleware

```js
// Gắn vào tất cả /api/* routes
// Đọc JWT từ Authorization: Bearer <token> hoặc httpOnly cookie
// Verify → attach req.user = { id, email }
// 401 nếu token invalid/expired
```

### `requireAdmin` middleware

```js
// Gắn vào tất cả /admin/api/* routes
// Sau requireAuth: query admin_accounts WHERE email = req.user.email AND is_active = true
// 403 nếu không có trong whitelist
// Attach req.adminRole = 'super_admin' | 'ld_admin'
```


---

## Environment Variables

```env
# Server
PORT=process.env.PORT || 3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/garena_learning_hub

# Google OAuth
GOOGLE_CLIENT_ID=<từ anh Kiên>
GOOGLE_CLIENT_SECRET=<từ anh Kiên>
GOOGLE_CALLBACK_URL=https://<domain>/auth/callback

# JWT
JWT_SECRET=<random 64-char string>
JWT_EXPIRES_IN=7d

# Email SMTP
SMTP_HOST=<từ anh Kiên>
SMTP_PORT=587
SMTP_USER=<từ anh Kiên>
SMTP_PASS=<từ anh Kiên>
SMTP_FROM=learning-hub@garena.vn
LD_ADMIN_EMAIL_GROUP=ld-team@garena.vn

# Chat Bot
AI_CHAT_ENDPOINT=TBD
AI_CHAT_API_KEY=TBD

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

> **Lưu ý:** Không hardcode PORT. Platform nội bộ có thể assign dynamic port.