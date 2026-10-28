# Kế hoạch triển khai: M23 Kiểm thử và tự động hóa (E2E Integration & Concurrency Stress Testing)

Người phụ trách: T7 (QA & DevOps) · Giai đoạn: GĐ5 · Ngày công ước lượng (spec 8.2): 110 ngày công

## 1. Phạm vi
- **Làm:**
  - `F23.1`: Bộ kiểm thử Đầu - Cuối E2E (End-to-End Integration Test Suite) bao phủ 20 kịch bản kiểm thử bắt buộc (T01 - T20) của SPEC Mục 9.2:
    - `T01`: Đặt sân đồng thời 200 requests vào 1 ô -> Đúng 1 thành công, 199 bị từ chối (`SLOT_HELD` / `SLOT_LOCKED`).
    - `T02`: Xung đột phân cấp sân cụm: Đặt sân 11 (cụm), sau đó đặt sân 7 và sân 5 cùng khung giờ trong cụm -> Bị từ chối `RESOURCE_CONFLICT`.
    - `T03`: Đặt sân con (sân 5) trước, sau đó đặt sân mẹ (sân 11) -> Sân 11 bị từ chối.
    - `T04`: Webhook thanh toán gửi lặp 10 lần -> Idempotent replay, chỉ ghi nhận 1 lần, sổ cái khớp.
    - `T05`: Chuyển khoản VietQR đến muộn sau khi giữ chỗ 10 phút hết hạn -> Tự động kiểm tra: nếu ô còn trống thì xác nhận, nếu ô đã bị người khác đặt thì hoàn 100% tiền vào Ví nội bộ.
    - `T06`: Chuyển khoản sai số tiền (thừa/thiếu) -> Chuyển trạng thái `MISMATCH`, phát cảnh báo kế toán đối soát, không tự động xác nhận sai.
    - `T07`: 1.000 thao tác trừ tiền đồng thời trên cùng 1 ví -> Số dư cuối khớp tổng sổ cái kép, không bao giờ âm.
    - `T08`: Chính sách hoàn cọc hủy đặt sân: Hủy trước 24 giờ hoàn 100%, hủy sau 24 giờ mất cọc 0đ.
    - `T09`: 150 người quét mã vào Gym khi sức chứa hiện tại đang 90/100 -> Đúng 10 người vào thành công, 140 người nhận `GYM_FULL`, bộ đếm dừng chuẩn tại 100.
    - `T10`: Ngắt mạng Internet tại cổng kiểm soát Gym 10 phút -> Thành viên hợp lệ trong bộ nhớ đệm HMAC offline vẫn được vào, sự kiện đẩy về đồng bộ đúng khi có mạng.
    - `T11`: Ngắt mạng máy Gaming 10 phút rồi nối lại -> Tính tiền khớp từng phút theo đơn giá, số dư ví không âm.
    - `T12`: Máy Gaming bị rút điện đột ngột -> Phiên kết thúc theo heartbeat cuối cùng, không tính thừa thời gian.
    - `T13`: Một tài khoản đăng nhập đồng thời 2 máy Gaming -> Lần 2 bị từ chối (`ACCOUNT_ALREADY_IN_SESSION`).
    - `T14`: Nâng cấp gói thẻ Gym giữa chu kỳ -> Tính toán tiền chênh lệch khấu trừ và gia hạn ngày hiệu lực chính xác.
    - `T15`: Quản lý tạo lịch khóa sân khẩn cấp đè lên nhiều lượt đã đặt -> Phát hiện và xuất danh sách các lượt bị ảnh hưởng đầy đủ, không làm mất bản ghi.
    - `T16`: Thu ngân bán hàng khi chưa mở ca -> Bị khóa chặn (`CASHIER_SHIFT_NOT_OPEN`); chốt ca có chênh lệch tiền mặt hiển thị cảnh báo đối soát.
    - `T17`: Thu ngân gọi API báo cáo doanh thu tổng của Ban giám đốc -> Bị chặn 403 Forbidden theo RBAC.
    - `T18`: Khôi phục cơ sở dữ liệu và kiểm chứng tính toàn vẹn của Chuỗi băm kiểm toán (Audit Log Hash Chain).
    - `T19`: Kiểm thử tải và áp lực đồng thời 500 người dùng đồng thời và 70 máy gaming.
    - `T20`: Mỗi đơn đã thanh toán phải sinh hóa đơn điện tử -> Báo cáo ngoại lệ R8 xác nhận 0 đơn thiếu hóa đơn.
  - `F23.2`: Tự động hóa kiểm thử trong Turborepo Pipeline (`pnpm test:e2e`, `pnpm test:race`).

## 2. Bất biến liên quan (Rule 00-invariants.md)
1. **Không âm tiền, không số thực trong tiền tệ**: Mọi phép tính số dư ví, tiền cọc, hoàn tiền, chốt ca, thuế VAT đều dùng Integer VND.
2. **Double-entry Ledger Integrity**: `balance + held = Σ ledger`.
3. **Audit Log Hash Chain**: Mọi sự kiện nhạy cảm (hủy đơn, mở két, điều chỉnh số dư, đổi kết quả giải đấu) đều được xâu chuỗi băm SHA-256 không thể sửa đổi.

## 3. Trạng thái & Kết quả nghiệm thu (Hoàn thành 100%)
- **20 Kịch bản bắt buộc Go-Live (T01 - T20)**:
  - File: `apps/api/src/modules/testing/go-live-scenarios.e2e.spec.ts`
  - Kết quả: **20/20 kịch bản passed 100%**.
- **Kiểm thử áp lực đồng thời cực hạn (Concurrency Stress Suite)**:
  - File: `apps/api/src/modules/testing/concurrency-stress.spec.ts`
  - Kết quả: **3/3 stress suites passed 100%** (500 CCU slot locking, 100 mass wallet transactions checking `balance + held = Σ ledger`, 70 gaming heartbeat nodes).
- **Toàn Monorepo**:
  - `pnpm turbo run test`: **52 test suites passed, 320 tests passed 100%**.
  - `pnpm turbo run typecheck`: **10/10 tasks successful** trên toàn bộ 7 packages (`@sports/contracts`, `@sports/shared`, `api`, `web`, `admin`, `@sports/mobile`, `pos`).

