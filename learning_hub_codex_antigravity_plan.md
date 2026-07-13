# Prompt & Implementation Plan cho Codex / Antigravity

## Learning Compass - Update theo feedback chị Vanh

Bạn hãy update Learning Compass theo các yêu cầu bên dưới.  
Mục tiêu là sửa UI/UX và logic hiển thị theo feedback của chị Vanh, tận dụng các field/data hiện có nếu đã có sẵn.

---

# 0. Nguyên tắc thực hiện

- Không thay đổi scope ngoài các yêu cầu trong plan này.
- Ưu tiên sửa theo hướng đơn giản, ổn định, dễ maintain.
- Tận dụng component/card/filter hiện có nếu có thể.
- Đảm bảo responsive trên desktop và mobile.
- Không hard-code data nếu có thể đưa vào Admin hoặc dùng field data hiện có.
- Sau khi sửa, kiểm tra lại các page chính:
  - Home / Dashboard
  - Thư viện đào tạo / Course Catalog
  - Chính sách & Hướng dẫn L&D
  - FAQ
  - Course modal / registration flow
  - Header / appbar

---

# 1. Header / Appbar / Navigation

## 1.1. Căn lại logo / button trang chủ

Yêu cầu:

- Căn button “Garena Learning Compass” trên header thẳng hàng với lề trái của content bên dưới.
- Kiểm tra lại container width/margin giữa header và main content.
- Cân đối lại khoảng cách giữa các phần trên appbar:
  - Logo/home
  - Main navigation
  - Quick tools
  - Profile/avatar

Gợi ý implementation:

- Dùng chung một max-width container cho cả header và main content.
- Header content nên có cùng left/right padding với body content.
- Nếu appbar có nhiều nhóm item, chia layout thành:
  - Left: logo/home
  - Center: navigation
  - Right: quick actions/profile
- Tránh để logo bị thụt vào so với content.

Acceptance criteria:

- Logo/home button align thẳng theo chiều dọc với content container bên dưới.
- Khoảng cách các item trên appbar đều, không bị chen hoặc lệch.
- Responsive không bị vỡ layout.

---

## 1.2. Onboarding tour và About this site

Yêu cầu:

- Giữ onboarding tour chỉ hiển thị 1 lần đầu khi user vào site.
- Không để nút bật lại onboarding tour trên quick toolbar.
- Đổi nút này thành “Về trang này”.

About this site nên hiển thị bằng modal ngắn gọn.

Nội dung modal gồm 4 block:

### Learning Compass là gì?

Nơi tập trung các khóa học, lịch đào tạo, chính sách học tập và các kênh request hỗ trợ đào tạo tại Garena.

### Dành cho ai?

- Nhân viên muốn tìm khóa học phù hợp.
- Manager/HRBP muốn tham khảo learning path/recommendation.
- L&D dùng để truyền thông và quản lý thông tin đào tạo.

### Có thể làm gì trên site?

- Xem khóa học được recommend theo rank/kỹ năng.
- Tìm lịch đào tạo sắp tới.
- Đăng ký khóa học.
- Gửi yêu cầu đào tạo.
- Xem chính sách hỗ trợ học tập.
- Tra cứu FAQ.

### Cách bắt đầu nhanh

- Vào Home để xem khóa gợi ý cho rank của bạn và lịch sắp tới
- Vào Thư viện đào tạo để lọc và tìm kiếm những khóa đã có trong kho đào tạo
- Nếu chưa tìm thấy khóa phù hợp, chọn “Gửi yêu cầu hỗ trợ đào tạo” hoặc nếu đã có khóa muốn học, chọn “Đăng ký hỗ trợ chi phí đào tạo”.

Acceptance criteria:

- User mới vẫn thấy onboarding tour lần đầu.
- Quick toolbar không còn nút mở lại onboarding tour.
- Có nút “About this site”.
- Bấm “About this site” mở modal hướng dẫn ngắn gọn.
- Modal có thể đóng được.

