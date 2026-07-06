-- ============================================================
-- import-policy.sql
-- Chạy lệnh này để import nội dung chính sách L&D từ HTML vào DB
-- Usage: mysql -u root -p learning_journey < server/scripts/import-policy.sql
-- ============================================================

DELETE FROM policies WHERE category = 'Chính sách đào tạo';

INSERT INTO policies (id, category, title, content, source_file, order_index, is_active) VALUES
(UUID(), 'Chính sách đào tạo', 'I. Khóa học nội bộ do công ty tổ chức',
'<div class="policy-html-content"><p style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;"><strong>I. Khóa học nội bộ do công ty tổ chức:</strong></span></p>
<p style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Các khóa học tại Garena Academy được thiết kế với ba lĩnh vực học tập: kỹ năng (Manage), thực hành (Make), và lãnh đạo (Grow/Mentor), cùng các chương trình cố vấn với đội ngũ lãnh đạo cấp cao.<br>Bạn có thể tham khảo và đặt chỗ tất cả các khóa học trong mục <strong>Lịch Đào Tạo</strong> của ứng dụng này. Các khóa học nội bộ hoàn toàn <strong>miễn phí</strong> và được tổ chức định kỳ.</span></p>
<img src="/policy-images/1.png" alt="Garena Academy Learning Framework" style="max-width:340px;" /></div>',
'Gigi Garena.html', 1, TRUE),

(UUID(), 'Chính sách đào tạo', 'II. Khóa học bên ngoài được công ty hỗ trợ chi phí',
'<div class="policy-html-content"><p><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Hy Garena hỗ trợ nhân viên trong việc tham gia đào tạo bên ngoài công ty. Chúng tôi khuyến khích học tập liên tục và cam kết hỗ trợ chi phí cho các khóa học phù hợp.</span></p>
<p><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;"><strong>1. CÁC MỨC HỖ TRỢ:</strong></span></p>
<p><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>a. Có 2 mức hỗ trợ như sau:</strong></span></p>
<table style="width:100%;">
<tbody>
<tr style="background-color:#c00000;">
<td><span style="color:#fff;font-weight:700;">Mức hỗ trợ</span></td>
<td><span style="color:#fff;font-weight:700;">Mục đích</span></td>
<td><span style="color:#fff;font-weight:700;">Mức hỗ trợ</span></td>
</tr>
<tr>
<td><strong>Cấp thiết</strong><br><em>Trực tiếp cải thiện hiệu suất trong công việc</em></td>
<td>Hỗ trợ 100%<br>Lên đến 20 triệu VNĐ / lần áp dụng</td>
</tr>
<tr>
<td><strong>Bổ trợ</strong><br><em>Hỗ trợ nhân viên trong việc nâng cao kỹ năng tổng quát</em></td>
<td>Hỗ trợ 50%<br>Lên đến 10 triệu VNĐ / lần áp dụng</td>
</tr>
</tbody>
</table>
<p><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><em>Điều kiện & điều kiện áp dụng chính sách hỗ trợ: Nhân viên phải xin phép ít nhất 1 tháng trước khi bắt đầu khóa học...</em></span></p>
<img src="/policy-images/image_2023-06-30_105551157-1024x436.png" alt="Bảng phân loại mức hỗ trợ" /></div>',
'Gigi Garena.html', 2, TRUE),

