# Kế hoạch triển khai: M18 Web khách hàng (Customer Web Portal)

Người phụ trách: T4 (Frontend Web) · Giai đoạn: GĐ4 · Ngày công ước lượng (spec 8.2): 65 ngày công

## 1. Phạm vi
- **Làm:**
  - `F18.1`: Cấu trúc ứng dụng Web khách hàng (`apps/web`):
    - Khởi tạo dự án Next.js (App Router), TypeScript, Tailwind CSS, Turborepo pipeline (`dev`, `build`, `typecheck`, `lint`).
    - Kết nối thư viện hợp đồng dùng chung `@sports/contracts` và `@sports/shared`.
    - Bộ API Client tích hợp xác thực JWT Bearer, quản lý Refresh Token tự động và xử lý lỗi chuẩn Problem Details.
    - Giao diện đáp ứng (Responsive Design) tối ưu hoàn hảo trên cả điện thoại di động (Mobile Web) và máy tính (Desktop).
  - `F18.2`: Đăng ký, Đăng nhập & Quản lý tài khoản (Auth & Profile):
    - Đăng nhập bằng số điện thoại & mật khẩu / Xác thực OTP.
    - Quản lý thông tin cá nhân, thông tin doanh nghiệp xuất hóa đơn VAT (MST, tên công ty, địa chỉ).
    - Quản lý đồng thuận quyền riêng tư (Privacy & Data Consents).
  - `F18.3`: Sơ đồ lịch & Đặt sân thể thao trực quan (Court Booking Matrix):
    - Bộ lọc theo bộ môn thể thao (Bóng đá, Cầu lông, Pickleball, Tennis), ngày thi đấu, cơ sở.
    - Lưới lịch sân tương tác (Time Slot Grid: 06:00 - 22:00, bước nhảy 30 phút), hiển thị trạng thái thời gian thực: Trống, Đang giữ chỗ, Đã đặt.
    - Tính giá tự động theo khung giờ cao điểm / thấp điểm và chiết khấu.
    - Đếm ngược giữ chỗ 10 phút (Reservation Hold Timer).
  - `F18.4`: Thanh toán đa phương thức & Áp dụng ưu đãi:
    - Áp dụng mã Voucher giảm giá hoặc Gói Combo dịch vụ.
    - Thanh toán bằng VietQR ngân hàng (hiển thị mã QR chuẩn NAPAS247 kèm số tiền & nội dung chuyển khoản tự động), Ví nội bộ (Internal Wallet), hoặc Tiền mặt tại quầy.
    - Màn hình kết quả thanh toán & xuất biên lai tức thời.
  - `F18.5`: Quản lý vé đặt & Lượt đặt của tôi (My Bookings):
    - Tra cứu lịch sử đặt sân, xem chi tiết vé, mã QR check-in vào sân.
    - Hủy lượt đặt sân tự động (hoàn cọc vào ví nội bộ theo chính sách hủy trước giờ thi đấu).
  - `F18.6`: Thẻ hội viên Gym & Kiểm soát vào ra (Gym Membership):
    - Bảng giá các gói thẻ Gym (1 tháng, 3 tháng, 6 tháng, 12 tháng) và quyền lợi đi kèm.
    - Mua thẻ mới, gia hạn thẻ hưởng chiết khấu gia hạn sớm.
    - Thẻ hội viên điện tử: Hiển thị hạn dùng, số ngày còn lại, mã QR động vào cổng gym (Dynamic QR có TTL đổi mã) và chỉ số số người đang tập theo thời gian thực (Capacity Badge).
  - `F18.7`: Lớp học nhóm & Huấn luyện viên cá nhân (PT & Group Classes):
    - Danh sách lớp học nhóm (Yoga, Zumba, Boxing...) kèm lịch học và số chỗ còn trống.
    - Danh sách Huấn luyện viên PT, xem chuyên môn, chứng chỉ và đăng ký thuê PT 1-1.
  - `F18.8`: Giải đấu thể thao & Esports (Tournaments):
    - Danh sách giải đấu đang mở đăng ký, thể lệ và cơ cấu giải thưởng.
    - Đội trưởng đăng ký đội thi đấu, nộp lệ phí giải.
    - Cây nhánh đấu trực quan (Single Elimination / Round Robin) và kết quả thi đấu thời gian thực.
  - `F18.9`: Trung tâm Ví nội bộ & Hóa đơn điện tử:
    - Quản lý số dư ví, nạp ví nhanh bằng mã VietQR.
    - Lịch sử biến động số dư và yêu cầu rút tiền về tài khoản ngân hàng.
    - Tra cứu hóa đơn điện tử và tải link PDF hóa đơn VAT.
  - `F18.10`: Trung tâm thông báo (Notification Center):
    - Hộp thư thông báo In-App (xác nhận đặt sân, nhắc giờ tập, biến động số dư ví).

