# Hướng Dẫn Tích Hợp Mini Game Garena Skill Snake Vào Website Đào Tạo (Learning Site)

Tài liệu này hướng dẫn chi tiết cách nhúng và tích hợp mini game **Garena Skill Snake** vào trang web Đào Tạo (Learning Site) của Garena Việt Nam qua iframe và cơ chế truyền tin hai chiều `postMessage`.

---

## 1. Cấu Trúc Thư Mục Game

Đặt toàn bộ thư mục `garena-skill-snake` vào thư mục static hoặc public của ứng dụng Learning Site:

```text
garena-skill-snake/
├── assets/
│   ├── head.png           # Mascot / Snake Head Icon (40x40px)
│   ├── chest_lvl1.png     # Rương Đồng (+10 XP)
│   ├── chest_lvl2.png     # Rương Bạc (+25 XP)
│   └── generate_assets.py # Script sinh asset tự động
├── snake.html             # Single-file HTML5 Canvas Mini Game
└── INTEGRATION_GUIDE.md   # Hướng dẫn tích hợp này
```

---

## 2. Mã Nguồn HTML Modal & Iframe Trở Thành Popup (Parent Window)

Thêm đoạn HTML modal và iframe sau vào trang chính của Learning Site:

```html
<!-- Modal Container Overlay cho Mini Game -->
<div id="garenaGameModal" class="garena-game-modal-overlay" style="display: none;">
  <div class="garena-game-modal-wrapper">
    <iframe 
      id="garenaGameIframe"
      src="/garena-skill-snake/snake.html"
      frameborder="0"
      allowtransparency="true"
      style="width: 100%; height: 100%; border: none; border-radius: 24px;">
    </iframe>
  </div>
</div>

<!-- Style Modal Background & Animation -->
<style>
  .garena-game-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(11, 14, 20, 0.85);
    backdrop-filter: blur(10px);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .garena-game-modal-wrapper {
    width: 500px;
    height: 650px;
    max-width: 95vw;
    max-height: 95vh;
  }
</style>
```

---

## 3. Danh Sách Nhiệm Vụ & Mã Nhiệm Vụ (Task IDs)

User mới bắt đầu với **0 lượt chơi**. Hệ thống có 2 nhiệm vụ một lần và 6 nhiệm vụ tự động reset mỗi ngày (00:00, múi giờ Việt Nam):

| Task ID | Tên Nhiệm Vụ | Thời Gian / Điều Kiện | Phần Thưởng | Tự Động Reset |
| :--- | :--- | :--- | :--- | :--- |
| `task_first_login` | 👋 Hoàn tất đăng nhập lần đầu | Đăng nhập và hoàn thành Onboarding Quiz | +1 lượt chơi | Không reset |
| `task_daily_login` | 📅 Đăng nhập hàng ngày | Mỗi ngày vào web | +1 lượt chơi | Tự động hoàn thành mỗi ngày |
| `task_fav_3` | ⭐ Yêu thích 3 khóa học bất kỳ | Yêu thích 3 khóa trong ngày | +1 lượt chơi | Hàng ngày |
| `task_1` | 🌐 Khám phá Trang chủ 30s | 30 giây | +1 lượt chơi | Hàng ngày |
| `task_2` | 📚 Khám phá Thư viện đào tạo 30s | 30 giây | +1 lượt chơi | Hàng ngày |
| `task_3` | 📖 Xem 1 khóa học bất kỳ 15s | 15 giây | +1 lượt chơi | Hàng ngày |
| `task_4` | ✅ Đánh dấu hoàn thành 1 khóa học | Tức thì khi xong | +1 lượt chơi | Hàng ngày |

---

## 4. JavaScript Xử Lý Sự Kiện postMessage & Đếm Thời Gian (Parent Window)

```javascript
// Lắng nghe Message từ Iframe Mini Game
window.addEventListener('message', function(event) {
  const data = event.data;
  if (!data || !data.type) return;

  switch (data.type) {
    case 'GARENA_GAME_OVER':
      saveUserGameScore(data.score, data.highScore);
      break;

    case 'GARENA_CLOSE_GAME':
      closeGarenaGameModal();
      break;

    case 'GARENA_TASK_CLAIMED':
      console.log(`[Garena Skill Snake] Nhận thưởng nhiệm vụ: ${data.taskId}`);
      break;
  }
});

// Gửi thông báo hoàn thành nhiệm vụ sang Iframe Game
function notifyTaskCompleted(taskId) {
  const iframe = document.getElementById('garenaGameIframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({
      type: 'TASK_COMPLETED_EXTERNAL',
      taskId: taskId
    }, '*');
  }
}

// Ví dụ khi Học viên bấm yêu thích đủ 3 khóa học:
function onUserFavoritedThreeCourses() {
  notifyTaskCompleted('task_fav_3');
}
```