---

## 1.3. Bỏ title/job khỏi header

Yêu cầu:

- Bỏ thông tin title/job khỏi header/appbar.
- Chỉ giữ các thông tin cần thiết như avatar/name nếu hiện có.

Lý do:

- Header không đủ không gian cho title dài như “Marketing Generalist”.
- Data source title/job chưa rõ.
- Title/job không phải action chính của user khi dùng Learning Compass.

Acceptance criteria:

- Header không còn hiển thị job title như HRBP/Marketing Generalist.
- Layout header gọn hơn, không bị text nhỏ hoặc overflow.

---

# 2. Chính sách & Hướng dẫn L&D

## 2.1. Bỏ nút Quay lại

Yêu cầu:

- Remove nút “Quay lại” trong page Chính sách & Hướng dẫn L&D.
- User quay về trang chính bằng header/homepage navigation.

Acceptance criteria:

- Page Chính sách & Hướng dẫn L&D không còn nút “Quay lại”.
- Navigation chính vẫn hoạt động bình thường.

---

## 2.2. Bỏ nút Dashboard / back button tương tự

Yêu cầu:

- Remove các nút back thủ công dạng “Dashboard” 
- Giữ UI detail page sạch và nhất quán.

Acceptance criteria:

- Không còn các back button thủ công không cần thiết trên detail pages.
- User vẫn có thể navigate bằng header/homepage.

---

# 3. Kho Đổi Quà

Yêu cầu:

- Tạm ẩn toàn bộ phần Kho Đổi Quà khỏi navigation/site nếu phase này chưa dùng.
- Nếu vẫn cần giữ route nội bộ, không expose trên UI chính.

Lý do:

- Nội dung reward store chưa relevant ở phase hiện tại.
- Tránh user bấm vào khu vực chưa có chức năng thật.

Acceptance criteria:

- User không thấy Kho Đổi Quà trên navigation chính.
- Không còn CTA/link dẫn user phổ thông vào Kho Đổi Quà.
- Nếu route vẫn tồn tại nội bộ, không ảnh hưởng các page khác.

---

# 4. FAQ / Chính sách đào tạo

## 4.1. Cách hiển thị FAQ

Yêu cầu:

- FAQ cần chia theo topic.
- Topic lấy theo danh sách được setup trong Admin.
- Mỗi topic có thể expand/collapse.
- Có dấu “+” ở cuối card để mở các câu hỏi trong topic.
- Bấm lại vào topic thì collapse, chỉ còn title topic.

Layout đề xuất:

- Top: Title + mô tả ngắn
- Search bar với placeholder: “Tìm kiếm chính sách, quy trình, câu hỏi”
- Danh sách topic dạng accordion
- Trong mỗi topic là các câu hỏi FAQ dạng accordion hoặc list expand/collapse

Search behavior:

- Search trong:
  - Topic
  - Question
  - Answer
  - Keywords/tags nếu có
- Khi có kết quả:
  - Chỉ hiển thị FAQ match keyword.
  - Show text: “Tìm thấy x kết quả”.
- Khi không có kết quả:
  - Show empty state: “Không tìm thấy nội dung phù hợp. Bạn có thể gửi câu hỏi cho L&D qua Seatalk.”

Acceptance criteria:

- FAQ không còn là danh sách phẳng.
- FAQ được group theo topic.
- User có thể expand/collapse topic.
- Search tìm được cả nội dung trong answer, không chỉ title/question.
- Empty state hoạt động khi không có kết quả.

---

## 4.2. FAQ content management trong Admin

Yêu cầu:

- Thêm FAQ management vào Admin site.
- Cho phép create/edit/delete FAQ.
- Cho phép create topic/tag và assign cho từng FAQ.
- Cho phép bật/tắt publish.
- Cho phép reorder FAQ trong từng topic.

Admin fields đề xuất:

