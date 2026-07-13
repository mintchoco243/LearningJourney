# Learning Compass — Implementation Session Guide

## Tech stack nhanh
- **Frontend**: Next.js app ở `frontend/`, viết React không có JSX (toàn `React.createElement(...)`), CSS custom properties theming
- **Backend**: Node.js/Express + MySQL tại `server/`, DB helper: `query()` từ `server/db.js`, migrations auto-run qua `server/migrate.js`
- **Pattern CSS theme**: `var(--ui-heading)`, `var(--ui-muted)`, `var(--ui-box-border)`, `var(--glh-accent)` — không dùng màu cứng
- **Pattern layout**: `className: "glh-container fade-screen"` + `padding: "28px clamp(16px,4vw,40px) 80px"` — chuẩn cho mọi trang
- **Icon**: `GLHUI.js` → `Icon({ name, size, color })` — trả `null` nếu name không có trong `PATHS`; tên có: `"edit-3"` (bút chì), KHÔNG có `"edit"`
- **State trung tâm**: `GameContext.js` — `persist()` lưu cả state lẫn localStorage
- **Dev server**: `npm run dev` trong `frontend/` + `node server/index.js` (hoặc `npm start` nếu có)

## Đã đúng — KHÔNG động vào
- Onboarding 1 lần, wiring `showAbout`/`onOpenAbout`, không còn nút replay tour
- Không còn nút "Quay lại"/"Dashboard" thừa ở Policy/Dashboard
- Kho Đổi Quà ẩn khỏi nav
- Popup xác nhận đăng ký khoá học (`GLHParts.js` `reserveCourse()`)
- Course card: không dim, status badge, sort priority — tất cả đúng
- **Backend FAQ** (`server/routes/faqs.js`, `server/routes/admin/faqs.js`, migration `017_faqs_mysql.sql`) — ĐÚNG, không sửa
- Filter logic (containment check rank/source) trong `CatalogCalendar.js` — logic đúng, chỉ values/labels sai

---

## CÁC TASK CẦN THỰC HIỆN (theo thứ tự)

---

### TASK 1 — Header: bỏ job title + verify alignment
**File**: `frontend/src/app/page.js`

**1a. Xoá job title** (2 vị trí):
- Dòng 203: xoá `React.createElement("div", { className: "lv" }, user.db_team || user.db_role || "Learning Compass")`
- Dòng 271: xoá `React.createElement("div", { className: "lv" }, user.db_team || user.db_role || "Learning Compass")`
- Chỉ giữ avatar + tên (`nm`), không giữ `.lv`

**1b. Verify alignment bằng browser**:
- Start dev server, mở Home, dùng `preview_inspect` so sánh:
  - `left` của tab "Trang chủ" vs `left` của `.dash-hero` (content bên dưới)
  - `right` của cụm nút+profile vs `right` của content
- Nếu lệch: nguyên nhân là `marginLeft: -14` hack tại dòng 159 (chỉ áp cho tab logo/Home, không áp 3 tab còn lại). Sửa: bỏ hack đó, thay bằng điều chỉnh `.appbar__link` padding hoặc `.appbar__nav` margin trong `globals.css` để cả dãy tab thẳng lề trái với content — kiểm tra CSS hiện tại tại `globals.css:907-924` trước khi sửa

---

### TASK 2 — About modal: sửa nội dung + overflow
**File**: `frontend/src/components/screens/AboutModal.js`

**Xoá** toàn bộ phần body hiện tại (dòng 40–59: đoạn gamification + 2 box + email).

**Thêm** phần thân mới với `maxHeight: "80vh", overflowY: "auto"` — 4 khối nội dung **verbatim**:

