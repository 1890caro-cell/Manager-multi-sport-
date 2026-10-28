# Kế hoạch triển khai: M10 Phòng gym - Thẻ thành viên & Kiểm soát vào ra (Gym Membership & Capacity Access Control)

Người phụ trách: T3 (Backend) · Giai đoạn: GĐ2 · Ngày công ước lượng (spec 8.2): 60 ngày công

## 1. Phạm vi
- **Làm:**
  - `F10.1`: Quản lý danh mục gói thẻ gym (tháng/quý/năm, giá, quyền lợi, ưu đãi gia hạn sớm).
  - `F10.2`: Mua thẻ tại quầy hoặc online: Tiền mặt, VietQR, MoMo/ZaloPay/VNPay (**CẤM dùng ví nội bộ**). Hỗ trợ chọn ngày bắt đầu (tối đa 30 ngày sau -> trạng thái `UPCOMING`).
  - `F10.3`: **Gia hạn (Renew)**: Còn hạn thì cộng dồn thời gian (`endDate + 1`), hết hạn thì tính từ ngày mua; tự động giảm giá X% nếu gia hạn sớm từ 7 ngày trở lên.
  - `F10.4`: **Nâng cấp (Upgrade)**: Giữ nguyên gói mới, trừ giá trị còn lại của gói cũ theo công thức pro-rata; gói cũ chuyển `UPGRADED`; cấm hạ cấp.
  - `F10.5`: Quản lý thẻ RFID: Gán thẻ vật lý, khóa thẻ cũ và cấp lại thẻ mới khi mất (thu phí cấp lại).
  - `F10.6`: QR động trong app đổi mỗi 30 giây có HMAC ký số, dùng 1 lần chống chụp màn hình.
  - `F10.7`: Check-in / Check-out: RFID, QR động, vân tay, hoặc lễ tân thao tác thủ công (bắt buộc ghi lý do).
  - `F10.8`: **Bộ đếm thời gian thực giới hạn 100 người**: Redis Set `gym:inside` + Lua script nguyên tử; từ chối khi phòng đầy (>= 100); Anti-passback (ngăn vào 2 lần khi chưa check-out).
  - `F10.9`: Tự động check-out sau 4 giờ; nhắc sắp hết hạn thẻ trước 7 ngày và 1 ngày qua M09.
  - `F10.10`: Báo cáo thành viên hoạt động, tỷ lệ gia hạn, lượt tập theo giờ.

## 2. Bất biến liên quan (từ rule 00-invariants)
1. **Ví nội bộ không áp dụng cho Gym**: Thẻ gym chỉ thanh toán bằng tiền mặt, QR ngân hàng hoặc ví điện tử đối tác. Bất kỳ request nào dùng `INTERNAL_WALLET` cho Gym đều bị từ chối `INVALID_PAYMENT_METHOD`.
2. **Giới hạn sức chứa cứng (100 người)**: Số lượng người cùng tập trong phòng gym không bao giờ được vượt quá 100 (`gym.capacity`). Phải được bảo vệ bằng script Lua nguyên tử trong Redis.
3. **Chống quay vòng thẻ (Anti-Passback)**: Một thẻ đang ở trạng thái "đã vào phòng" không thể check-in tiếp cho người khác vào.
4. **Công thức nâng cấp Pro-Rata**:
   - `giá trị còn lại = làm tròn (giá đã trả cũ × số ngày còn lại / tổng số ngày cũ)`.
   - `số tiền phải trả = max(0, giá gói mới − giá trị còn lại)`.
5. **Tiền nguyên VND an toàn**: Toàn bộ giá trị thẻ, giảm giá và bù trừ nâng cấp phải là số nguyên VND (`Number.isSafeInteger`).

