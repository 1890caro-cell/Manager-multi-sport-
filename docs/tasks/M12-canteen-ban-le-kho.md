# Kế hoạch triển khai: M12 POS Canteen, Bán lẻ, Quản lý kho & Ca thu ngân (POS, Retail, Inventory & Cashier Shifts)

Người phụ trách: T3 (Backend) · Giai đoạn: GĐ3 · Ngày công ước lượng (spec 8.2): 45 ngày công

## 1. Phạm vi
- **Làm:**
  - `F12.1`: Danh mục sản phẩm: Nhóm (`CANTEEN` đồ ăn/uống hoặc `RETAIL` bóng, vợt, quấn cán, phụ kiện), SKU, mã vạch (barcode), giá bán (đã gồm VAT), giá vốn, thuế suất (0%, 8%, 10%), đơn vị tính, cờ quản lý tồn kho (`trackInventory`), ảnh.
  - `F12.2`: Bán hàng tại POS: Quét mã vạch/tìm kiếm theo tên, giỏ hàng, ghi chú từng món, gắn khách hàng theo SĐT (bắt buộc nếu thanh toán qua Ví nội bộ), áp dụng giảm giá thủ công (theo hạn mức quyền thu ngân/quản lý).
  - `F12.3`: Thanh toán tại POS & hóa đơn 80mm:
    - Tiền mặt (tính tiền thừa, ghi nhận vào tiền mặt ca thu ngân).
    - VietQR động (M06).
    - Ví nội bộ (M05): **BẤT BIẾN BẮT BUỘC**: Ví nội bộ chỉ được dùng để thanh toán cho các mặt hàng nhóm `CANTEEN`, tuyệt đối không dùng cho `RETAIL`.
    - Thanh toán kết hợp (Split Payment).
    - Tự động trừ tồn kho nguyên tử ngay khi thanh toán thành công.
    - Kích hoạt xuất hóa đơn điện tử tự động qua M08 `InvoiceService`.
  - `F12.4`: Hủy đơn & hoàn hàng: Yêu cầu quyền Quản lý (`ADMIN`, `MANAGER`), nhập lý do, tự động hoàn trả tồn kho vào thẻ kho, hoàn tiền (tiền mặt / ví theo phương thức ban đầu), hủy hóa đơn điện tử tương ứng nếu đã xuất qua M08, ghi nhận `AuditLog`.
  - `F12.5`: Quản lý ca thu ngân (Cashier Shifts):
    - Mở ca: Khai báo tiền mặt đầu ca (`openingCash`). Mỗi thu ngân chỉ được mở duy nhất 1 ca tại một thời điểm.
    - Bắt buộc phải có ca đang mở mới được bán hàng tại POS; tự động khóa đăng xuất khi chưa chốt ca.
    - Chốt ca: Khai báo số tiền mặt thực tế kiểm đếm cuối ca (`closingCashActual`), hệ thống tính toán số tiền sổ sách (`closingCashExpected` = `openingCash` + tiền mặt thu bán hàng - tiền mặt chi hoàn), xác định chênh lệch (`difference` thừa/thiếu), biên bản bàn giao ca.
  - `F12.6`: Nhập hàng & Giá vốn bình quân gia quyền: Lập phiếu nhập kho, cập nhật số lượng tồn kho và tự động tính lại giá vốn bình quân:
    `gia_von_moi = Math.round((ton_cu * gia_von_cu + sl_nhap * gia_nhap) / (ton_cu + sl_nhap))`.
  - `F12.7`: Xuất kho & Thẻ kho (Stock Ledger): Lưu vết toàn bộ biến động kho (nhập hàng, bán hàng, hao hụt, hỏng hóc, điều chỉnh sau kiểm kê).
  - `F12.8`: Kiểm kê kho (Stock Audit): Lập phiếu kiểm kê, nhập số lượng tồn thực tế, duyệt phiếu điều chỉnh cân bằng kho, ghi nhật ký AuditLog.
  - `F12.9`: Cảnh báo tồn dưới ngưỡng tối thiểu (`minStockThreshold`), báo cáo sản phẩm bán chạy, báo cáo doanh thu & lãi gộp (`doanh_thu - gia_von`).