```
1. "Learning Compass là gì?"
   → "Nơi tập trung các khóa học, lịch đào tạo, chính sách học tập và các kênh request hỗ trợ đào tạo tại Garena."

2. "Dành cho ai?"
   • Nhân viên muốn tìm khóa học phù hợp.
   • Manager/HRBP muốn tham khảo learning path/recommendation.
   • L&D dùng để truyền thông và quản lý thông tin đào tạo.

3. "Có thể làm gì trên site?"
   • Xem khóa học được gợi ý theo vai trò và rank
   • Tìm lịch đào tạo sắp tới
   • Đăng ký tham gia khoá học
   • Gửi yêu cầu học tập hoặc đề xuất khoá mới
   • Xem chính sách L&D của công ty
   • Tra cứu câu hỏi thường gặp (FAQ)

4. "Cách bắt đầu nhanh"
   • Vào "Trang chủ" để xem gợi ý khoá học dành riêng cho bạn.
   • Vào "Thư viện" để lọc và tìm kiếm khoá học theo nhu cầu.
   • Nếu chưa tìm thấy khoá phù hợp, hãy "Gửi yêu cầu học tập" hoặc đăng ký hỗ trợ chi phí đào tạo.
```

**Giữ nguyên**: header (logo + "Về Garena Learning Compass"), nút đóng `×`, footer nút "Đã hiểu".

**Test sau sửa**: mở từ cả appbar desktop và sidebar mobile, xác nhận modal hiển thị đúng, không tràn.

---

### TASK 3 — Catalog: fix rankOptions + sourceOptions + placeholder
**File**: `frontend/src/components/screens/CatalogCalendar.js`

**Sửa `rankOptions`** (dòng 69–76) — đổi thành đúng 5 rank tổ chức:
```js
const rankOptions = [
  { id: "Associate", label: "Associate" },
  { id: "Senior Associate", label: "Senior Associate" },
  { id: "Assistant Manager", label: "Assistant Manager" },
  { id: "Manager", label: "Manager" },
  { id: "Senior Manager", label: "Senior Manager" },
];
```
Đổi `Sel` placeholder rank (dòng ~169) từ `"Rank"` → `"Tất cả rank"`

**Sửa `sourceOptions`** (dòng 77–80):
```js
const sourceOptions = [
  { id: "internal", label: "Khóa nội bộ" },
  { id: "external", label: "Khóa bên ngoài / Learning Budget Sponsor" },
];
```
Đổi `Sel` placeholder source (dòng ~170) từ `"Nguồn khóa học"` → `"Tất cả nguồn"`

**Không đổi**: filter logic (containment check `ranks.includes(rankFilter)` và `c.trainer_type !== sourceFilter`) — đã đúng.

---

### TASK 4 — Catalog: thêm 2 CTA button cạnh search
**File**: `frontend/src/components/screens/CatalogCalendar.js`

Tại khu vực search bar (dòng ~160–163), bọc search + 2 nút trong flex-wrap row:
```js
React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 } },
  /* search input (giữ nguyên) */,
  React.createElement("a", {
    href: "https://gigi.garena.vn/form/46",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "glh-btn glh-btn--secondary",
    style: { whiteSpace: "nowrap", textDecoration: "none" }
  }, "Đăng ký hỗ trợ chi phí đào tạo"),
  React.createElement("button", {
    className: "glh-btn glh-btn--primary",
    style: { whiteSpace: "nowrap" },
    onClick: () => props.onOpenLdRequest && props.onOpenLdRequest()
  }, "Gửi yêu cầu hỗ trợ đào tạo")
)
```
`props.onOpenLdRequest` đã được truyền từ `page.js` qua `utilCommon` — không tạo modal mới. Giữ nguyên banner cuối trang.

---

### TASK 5 — FAQ Frontend: fix bugs + layout + accordion + search
**File**: `frontend/src/components/screens/FAQScreen.js`

**Bug 1 — fetch sai (dòng 28)**:
```js
// SAI:
if (Array.isArray(data) && data.length > 0) { setFaqs(data); }
// ĐÚNG:
if (data.faqs && Array.isArray(data.faqs)) { setFaqs(data.faqs); }
```

**Bug 2 — field name sai**: đổi toàn bộ `item.q` → `item.question`, `item.a` → `item.answer`

