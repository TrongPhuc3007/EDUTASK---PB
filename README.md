# 🎓 EDUTASK - PB — Hệ Thống Học Tập & Dạy Kèm Tri Thức

> **Ứng dụng quản lý bài tập cá nhân hóa: 1 Quản Trị (Admin) + 1 Gia Sư Trực Tiếp + Danh Sách Học Sinh Dạy Kèm.**

---

## 🚀 1. Cách Mở Ứng Dụng (1-Click)
* Nhấp đúp chuột vào file **`Mo_EduTask.bat`** (hoặc mở trực tiếp file **`index.html`** bằng trình duyệt Google Chrome / Microsoft Edge).

---

## 🔑 2. Giao Diện Đăng Nhập Hoàn Chỉnh & Phân Quyền Độc Lập

Hệ thống sở hữu **Màn hình Đăng Nhập Tập Trung Hoàn Chỉnh** với đầy đủ thông tin Tên đăng nhập (`tk`) và Mật khẩu (`mk`), phân tách 3 cổng và bảo mật độc lập:

### 📋 Danh Sách Tài Khoản & Mật Khẩu Truy Cập Hệ Thống:

| Vai Trò / Cổng | Tài Khoản (`tk`) | Mật Khẩu (`mk`) | Quyền Hạn & Tính Năng |
| :--- | :--- | :--- | :--- |
| **👑 Quản Trị Viên** | `admin` | `admin123` | **Toàn quyền hệ thống:** Quản lý hồ sơ học sinh, học phí, cấp/khóa tài khoản, thanh **Master Bar** giám sát mọi giao diện. |
| **👨‍🏫 Gia Sư Trực Tiếp** | `giasu` | `123456` | **Chuyên môn giảng dạy:** Quản lý học sinh học kèm, giao bài 1-1, chấm bài Canvas bút đỏ, xuất tin nhắn Zalo gửi phụ huynh. Không thấy dữ liệu Admin. |
| **🎒 HS: Minh Quang (Chính thức)** | `std_quang` | `123456` | **Bàn học cá nhân:** Nhận bài tập riêng, nộp ảnh bài làm, xem lời phê bút đỏ. Không thấy dữ liệu của Gia sư hay học sinh khác. |
| **🎒 HS: Mai Anh (Chính thức)** | `std_maianh` | `123456` | **Bàn học cá nhân:** Tài khoản học sinh chính thức đã được Admin kích hoạt. |
| **⛔ HS: Hoàng Nam (Chưa cấp TK)** | `std_nam` | `123456` | **Tài khoản chưa kích hoạt:** Khi đăng nhập hệ thống sẽ từ chối và cảnh báo *"Chưa được Admin cấp tài khoản chính thức"*. |

### 🌟 Điểm Nổi Bật Của Giao Diện Đăng Nhập:
* **3 Tab Vai Trò Trực Quan:** Chọn tab để phân định rõ ràng cổng Quản Trị, Gia Sư và Học Sinh.
* **Bảo Mật Từng Lần Truy Cập:** Mỗi lần vào web/tải lại trang đều yêu cầu đăng nhập lại để đảm bảo tính riêng tư, không tự động lưu phiên làm việc.
* **Hỗ Trợ Quên Mật Khẩu:** Popup hotline liên hệ Admin/Gia sư để được hỗ trợ cấp lại mật khẩu.
* **Bảng Cảnh Báo Lỗi Trực Quan:** Báo lỗi rõ ràng khi sai mật khẩu, tài khoản không tồn tại hoặc học sinh chưa được cấp tài khoản.

---

## ✨ 3. Hướng Dẫn Sử Dụng Các Tính Năng Mới Của Gia Sư

### 🔍 1. Lọc Xem Bài Tập Theo Từng Học Sinh:
* Trên màn hình Gia Sư, nhìn vào thanh **"Lọc theo học sinh:"**.
* Bấm vào chip **`👤 Nguyễn Minh Quang`** $\rightarrow$ Danh sách lập tức chỉ hiển thị các bài tập của em Quang.
* Bấm vào **`⭐ Tất cả học sinh`** để quay lại xem toàn bộ lớp.

### ✍️ 2. Chấm Bài Bút Đỏ & Chọn Điểm Siêu Nhanh:
1. Tại bài tập có học sinh nộp, bấm **`✍️ Chấm ngay`**.
2. Bàn chấm bài Canvas mở ra:
   - Dùng **Bút Đỏ** khoanh vùng sai, đóng dấu **`✔️ Đúng`** hoặc **`⚠️ Nhầm dấu`**.
   - Bấm vào các phím điểm nhanh: **`8.5`**, **`9.0`**, **`9.5`** để tự điền điểm.
   - Bấm nhận xét nhanh: *"Bài làm rất tốt, trình bày khoa học."*
   - Bấm **`💾 Lưu Điểm & Trả Bài Ngay`**.
   - Hoặc bấm **`📥 Tải ảnh bài đã chấm`** để lưu ảnh PNG về máy.

