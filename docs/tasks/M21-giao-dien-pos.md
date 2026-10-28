# Kế hoạch triển khai: M21 Giao diện POS Bán hàng tại quầy (Touchscreen & Tablet POS Frontend)

Người phụ trách: T5 (Mobile & POS Frontend) · Giai đoạn: GĐ4 · Ngày công ước lượng (spec 8.2): 50 ngày công

## 1. Phạm vi
- **Làm:**
  - `F21.1`: Cấu trúc dự án Giao diện POS (`apps/pos`):
    - Khởi tạo Next.js 14 / React 18, TypeScript nghiêm ngặt, Tailwind CSS, Lucide icons, Turborepo pipeline (`dev`, `build`, `typecheck`, `lint`).
    - Kết nối hợp đồng `@sports/contracts` và tiện ích `@sports/shared`.
    - Giao diện thiết kế chuyên biệt cho màn hình cảm ứng POS quầy (Touchscreen Terminal & Tablet 10-15 inch), phím bấm to rõ, độ tương phản cao, thao tác siêu tốc.
  - `F21.2`: Quản lý Ca thu ngân (Cashier Shift Management F12.5):
    - Bắt buộc Mở ca (Open Shift) với số tiền mặt đầu ca (Initial Float) trước khi bán hàng; ngăn chặn mọi giao dịch khi chưa mở ca.
    - Chốt ca (Close Shift): Kiểm đếm tiền mặt thực tế trong két, tính toán tự động chênh lệch Thừa/Thiếu so với sổ sách, sinh báo cáo doanh thu ca (Tiền mặt / VietQR / Ví nội bộ).
    - Cảnh báo nếu còn dụng cụ thể thao cho thuê chưa trả của ca trực.
  - `F21.3`: Màn hình Bán hàng Cảm ứng Nhanh (Fast Touchscreen POS F12.2):
    - Lưới danh mục sản phẩm trực quan chia theo nhóm `CANTEEN` (Đồ ăn, thức uống, nước tăng lực) và `RETAIL` (Bóng, băng cuốn, áo bib, phụ kiện).
    - Tích hợp ô quét mã vạch Barcode (USB Scanner hoặc gõ nhanh).
    - Bàn phím số cảm ứng On-Screen Touch Numpad để nhập nhanh số lượng và số tiền khách đưa.
    - Tìm và gán khách hàng theo Số điện thoại / Mã thẻ hội viên.
    - Áp dụng Voucher giảm giá hợp lệ.
  - `F21.4`: Đơn hàng Đa dịch vụ & Ghép đơn (Composite POS Orders F12.10):
    - Cho phép bán đơn ghép tại quầy: Món ăn Canteen + Thuê dụng cụ thể thao + Nạp giờ chơi Gaming trên cùng một hóa đơn thanh toán.
  - `F21.5`: Thanh toán & Quy tắc Bất biến (Payment & Invariant Enforcement):
    - **Quy tắc Ví nội bộ**: Chỉ cho phép dùng Ví nội bộ thanh toán cho các mặt hàng nhóm `CANTEEN`, cấm tuyệt đối dùng ví mua hàng `RETAIL` theo SPEC F12.1.
    - Tiền mặt (Cash): Tự động tính tiền thối lại (Change amount).
    - VietQR: Sinh mã QR động Napas 24/7 tức thì trên màn hình cảm ứng để khách quét thanh toán.
    - Split Payment: Hỗ trợ thanh toán hỗn hợp (Ví + Tiền mặt hoặc VietQR + Tiền mặt).
  - `F21.6`: Tích hợp Phần cứng Quầy qua Bridge Agent M22 (Hardware Bridge F12.3):
    - Kết nối Bridge Agent cục bộ qua WebSocket / HTTP.
    - Gửi lệnh in hóa đơn nhiệt ESC/POS khổ 80mm ngay khi thanh toán thành công.
    - Gửi xung kích hoạt mở két tiền tự động (Cash Drawer Pulse) khi thu tiền mặt.
    - Tự động xuất Hóa đơn điện tử VAT có mã cơ quan thuế (M08) cho khách có nhu cầu.
  - `F21.7`: Hủy đơn & Hoàn hàng an toàn (Refunds & PIN Security F12.4):
    - Yêu cầu mã PIN Quản lý (Manager PIN) khi hủy đơn hoặc giảm giá thủ công ngoài hạn mức.
    - Lưu vết lý do hủy và tự động đồng bộ hoàn trả tồn kho.
  - `F21.8`: Quầy Thuê dụng cụ Tích hợp (Equipment Rental at POS M13):
    - Lập phiếu thuê vợt, bóng, giày tại POS, quản lý tiền cọc.
    - Trả đồ: Ghi nhận tình trạng (Tốt, Hỏng, Mất) và tự động cấn trừ bồi thường vào tiền cọc.