**Xoá hẳn**:
- `FALLBACK_FAQS` constant (dòng 10–15) và mọi `D.FAQS` reference
- `import { GLH_DATA }` và `const D = GLH_DATA` (không dùng nữa)
- `const [selectedTopic, setSelectedTopic]` state (thay bằng `openTopics`)

**Fix layout (dòng 57–62)**:
- Đổi `padding: "32px ..."` → `"28px clamp(16px,4vw,40px) 80px"`
- Bỏ wrapper `<div style={{ maxWidth: 840, margin: "0 auto" }}>` bọc toàn bộ
- Heading căn trái (bỏ `textAlign: "center"`)
- Pattern heading: `h2` cỡ 20px, fontWeight 700, giống `CatalogCalendar.js:156`

**Đổi placeholder** (dòng ~69): `"Tìm kiếm chính sách, quy trình, câu hỏi"`

**Đổi topic pills → accordion** (thay dòng 82–89):
```js
// State mới:
const [openTopics, setOpenTopics] = React.useState(new Set());

// Topics list (unique từ faqs.topic)
// Mỗi topic = 1 card:
// - Header có nút "+"/"-" toggle
// - Body là list FAQ items trong topic (dùng expandedId cho từng câu hỏi)
// Có thể mở nhiều topic cùng lúc (Set)
```

**Fix filteredFaqs search** (dòng 48–55): match cả `topic`, `question`, `answer`, `keywords`
```js
const matchSearch = !qLower ||
  (item.topic && item.topic.toLowerCase().includes(qLower)) ||
  (item.question && item.question.toLowerCase().includes(qLower)) ||
  (item.answer && item.answer.toLowerCase().includes(qLower)) ||
  (item.keywords && item.keywords.toLowerCase().includes(qLower));
```
Khi search active: hiển thị flat list + dòng `"Tìm thấy {x} kết quả"` phía trên

**Empty state** (dòng 93–98): `"Không tìm thấy nội dung phù hợp. Bạn có thể gửi câu hỏi cho L&D qua Seatalk."` — bỏ nút "Xem tất cả câu hỏi"

**Giữ nguyên**: loading state, footer banner (mailto contact)

**Backend field names** (tham khảo): `id, topic, question, answer, keywords, status, display_order, updated_at`

---

