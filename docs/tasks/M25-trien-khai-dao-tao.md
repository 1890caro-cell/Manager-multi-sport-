# Kế hoạch triển khai: M25 Triển khai, Đào tạo & Tài liệu vận hành (Deployment, Runbooks & Operations)

Người phụ trách: T7 (QA & DevOps) & toàn đội · Giai đoạn: GĐ6 · Ngày công ước lượng (spec 8.2): 30 ngày công

## 1. Phạm vi
- **Làm:**
  - `F25.1`: Bộ Cẩm nang Vận hành Chuẩn (Standard Operating Runbooks):
    - `docs/runbooks/01-operations-runbook.md`: Quy trình thường nhật (Checklist mở ca buổi sáng 05:45, kiểm tra rơ-le sân, cổng xoay gym, kết nối Bridge Agent, bàn giao ca giữa trưa, đối soát chốt ca buổi tối 22:15, kiểm kê tồn kho canteen/bán lẻ).
    - `docs/runbooks/02-disaster-recovery.md`: Kế hoạch ứng cứu thảm họa (Disaster Recovery Plan): Cam kết mục tiêu RTO < 4 giờ, RPO < 15 phút theo SPEC 3.9; quy trình khôi phục MongoDB snapshot & PITR; phục hồi Redis; kịch bản chuyển dự phòng Internet 4G/5G khi đứt cáp quang.
    - `docs/runbooks/03-cashier-training-manual.md`: Cẩm nang đào tạo nghiệp vụ Thu ngân & Lễ tân (Thao tác bán hàng cảm ứng POS F12, mở ca nhập float, bán ghép đơn canteen + dụng cụ thể thao, quét barcode, thanh toán VietQR / Tiền mặt, chặn ví nội bộ với hàng bán lẻ, in lại hóa đơn nhiệt 80mm, quy trình hủy đơn yêu cầu Manager PIN).
    - `docs/runbooks/04-incident-response.md`: Ma trận xử lý 6 sự cố vận hành thường gặp theo SPEC 10.4:
      1. Mất Internet tại cơ sở (offline cache gym, tạm giữ gaming).
      2. Cổng thanh toán lỗi / bảo trì.
      3. Khách chuyển khoản thành công nhưng chưa nhận được đơn (đối soát MISMATCH).
      4. Bộ đếm tải phòng gym hiển thị sai lệch.
      5. Hóa đơn điện tử gặp lỗi kết nối VNPT.
      6. Máy gaming bị treo / mất điện đột ngột.
  - `F25.2`: Bộ Script Tự động hóa Sao lưu & Khôi phục:
    - `scripts/backup-db.sh`: Tạo bản sao lưu MongoDB nén tar.gz có gắn timestamp và sinh mã băm SHA-256 xác thực.
    - `scripts/restore-db.sh`: Khôi phục cơ sở dữ liệu từ file sao lưu, tự động chạy kiểm chứng chuỗi băm Hash Chain của Audit Log để phát hiện can thiệp dữ liệu trái phép.

## 2. Bất biến liên quan (Rule 00-invariants.md)
1. **RTO < 4h, RPO < 15m**: Toàn bộ quy trình khôi phục thảm họa phải đảm bảo thời gian phục hồi dịch vụ dưới 4 giờ và tổn thất dữ liệu dưới 15 phút.
2. **Audit Log Hash Chain Verification**: Mọi hành vi khôi phục dữ liệu bắt buộc phải chạy lệnh kiểm chứng chuỗi băm mật mã SHA-256 từ `GENESIS` để chứng minh tính toàn vẹn của sổ cái và nhật ký kiểm toán.
