-- Import full L&D policy content from Gigi Garena article 146.
DELETE FROM policies
WHERE source_file = 'Gigi Garena.html'
   OR category IN ('Chính sách đào tạo', 'ChÃ­nh sÃ¡ch Ä‘Ã o táº¡o');

INSERT INTO policies (id, category, title, content, source_file, order_index, is_active) VALUES
(UUID(), 'Chính sách đào tạo', 'I. Khóa học nội bộ do công ty tổ chức', '<div class="policy-html-content"><h2><strong><span style="font-family: arial, helvetica, sans-serif; font-size: 14pt;">I. Khóa học nội bộ do công ty tổ chức:</span></strong></h2><p></p>
<p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Các khóa học của<b> Garena Academy </b>được đặc biệt thiết kế với ba lĩnh vực chính để phát triển kỹ năng và nâng cao nghiệp vụ chuyên môn cho nhân viên Garena. Đó là các chương trình hỗ trợ các bạn <b>quản lý (Managing) </b>bản thân và mối quan hệ với người khác, <b>thực hành</b> <b>(Performing)</b> tốt công việc chuyên môn, và <b>nâng cao (Enhancing)</b> kỹ năng mềm của bản thân, với các cấp độ đào tạo từ cơ bản đến nâng cao. Hàng tháng, bộ phận Đào tạo sẽ đồng hành và cung cấp các khóa học nội bộ sát thực với nhu cầu và hữu ích cho công việc của các bạn.&nbsp;<em><strong>Các bạn có thể theo dõi các email thông báo khóa học và đăng ký theo đường link đính kèm email.&nbsp;</strong></em></span></p><p></p>
<p style="text-align:center"><span style="font-family: arial, helvetica, sans-serif;"><img class="policy-img-center" src="/policy-images/1.png" alt="" width="390" height="370"></span></p><p></p>
<p>&nbsp;</p></div>', 'Gigi Garena.html', 1, TRUE),
(UUID(), 'Chính sách đào tạo', 'II. Khóa học bên ngoài được công ty hỗ trợ chi phí', '<div class="policy-html-content"><h2><span style="font-family: arial, helvetica, sans-serif; font-size: 14pt;"><strong>II. Khóa học bên ngoài được công ty hỗ trợ chi phí</strong></span></h2><p></p>
<p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><b>Tại Garena</b><span style="font-weight: 400;">,&nbsp;</span><b>chúng tôi tin rằng nhân viên là đại diện của công ty</b><span style="font-weight: 400;">. Chúng tôi&nbsp;khuyến khích các Garenians không ngừng học tập, nâng cao nghiệp vụ chuyên môn, các kỹ năng cần thiết cho công việc của mình thông qua các khoá học nội bộ, các khóa đào tạo bên ngoài cũng như khuyến khích nhân viên chủ động và tự chủ hơn hơn trong việc phát triển bản thân.&nbsp;Chính vì vậy, công ty mong muốn chia sẻ thông tin và cập nhật về&nbsp;</span><b>Chính sách hỗ trợ chi phí đào tạo&nbsp;</b><span style="font-weight: 400;">như sau:&nbsp;</span></span></p><p></p>
<h3 style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;"><b>1. CÁC MỨC HỖ TRỢ:</b></span></h3><p></p>
<p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;"><b>a. Có 2 mức hỗ trợ như sau:</b></span></p><p></p>
<p></p><p></p><p></p><p></p><p></p><p></p><p></p><table style="width: 699.078px; height: 256px;">
<tbody>
<tr style="height: 6.42188px; background-color: #c00000;">
<td style="width: 63px; height: 6.42188px;"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif; color: #ffffff;"><b>Mức độ</b></span></td>
<td style="width: 311px; height: 6.42188px;"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif; color: #ffffff;"><b>Mục đích</b></span></td>
<td style="width: 260.078px; height: 6.42188px;"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif; color: #ffffff;"><b>Mức hỗ trợ</b></span></td>
</tr>
<tr style="height: 72px;">
<td style="width: 63px; height: 72px;"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;"><b>Cấp thiết</b></span></td>
<td style="width: 311px; height: 72px;"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;"><b>Trực tiếp</b><span style="font-weight: 400;"> nâng cao kỹ năng và kiến thức trong lĩnh vực chuyên môn của nhân viên</span></span></td>
<td style="width: 260.078px; height: 72px;">
<ul>
<li aria-level="1"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;"><b>Hỗ trợ 100%</b></span></li>
<li aria-level="1"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;"><b>Lên đến 20 triệu (net) VND/ nội dung</b></span></li>
</ul>
</td>
</tr>
<tr style="height: 72px;">
<td style="width: 63px; height: 72px;"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;"><b>Bổ trợ</b></span></td>
<td style="width: 311px; height: 72px;"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;"><b>Bổ trợ</b><span style="font-weight: 400;"> cho các kỹ năng và kiến thức trong lĩnh vực chuyên môn của nhân viên</span></span></td>
<td style="width: 260.078px; height: 72px;">
<ul>
<li aria-level="1"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;"><b>Hỗ trợ 50%</b></span></li>
<li aria-level="1"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;"><b>Lên đến 10 triệu (net) VND/ nội dung</b></span></li>
</ul>
</td>
</tr>
</tbody>
</table>
<p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong><em>Điều kiện &amp; điều khoản:</em></strong></span></p><p></p>
<ul style="text-align: justify;">
<li><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><em>Chính sách áp dụng cho nhân sự toàn thới gian đã làm việc tại Công ty ít nhất 12 tháng tính tới ngày bắt đầu khóa đào tạo, với một số trường hợp đặc biệt, vui lòng liên hệ BP Đào tạo (Ms. Trang Phạm - thutrang.pham@garena.vn)</em></span></li>
<li style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><em>Các nội dung được hỗ trợ bao gồm: các khóa học bên ngoài có chứng chỉ, hội thảo, hội nghị, bằng đại học/cao học (theo khóa), các sách/sách điện tử, bài báo/bài báo điện tử, các nền tảng khóa học trực tuyến mở rộng (VD: Coursera, Udemy).<br>
</em></span></li><p></p>
<li style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><em>Các chi phí liên quan khác như chi phí đi lại sẽ không bao gồm trong ngân sách hỗ trợ chi phí đào tạo.</em></span></li>
<li style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><em>Tổng trợ cấp tối đa là 20 triệu đồng (net) mỗi năm/nhân viên (bao gồm cả hai cấp độ Cấp thiết và Bổ trợ) dựa theo tỉ lệ thời gian làm việc trong năm.</em></span></li>
<li style="text-align: left;"><em><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;">Chi phí đào tạo cá nhân, với mức tối đa 20 triệu đồng mỗi lần/năm, có thể được phê duyệt thanh toán mà không yêu cầu hợp đồng.</span></em></li>
<li style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong><em>Quan trọng</em></strong><em><strong>:</strong> Nếu bạn đã sử dụng hỗ trợ này từ Garena và nghỉ việc trước khi hoàn thành một (01) năm làm việc, bạn sẽ phải hoàn lại mức hỗ trợ này sau khi hoàn thành khóa học đã đăng ký.</em></span></li>
</ul>
<p><span style="font-family: arial, helvetica, sans-serif;"><strong>b. Những loại chi phí được hỗ trợ:</strong></span></p>
<p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><table style="width: 701.641px;">
<tbody>
<tr style="height: 46px; background-color: #c00000;">
<td style="height: 46px; width: 43px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt; color: #ffffff;"><strong>&nbsp;</strong></span></td>
<td style="height: 46px; width: 324px;"><span style="font-family: arial, helvetica, sans-serif; color: #ffffff;"><strong><span style="font-size: 10pt;">Chi Phí</span></strong></span></td>
<td style="height: 46px; width: 268.641px;"><span style="font-family: arial, helvetica, sans-serif; color: #ffffff;"><strong><span style="font-size: 10pt;">Hỗ trợ</span></strong></span></td>
</tr>
<tr style="height: 16px;">
<td style="height: 16px; text-align: center; width: 43px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">1</span></td>
<td style="height: 16px; text-align: justify; width: 324px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Phí đăng ký khoá học/ hội thảo, mua sách/ sách điện tử, bài báo/ bài báo điện tử</span></td>
<td style="height: 16px; text-align: justify; width: 268.641px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Được hỗ trợ</span></td>
</tr>
<tr style="height: 72px;">
<td style="height: 72px; text-align: center; width: 43px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">2</span></td>
<td style="height: 72px; text-align: justify; width: 324px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Chi phí khoá học, phí giáo trình bắt buộc (như 1 phần của chi phí khoá học), lệ phí thi</span></td>
<td style="height: 72px; text-align: justify; width: 268.641px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Được hỗ trợ</span></td>
</tr>
<tr style="height: 7.28125px;">
<td style="height: 7.28125px; text-align: center; width: 43px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">3</span></td>
<td style="height: 7.28125px; text-align: justify; width: 324px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Bất cứ lần thi lại, cấp chứng chỉ lại nào trong cùng 1 khoá học hoặc 1 kỳ thi</span></td>
<td style="height: 7.28125px; text-align: justify; width: 268.641px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Không được hỗ trợ. Nhân viên phải tự chi trả</span></td>
</tr>
<tr style="height: 72px;">
<td style="height: 72px; text-align: center; width: 43px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">4</span></td>
<td style="height: 72px; text-align: justify; width: 324px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Phí đăng ký dài hạn</span></td>
<td style="height: 72px; text-align: justify; width: 268.641px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Không được hỗ trợ. <span style="font-weight: 400;">Chỉ hỗ trợ 1 khóa/ 1 nội dung/ bài báo riêng lẻ</span></span></td>
</tr>
</tbody>
</table>
<p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;"><strong>c. Tổng chi phí khoá học:</strong></span></p><p></p>
<ul style="text-align: justify;">
<li style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Bao gồm chi phí khoá học, lệ phí thi, giáo trình bắt buộc</span></li>
<li style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Chỉ những chi phí khoá học phải trả sau khi đã trừ đi hỗ trợ/học bổng đào tạo từ chính phủ/nhà cung cấp khóa học, trừ khi có quy định khác.</span></li>
</ul>
<p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;"><strong>2. YÊU CẦU VỀ KHÓA HỌC</strong></span></p><p></p>
<p style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Để đạt tiêu chuẩn được nhận hỗ trợ chi phí đào tạo, khóa học cần:</span></p><p></p>
<p style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>a. Gắn liền chặt chẽ với kết quả kinh doanh</strong></span></p><p></p>
<ul style="text-align: left;">
<li><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Các kỹ năng được học sẽ có những đóng góp cụ thể nhằm tăng năng suất, hiệu suất và/hoặc doanh thu.</span></li>
<li><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Các kỹ năng được học có thể hỗ trợ nhân viên trong công việc hàng ngày.</span></li>
</ul>
<p style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>b. Được cung cấp bởi những tổ chức đào tạo uy tín và đáng tin cậy, ví dụ như:</strong></span></p><p></p>
<ul style="text-align: left;">
<li><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Được chứng nhận bởi một tổ chức đào tạo quốc tế, hoặc</span></li>
<li><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Được chấp thuận bởi một trường đào tạo uy tín có liên quan (WSQ, WDA,...), hoặc</span></li>
<li><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Là nhà cung cấp hàng đầu trong lĩnh vực đào tạo</span></li>
</ul>
<p style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>c. Nội dung giảng dạy rõ ràng và chi tiết </strong></span></p><p></p>
<p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>d. Có thể cung cấp chứng chỉ khi hoàn thành khóa học</strong></span></p><p></p>
<p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>e. Chứng chỉ không bắt nguồn từ nội bộ Garena</strong></span></p><p></p></div>', 'Gigi Garena.html', 2, TRUE),
(UUID(), 'Chính sách đào tạo', 'III. Yêu cầu nhân viên & Quy trình đăng ký', '<div class="policy-html-content"><p style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 12pt;"><strong>3. YÊU CẦU VỀ NHÂN VIÊN</strong></span></p><p></p>
<p style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Để đạt tiêu chuẩn được nhận hỗ trợ chi phí đào tạo, nhân viên cần đạt những yêu cầu sau:</span></p><p></p>
<ul style="text-align: justify;">
<li style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>Là nhân viên chính thức toàn thời gian đã làm việc tối thiểu 12 tháng tính tới ngày đầu tiên bắt đầu khóa đào tạo</strong></span></li>
<li style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>Chia sẻ rõ ràng mục đích, mục tiêu và cam kết kết quả có thể đạt được trong Form Đăng ký hỗ trợ chi phí đào tạo</strong></span></li>
<li style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>Đồng ý tham gia vào các buổi chia sẻ nội bộ/đào tạo&nbsp;</strong>về những kiến thức đã được học hoặc hỗ trợ Bộ phận Đào tạo phát triển các khóa học E-learning theo yêu cầu</span></li>
</ul>
<p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif;"><strong>4. QUY TRÌNH ĐĂNG KÝ &amp; NHẬN HỖ TRỢ:</strong></span></p><p></p>
<p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Quy trình bao gồm 2 bước như sau:</span></p><p></p>
<p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>Bước 1: Đăng ký hỗ trợ chi phí đào tạo</strong></span></p><p></p>
<p style="text-align:center"><img class="policy-img-center" style="font-family: arial, helvetica, sans-serif; text-align: justify;" src="/policy-images/Picture1.png" alt="" width="343" height="156"></p><p></p>
<ul>
<li><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>Đối với nhân viên đăng ký hỗ trợ</strong>: Cần được phê duyệt thông qua ticket được tạo từ Form Đăng ký hỗ trợ chi phí đào tạo <span style="text-decoration: underline;"><strong><a href="https://gigi.garena.vn/form/46" target="_blank" rel="noopener">tại đây</a></strong></span>. Kết quả sẽ được cập nhật trên ticket trong vòng 2 tuần.<br>
</span><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><em>Lưu ý</em>, <em>với team Corporate IT vui lòng hoàn thành 2 bước tại <a href="https://confluence.garenanow.com/display/CI/Corporate+IT+Learning+Subsidy">đây</a>, sau đó đính kèm email phê duyệt tại phần Comment trên Ticket.</em></span></li><p></p>
</ul>
<p style="text-align:center"><img class="policy-img-center" src="/policy-images/image_2023-06-30_105551157-1024x436.png" alt="" width="594" height="253"></p><p></p>
<ul>
<li><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>Đối với Quản lý trực tiếp của nhân viên</strong>: Hoàn thành <strong>Form Đánh giá giá trước khóa học tại ticket&nbsp;</strong>để đánh giá năng lực của nhân viên trước khi khóa học bắt đầu</span></li>
</ul>
<p style="text-align:center"><img class="policy-img-center" src="/policy-images/image_2023-06-30_105635367-1024x328.png" alt="" width="566" height="181"></p><p></p>
<p><em><span style="font-size: 10pt;">Sau khi ticket được phê duyệt, Bộ phận Đào tạo sẽ gửi thông báo hướng dẫn đăng ký &amp; thanh toán khóa học trên ticket, vui lòng theo dõi ticket và thực hiện chuẩn xác theo hướng dẫn để đảm bảo đúng quy định và dễ dàng hoàn phí sau này.</span></em></p>
<p><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>Bước 2: Đánh giá sau khóa học và yêu cầu hoàn phí</strong></span></p>
<p style="text-align:center"><img class="policy-img-center" style="font-family: arial, helvetica, sans-serif;" src="/policy-images/image_2022-07-07_114130694.png" alt="" width="541" height="198"></p><p></p>
<ul>
<li><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>Đối với nhân viên đăng ký hỗ trợ</strong>:</span>
<ul style="list-style-type: circle;">
<li style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Hoàn thành<strong> Form Đánh giá sau khóa học (dành cho nhân viên)</strong> trên ticket đã được phê duyệt sau khi kết thúc khóa học tối đa 30 ngày. Nếu có bất kỳ thay đổi gì về chi phí cũng cần lưu ý tại đây.</span></li>
</ul>
</li>
</ul>
<p style="text-align:center"><img class="policy-img-center" src="/policy-images/image_2023-06-30_105837170.png" alt="" width="537" height="230"></p><p></p>
<ul>
<li style="list-style-type: none;">
<ul style="list-style-type: circle;">
<li style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Chuẩn bị chứng từ bao gồm: (1) File PDF ticket đã được phê duyệt <em>(chọn xuất file PDF ở bên dưới ticket - lưu ý header &amp; footer)</em>, (2) Chứng chỉ/Xác nhận hoàn thành khóa học/hội thảo (trong trường hợp tham gia khóa học/ hội thảo, không áp dụng với trường hợp mua sách/ sách điện tử, bài báo/ bài báo điện tử), và (3) Hóa đơn chi phí khóa học/hội thảo hoặc Biên nhận mua sách/ sách điện tử, bài báo/ bài báo điện tử</span></li>
</ul>
</li>
</ul>
<p style="text-align:center"><img class="policy-img-center" src="/policy-images/image_2023-06-30_105952492.png" alt="" width="593" height="124"></p><p></p>
<ul>
<li style="list-style-type: none;">
<ul style="list-style-type: circle;">
<li style="text-align: left;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Nộp toàn bộ chứng từ trên hệ thống <a href="https://expense.sea.com/claims">HRIS</a> -&gt; New Claim -&gt; Chọn&nbsp;<em><strong>Project VHB-PJ-264: <span style="font-family: arial, helvetica, sans-serif;">HRBP_2026</span></strong></em>&nbsp;-&gt; Tải lên chứng từ và nhập các mục theo hình minh họa dưới đây:<br>
<em>Lưu ý: chi phí phải chính xác với hóa đơn. Nếu thanh toán khóa học bằng USD và vendor nước ngoài liên quan tới dịch vụ tiêu dùng trong nước sẽ phát sinh thuế nhà thầu (gồm cả VAT và CIT,) vui lòng liên hệ với bộ phận Đào tạo để được hướng dẫn cụ thể về: t</em></span><span style="font-size: 10pt;"><em><span style="font-family: arial, helvetica, sans-serif;">hời gian, cách thức cung cấp thông tin thanh toán cho kế toán và chi phí cụ thể khi claim. Tham khảo sử dụng công cụ tính chi phí ra VNĐ tại <a href="https://docs.google.com/spreadsheets/d/1PYLFNhfzYfIhV3mNrursKV1_7fDSJL84shvc7QgUnWk/edit?gid=0#gid=0"><span style="text-decoration: underline;"><strong>ĐÂY</strong></span></a></span></em></span></li><p></p>
</ul>
</li>
</ul>
<ul>
<li style="list-style-type: none;">
<ul style="list-style-type: circle;">
<li><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">In toàn bộ các chứng từ và tới nộp tại phòng Kế toán để làm hoàn phí</span></li>
</ul>
</li>
</ul>
<p style="text-align:center"><img class="policy-img-center" src="/policy-images/SeaTalk_IMG_20260306_134217.png" alt="" width="1744" height="372"><img class="policy-img-center" src="/policy-images/SeaTalk_IMG_20260306_134124.png" alt="" width="278" height="414"></p><p></p>
<ul>
<li><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;"><strong>Đối với Quản lý trực tiếp của nhân viên: </strong>Hoàn thành <strong>Form Đánh giá sau khóa học (dành cho quản lý)</strong> trên ticket đã được phê duyệt để đánh giá năng lực của nhân viên sau ít nhất 3 tháng hoàn thành khóa học.</span></li>
</ul>
<p style="text-align:center"><img class="policy-img-center" src="/policy-images/image_2023-06-30_110228377.png" alt="" width="534" height="171"></p><p></p>
<p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>Quyết định cuối cùng cho mức hỗ trợ chi phí đào tạo của từng đơn đăng ký sẽ phụ thuộc vào Bộ phận Đào tạo và Tổng Giám Đốc.&nbsp;</strong></span></p><p></p>
<p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;"><strong>Ví dụ về khóa đào tạo đủ điều kiện:&nbsp;</strong></span></p><p></p>
<p></p><p></p><p></p><p></p><p></p><p></p><table style="width: 715.969px;">
<tbody>
<tr style="background-color: #c00000; border-color: #c00000;">
<td style="text-align: justify; width: 169px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt; color: #ffffff;"><strong>Thiết yếu</strong></span></td>
<td style="text-align: justify; width: 286px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt; color: #ffffff;"><strong>Bổ trợ</strong></span></td>
<td style="text-align: justify; width: 191.969px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt; color: #ffffff;"><strong>Không được hỗ trợ</strong></span></td>
</tr>
<tr>
<td style="text-align: justify; width: 169px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">1. Khóa học Dreamweaver &amp; CSS (ngôn ngữ thiết kế)</span></td>
<td style="text-align: justify; width: 286px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">1. Kỹ năng Marketing phục vụ mục đích thiết kế</span><p></p>
<p><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">2. Lắng nghe, nắm bắt nhu cầu của khách hàng</span></p></td>
<td style="text-align: justify; width: 191.969px;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">1. Chứng chỉ HRIP</span></td>
</tr>
</tbody>
</table>
<p>&nbsp;</p></div>', 'Gigi Garena.html', 3, TRUE),
(UUID(), 'Chính sách đào tạo', 'IV. Các trường hợp không áp dụng & Liên hệ', '<div class="policy-html-content"><p style="text-align: justify;"><span style="font-family: arial, helvetica, sans-serif;"><strong>5. CÁC TRƯỜNG HỢP KHÔNG ÁP DỤNG CHÍNH SÁCH NÀY</strong></span></p><p></p>
<p style="text-align: justify;"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;"><strong>Vui lòng liên hệ Bộ phận Đào tạo để được hỗ trợ thêm thông tin với các khóa học sau:</strong></span></p><p></p>
<p style="text-align: justify;"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;">a. Các chương trình đào tạo của công ty giải quyết khoảng cách năng lực trong nước và khu vực</span><br>
<span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;">b. Với những khóa học nội bộ</span></p><p></p>
<p style="text-align: justify;"><span style="font-size: 10pt; font-family: arial, helvetica, sans-serif;">Nếu bạn có những câu hỏi khác liên quan, vui lòng liên hệ Bộ phận Đào tạo: thutrang.pham@garena.vn hoặc minhngoc.phamnguyen@garena.vn</span></p><p></p>
<p style="text-align: center;"><span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Best regards,</span><br>
<span style="font-family: arial, helvetica, sans-serif; font-size: 10pt;">Bộ Phận Đào Tạo</span></p></div>', 'Gigi Garena.html', 4, TRUE);