- Topic
- Question
- Answer
- Status: Draft / Published
- Display order
- Last updated by
- Last updated at

Acceptance criteria:

- Admin có khu vực quản lý FAQ.
- Admin tạo/sửa/xóa FAQ được.
- Admin tạo topic/tag và assign FAQ vào topic được.
- Chỉ FAQ Published hiển thị ở user site.
- FAQ hiển thị đúng thứ tự theo display order.

---

# 5. Thư viện đào tạo / Course Catalog

## 5.1. Filter theo rank

Yêu cầu:

- Thêm filter group “Rank”.
- Options hiển thị:
  - Tất cả rank
  - Associate
  - Senior Associate
  - Assistant Manager
  - Manager
  - Senior Manager

Data:

- Course đã có sẵn field `target_ranks`, hãy tận dụng field này.

Logic:

- Khi chọn một rank, hiển thị các course có rank đó trong `target_ranks`.
- “Tất cả rank” hiển thị tất cả course phù hợp.
- Nếu một course target nhiều rank, course đó xuất hiện khi chọn bất kỳ rank nào match.

Acceptance criteria:

- Course Catalog có filter Rank.
- Filter dùng field `target_ranks`.
- Filter hoạt động đúng với course multi-rank.
- Filter không làm hỏng các filter/search/sort khác.

---

## 5.3. CTA khi user không tìm thấy khóa học phù hợp

Yêu cầu:

Bổ sung 2 button cùng hàng với search khóa học, responsive theo size thì hạ hàng xuống bình thường:

- Button 1: “Đăng ký hỗ trợ chi phí đào tạo”
- Button 2: “Gửi yêu cầu hỗ trợ đào tạo”

Ý nghĩa journey:

1. User có thể tham khảo các khóa trong kho đào tạo sẵn có của L&D.
2. Nếu user đã có khóa học bên ngoài muốn học, bấm “Đăng ký hỗ trợ chi phí đào tạo”.
3. Nếu user chưa tìm thấy khóa phù hợp và cần L&D hỗ trợ, bấm “Gửi yêu cầu hỗ trợ đào tạo”.

Link/action:

- “Đăng ký hỗ trợ chi phí đào tạo” dẫn đến: `https://gigi.garena.vn/form/46`
- “Gửi yêu cầu hỗ trợ đào tạo” mở form gửi yêu cầu đào tạo hiện có.

Acceptance criteria:

- Hai CTA visible ơ cạnh search bar
- Link Gigi mở đúng URL.
- Button gửi yêu cầu mở đúng form hiện có.
- Responsive không vỡ layout.
- Vẫn giữ banner cuối page, banner không phải CTA duy nhất.

---

## 5.4. Filter theo nguồn khóa học / Learning Budget Sponsor

Yêu cầu:

- Thêm filter theo “Nguồn khóa học”.
- Không đặt filter đơn lẻ là “Learning Budget Sponsor”.
- Dùng field hiện có `trainer_type`.

Data:

- `trainer_type = internal` tương ứng khóa nội bộ.
- `trainer_type = external` tương ứng khóa bên ngoài, dùng Learning Budget Sponsor.

Options hiển thị:

- Tất cả nguồn
- Khóa nội bộ
- Khóa bên ngoài / Learning Budget Sponsor

Logic:

- Chọn “Tất cả nguồn”: hiển thị tất cả course.
- Chọn “Khóa nội bộ”: filter `trainer_type = internal`.
- Chọn “Khóa bên ngoài / Learning Budget Sponsor”: filter `trainer_type = external`.

Acceptance criteria:

- Course Catalog có filter “Nguồn khóa học”.
- Filter dùng field `trainer_type`.
- External course được hiểu là khóa bên ngoài / Learning Budget Sponsor.
- Filter kết hợp được với Rank/Search/Sort.

---

# 6. Course Registration / Calendar Invite

## 6.1. Thông báo sau khi đăng ký khóa học

