# Kế hoạch triển khai: M19 Trang quản trị trung tâm & Vận hành (Admin & Operations Dashboard)

Người phụ trách: T4 (Frontend Web) · Giai đoạn: GĐ4 · Ngày công ước lượng (spec 8.2): 65 ngày công

## 1. Phạm vi
- **Làm:**
  - `F19.1`: Cấu trúc dự án Trang quản trị (`apps/admin`):
    - Khởi tạo Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide icons, Turborepo pipeline (`dev`, `build`, `typecheck`, `lint`).
    - Kết nối hợp đồng `@sports/contracts` và tiện ích `@sports/shared`.
    - Typed Admin API Client kết nối toàn bộ hệ thống API backend NestJS (`/api/v1/admin/*`), hỗ trợ phân quyền vai trò (Admin, Manager, Cashier, Coach/Staff).
    - Bố cục Sidebar điều hướng chuyên nghiệp, Header hiển thị nhân viên trực ca và đồng hồ thời gian thực.
  - `F19.2`: Bảng điều khiển vận hành thời gian thực (Executive Realtime Dashboard):
    - Tổng quan KPI: Doanh thu thực tế trong ngày, Số lượt đặt sân đang diễn ra, Sức chứa phòng gym hiện tại / 100 người, Số máy trạm gaming đang hoạt động.
    - Biểu đồ phân tích doanh thu theo giờ và theo từng bộ môn thể thao (Bóng đá, Cầu lông, Pickleball, Tennis, Gym, Gaming, Canteen).
    - Cảnh báo vận hành: Slot sắp tới giờ chưa check-in, giao dịch thanh toán lệch tiền `MISMATCH`, cảnh báo tồn kho sắp hết.
  - `F19.3`: Quản lý Sân bãi, Lịch đặt & Khóa sân khẩn cấp (Facilities & Bookings):
    - Ma trận sơ đồ toàn bộ sân thể thao (Realtime Court Grid Matrix: 06:00 - 22:00, bước 30 phút).
    - Thao tác nhanh cho lễ tân: Check-in nhận sân, Giữ chỗ tại quầy, Hủy lịch đặt sân hoàn tiền vào ví.
    - Khóa sân khẩn cấp (Emergency Closure): Đóng sân bảo trì hoặc do mưa bão/thời tiết xấu, tự động giải tỏa và hoàn cọc cho khách.
    - Quản lý danh mục sân & Sân ghép (Composite Courts), cấu hình bảng giá giờ cao điểm/thấp điểm (Peak/Off-peak).
  - `F19.4`: Quản lý Hội viên Gym & Kiểm soát vào ra (Gym Management):
    - Giám sát sức chứa phòng tập trực tiếp, nút Đặt lại bộ đếm sức chứa khi cần hiệu chỉnh thủ công.
    - Danh sách thẻ hội viên (đang kích hoạt, sắp hết hạn, đã hết hạn), tìm kiếm theo SĐT / Họ tên / Mã thẻ.
    - Gán mã thẻ RFID vật lý cho hội viên.
    - Nhật ký sự kiện quét mã QR động / quẹt thẻ RFID tại cổng kiểm soát Turnstile.
  - `F19.5`: Quản lý HLV & Lớp học nhóm (PT & Group Classes):
    - Danh sách Huấn luyện viên, hồ sơ chuyên môn, chứng chỉ quốc tế và đánh giá sao.
    - Lịch biểu các lớp học nhóm (Yoga, Zumba, HIIT, Spinning...), theo dõi số lượng học viên ghi danh, mở lớp mới.
    - Danh sách lịch đặt PT 1-1, phân công HLV và kiểm soát xung đột lịch dạy.
  - `F19.6`: Quản lý POS Canteen, Bán lẻ & Tồn kho (Canteen & Inventory):
    - Giao diện POS bán hàng quầy nhanh: Danh mục món ăn, đồ uống, phụ kiện thể thao, quét mã vạch Barcode.
    - Quản lý ca thu ngân: Xem ca đang mở, chốt ca kiểm đếm tiền mặt, đối soát doanh thu tiền mặt / VietQR / ví nội bộ, xử lý chênh lệch tiền thừa/thiếu.
    - Quản lý kho hàng: Thẻ kho chi tiết, cảnh báo tồn kho dưới ngưỡng tối thiểu, phiếu nhập kho tính giá vốn bình quân gia quyền, xuất hủy và kiểm kê kho.
  - `F19.7`: Cho thuê dụng cụ thể thao (Equipment Rental):
    - Danh mục dụng cụ (vợt, bóng, giày...), số lượng sẵn sàng cho thuê và đang thuê.
    - Lập phiếu thuê tại quầy, quản lý tiền cọc.
    - Trả đồ: Đánh giá tình trạng (Tốt, Hỏng, Mất), tự động trừ tiền bồi thường vào cọc và hoàn trả phần dư.
  - `F19.8`: Giám sát Phòng máy Gaming (Gaming Stations):
    - Sơ đồ trực quan 70 máy trạm (Sảnh thường + VIP 240Hz).
    - Trạng thái từng máy: Sẵn sàng, Đang chơi (hiển thị thời gian còn lại, tên khách), Ngoại tuyến, Bảo trì.
    - Thao tác tại quầy: Mở máy cho khách vãng lai, nạp thêm giờ chơi, khóa máy khẩn cấp.
  - `F19.9`: Giải đấu & Khuyến mãi (Tournaments & Promotions):
    - Quản lý giải đấu thể thao & Esports: Phê duyệt đội ghi danh, xếp lịch bốc thăm, cập nhật tỉ số nhánh đấu trực tiếp.
    - Quản lý Voucher giảm giá và Combo dịch vụ: Cấu hình ngân sách, hạn mức và tỷ lệ chiết khấu.
  - `F19.10`: Kế toán, Ví & Hóa đơn điện tử VAT (Finance, Wallets & Invoices):
    - Tra cứu giao dịch ví nội bộ, công cụ đối soát tự động Sổ cái kế toán kép (Reconciliation) đảm bảo `balance + held = Σ ledger`.
    - Điều chỉnh số dư ví thủ công kèm lý do bắt buộc và ghi nhận Audit Log Hash Chain.
    - Quản lý giao dịch thanh toán: Thu tiền mặt tại quầy, xử lý giao dịch lệch tiền `MISMATCH`.
    - Quản lý hóa đơn VAT điện tử: Danh sách hóa đơn có mã CQT, xuất lại hóa đơn lỗi, báo cáo doanh thu chưa xuất hóa đơn.
  - `F19.11`: Thiết bị IoT & Trạm điều khiển phần cứng (Bridge & Hardware Control):
    - Bảng điều khiển kết nối máy trạm Bridge Agent tại quầy và các thiết bị ngoại vi (Cửa xoay Turnstile, Máy in bill 80mm, Ngăn kéo đựng tiền, Máy quét QR/RFID).
    - Giám sát nhịp tim (Heartbeat) và nhật ký chẩn đoán phần cứng (Hardware Diagnostic Health).
    - Nút gửi lệnh điều khiển thủ công khẩn cấp (Mở cổng xoay, Bật két tiền, In hóa đơn kiểm tra).
  - `F19.12`: Phân quyền & Cấu hình tập trung (Users, RBAC & Settings):
    - Quản lý tài khoản nhân viên, phân quyền theo vai trò (Admin, Manager, Cashier, Coach/Staff).
    - Nhật ký kiểm toán chuỗi khối mật mã (Audit Log SHA-256 Hash Chain bất biến).
    - Quản lý cấu hình toàn hệ thống (Phụ lục C: giờ mở cửa, slot 30m, cọc 30%, sức chứa gym 100...) không viết cứng vào mã nguồn.