## 3. Hợp đồng API (packages/contracts)
| Method | Path | Request | Response | Lỗi (`code`) |
|---|---|---|---|---|
| GET | `/api/v1/gym/packages` | None | `GymPackageList` | None |
| GET | `/api/v1/gym/capacity` | None | `GymCapacityStatus` | None |
| GET | `/api/v1/gym/memberships/me` | None | `GymMembershipList` | None |
| GET | `/api/v1/gym/memberships/me/qr` | None | `{ qrToken: string, expiresInSeconds: number }` | `NO_ACTIVE_MEMBERSHIP` |
| POST | `/api/v1/gym/memberships` | `PurchaseGymMembershipDto` | `GymMembershipDetail` | `INVALID_PAYMENT_METHOD` |
| POST | `/api/v1/gym/memberships/:id/renew` | `RenewGymMembershipDto` | `GymMembershipDetail` | `CANNOT_RENEW` |
| POST | `/api/v1/gym/memberships/:id/upgrade` | `UpgradeGymMembershipDto` | `GymMembershipDetail` | `CANNOT_UPGRADE` |
| POST | `/api/v1/gym/check-in` | `GymCheckInDto` | `GymAccessResult` | `GYM_FULL`, `ANTI_PASSBACK` |
| POST | `/api/v1/gym/check-out` | `GymCheckOutDto` | `GymAccessResult` | `NOT_INSIDE` |
| GET | `/api/v1/admin/gym/memberships` | `{ status, phone, page, limit }` | `GymMembershipList` | None |
| POST | `/api/v1/admin/gym/memberships/:id/assign-rfid` | `{ rfidCardId: string }` | `GymMembershipDetail` | `RFID_ALREADY_USED` |
| POST | `/api/v1/admin/gym/check-in-manual` | `{ membershipId, reason }` | `GymAccessResult` | `GYM_FULL` |

## 4. Cấu trúc CSDL
- **Collection `gym_packages`:**
  - `_id`: ObjectId
  - `code`: string (Unique index)
  - `name`: string
  - `durationMonths`: number (1, 3, 6, 12)
  - `price`: number (Integer VND)
  - `benefits`: string[]
  - `earlyRenewDiscountPercent`: number (default 5%)
  - `isActive`: boolean
- **Collection `gym_memberships`:**
  - `_id`: ObjectId
  - `membershipCode`: string (Unique index, `GYM-YYYYMMDD-XXXX`)
  - `userId`: ObjectId (index)
  - `packageId`: ObjectId (index)
  - `packageName`: string
  - `startDate`: Date
  - `endDate`: Date
  - `status`: GymMembershipStatus (`UPCOMING`, `ACTIVE`, `EXPIRED`, `UPGRADED`, `CANCELLED`)
  - `rfidCardId`?: string (Unique index sparse)
  - `pricePaid`: number
  - `paymentId`: ObjectId
  - `idempotencyKey`: string (Unique index)
- **Collection `gym_access_events`:**
  - `_id`: ObjectId
  - `userId`: ObjectId (index)
  - `membershipId`: ObjectId
  - `type`: GymAccessType (`CHECK_IN`, `CHECK_OUT`, `AUTO_CHECK_OUT`)
  - `method`: GymAccessMethod (`RFID`, `DYNAMIC_QR`, `FINGERPRINT`, `MANUAL`)
  - `operatorId`?: ObjectId (khi lễ tân thao tác bằng tay)
  - `reason`?: string
  - `occurredAt`: Date (index)

## 5. Kế hoạch thực hiện
- [x] 1. Thêm Zod schemas & hợp đồng API cho Gym trong `packages/contracts/src/gym.ts`.
- [x] 2. Bổ sung enums trong `@sports/shared` (`GymMembershipStatus`, `GymAccessType`, `GymAccessMethod`).
- [x] 3. Tạo Mongoose schemas: `GymPackage`, `GymMembership`, `GymAccessEvent`.
- [x] 4. Hiện thực Redis Lua Script cho bộ đếm 100 người nguyên tử & Anti-passback (`gym:inside`).
- [x] 5. Xây dựng `GymService`:
  - `purchaseMembership`: Chặn `INTERNAL_WALLET`, kiểm tra ngày bắt đầu.
  - `renewMembership`: Tính cộng dồn ngày, áp dụng chiết khấu gia hạn sớm.
  - `upgradeMembership`: Tính tiền pro-rata còn lại, chuyển gói cũ sang `UPGRADED`.
  - `generateDynamicQr`: Sinh QR có chữ ký HMAC 30s.
  - `checkIn`: Xác thực thẻ, gọi Redis Lua Script nguyên tử, ghi nhận access event.
  - `checkOut`: Xóa khỏi Redis `gym:inside`, ghi nhận check-out.
  - `autoCheckoutExpired`: Quét và tự động check-out các ca quá 4 giờ.
  - `getCapacityStatus`: Đọc số lượng người tập hiện tại từ Redis.
- [x] 6. Xây dựng Controllers: `GymController`, `AdminGymController`.
- [x] 7. Đăng ký `GymModule` vào `app.module.ts`.
- [x] 8. Viết Unit Tests & Concurrency Race Test (150 người quét đồng thời khi đã có 90 người -> đúng 10 người được vào).
- [x] 9. Kiểm tra toàn bộ hệ thống (`pnpm test`, `pnpm typecheck`, `pnpm build`).
- [x] 10. Cập nhật `walkthrough.md`.