Yêu cầu:

- Sau khi user đăng ký khóa học thành công, hiển thị thông báo popup.
- Popup style giống thông báo gửi thành công form gửi yêu cầu đào tạo.

Copy:

“Bạn đã đăng ký thành công. Lịch trên Google Calendar sẽ được gửi tới mail của bạn trong tối đa 48h tới.”

Acceptance criteria:

- Sau khi register thành công, user thấy popup message.
- Message không chỉ đổi trạng thái im lặng trên UI.
- Popup có thể đóng được hoặc tự biến mất theo pattern hiện tại.
- Registration flow hiện tại không bị lỗi.

---

# 7. Course Card / Course Status

## 7.1. Không dim khóa đã học

Yêu cầu:

- Remove opacity/dim style khỏi completed/learned course cards.
- Completed courses vẫn hiển thị rõ, readable.
- Không dùng dim như tín hiệu trạng thái.
- Dùng badge/color code để phân biệt trạng thái.
- Không cần tách section riêng ở Course Catalog, chỉ sort khóa đã học xuống cuối list.

Acceptance criteria:

- Course đã học/đã hoàn thành không bị mờ.
- User vẫn đọc title/description/metadata dễ dàng.
- Completed courses được sort xuống cuối theo logic ở mục 7.3.

---

## 7.2. Color code trạng thái khóa học

Yêu cầu:

- Chuẩn hóa status badge cho course card.
- Dùng badge + viền/accent nhẹ quanh card.
- Không đổi toàn bộ nền card quá mạnh.
- Không dùng màu đỏ Garena cho trạng thái khóa học, giữ đỏ cho CTA/action chính.

Status cần hỗ trợ:

1. Chưa học / chưa đăng ký
2. Đã đăng ký
3. Đã học / đã hoàn thành
4. Đã kết thúc

Color logic đề xuất:

- Chưa học / chưa đăng ký:

  - Badge default
  - Border default

- Đã đăng ký:

  - Badge xanh dương
  - Border/accent xanh dương

- Đã học / đã hoàn thành:

  - Badge xanh lá
  - Border/accent xanh lá

- Đã kết thúc:

  - Badge gray
  - Border/accent gray

Implementation note:

- Nên centralize status style mapping để dùng chung cho Home, Course Catalog, Dashboard (đồng bộ toàn bộ coursecard)
- Không hard-code style rải rác ở nhiều component.

Acceptance criteria:

- Card có status badge rõ ràng.
- Card đã đăng ký, đã học, đã kết thúc phân biệt được bằng màu/border.
- Completed card không bị dim.
- Status style dùng đồng bộ ở Home và Course Catalog.

---

## 7.3. Logic sort khóa học

Yêu cầu:

Apply sort priority cho course list:

1. Upcoming + registered
2. Upcoming + not registered
3. Completed / learned
4. Ended + not registered nếu có

Trong cùng một nhóm:

- Upcoming: sort theo ngày tổ chức gần nhất trước.
- Completed/learned: có thể giữ theo ngày mới nhất hoặc existing order nếu chưa có completion date.

Áp dụng ở:

- Home
- Course Catalog / Thư viện đào tạo

Riêng Home:

- Logic sort này nằm sau logic filter fit rank.

Logic chi tiết:

1. Lọc các khóa phù hợp với user/rank trước.
2. Apply search/filter hiện có.
3. Group theo trạng thái:
   - Upcoming + registered
   - Upcoming + not registered
   - Ended
   - Completed / learned
4. Sort theo group trong từng group.
5. Render danh sách.

Acceptance criteria:

- Khóa sắp tổ chức và user đã đăng ký lên đầu.
- Khóa sắp tổ chức và chưa đăng ký đứng tiếp theo.
- Khóa đã học/đã hoàn thành xuống cuối.
- Logic hoạt động đồng bộ ở Home và Course Catalog.
- Search/filter không phá logic sort.

---

# 8. Dashboard / Profile

