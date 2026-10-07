# 🌐 HƯỚNG DẪN ĐỒNG BỘ DỮ LIỆU GIỮA MÁY TÍNH VÀ ĐIỆN THOẠI — EDUTASK PRO

---

## ❓ 1. Vì Sao Trước Đây Máy Tính Và Điện Thoại Lại Là 2 Luồng Dữ Liệu Khác Nhau?
* Trước đây, toàn bộ dữ liệu (danh sách học sinh, bài tập, bài làm nộp, điểm số) được lưu trữ trong **`LocalStorage`** (bộ nhớ cục bộ của từng trình duyệt).
* Do đó, khi bạn mở web trên **Máy tính**, dữ liệu chỉ nằm trên ổ cứng máy tính. Khi mở trên **Điện thoại**, điện thoại có một bộ nhớ riêng biệt hoàn toàn.
* Kết quả là: Gia sư giao bài trên máy tính thì điện thoại học sinh không thấy; học sinh nộp bài trên điện thoại thì máy tính gia sư cũng không nhận được.

---

## ⚡ 2. Giải Pháp Mới: Đồng Bộ Đám Mây Thời Gian Thực (Google Firebase Realtime Database)
Hệ thống **EDUTASK - PB** đã được nâng cấp toàn diện với công nghệ **Firebase Realtime Database** của Google:
* **Miễn phí 100% vĩnh viễn** (Gói Spark của Google cung cấp 1GB lưu trữ và 100 kết nối đồng thời — hoàn toàn thoải mái cho mô hình dạy kèm/lớp học).
* **Đồng bộ 2 chiều tức thì (Real-time)**: Gia sư giao bài trên máy tính $\rightarrow$ điện thoại học sinh nhận ngay; Học sinh nộp bài trên điện thoại $\rightarrow$ máy tính gia sư nhận được tức thì không cần tải lại trang.
* **Cơ chế Ngoại tuyến (Offline-First)**: Khi mất mạng vẫn lưu trên máy, khi có mạng trở lại sẽ tự động đẩy lên mây.
* **Smart Merge thông minh**: Tự động hợp nhất dữ liệu, chống ghi đè làm mất bài làm hay điểm số.
* **Nén ảnh tự động**: Ảnh chụp bài vở từ camera điện thoại được tự động nén tối ưu (khoảng 150KB - 250KB nhưng vẫn giữ độ nét cao), giúp đường truyền đồng bộ diễn ra trong chớp mắt (dưới 0.5 giây).

---

## 🚀 3. Hướng Dẫn 2 Phút Kích Hoạt Firebase (Chỉ Cần Làm 1 Lần Duy Nhất)