### 💬 3. Xuất Tin Nhắn Zalo Báo Cáo Phụ Huynh:
1. Bấm nút **`💬 Báo Cáo Zalo Phụ Huynh`** (trên Banner hoặc trên từng bài tập).
2. Chọn học sinh và bài tập vừa chấm.
3. Hệ thống tự động biên soạn nội dung tin nhắn đầy đủ lời khen, điểm số và bài tập về nhà.
4. Bấm **`📋 Sao Chép Tin Nhắn (Copy Zalo)`** và dán gửi ngay cho phụ huynh qua Zalo.

### 🗑️ 4. Đồng Bộ Tự Động Khi Học Sinh Đã Học Xong / Dừng Học:
* Khi một em học sinh đã kết thúc khóa học hoặc nghỉ học, **Admin** chỉ cần vào hồ sơ học sinh đó và bấm nút **`🗑️ Xóa Học Sinh Khỏi Lớp`**.
* Hệ thống sẽ **tự động đồng bộ và dọn sạch 100% dữ liệu** bên phía **Gia Sư**:
  - Thẻ học sinh trong danh sách *"Học sinh dạy kèm"* biến mất ngay lập tức.
  - Số lượng KPI *"Học sinh theo học"* tự động giảm tương ứng.
  - Xóa chip lọc của học sinh đó trên thanh lọc bài tập.
  - Dọn sạch toàn bộ bài làm/bài nộp (`submissions`) của học sinh đó, giúp danh sách *"Chờ chấm bài"* không còn bài rác.
  - Tự động hủy các bài tập giao riêng cho học sinh này; với bài tập chung thì loại tên em đó ra khỏi danh sách nhận bài.
  - Gỡ học sinh khỏi danh sách chọn báo cáo Zalo và danh sách giao bài tập mới.
  - Khóa vĩnh viễn quyền đăng nhập của học sinh này trên hệ thống.

---

## 📁 5. Cấu Trúc Mã Nguồn
```
d:\App_HocTap_Azota\
├── css/
│   ├── style.css           # Bố cục, thẻ bài tập, chips lọc học sinh, nút đồng bộ đám mây
│   └── canvas.css          # Bàn chấm bài bút đỏ, nút chọn điểm nhanh
├── js/
│   ├── cloud-sync.js       # Động cơ đồng bộ Firebase Realtime 2 chiều giữa PC & Điện thoại
│   ├── store.js            # CSDL LocalStorage kết hợp CloudSync mô hình 1 Admin + Gia Sư + Học Sinh
│   ├── auth.js             # Phân quyền độc lập & kiểm soát phiên đăng nhập
│   ├── anticheat.js        # Giám sát chống gian lận & phát hiện task ngoài (rời tab/dùng AI)
│   ├── grader.js           # Lõi Canvas vẽ bút đỏ, đóng dấu, xử lý trừ điểm kỷ luật
│   ├── admin.js            # Quản lý học sinh với hồ sơ đa chiều, tài khoản & học phí
│   ├── tutor.js            # Lọc theo học sinh, tiến độ nộp bài, báo cáo rời tab, tạo tin Zalo
│   ├── student.js          # To-Do List học sinh, nộp bài có cờ giám sát trung thực
│   └── app.js              # Khởi tạo, modals, toasts, phím ESC đóng nhanh
├── HUONG_DAN_DONG_BO_DU_LIEU.md # Hướng dẫn chi tiết kích hoạt Firebase & quét QR đồng bộ
├── Mo_EduTask.bat          # Phím tắt mở ứng dụng 1-click
└── index.html              # Giao diện chính của ứng dụng
```

---

## 🛡️ 6. Hệ Thống Nhận Diện Task Ngoài & Giám Sát Chống Gian Lận (Anti-Cheat Proctoring)
1. **Phát hiện chuyển tab & mất tiêu điểm**:
   - Sử dụng `document.visibilitychange` & `window.blur/focus` để phát hiện ngay khi học sinh rời bài làm sang ứng dụng khác (mở ChatGPT, Claude, tài liệu ngoài...).
   - Tính toán chính xác số giây học sinh ở ngoài màn hình bài làm.
2. **Cảnh báo khẩn cấp & Âm thanh nghiêm khắc**:
   - Tự động bật Popup cảnh báo đỏ rực ngay khi quay lại tab và phát còi cảnh báo Web Audio Synthesizer.
3. **Biên bản giám sát chi tiết**:
   - Tự động đính kèm số lần vi phạm, tổng thời gian và nhật ký từng mốc thời gian vào bài nộp.
   - Gia sư và Admin có thể nhấp vào huy hiệu `🚨 [Số] lần rời tab ([Số]s) • Xem log` để tra cứu chi tiết.
4. **Xử phạt trực tiếp trên bàn chấm bài Canvas**:
   - Hộp cảnh báo hiển thị ngay trên thanh công cụ chấm điểm với nút **⚠️ Trừ 1đ vì tra cứu** (tự động giảm 1 điểm và điền lời nhắc nhở kỷ luật).