## 8.1. Avatar

Yêu cầu:

- Avatar hiện tại đang được lựa chọn duy nhất khi onboard.
- Thêm button edit ngay cạnh avatar để user chọn lại avatar.
- Bổ sung lựa chọn avatar đa dạng hơn.

Avatar customization gợi ý:

- Đồ vật trang trí
- Kiểu tóc
- Loại trang phục
- Màu sắc

Acceptance criteria:

- Có button edit cạnh avatar.
- User chọn lại avatar được.
- Avatar sau khi chọn được lưu lại.
- Không còn cảm giác avatar không đổi được.

---

# 9. Home / Lịch sắp tới

Yêu cầu:

- Bỏ block “Lịch sắp tới” trên trang Thư viện đào tạo
- Giữ “Lịch sắp tới” trên Home như lịch chính để user xem nhanh các training sắp diễn ra.
- Bổ sung filter tag theo kỹ năng, giống phần lịch trên Thư viện.
- Bổ sung lựa chọn filter theo năm/tháng cho lịch sắp tới ở Home, giống phần lịch trên Thư viện.
- Trong lịch tháng, course tab hiển thị thêm:
  - Giờ tổ chức
  - Địa điểm tổ chức

Acceptance criteria:

- Không còn duplicate block lịch gây overlap giữa Home và Thư viện đào tạo.
- Home có lịch sắp tới rõ ràng.
- User filter lịch theo skill tag được.
- User filter theo năm/tháng được.
- Course item trong lịch tháng có hiển thị giờ và địa điểm.

---

# 10. Kiểm tra sau khi implement

Sau khi sửa, hãy tự kiểm tra các case sau:

## Header

- Logo/home align với content.
- Header không còn job title.
- About this site mở được modal.
- Onboarding tour chỉ hiện lần đầu, không có nút bật lại trên toolbar.

## Policy pages

- Không còn nút Quay lại/Dashboard thừa.
- Navigation chính vẫn dùng được.

## Course Catalog

- Search/filter nằm đầu page.
- Có filter Rank dùng `target_ranks`.
- Có filter Nguồn khóa học dùng `trainer_type`.
- Có 2 CTA:
  - Đăng ký hỗ trợ chi phí đào tạo
  - Gửi yêu cầu hỗ trợ đào tạo
- Link Gigi đúng.
- Form request mở đúng.

## FAQ

- FAQ group theo topic.
- Topic expand/collapse được.
- Search tìm được trong answer.
- Admin quản lý FAQ được.
- Draft không hiển thị ngoài user site.

## Course card

- Completed course không bị dim.
- Status badge + border/accent hiển thị đúng.
- Sort đúng thứ tự trạng thái.

## Registration

- Sau khi đăng ký thành công có popup calendar invite.
- Copy đúng: “Bạn đã đăng ký thành công. Lịch trên Google Calendar sẽ được gửi tới mail của bạn trong tối đa 48h tới.”

## Dashboard/Home

- Avatar edit được.
- Home calendar có filter skill tag + năm/tháng.
- Course tab trong lịch tháng có giờ và địa điểm.
- Không còn lịch bị duplicate không rõ mục đích.

Kiểm tra API các phần xem đã ghép chuẩn xác chưa

---

# 11. Output mong muốn từ Codex / Antigravity

Sau khi implement, hãy trả lại:

1. Danh sách file/component đã sửa.
2. Tóm tắt thay đổi theo từng nhóm:
   - Header
   - FAQ
   - Course Catalog
   - Course Card
   - Registration
   - Dashboard/Home
3. Các field/data đang dùng:
   - `target_ranks`
   - `trainer_type`
   - FAQ topic/status/display order nếu có
4. Các điểm chưa làm được hoặc cần data/config thêm.
5. Cách test nhanh từng flow.
6. API đã được ghép chuẩn chỉnh, không phần nào là mock hoặc nút không link tới đâu