## 2. Bất biến liên quan (Rule 00-invariants.md & SPEC 3.12)
1. **Tiền VND nguyên an toàn (`Number.isSafeInteger`)**: Mọi số tiền bán hàng, tiền vốn, tiền thuế VAT, tiền thối lại, tiền cọc hiển thị số nguyên VND (`formatVND`).
2. **Ví nội bộ không dùng cho Bán lẻ**: Chặn hoàn toàn thanh toán ví nội bộ cho sản phẩm `RETAIL`.
3. **Mỗi thu ngân một ca**: Thu ngân phải mở ca mới được bán hàng; không bán âm tiền hoặc bỏ qua bước chốt ca.
4. **Idempotency Client**: Tất cả giao dịch thanh toán quầy đều sinh `idempotencyKey` duy nhất.

## 3. Cấu trúc thư mục (`apps/pos`)
```
apps/pos/
├── app/
│   ├── layout.tsx                 # POS Shell layout, kết nối Bridge Agent status
│   ├── globals.css                # Touch POS dark mode theme
│   ├── page.tsx                   # Màn hình Bán hàng cảm ứng chính
│   ├── shifts/page.tsx            # Quản lý ca thu ngân (Mở ca, Chốt ca, Báo cáo ca)
│   ├── orders/page.tsx            # Lịch sử hóa đơn, in lại bill, hủy đơn kèm PIN
│   ├── rentals/page.tsx           # Cho thuê & Trả dụng cụ thể thao tại quầy
│   └── hardware/page.tsx          # Giám sát & Chẩn đoán thiết bị ngoại vi (Máy in, Két, Scanner)
├── components/
│   ├── ProductGrid.tsx            # Lưới sản phẩm chạm cảm ứng
│   ├── CartPane.tsx               # Cột giỏ hàng & tính thuế VAT 8%
│   ├── TouchNumpad.tsx            # Bàn phím số cảm ứng nhập tiền khách đưa
│   ├── PaymentModal.tsx           # Modal thanh toán Tiền mặt / VietQR / Ví nội bộ
│   ├── ReceiptPreview.tsx         # Bản xem trước & Lệnh in hóa đơn nhiệt ESC/POS 80mm
│   └── ShiftModal.tsx             # Modal Mở ca / Chốt ca kiểm đếm tiền mặt
├── lib/
│   ├── api.ts                     # POS API Client kết nối NestJS Backend
│   ├── bridge.ts                  # Client kết nối Bridge Agent máy in nhiệt & két tiền
│   └── utils.ts                   # formatVND, formatDateTime, idempotency
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## 4. Trạng thái & Kết quả nghiệm thu (Hoàn thành 100%)
- **Mã nguồn**: Đã xây dựng trọn vẹn 5 màn hình POS và 7 components cảm ứng chuyên biệt.
- **Biên dịch & Build**:
  - `pnpm --filter pos typecheck`: **0 lỗi** (tsc --noEmit clean).
  - `pnpm --filter pos build`: **Thành công 100%**, xuất xưởng 8/8 static routes Next.js 14 App Router.
  - `pnpm turbo run typecheck`: **10/10 tasks successful** trên toàn bộ 7 packages (`@sports/contracts`, `@sports/shared`, `api`, `web`, `admin`, `@sports/mobile`, `pos`).
  - `pnpm turbo run test`: **50 test suites passed, 297 tests passed** (100% pass).
- **Tuân thủ Bất biến**:
  - Bắt buộc Mở ca trước khi bán hàng (Lockout overlay).
  - Nghiêm cấm dùng Ví nội bộ cho đơn hàng chứa sản phẩm `RETAIL` (cảnh báo + vô hiệu hóa nút thanh toán ví).
  - Tích hợp điều khiển ESC/POS 80mm và xung mở két tiền qua Bridge Agent M22.
  - Tiền tệ Safe Integer VND 100%.