5. **Đồng bộ vào tin nhắn báo cáo Phụ huynh (Zalo)**:
   - Tự động phản ánh tính trung thực và số lần rời tab vào báo cáo buổi học gửi cho cha mẹ học sinh.

---

## 🌐 7. Hệ Thống Đồng Bộ Đám Mây Đa Thiết Bị & Đa Nền Tảng (Cross-Platform)
1. **Đồng Bộ Đa Tab Tức Thời Không Độ Trễ (BroadcastChannel Bus)**:
   - Khi mở nhiều tab hoặc nhiều cửa sổ trên cùng một máy (ví dụ: Tab 1 Gia Sư, Tab 2 Học Sinh hoặc Admin), mọi thay đổi dữ liệu sẽ được truyền thông qua kênh `BroadcastChannel` và sự kiện `storage`. Các tab tự động cập nhật ngay lập tức mà không cần kết nối mạng hay tải lại trang (F5).
2. **Đồng Bộ 2 Chiều Thời Gian Thực (Google Firebase Realtime Database)**:
   - Liên thông dữ liệu giữa Máy tính (PC/Laptop) và Điện thoại (iOS / Android) trong tích tắc.
   - Thầy cô giao bài trên máy tính $\rightarrow$ Học sinh nhận ngay trên điện thoại; Học sinh nộp bài trên điện thoại $\rightarrow$ Thầy cô nhận bài chấm ngay trên máy tính.
3. **Quét Mã QR 1-Chạm Cho Điện Thoại**:
   - Cung cấp mã QR tích hợp trên modal Đám Mây: Điện thoại chỉ cần quét camera là tự động nhận cấu hình, không phải nhập bất kỳ ký tự nào.
4. **Kiểm Tra Kết Nối (Ping Test) & Giám Sát Mạng Online/Offline**:
   - Nút **"Kiểm Tra Kết Nối"** trong tab Cài đặt Firebase giúp kiểm tra ngay tính sẵn sàng của database và hướng dẫn sửa lỗi Security Rules nếu thiếu quyền.
   - Khi mất mạng và có lại mạng, hệ thống tự động phát hiện và đồng bộ bù dữ liệu ngay lập tức.
5. **Cài Đặt Dưới Dạng Ứng Dụng Native (PWA - Progressive Web App)**:
   - Hỗ trợ tệp `manifest.webmanifest` và `sw.js` (Service Worker) cho phép cài đặt app trực tiếp lên Windows, macOS, Android (Chrome "Cài đặt ứng dụng") và iOS (Safari "Thêm vào màn hình chính").
   - Ứng dụng khởi động siêu tốc và có khả năng hoạt động ngay cả khi ngoại tuyến (Offline-first).

---

## ⚡ 8. Tối Ưu Hóa Hiệu Năng & Trải Nghiệm Người Dùng (Performance Optimizations)
1. **Bảo Vệ Chống Tràn Bộ Nhớ & Nén Ảnh Thông Minh**:
   - Toàn bộ ảnh chụp bài tập từ camera điện thoại và ảnh chấm bút đỏ đều được tự động nén qua Canvas với chuẩn tối ưu (kích thước tối đa 1400px, chất lượng 80%), giúp dung lượng mỗi ảnh chỉ khoảng 120KB - 180KB, đảm bảo đường truyền đồng bộ dưới 0.3s.
   - Cơ chế tự động giải phóng dung lượng và bắt lỗi an toàn `QuotaExceededError` bảo vệ dữ liệu không bao giờ bị mất hoặc tràn bộ nhớ LocalStorage.
2. **Nét Vẽ Canvas Bút Đỏ Mượt Mà 60FPS (RequestAnimationFrame)**:
   - Tối ưu hóa chuỗi điểm vẽ qua `requestAnimationFrame`, loại bỏ hiện tượng giật lag khi dùng chuột, bút cảm ứng (Apple Pencil, S-Pen) hoặc ngón tay trên màn hình cảm ứng.
3. **Bộ Công Cụ Phóng To / Thu Nhỏ Ảnh Bài Chấm Cho Học Sinh & Phụ Huynh**:
   - Khi xem bài đã chấm bút đỏ, người dùng có thể bấm nút **Phóng to (🔍+)**, **Thu nhỏ (🔍-)**, **Về 100% (🔄)** hoặc **Tải ảnh bài làm về máy (💾)** để xem rõ từng nét chữ viết tay và lời nhận xét của gia sư trên màn hình điện thoại.
4. **Sửa Lỗi Phân Công & Liên Hệ Gia Sư Trong Giao Diện Phụ Huynh**:
   - Hiển thị chính xác tên gia sư được phân công phụ trách học sinh (`student.assignedTutorId`), kèm số điện thoại liên hệ và chỉ số trung thực khi làm bài.



