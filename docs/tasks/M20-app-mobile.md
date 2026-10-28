# Kế hoạch triển khai: M20 Ứng dụng Di động Khách hàng (Customer Mobile App - React Native / Expo)

Người phụ trách: T5 (Mobile Developer) · Giai đoạn: GĐ4 · Ngày công ước lượng (spec 8.2): 75 ngày công

## 1. Phạm vi
- **Làm:**
  - `F20.1`: Cấu trúc dự án Mobile App (`apps/mobile`):
    - Khởi tạo React Native / Expo (SDK 51), TypeScript, Turborepo pipeline (`typecheck`, `lint`, `build`).
    - Kết nối hợp đồng API `@sports/contracts` và tiện ích dùng chung `@sports/shared`.
    - Typed Mobile API Client kết nối toàn bộ hệ thống API backend NestJS (`/api/v1/*`), quản lý JWT token an toàn trong SecureStore, hỗ trợ RFC 7807 Problem Details.
  - `F20.2`: Định danh, Xác thực & Sinh trắc học (Auth & Biometrics):
    - Đăng nhập / Đăng ký hội viên bằng Số điện thoại + Mật khẩu.
    - Xác thực sinh trắc học FaceID / TouchID / Vân tay mở khóa ứng dụng và xác nhận giao dịch ví nội bộ.
  - `F20.3`: Trang chủ & Giám sát Sức chứa Thời gian thực (Dashboard & Live Gym Capacity):
    - Thẻ giám sát sức chứa phòng gym trực tiếp (`/api/v1/gym/capacity`, trần an toàn 100 người).
    - Lối tắt nhanh: Đặt sân tức thì, Nạp ví VietQR, Dynamic QR vào phòng tập, Lịch tập hôm nay.
  - `F20.4`: Đặt sân Thể thao 3 lớp chống trùng lịch (Mobile Court Booking):
    - Lọc theo bộ môn thể thao (Bóng đá, Cầu lông, Pickleball, Tennis) và ngày chơi.
    - Ma trận slot 30 phút (06:00 - 22:00, 32 slots) hiển thị trạng thái Trống / Đang giữ / Đã đặt / Khóa.
    - Bộ đếm ngược giữ chỗ 10 phút (Reservation Hold Timer).
    - Thanh toán đặt sân: Ví nội bộ, VietQR tự động mở App ngân hàng.
  - `F20.5`: Thẻ vé & Dynamic QR Pass vào cổng Turnstile (Access Control & Tickets):
    - Mã Dynamic QR TOTP phòng tập tự động làm mới mỗi 30 giây kèm đồng hồ đếm ngược, chống chụp màn hình chia sẻ (Anti-Passback).
    - Mã QR Check-in vé đặt sân thể thao quét tại quầy lễ tân hoặc cổng tự động.
    - Hủy đặt sân và chính sách hoàn tiền cọc tự động vào ví nội bộ.
  - `F20.6`: Trung tâm Ví điện tử Nội bộ & Nạp tiền VietQR (Mobile Wallet):
    - Hiển thị số dư khả dụng chuẩn Safe Integer VND.
    - Nạp tiền nhanh: Chọn mệnh giá (100k, 200k, 500k, 1M, 2M) hoặc tùy nhập, sinh mã VietQR Napas chuẩn EMVCo.
    - Deep Link / App-to-App payment chuyển hướng thẳng sang App ngân hàng.
    - Bảng lịch sử biến động số dư Sổ cái kép (Nạp, Thanh toán, Hoàn tiền, Tạm giữ).
  - `F20.7`: Lớp học Nhóm & Đặt lịch HLV Cá nhân 1-1 (PT & Group Classes):
    - Lịch lớp Yoga, Zumba, HIIT, Spinning... kèm sĩ số còn trống và nút ghi danh.
    - Hồ sơ HLV chuyên nghiệp, chứng chỉ quốc tế, số sao đánh giá và đặt lịch tập PT 1-1.
  - `F20.8`: Giải đấu & Nhánh đấu Thể thao / Esports (Tournaments & Brackets):
    - Danh sách giải đấu, thể thức thi đấu, cơ cấu giải thưởng.
    - Đăng ký đội thi đấu, sơ đồ nhánh đấu trực tiếp (Visual Tournament Bracket).
  - `F20.9`: Hóa đơn Điện tử VAT & Thông báo Đa kênh (Invoices & Notifications):
    - Tra cứu và xem PDF hóa đơn điện tử có mã cơ quan thuế.
    - Trung tâm thông báo In-App: Phân loại Đặt sân, Biến động ví, Nhắc giờ tập, Thông báo hệ thống.
  - `F20.10`: Hồ sơ Cá nhân & Xuất Hóa đơn Đỏ (Profile & Company VAT):
    - Cập nhật thông tin hội viên, đổi mật khẩu, cấu hình thông báo.
    - Lưu thông tin doanh nghiệp xuất hóa đơn VAT (Tên công ty, MST, Địa chỉ, Email nhận HĐ).