(UUID(), 'Chính sách đào tạo', 'III. Yêu cầu nhân viên & Quy trình đăng ký',
'<div class="policy-html-content"><p><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;"><strong>3. YÊU CẦU VỀ NHÂN VIÊN</strong></span></p>
<p>Để đạt tiêu chuẩn được nhận hỗ trợ chi phí đào tạo, nhân viên cần đạt những yêu cầu sau:</p>
<ul>
<li><strong>Là nhân viên chính thức toàn thời gian đã làm việc tối thiểu 12 tháng</strong> tính tới ngày đầu tiên bắt đầu khóa đào tạo</li>
<li><strong>Chia sẻ rõ ràng mục đích, mục tiêu và cam kết kết quả</strong> trong Form Đăng ký hỗ trợ chi phí đào tạo</li>
<li><strong>Đồng ý tham gia vào các buổi chia sẻ nội bộ/đào tạo</strong> về những kiến thức đã được học</li>
</ul>
<p><strong>4. QUY TRÌNH ĐĂNG KÝ &amp; NHẬN HỖ TRỢ:</strong></p>
<p>Quy trình bao gồm 2 bước như sau:</p>
<p><strong>Bước 1: Đăng ký hỗ trợ chi phí đào tạo</strong></p>
<img src="/policy-images/Picture1.png" alt="Sơ đồ bước 1: Đăng ký" />
<ul>
<li><strong>Đối với nhân viên đăng ký hỗ trợ</strong>: Cần được phê duyệt thông qua ticket được tạo từ Form Đăng ký hỗ trợ chi phí đào tạo. Kết quả sẽ được cập nhật trên ticket trong vòng 2 tuần.</li>
</ul>
<img src="/policy-images/image_2023-06-30_105635367-1024x328.png" alt="Form đánh giá quản lý" />
<ul>
<li><strong>Đối với Quản lý trực tiếp của nhân viên</strong>: Hoàn thành <strong>Form Đánh giá trước khóa học tại ticket</strong> để đánh giá năng lực của nhân viên trước khi khóa học bắt đầu</li>
</ul>
<p><em>Sau khi ticket được phê duyệt, Bộ phận Đào tạo sẽ gửi thông báo hướng dẫn đăng ký &amp; thanh toán khóa học trên ticket.</em></p>
<p><strong>Bước 2: Đánh giá sau khóa học và yêu cầu hoàn phí</strong></p>
<img src="/policy-images/image_2022-07-07_114130694.png" alt="Sơ đồ bước 2: Hoàn phí" />
<ul>
<li><strong>Đối với nhân viên đăng ký hỗ trợ</strong>: Hoàn thành <strong>Form Đánh giá sau khóa học (dành cho nhân viên)</strong> trên ticket đã được phê duyệt sau khi kết thúc khóa học tối đa 30 ngày.</li>
</ul>
<img src="/policy-images/image_2023-06-30_105837170.png" alt="Form đánh giá sau khóa học" />
<ul>
<li>Chuẩn bị chứng từ: (1) File PDF ticket đã phê duyệt, (2) Chứng chỉ/Xác nhận hoàn thành, (3) Hóa đơn chi phí</li>
</ul>
<img src="/policy-images/image_2023-06-30_105952492.png" alt="Quy trình nộp chứng từ" />
<ul>
<li>Nộp toàn bộ chứng từ trên hệ thống HRIS → New Claim → Project VHB-PJ-264: HRBP_2026 → Tải lên chứng từ</li>
</ul>
<img src="/policy-images/SeaTalk_IMG_20260306_134217.png" alt="Hướng dẫn HRIS" />
<img src="/policy-images/SeaTalk_IMG_20260306_134124.png" alt="Hướng dẫn HRIS chi tiết" />
<ul>
<li><strong>Đối với Quản lý trực tiếp</strong>: Hoàn thành <strong>Form Đánh giá sau khóa học (dành cho quản lý)</strong> sau ít nhất 3 tháng hoàn thành khóa học.</li>
</ul>
<img src="/policy-images/image_2023-06-30_110228377.png" alt="Form đánh giá quản lý sau khóa" />
<p><strong>Quyết định cuối cùng cho mức hỗ trợ chi phí đào tạo của từng đơn đăng ký sẽ phụ thuộc vào Bộ phận Đào tạo và Tổng Giám Đốc.</strong></p></div>',
'Gigi Garena.html', 3, TRUE),

(UUID(), 'Chính sách đào tạo', 'IV. Các trường hợp không áp dụng & Liên hệ',
'<div class="policy-html-content"><p><strong>5. CÁC TRƯỜNG HỢP KHÔNG ÁP DỤNG CHÍNH SÁCH NÀY</strong></p>
<p><strong>Vui lòng liên hệ Bộ phận Đào tạo để được hỗ trợ thêm thông tin với các khóa học sau:</strong></p>
<p>a. Các chương trình đào tạo của công ty giải quyết khoảng cách năng lực trong nước và khu vực<br>b. Với những khóa học nội bộ</p>
<p>Nếu bạn có những câu hỏi khác liên quan, vui lòng liên hệ Bộ phận Đào tạo:<br>
📧 <a href="mailto:thutrang.pham@garena.vn">thutrang.pham@garena.vn</a> hoặc <a href="mailto:minhngoc.phamnguyen@garena.vn">minhngoc.phamnguyen@garena.vn</a></p>
<hr/>
<p><strong>Phụ lục:</strong></p>
<ul>
<li>Mẫu Ticket Đăng ký hỗ trợ chi phí đào tạo (dành cho nhân viên): <a href="https://drive.google.com/file/d/1nP0hci2GwVWNlE6LnYHYJMgZ1QfmHy4J/view" target="_blank">LINK</a></li>
<li>Mẫu Ticket Đăng ký hỗ trợ chi phí đào tạo (dành cho quản lý): <a href="https://drive.google.com/file/d/1YUiarin2lVOV4mjNyRdd0-gvsvWHnf_s/view" target="_blank">LINK</a></li>
</ul></div>',
'Gigi Garena.html', 4, TRUE);

SELECT id, title, order_index, LENGTH(content) as content_size FROM policies WHERE category = 'Chính sách đào tạo' ORDER BY order_index;