### TASK 6 — Avatar: persist to DB (migration + API + GameContext)
**Tạo migration mới**: `server/migrations/018_add_character_to_users_mysql.sql`
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS character JSON;
```

**Sửa `server/routes/me.js`** — `PUT /` (dòng 36–50):
- Thêm `character` vào destructure `req.body`
- Thêm `character = COALESCE($n, character)` vào UPDATE SET clause
- Tăng `$n` index tương ứng và thêm vào params array

**Sửa `frontend/src/context/GameContext.js`**:

1. `setUserProfile` (dòng ~161–193): thêm `character: profile.character || user.character` vào object truyền vào `persist()`

2. `setCharacter` (dòng 194): thêm API call trước `persist()`:
```js
setCharacter(character) {
  fetch("/api/me", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ character })
  });
  persist(Object.assign({}, user, { character }));
}
```

**Không cần sửa**: `GET /api/me` dùng `SELECT *` tự trả `character` sau khi có cột; `ProfilePolicy.js` chỗ gọi `actions.setCharacter(newChar)` giữ nguyên.

---

### TASK 7 — Avatar edit UX: export modal + fix icon + giảm size + fix theme

**`frontend/src/components/screens/ProfilePolicy.js`**:
1. Dòng ~127: thêm `export` → `export function AvatarEditModal(`
2. Dòng 153 (skin swatch border): `"2px solid rgba(255,255,255,0.2)"` → `"2px solid var(--ui-box-border)"`
3. Dòng 161 (outfit selected border): `"3px solid #fff"` → `"3px solid var(--glh-accent)"`
4. Dòng ~250–269 (nút edit avatar trong Profile): `name: "edit"` → `name: "edit-3"`, giảm size xuống 22–24px/icon 11–12

**`frontend/src/components/screens/Dashboard.js`**:
1. Import: `import { AvatarEditModal } from './ProfilePolicy';`
2. Thêm state: `const [showAvatarEdit, setShowAvatarEdit] = React.useState(false);`
3. Dòng ~266: đổi `onClick: () => props.onNav("profile")` → `onClick: () => setShowAvatarEdit(true)`
4. Sửa icon nút: `name: "edit"` → `name: "edit-3"`, giảm kích thước nút xuống 22–24px/icon 11–12
5. Render modal (sau return hoặc cuối JSX block):
```js
showAvatarEdit && React.createElement(AvatarEditModal, {
  initialChar: user.character,
  crisp: props.crisp,
  onClose: () => setShowAvatarEdit(false),
  onSave: c => actions.setCharacter(c)
})
```

---

### TASK 8 — Calendar: chuyển sang Home, bỏ khỏi Catalog tab

**`frontend/src/components/screens/Dashboard.js`**:
1. Import: `import { Calendar } from './CatalogCalendar';`
2. Xoá `UpcomingList` và `UpcomingItem` functions (dòng ~33–88)
3. Xoá các import chỉ dùng cho chúng: `getUpcomingCourses`, `FORMAT_LABEL`, `DOW_VI`, `MONTHS_VI` (nếu không dùng ở chỗ khác)
4. Tại section "Lịch sắp tới" (dòng ~315–321): thay toàn bộ block bằng:
   ```js
   React.createElement(Calendar, { onOpenCourse: props.onOpenCourse })
   ```
5. Xoá `action: { label: "Xem tất cả →", ... }` — bỏ hẳn nút này

**`frontend/src/app/page.js`**:
1. Xoá block `<Calendar>` khỏi tab `"library"` (dòng ~479–482)
2. Cập nhật import từ `CatalogCalendar.js` — bỏ `Calendar` nếu `page.js` không dùng nữa

**`frontend/src/components/screens/CatalogCalendar.js`** — month view (dòng ~369–378):
- Địa điểm hiện chỉ trong tooltip `title`, thêm visible text bên dưới giờ+tên khóa trong ô sự kiện
- Kiểm tra CSS `.cal-ev` có `overflow: hidden` hoặc `max-height` cứng không → chỉnh nếu cắt chữ

**QA sau khi nhúng**: kiểm tra `Calendar` root có `className: "glh-container"` không — nếu có sẽ bị double-padding khi nhúng vào Dashboard. Nếu bị: bỏ `glh-container` khỏi Calendar root hoặc tách riêng Calendar wrapper trong Dashboard ra ngoài container.

---

## DEFERRED (làm sau cùng)
**FAQ Admin UI** — CRUD quản lý FAQ trong Admin site. Backend đã sẵn (`server/routes/admin/faqs.js`), chỉ thiếu UI. Nhắc lại khi 8 task trên xong.

---

## Checklist kiểm tra cuối

- [ ] Header: không còn job title; 4 tab thẳng lề trái, cụm nút+profile thẳng lề phải, khớp content
- [ ] About modal: 4 khối nội dung đúng, không tràn, đóng được
- [ ] Catalog rank filter: 5 tên rank tổ chức, lọc đúng course; source filter đúng label
- [ ] Catalog: 2 CTA button hoạt động (link mở tab mới, button mở LdRequest popup)
- [ ] FAQ: load FAQ thật từ DB; search theo question/answer/keywords/topic; accordion expand/collapse; padding/heading căn trái; placeholder đúng; empty state đúng
- [ ] Home: Calendar đầy đủ tính năng xuất hiện; không có "Xem tất cả →"; Catalog tab không còn Calendar block
- [ ] Avatar: chỉnh xong → refresh/logout/login lại → giữ nguyên (DB); popup mở từ Home lẫn Profile; icon bút chì hiển thị; size gọn; theme dark/light đọc rõ