## 2. Bất biến liên quan (từ rule 00-invariants & SPEC 3.6/M12)
1. **Ví nội bộ chỉ áp dụng cho CANTEEN (SPEC Rule 1)**: Dòng hàng thuộc nhóm `RETAIL` không được thanh toán bằng ví nội bộ. Nếu đơn hàng có cả hai nhóm hoặc chỉ có `RETAIL`, tiền ví chỉ được khấu trừ tối đa bằng tổng tiền các món thuộc nhóm `CANTEEN`.
2. **Kỷ luật ca thu ngân (SPEC Rule 2)**: Mỗi thu ngân chỉ có tối đa 1 ca đang mở (`status: OPEN`) tại một thời điểm. Không thể tạo đơn bán hàng POS nếu thu ngân chưa mở ca.
3. **Chống âm kho nguyên tử (SPEC Rule 3)**: Tồn kho không âm (`stock >= 0`). Trừ tồn kho đồng thời phải dùng lệnh nguyên tử `findOneAndUpdate({ _id, stock: { $gte: quantity } }, { $inc: { stock: -quantity } })`. Nếu không đủ tồn kho -> Báo lỗi `INSUFFICIENT_STOCK`.
4. **Giá bán đã gồm thuế (SPEC Rule 4)**: Giá bán niêm yết đã bao gồm VAT. Khi xuất hóa đơn M08, tự động bóc tách doanh thu chưa thuế và thuế GTGT theo thuế suất (`vatRate`): `preTaxAmount = Math.round(totalAmount / (1 + vatRate / 100))`, `vatAmount = totalAmount - preTaxAmount`.
5. **Hủy đơn gắn liền hủy hóa đơn (SPEC Rule 5)**: Hủy đơn hàng đã phát hành hóa đơn điện tử bắt buộc phải kích hoạt quy trình hủy hóa đơn M08.
6. **Số nguyên VND an toàn**: Toàn bộ giá bán, giá vốn, tiền đầu ca, tiền cuối ca, tiền thanh toán và chênh lệch là số nguyên VND (`Number.isSafeInteger`).

## 3. Hợp đồng API (packages/contracts)
| Method | Path | Request | Response | Lỗi (`code`) |
|---|---|---|---|---|
| GET | `/api/v1/canteen/products` | `{ category, search, barcode, page, limit }` | `ProductListResponse` | None |
| GET | `/api/v1/canteen/products/:id` | None | `ProductDetail` | `PRODUCT_NOT_FOUND` |
| POST | `/api/v1/canteen/orders` | `CreatePosOrderDto` | `CanteenOrderDetail` | `NO_ACTIVE_SHIFT`, `INSUFFICIENT_STOCK`, `WALLET_PAYMENT_RETAIL_FORBIDDEN` |
| GET | `/api/v1/canteen/orders/:id` | None | `CanteenOrderDetail` | `ORDER_NOT_FOUND` |
| POST | `/api/v1/canteen/orders/:id/cancel` | `CancelPosOrderDto` | `CanteenOrderDetail` | `UNAUTHORIZED`, `ORDER_ALREADY_CANCELLED` |
| GET | `/api/v1/canteen/shifts/current` | None | `CashierShiftDetail` | `NO_ACTIVE_SHIFT` |
| POST | `/api/v1/canteen/shifts/open` | `OpenCashierShiftDto` | `CashierShiftDetail` | `SHIFT_ALREADY_OPEN` |
| POST | `/api/v1/canteen/shifts/:id/close` | `CloseCashierShiftDto` | `CashierShiftDetail` | `SHIFT_NOT_OPEN` |
| POST | `/api/v1/admin/canteen/products` | `CreateProductDto` | `ProductDetail` | `SKU_EXISTS`, `BARCODE_EXISTS` |
| PATCH | `/api/v1/admin/canteen/products/:id` | `UpdateProductDto` | `ProductDetail` | `PRODUCT_NOT_FOUND` |
| POST | `/api/v1/admin/canteen/stock/in` | `CreateStockInDto` | `StockTransactionDetail` | `PRODUCT_NOT_FOUND` |
| POST | `/api/v1/admin/canteen/stock/out` | `CreateStockOutDto` | `StockTransactionDetail` | `INSUFFICIENT_STOCK` |
| POST | `/api/v1/admin/canteen/stock/audit` | `StockAuditDto` | `StockAuditDetail` | None |
| GET | `/api/v1/admin/canteen/stock/low-stock` | None | `ProductListResponse` | None |
| GET | `/api/v1/admin/canteen/reports/profit` | `{ fromDate, toDate }` | `ProfitReportResponse` | None |