## 2. Bất biến liên quan (Rule 00-invariants.md)
1. **Tiền tệ Safe Integer VND**: Toàn bộ hiển thị tiền nạp, số dư ví, giá slot sân, phí lớp tập là số nguyên an toàn VND (`formatVND`), không tính toán làm tròn số thực ở mobile client.
2. **Dynamic QR TOTP**: Mã QR vào cổng gym sinh từ TOTP backend với TTL 30 giây, chống quét quay vòng hoặc chia sẻ vé.
3. **Idempotency Client**: Tất cả giao dịch nạp ví, đặt sân, hủy sân, ghi danh giải đấu đều sinh `idempotencyKey` duy nhất để chống double-click gửi trùng lệnh.

## 3. Cấu trúc thư mục (`apps/mobile`)
```
apps/mobile/
├── src/
│   ├── api/
│   │   ├── client.ts             # Typed Fetch API Client kết nối NestJS Backend
│   │   └── endpoints.ts          # Các hàm API gom nhóm theo domain
│   ├── components/
│   │   ├── DynamicQrPass.tsx     # Mã Dynamic QR TOTP 30s đếm ngược
│   │   ├── CourtSlotGrid.tsx     # Lưới chọn slot 30 phút
│   │   ├── HoldTimer.tsx         # Đồng hồ đếm ngược giữ slot 10 phút
│   │   ├── VietQrModal.tsx       # Modal hiển thị VietQR kèm nút mở App ngân hàng
│   │   ├── BiometricPrompt.tsx   # Xác thực FaceID/TouchID
│   │   └── TopBar.tsx            # Header thanh tiêu đề & số dư ví
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx   # Đăng nhập SĐT + Mật khẩu
│   │   │   └── RegisterScreen.tsx# Đăng ký hội viên mới
│   │   ├── home/
│   │   │   └── HomeScreen.tsx    # Trang chủ, Sức chứa Gym, Quick actions
│   │   ├── booking/
│   │   │   ├── BookingScreen.tsx # Ma trận đặt sân & Giữ chỗ
│   │   │   └── MyTicketsScreen.tsx# Vé của tôi, QR Check-in & Hủy hoàn tiền
│   │   ├── gym/
│   │   │   ├── GymPassScreen.tsx # Thẻ hội viên & Dynamic QR vào cổng Turnstile
│   │   │   └── BuyGymPlanScreen.tsx# Mua gói tập gym
│   │   ├── pt/
│   │   │   ├── ClassesScreen.tsx # Danh sách lớp nhóm & Ghi danh
│   │   │   └── TrainersScreen.tsx# Đặt lịch HLV 1-1
│   │   ├── wallet/
│   │   │   └── WalletScreen.tsx  # Số dư ví, Nạp VietQR & Biến động sổ cái
│   │   ├── tournaments/
│   │   │   └── TournamentsScreen.tsx# Giải đấu & Sơ đồ nhánh đấu
│   │   ├── invoices/
│   │   │   └── InvoicesScreen.tsx# Tra cứu HĐĐT VAT
│   │   ├── notifications/
│   │   │   └── NotificationsScreen.tsx# Hộp thư thông báo
│   │   └── profile/
│   │       └── ProfileScreen.tsx # Hồ sơ, Cấu hình MST doanh nghiệp
│   ├── navigation/
│   │   └── RootNavigator.tsx     # Tab Navigator + Stack Navigator
│   ├── utils/
│   │   ├── format.ts             # formatVND, formatDateTime
│   │   └── idempotency.ts        # UUID idempotency key generator
│   └── types/
│       └── navigation.ts         # Navigation params typing
├── package.json
├── tsconfig.json
└── app.json
```