### Bước 1: Tạo dự án Firebase miễn phí
1. Truy cập: [https://console.firebase.google.com](https://console.firebase.google.com) và đăng nhập bằng tài khoản Google (Gmail) của bạn.
2. Bấm nút **Add project (Thêm dự án)**.
3. Đặt tên dự án (ví dụ: `edutask-pb` hoặc `lop-thay-duc`) $\rightarrow$ Bấm **Continue**.
4. Ở bước Google Analytics, bạn có thể **Tắt công tắc** (Disable) để tạo nhanh $\rightarrow$ Bấm **Create project**. Đợi 10 giây dự án sẽ được tạo xong.

### Bước 2: Bật Realtime Database
1. Ở thanh menu bên trái, tìm mục **Build** $\rightarrow$ chọn **Realtime Database**.
2. Bấm nút **Create Database (Tạo cơ sở dữ liệu)**.
3. Chọn vị trí máy chủ: Chọn **Singapore (`asia-southeast1`)** hoặc **United States** $\rightarrow$ Bấm **Next**.
4. Ở bước chọn quy tắc bảo mật: Chọn **Start in test mode (Bắt đầu ở chế độ kiểm thử)** $\rightarrow$ Bấm **Enable (Bật)**.
   *(Chế độ này cho phép ứng dụng đọc và ghi dữ liệu ngay lập tức mà không cần xác thực phức tạp).*

### Bước 3: Lấy mã cấu hình (firebaseConfig)
1. Bấm vào biểu tượng **⚙️ (Bánh răng Cài đặt dự án - Project settings)** ở góc trên bên trái (cạnh dòng *Project Overview*).
2. Cuộn chuột xuống dưới cùng mục **Your apps (Ứng dụng của bạn)**.
3. Bấm vào biểu tượng Web: **`</>`**.
4. Đặt tên ứng dụng (ví dụ: `edutask-web`) $\rightarrow$ Bấm **Register app**.
5. Bạn sẽ thấy một đoạn mã tương tự như sau:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxx",
     authDomain: "edutask-pb.firebaseapp.com",
     databaseURL: "https://edutask-pb-default-rtdb.asia-southeast1.firebasedatabase.app",
     projectId: "edutask-pb",
     storageBucket: "edutask-pb.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```
6. **Sao chép toàn bộ đoạn mã trên** (hệ thống hỗ trợ tự động nhận diện cả định dạng code JS lẫn định dạng JSON).

### Bước 4: Dán vào ứng dụng EduTask
1. Mở ứng dụng **EDUTASK - PB** trên máy tính.
2. Nhìn lên góc trên thanh Header, bấm vào nút **`Cài Đặt Đám Mây ☁️`** (hoặc trong trang Admin mục *Quản Trị & Sao Lưu*).
3. Chọn tab **`⚙️ Cài Đặt Firebase (2 Phút)`**.
4. Dán đoạn mã vừa sao chép vào ô **"Dán Mã Cấu Hình Firebase"**.
5. Nhập **Mã Phòng / Tên Lớp Kèm** (mặc định là `lop_chinh`, hoặc đặt tên tùy thích ví dụ: `lop_toan_12`).
6. Bấm nút **`💾 Lưu Cấu Hình & Kết Nối Đám Mây`**.
7. Nút trên Header sẽ lập tức chuyển sang màu xanh lá: **`Đám Mây: Realtime 🟢`**.
8. Toàn bộ danh sách học sinh và bài tập hiện tại trên máy tính sẽ **tự động được tải lên Cloud** ngay lập tức!

---

## 📱 4. Cách Kết Nối Điện Thoại Trong 5 Giây (1-Chạm, Không Cần Nhập Liệu)

Sau khi máy tính đã kết nối thành công:
1. Trên máy tính, bấm vào nút **`Đám Mây: Realtime 🟢`** trên Header.
2. Chuyển sang tab **`📱 Quét QR Cho Điện Thoại`**.
3. Bạn sẽ thấy một **Mã QR lớn** kèm liên kết đồng bộ.
4. Dùng điện thoại (mở Camera, Zalo hoặc trình quét QR) quét hình mã QR đó.
5. Điện thoại sẽ mở trang web và **tự động nhận diện cấu hình đám mây** từ máy tính mà bạn không cần gõ bất kỳ ký tự nào!
6. Hoặc bạn có thể bấm nút **`📋 Sao Chép Link Gửi Qua Zalo`** trên máy tính rồi gửi tin nhắn Zalo cho chính mình $\rightarrow$ mở link trên điện thoại là hoàn tất!

---

## 🧪 5. Kiểm Thử Hoạt Động Đồng Bộ Giữa 2 Thiết Bị

Để thấy sự kỳ diệu của Realtime Database:
1. Mở song song web trên **Máy tính** (đăng nhập tài khoản Gia Sư `giasu` / `123456`) và trên **Điện thoại** (đăng nhập tài khoản Học Sinh `std_quang` / `123456`).
2. Trên máy tính: Gia sư tạo một bài tập mới.
   $\rightarrow$ Nhìn sang điện thoại: Bài tập mới xuất hiện ngay trước mắt mà **không cần bấm F5 hay tải lại trang**!
3. Trên điện thoại: Học sinh bấm chụp ảnh vở nộp bài.
   $\rightarrow$ Nhìn sang máy tính: Bài nộp của em Quang lập tức hiện vào danh sách "Chờ chấm bài" kèm ảnh vở và thời gian nộp!
4. Trên máy tính: Gia sư mở bàn chấm bài Canvas bút đỏ chấm 9.5 điểm và bấm Trả bài.
   $\rightarrow$ Nhìn sang điện thoại: Điểm số 9.5 và lời phê bút đỏ hiện ngay tức khắc!

---

## 🔒 6. Lưu Ý Về Quy Tắc Firebase (Security Rules)
Trong Firebase Console $\rightarrow$ **Realtime Database** $\rightarrow$ tab **Rules (Quy tắc)**, hãy đảm bảo quy tắc cho phép đọc/ghi như sau để ứng dụng hoạt động trơn tru:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
*(Bạn có thể thêm thời hạn hoặc khóa lại theo nhu cầu quản trị cá nhân).*
