# Kế hoạch triển khai: M13 Cho thuê dụng cụ (Equipment Rental)

Người phụ trách: T3 (Backend) · Giai đoạn: GĐ3 · Ngày công ước lượng (spec 8.2): 20 ngày công
Trạng thái: **ĐÃ HOÀN THÀNH (100%)**

## 1. Phạm vi
- **Làm:**
  - `F13.1`: Danh mục dụng cụ: Vợt tennis, vợt cầu lông, bóng tennis/bóng đá/bóng rổ, giày thể thao, áo bib tập luyện, rổ bóng... Quản lý theo số lượng tổng (`totalQuantity`), số lượng đang thuê (`rentedQuantity`), số lượng hỏng/mất (`damagedQuantity`), và số lượng khả dụng (`availableQuantity = totalQuantity - rentedQuantity - damagedQuantity`). Có ảnh, mô tả, môn thể thao (`SportType`).
  - `F13.2`: Bảng giá thuê & Tiền cọc:
    - Loại giá thuê: Theo lượt (`PER_TURN` - trọn buổi chơi) hoặc theo giờ (`HOURLY` - tính theo giờ thực tế).
    - Cấu hình tiền cọc thiết bị (`depositAmount`, mặc định 0 hoặc theo giá trị món đồ).
    - Quy định phí bồi thường: Phí hư hỏng (`damageFee`) và phí mất dụng cụ (`lostFee`).
  - `F13.3`: Tạo phiếu thuê tại quầy POS (`RentalTicket`):
    - Gắn với lượt đặt sân (`bookingId`) hoặc thuê độc lập (`isStandalone`).
    - Gắn khách hàng (SĐT, tên) và ca làm việc thu ngân (`shiftId`).
    - Thanh toán đa phương thức: Tiền mặt, VietQR, **Ví nội bộ ĐƯỢC PHÉP DÙNG** (`WalletCategory.RENTAL`).
    - Khấu trừ số lượng khả dụng nguyên tử tức thời (`availableQuantity -= qty`, `rentedQuantity += qty`).
  - `F13.4`: Trả đồ & Quyết toán bồi thường hư hỏng/mất (`returnRental`):
    - Kiểm tra tình trạng từng món: Tốt (`GOOD`), Hỏng (`DAMAGED`), Mất (`LOST`).
    - Tính toán tiền bồi thường: `totalDamageFee` + `totalLostFee`.
    - Xử lý tiền cọc: Hoàn trả tiền cọc thừa (`refundDeposit = Math.max(0, depositAmount - penaltyFee)`) hoặc thu thêm nếu phí bồi thường vượt quá tiền cọc.
    - Cập nhật kho dụng cụ: Món tốt hoàn trả lại `availableQuantity`; món hỏng/mất chuyển sang `damagedQuantity` (không đưa lại vào khả dụng).
    - Hoàn tiền cọc vào Ví nội bộ hoặc chi tiền mặt tại quầy.
  - `F13.5`: Quản lý thời gian thực & Cảnh báo:
    - Theo dõi số lượng khả dụng thời gian thực.
    - Cảnh báo quá hạn trả đồ (`isOverdue`).
    - **Cảnh báo khi chốt ca thu ngân (SPEC Rule)**: Liệt kê các phiếu thuê chưa trả của ca thu ngân đó trước khi chốt ca.
  - `F13.6`: Báo cáo thống kê:
    - Báo cáo tần suất thuê từng món dụng cụ.
    - Báo cáo doanh thu cho thuê, tổng cọc đã thu, tổng phí bồi thường hư hỏng/mất.
    - Báo cáo danh sách tài sản hỏng/mất cần thanh lý hoặc mua mới.

## 2. Bất biến liên quan (từ rule 00-invariants & SPEC 3.6/M13)
1. **Ví nội bộ được phép dùng (SPEC Rule)**: Khác với mặt hàng bán lẻ RETAIL, dịch vụ thuê dụng cụ **ĐƯỢC PHÉP** thanh toán tiền thuê và tiền cọc bằng ví nội bộ (`WalletCategory.RENTAL`).
2. **Không cho thuê vượt số lượng khả dụng (Bất biến Race Condition Defense)**:
   `availableQuantity >= rentalQuantity`. Phép trừ số lượng khả dụng phải dùng lệnh nguyên tử:
   `findOneAndUpdate({ _id, availableQuantity: { $gte: quantity } }, { $inc: { availableQuantity: -quantity, rentedQuantity: quantity } })`.
   Nếu không đủ số lượng khả dụng -> Từ chối với lỗi `INSUFFICIENT_EQUIPMENT`.