## 4. Cấu trúc CSDL
- **Collection `products`:**
  - `_id`: ObjectId
  - `sku`: string (Unique index)
  - `barcode`?: string (Unique index sparse)
  - `name`: string
  - `category`: ProductCategory (`CANTEEN`, `RETAIL`)
  - `unit`: string (lon, chai, cái, bộ, v.v.)
  - `price`: number (Giá bán gồm VAT, Integer VND)
  - `costPrice`: number (Giá vốn bình quân, Integer VND)
  - `vatRate`: number (0, 8, 10)
  - `trackInventory`: boolean (default true)
  - `stock`: number (Tồn kho hiện tại, default 0)
  - `minStockThreshold`: number (Ngưỡng cảnh báo tồn, default 5)
  - `imageUrl`?: string
  - `isActive`: boolean
- **Collection `stock_transactions` (Thẻ kho):**
  - `_id`: ObjectId
  - `productId`: ObjectId (index)
  - `type`: StockTxnType (`PURCHASE_IN`, `SALE_OUT`, `RETURN_IN`, `DISCARD_OUT`, `AUDIT_ADJUST`)
  - `quantity`: number (Dương: nhập, Âm: xuất)
  - `beforeStock`: number
  - `afterStock`: number
  - `unitPrice`?: number (Giá nhập cho PURCHASE_IN)
  - `referenceId`?: ObjectId (orderId, purchaseOrderId, auditId)
  - `notes`?: string
  - `operatorId`: ObjectId (index)
  - `createdAt`: Date (index)
- **Collection `canteen_orders`:**
  - `_id`: ObjectId
  - `orderCode`: string (Unique index, `POS-YYYYMMDD-XXXX`)
  - `shiftId`: ObjectId (index)
  - `cashierId`: ObjectId (index)
  - `customerId`?: ObjectId (Bắt buộc nếu có thanh toán ví)
  - `customerPhone`?: string
  - `items`: Array<{ productId, sku, name, category, unit, quantity, unitPrice, vatRate, subtotal }>
  - `subtotal`: number
  - `discountAmount`: number
  - `totalAmount`: number
  - `vatAmount`: number
  - `paymentMethod`: PaymentProvider (`CASH`, `VIETQR`, `INTERNAL_WALLET`, `SPLIT`)
  - `paymentId`?: ObjectId
  - `paidAmount`: number
  - `changeAmount`: number
  - `status`: OrderStatus (`PENDING`, `COMPLETED`, `CANCELLED`)
  - `cancelReason`?: string
  - `cancelledBy`?: ObjectId
  - `cancelledAt`?: Date
  - `invoiceId`?: ObjectId
  - `idempotencyKey`: string (Unique index)
  - `createdAt`: Date (index)
- **Collection `cashier_shifts`:**
  - `_id`: ObjectId
  - `shiftCode`: string (Unique index, `SHF-YYYYMMDD-XXXX`)
  - `cashierId`: ObjectId (index)
  - `cashierName`: string
  - `openedAt`: Date
  - `openingCash`: number (Integer VND)
  - `status`: ShiftStatus (`OPEN`, `CLOSED`)
  - `closedAt`?: Date
  - `closingCashExpected`?: number (openingCash + cashSales - cashRefunds)
  - `closingCashActual`?: number
  - `difference`?: number (closingCashActual - closingCashExpected)
  - `totalOrders`: number
  - `totalCashSales`: number
  - `totalQrSales`: number
  - `totalWalletSales`: number
  - `totalSales`: number
  - `notes`?: string