## 4. Kết quả nghiệm thu (Verification & Acceptance)
- [x] **Toàn bộ cấu trúc Mobile App (`apps/mobile`) và 12 màn hình đã triển khai hoàn tất:**
  - Login & Register (`LoginScreen.tsx`, `RegisterScreen.tsx`) với xác thực sinh trắc học FaceID/Vân tay.
  - Trang chủ (`HomeScreen.tsx`) với thẻ Sức chứa Gym thời gian thực / 100 người, lối tắt nhanh và giới thiệu các bộ môn.
  - Ma trận Đặt sân (`BookingScreen.tsx`) với bộ lọc môn thể thao, ngày chơi, sân, ma trận 32 slots 30 phút, đồng hồ đếm ngược giữ chỗ 10 phút và modal thanh toán.
  - Vé của tôi (`MyTicketsScreen.tsx`) hiển thị danh sách vé, mã QR check-in điện tử và tính năng hủy đặt sân hoàn tiền cọc vào ví nội bộ.
  - Gym Pass (`GymPassScreen.tsx`) tích hợp `DynamicQrPass` làm mới mã TOTP mỗi 30 giây kèm đồng hồ đếm ngược chống Anti-Passback, và bảng các gói tập hội viên.
  - Lớp học nhóm (`ClassesScreen.tsx`) với danh sách lớp Yoga, Zumba, HIIT, Spinning, thanh sĩ số và nút ghi danh.
  - HLV Cá nhân PT 1-1 (`TrainersScreen.tsx`) với danh sách HLV, chuyên môn, chứng chỉ quốc tế, đánh giá sao và đặt lịch hẹn.
  - Trung tâm Ví nội bộ (`WalletScreen.tsx`) hiển thị số dư Safe Integer VND, phím nạp tiền nhanh VietQR Napas EMVCo và lịch sử biến động sổ cái kép.
  - Giải đấu & Esports (`TournamentsScreen.tsx`) hiển thị danh sách giải đấu, giải thưởng, đăng ký đội và sơ đồ nhánh thi đấu.
  - Hộp thư thông báo (`NotificationsScreen.tsx`) hiển thị thông báo giao dịch, lọc tin chưa đọc và đánh dấu đã đọc.
  - Hồ sơ cá nhân (`ProfileScreen.tsx`) quản lý thông tin hội viên, cấu hình thông tin doanh nghiệp xuất hóa đơn đỏ VAT và cài đặt bảo mật.
  - Bộ điều hướng chuẩn (`RootNavigator.tsx`) kết hợp Bottom Tab Navigator và Native Stack Navigator.
- [x] **Kiểm thử chất lượng & Đồng bộ Monorepo:**
  - `pnpm turbo run typecheck`: 6/6 packages (`@sports/contracts`, `@sports/mobile`, `@sports/shared`, `admin`, `api`, `web`) đạt 0 lỗi TypeScript.
  - `pnpm turbo run test`: Toàn bộ 50 test suites và 297 tests tiếp tục pass 100%.
- [x] **Tuân thủ quy tắc bất biến hệ thống (`00-invariants.md`):**
  - Tiền tệ toàn bộ xử lý và hiển thị bằng Safe Integer VND (`formatVND`).
  - Mã Dynamic QR phòng gym sử dụng chu kỳ 30s chống chụp màn hình.
  - Toàn bộ giao dịch gửi lên backend đều tạo khóa `idempotencyKey` chống trùng lặp lệnh.