3. **Tự động cách ly tài sản hỏng/mất (SPEC Rule)**:
   Dụng cụ hỏng hoặc mất khi trả đồ tự động cộng vào `damagedQuantity` và **không được** hoàn trả lại `availableQuantity`.
4. **Cảnh báo chốt ca còn đồ chưa trả (SPEC Rule)**:
   Trước khi thu ngân chốt ca, hệ thống bắt buộc phải kiểm tra và cảnh báo nếu có phiếu thuê phát sinh trong ca mà khách chưa trả đồ.
5. **Tiền nguyên VND an toàn**: Toàn bộ tiền thuê, tiền cọc, phí hư hỏng, phí đền bù và tiền hoàn cọc phải là số nguyên VND (`Number.isSafeInteger`).

## 3. Hợp đồng API (packages/contracts)
| Method | Path | Request | Response | Lỗi (`code`) |
|---|---|---|---|---|
| GET | `/api/v1/rentals/equipments` | `{ sportType, search, availableOnly }` | `EquipmentListResponse` | None |
| GET | `/api/v1/rentals/equipments/:id` | None | `EquipmentDetail` | `EQUIPMENT_NOT_FOUND` |
| POST | `/api/v1/rentals/tickets` | `CreateRentalTicketDto` | `RentalTicketDetail` | `NO_ACTIVE_SHIFT`, `INSUFFICIENT_EQUIPMENT` |
| GET | `/api/v1/rentals/tickets/:id` | None | `RentalTicketDetail` | `TICKET_NOT_FOUND` |
| POST | `/api/v1/rentals/tickets/:id/return` | `ReturnRentalTicketDto` | `RentalTicketDetail` | `TICKET_ALREADY_RETURNED` |
| GET | `/api/v1/rentals/shifts/unreturned` | None | `RentalTicketListResponse` | `NO_ACTIVE_SHIFT` |
| POST | `/api/v1/admin/rentals/equipments` | `CreateEquipmentDto` | `EquipmentDetail` | `CODE_EXISTS` |
| PATCH | `/api/v1/admin/rentals/equipments/:id` | `UpdateEquipmentDto` | `EquipmentDetail` | `EQUIPMENT_NOT_FOUND` |
| GET | `/api/v1/admin/rentals/reports/usage` | `{ fromDate, toDate }` | `RentalUsageReportResponse` | None |

## 4. Cấu trúc CSDL
- **Collection `equipments`:**
  - `_id`: ObjectId
  - `code`: string (Unique index, `EQP-XXXX`)
  - `name`: string
  - `sportType`: SportType (`FOOTBALL`, `TENNIS`, `BADMINTON`, `BASKETBALL`, `GENERAL`)
  - `pricingType`: RentalPricingType (`PER_TURN`, `HOURLY`)
  - `price`: number (Giá thuê, Integer VND)
  - `depositAmount`: number (Tiền cọc yêu cầu, default 0)
  - `damageFee`: number (Phí phạt nếu hỏng)
  - `lostFee`: number (Phí đền bù nếu mất)
  - `totalQuantity`: number (Tổng tài sản)
  - `rentedQuantity`: number (Đang cho thuê, default 0)
  - `damagedQuantity`: number (Hỏng/mất, default 0)
  - `availableQuantity`: number (Khả dụng = total - rented - damaged)
  - `imageUrl`?: string
  - `isActive`: boolean
- **Collection `rental_tickets`:**
  - `_id`: ObjectId
  - `ticketCode`: string (Unique index, `RNT-YYYYMMDD-XXXX`)
  - `shiftId`: ObjectId (index)
  - `cashierId`: ObjectId (index)
  - `customerId`?: ObjectId (index)
  - `customerPhone`: string
  - `customerName`?: string
  - `bookingId`?: ObjectId (index, nếu gắn với đặt sân)
  - `items`: Array<{
      equipmentId: ObjectId,
      code: string,
      name: string,
      quantity: number,
      unitPrice: number,
      depositPerUnit: number,
      pricingType: RentalPricingType,
      subtotalPrice: number,
      subtotalDeposit: number,
      returnCondition?: RentalItemCondition (`GOOD`, `DAMAGED`, `LOST`),
      penaltyFee?: number
    }>
  - `rentedAt`: Date (index)
  - `dueAt`: Date (hạn trả dự kiến)
  - `returnedAt`?: Date
  - `totalRentalAmount`: number
  - `totalDepositAmount`: number
  - `totalPenaltyFee`: number (phí phạt hỏng/mất)
  - `refundDepositAmount`: number (tiền cọc hoàn trả thực tế)
  - `paymentMethod`: PaymentMethod
  - `status`: RentalTicketStatus (`RENTING`, `RETURNED`, `OVERDUE`, `CANCELLED`, index)
  - `notes`?: string
  - `idempotencyKey`: string (Unique index)