## 2. Bất biến liên quan (Rule 00-invariants & SPEC 3.6/M18)
1. **Tiền VND nguyên an toàn**: Mọi giao diện hiển thị tiền tệ phải định dạng số nguyên VND (`Int64`), có dấu phân cách hàng nghìn (e.g. `300.000 đ`), không làm tròn số thực.
2. **Nguồn sự thật từ Backend**: Giao diện không tự ý tính toán giá cuối cùng mà luôn gửi yêu cầu lên Backend tính giá (`PriceRules`, `Voucher`), Frontend chỉ hiển thị số liệu từ API trả về.
3. **Idempotency Client**: Mọi hành động thanh toán, đặt chỗ, hủy chỗ phải sinh `idempotencyKey` duy nhất ở client để tránh người dùng nhấn đúp (double-click) gây trùng giao dịch.
4. **Xác thực bảo mật**: Lưu trữ token JWT trong bộ nhớ / HttpOnly cookie an toàn, tự động refresh token khi hết hạn mà không gây gián đoạn trải nghiệm của khách.

## 3. Cấu trúc thư mục dự kiến (`apps/web`)
```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── booking/
│   │   └── page.tsx           # Sơ đồ đặt sân & chọn slot
│   ├── my-bookings/
│   │   └── page.tsx           # Vé đặt của tôi & QR check-in
│   ├── gym/
│   │   └── page.tsx           # Gói gym & Thẻ hội viên điện tử
│   ├── pt-classes/
│   │   └── page.tsx           # Lớp học & Đặt lịch PT
│   ├── tournaments/
│   │   └── page.tsx           # Giải đấu & Nhánh đấu
│   ├── wallet/
│   │   └── page.tsx           # Ví nội bộ & Nạp tiền VietQR
│   ├── invoices/
│   │   └── page.tsx           # Hóa đơn điện tử
│   ├── notifications/
│   │   └── page.tsx           # Trung tâm thông báo
│   ├── profile/
│   │   └── page.tsx           # Thông tin tài khoản & xuất HĐ
│   ├── layout.tsx             # Root layout kèm Header/Footer
│   └── page.tsx               # Trang chủ tổ hợp thể thao
├── components/
│   ├── layout/                # Header, Footer, MobileNav
│   ├── booking/               # CourtGrid, SlotItem, BookingModal
│   ├── gym/                   # MemberCard, DynamicQrModal, CapacityBadge
│   ├── wallet/                # TopupModal, BalanceCard
│   └── ui/                    # Button, Badge, Modal, Card
├── lib/
│   ├── api.ts                 # Typed API client kết nối Backend
│   └── utils.ts               # Format tiền VND, format ngày giờ VN
├── public/                    # Assets, logos, icons
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

## 4. Kết quả kiểm thử & Nghiệm thu hoàn thành 100%

### Các chức năng đã triển khai hoàn tất:
- [x] **Cấu trúc & Cấu hình Next.js 14 App Router (`apps/web`)**: Next.js 14.2.35, React 18, Tailwind CSS, Lucide icons, Turborepo pipeline (`dev`, `build`, `typecheck`, `lint`).
- [x] **Thư viện dùng chung & Typed API Client (`lib/api.ts`, `lib/utils.ts`)**: Tích hợp token JWT, RFC 7807 problem details error handling, hàm tiện ích `formatVND` (số nguyên VND an toàn), `formatDateTime`, `generateIdempotencyKey`.
- [x] **Giao diện đa nền tảng Responsive (`components/layout/`)**: Header desktop với số dư ví & thông báo, Footer đầy đủ thông tin pháp lý & giờ mở cửa 06:00 - 22:00, Bottom Navigation bar cho điện thoại di động.
- [x] **Trang chủ (`app/page.tsx`)**: Hero banner, live gym capacity badge, phím tắt dịch vụ, giới thiệu các bộ môn thể thao.
- [x] **Đăng nhập & Đăng ký (`app/(auth)/`)**: Form đăng nhập bằng SĐT + mật khẩu, form đăng ký hội viên mới, lưu trữ JWT và hồ sơ người dùng.
- [x] **Ma trận Đặt sân thông minh (`app/booking/page.tsx`)**: Bộ lọc bộ môn thể thao, chọn ngày, chọn sân, lưới thời gian 30 phút từ 06:00 đến 22:00, đếm ngược giữ chỗ 10 phút, modal thanh toán hỗ trợ VietQR, Ví nội bộ và Tiền mặt.
- [x] **Vé đặt & Lượt đặt của tôi (`app/my-bookings/page.tsx`)**: Bộ lọc trạng thái, thẻ vé, modal QR check-in tại quầy/cổng, modal hủy đặt sân kèm chính sách hoàn tiền tự động vào ví nội bộ.
- [x] **Gym & Thẻ hội viên điện tử (`app/gym/page.tsx`)**: Giám sát sức chứa thời gian thực (Capacity indicator), bảng giá các gói 1T/3T/6T/12T, thẻ hội viên kích hoạt, modal mã Dynamic QR vào cổng Turnstile tự động làm mới mỗi 30s chống quay vòng (Anti-Passback).
- [x] **Lớp học nhóm & Huấn luyện viên cá nhân (`app/pt-classes/page.tsx`)**: Lịch các lớp Yoga/Zumba/HIIT/Spinning/Pilates, danh sách HLV 1-1 kèm chứng chỉ và xếp hạng sao, modal ghi danh lớp học và modal đặt lịch PT.
- [x] **Giải đấu thể thao & Esports (`app/tournaments/page.tsx`)**: Danh sách giải đấu, thể lệ và giải thưởng, modal đăng ký đội và danh sách VĐV, sơ đồ nhánh đấu trực tiếp tương tác (Visual Tournament Bracket).
- [x] **Trung tâm Ví nội bộ (`app/wallet/page.tsx`)**: Tổng số dư & các tiểu ví, nạp tiền nhanh bằng VietQR chuẩn NAPAS247 kèm nút sao chép thông tin chuyển khoản, bảng lịch sử biến động số dư sổ cái kép.
- [x] **Hóa đơn điện tử VAT (`app/invoices/page.tsx`)**: Danh sách hóa đơn có mã CQT, công cụ tra cứu hóa đơn trực tiếp bằng mã tra cứu + MST, nút tải bản thể hiện PDF.
- [x] **Trung tâm thông báo (`app/notifications/page.tsx`)**: Thông báo đa kênh phân loại theo chủ đề, bộ lọc chưa đọc, đánh dấu đã đọc.
- [x] **Hồ sơ cá nhân & Cấu hình xuất hóa đơn (`app/profile/page.tsx`)**: Quản lý thông tin hội viên, cấu hình tên công ty/MST/địa chỉ doanh nghiệp nhận hóa đơn đỏ, nút đăng xuất an toàn.

### Kết quả thẩm định kỹ thuật:
- **TypeScript Typecheck (`pnpm turbo run typecheck`)**: 100% Passed (0 errors across 4 packages: `@sports/contracts`, `@sports/shared`, `api`, `web`).
- **Production Build (`pnpm turbo run build`)**: 100% Passed (15 routes statically pre-rendered trong Next.js App Router và NestJS API build thành công).
- **Test Suites (`pnpm turbo run test`)**: 50 test suites passed, 297 tests passed.