## 2. Bất biến liên quan (Rule 00-invariants.md & SPEC 3.6/3.8/Phụ lục C)
1. **Tiền VND nguyên an toàn (`Number.isSafeInteger`)**: Toàn bộ báo cáo tài chính, doanh thu, giá vốn, tiền tồn kho, số dư ví hiển thị số nguyên VND, có phân cách hàng nghìn.
2. **Quyền hạn nghiêm ngặt (RBAC Enforcement)**: Mọi thao tác nhạy cảm (điều chỉnh ví, xóa/sửa dữ liệu, khóa sân, gửi lệnh thiết bị) phải kiểm tra quyền từ Backend và ghi nhật ký chuỗi Hash Chain SHA-256 Audit Log.
3. **Cấu hình động (Dynamic Settings)**: Tất cả giá trị nghiệp vụ (giờ hoạt động, thời hạn giữ chỗ, tỷ lệ cọc, sức chứa) đọc và ghi qua API `/api/v1/admin/settings`, không viết cứng trong code.
4. **Idempotency Client**: Tất cả các thao tác hành động quản trị (tạo sân, mở ca, chốt ca, lập phiếu nhập kho, gửi lệnh thiết bị) đều phải sinh `idempotencyKey` duy nhất.

## 3. Cấu trúc thư mục (`apps/admin`)
```
apps/admin/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx               # Bảng điều khiển thời gian thực (Executive Realtime)
│   │   ├── bookings/page.tsx      # Sơ đồ ma trận đặt sân, check-in & khóa sân
│   │   ├── facilities/page.tsx    # Quản lý sân, sân ghép & bảng giá Peak/Off-peak
│   │   ├── gym/page.tsx           # Hội viên gym, sức chứa & cổng Turnstile
│   │   ├── pt-classes/page.tsx    # HLV cá nhân & Lớp học nhóm
│   │   ├── pos/page.tsx           # Quầy POS thu ngân & Bán lẻ
│   │   ├── inventory/page.tsx     # Quản lý kho, thẻ kho & ca thu ngân
│   │   ├── rentals/page.tsx       # Cho thuê dụng cụ thể thao & bồi thường
│   │   ├── gaming/page.tsx        # Giám sát sơ đồ 70 máy trạm & mở phiên
│   │   ├── tournaments/page.tsx   # Giải đấu, duyệt đội & nhánh đấu
│   │   ├── promotions/page.tsx    # Quản lý Voucher & Combo
│   │   ├── finance/page.tsx       # Kế toán ví, đối soát sổ cái & lệch tiền
│   │   ├── invoices/page.tsx      # Quản lý hóa đơn VAT điện tử
│   │   ├── bridge/page.tsx        # Trạm Bridge Agent & Thiết bị IoT tại quầy
│   │   ├── users/page.tsx         # Quản lý người dùng, phân quyền & Audit Log
│   │   └── settings/page.tsx      # Cấu hình tập trung toàn hệ thống
│   ├── (auth)/
│   │   └── login/page.tsx         # Đăng nhập dành cho Quản trị viên & Nhân viên
│   ├── layout.tsx                 # Layout chung kèm Sidebar & Header quản trị
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx            # Menu điều hướng nhóm chức năng quản trị
│   │   └── top-nav.tsx            # Thanh tiêu đề, thông tin ca trực & profile
│   └── ui/                        # Các thẻ giao diện, biểu đồ, bảng dữ liệu
├── lib/
│   ├── api.ts                     # Admin Typed API Client kết nối NestJS Backend
│   └── utils.ts                   # Định dạng tiền VND, ngày giờ, idempotency
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

## 4. Kết quả nghiệm thu (Verification & Acceptance)
- [x] **Toàn bộ 17 màn hình chức năng quản trị đã xây dựng hoàn tất:**
  - Login (`/login`)
  - Executive Realtime Dashboard (`/`)
  - Sơ đồ ma trận & Check-in / Khóa sân (`/bookings`)
  - Quản lý danh mục sân & Sân ghép, Bảng giá Peak/Off-peak (`/facilities`)
  - Giám sát sức chứa Gym, RFID & Cổng Turnstile (`/gym`)
  - Lịch biểu Lớp học nhóm & HLV PT 1-1 (`/pt-classes`)
  - Quầy POS bán hàng, Barcode & Giỏ hàng (`/pos`)
  - Quản lý kho, Phiên chốt ca thu ngân & Thẻ kho (`/inventory`)
  - Cho thuê dụng cụ & Bồi thường hao mòn (`/rentals`)
  - Sơ đồ trực quan 70 máy trạm Gaming (`/gaming`)
  - Giải đấu thể thao & Esports, Nhánh thi đấu (`/tournaments`)
  - Khuyến mãi Voucher & Gói Combo đa dịch vụ (`/promotions`)
  - Đối soát sổ cái kế toán kép & Xử lý lệch tiền (`/finance`)
  - Hóa đơn điện tử VAT có mã CQT (`/invoices`)
  - Trạm Bridge Agent & Điều khiển thiết bị IoT (`/bridge`)
  - Quản lý tài khoản, RBAC & SHA-256 Hash Chain Audit Log (`/users`)
  - Cấu hình tập trung toàn hệ thống (`/settings`)
- [x] **Kiểm thử chất lượng & Biên dịch:**
  - `pnpm turbo run typecheck`: 5/5 packages (`@sports/contracts`, `@sports/shared`, `api`, `web`, `admin`) đạt 0 lỗi TypeScript.
  - `pnpm --filter admin build`: Next.js 14 App Router biên dịch thành công 20 static pages.
  - `pnpm turbo run test`: 50 test suites, 297 tests passed 100%.
- [x] **Tuân thủ bất biến hệ thống (`00-invariants.md`):**
  - Số tiền xử lý và hiển thị hoàn toàn bằng `Safe Integer VND` (`formatVND`).
  - Giao diện POS chặn thanh toán sản phẩm bán lẻ `RETAIL` bằng ví nội bộ theo đúng SPEC.
  - Mọi thao tác cấu hình, khóa sân, điều chỉnh ví đều yêu cầu lý do và lưu vết vào chuỗi băm SHA-256 Audit Log.

