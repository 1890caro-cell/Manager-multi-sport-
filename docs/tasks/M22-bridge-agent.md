# Kế hoạch triển khai: M22 Bridge agent và thiết bị tại quầy (Bridge Agent & Device Management)

Người phụ trách: T6 (IoT & Gaming) · Giai đoạn: GĐ3 · Ngày công ước lượng (spec 8.2): 30 ngày công

## 1. Phạm vi
- **Làm:**
  - `F22.1`: Điều khiển và giao tiếp thiết bị ngoại vi tại quầy & cửa:
    - Đọc thẻ RFID, mã QR/mã vạch, cảm biến vân tay/FaceID.
    - Điều khiển rơ-le kích mở cửa xoay (Turnstile) / khóa chốt điện tử (3-5 giây tự đóng).
    - In biên lai qua máy in nhiệt ESC/POS khổ 80mm (hỗ trợ tiếng Việt UTF-8/TCVN3, cắt giấy tự động).
    - Kích xung điện mở ngăn kéo đựng tiền tại quầy (Cash Drawer Kick Pulse - RJ11 Pin 2/5).
    - Điều khiển rơ-le bật/tắt đèn sân thể thao theo lịch đặt chỗ hoặc lệnh tức thời.
  - `F22.2`: Kênh kết nối an toàn Cloud - Agent:
    - Kênh giao tiếp thời gian thực bảo mật (WebSocket Gateway & REST fallback) sử dụng token định danh riêng cho từng Agent (`agentCode`, `tokenHash`), hỗ trợ thu hồi token từ xa khi nghi ngờ lộ thông tin.
    - Cơ chế Heartbeat định kỳ (mỗi 30 giây) để giám sát trạng thái `ONLINE` / `OFFLINE` của từng Agent.
  - `F22.3`: Khả năng vận hành ngoại tuyến (Offline Resilience):
    - Đồng bộ bộ nhớ đệm thành viên có hiệu lực (`Offline Member Cache`) về Agent với cơ chế mã hóa.
    - Hàng đợi sự kiện ngoại tuyến (`Offline Event Queue`): Khi rớt mạng, Agent tự động kiểm tra thẻ thành viên/QR vé offline, mở cửa xoay và ghi nhận lượt vào vào hàng đợi cục bộ.
    - Tự động đẩy (replay) hàng đợi sự kiện lên Cloud ngay khi mạng phục hồi, xử lý khử trùng lặp và đối soát trạng thái thẻ/vé.
  - `F22.4`: Cấu hình từ xa & Quản lý vòng đời:
    - Quản lý danh mục Bridge Agent theo chi nhánh/quầy/vị trí cửa xoay.
    - Cập nhật cấu hình thiết bị từ xa (cổng COM, baud rate, địa chỉ IP máy in LAN, thời gian trễ đóng mở rơ-le).
    - Ghi nhận nhật ký hoạt động và theo dõi phiên bản phần mềm Agent.
  - `F22.5`: Chẩn đoán trạng thái thiết bị (Device Diagnostics):
    - Thu thập trạng thái sức khỏe từng thiết bị kết nối với Agent: Trạng thái máy in (sẵn sàng, hết giấy, kẹt giấy, mất kết nối), trạng thái cửa xoay (sẵn sàng, kẹt, mở cưỡng bức), đầu đọc thẻ (hoạt động/lỗi).
    - Cảnh báo trực quan lên POS và màn hình Giám đốc khi phát hiện sự cố phần cứng.

## 2. Bất biến liên quan (Rule 00-invariants & SPEC 3.6/M22)
1. **Bảo mật xác thực Agent**: Mọi kết nối WebSocket / API từ Agent lên Cloud phải xác thực bằng Agent Secret Key và gắn `agentCode`. Token có thể bị vô hiệu hóa tức thì từ trang Quản trị.
2. **Khử trùng lặp sự kiện ngoại tuyến**: Các sự kiện đẩy từ Agent lên Cloud (vào cổng, quét thẻ, in phiếu) bắt buộc phải có `idempotencyKey` hoặc `eventCode` duy nhất để chống ghi nhận trùng lặp khi mạng chập chờn.
3. **An toàn kiểm soát vào ra**: Khi offline, chỉ chấp nhận thẻ thành viên/mã QR còn hạn và có chữ ký xác thực trong cache. Khi phục hồi mạng, các sự kiện vào phòng gym phải được đối soát vào `GymAccessEvent` và cập nhật sĩ số thời gian thực.
4. **Không làm nghẽn POS**: Lệnh in hóa đơn và kích ngăn kéo phải là bất đồng bộ (non-blocking) qua hàng đợi lệnh `DeviceCommand`.

## 3. Hợp đồng API (packages/contracts)
| Method | Path | Quyền | Mục đích |
|---|---|---|---|
| POST | `/api/v1/bridge/agent/handshake` | Public (Agent Token) | Xác thực kết nối Agent và lấy cấu hình ban đầu |
| POST | `/api/v1/bridge/agent/heartbeat` | Agent Token | Gửi nhịp tim định kỳ & báo cáo trạng thái thiết bị |
| POST | `/api/v1/bridge/agent/events` | Agent Token | Đẩy sự kiện thiết bị (RFID, QR, cửa xoay, mở két) lên cloud |
| GET | `/api/v1/bridge/agent/sync/members` | Agent Token | Tải snapshot danh sách hội viên/vé hợp lệ về cache offline |
| POST | `/api/v1/bridge/agent/sync/offline-events` | Agent Token | Đồng bộ hàng đợi sự kiện ngoại tuyến sau khi có mạng lại |
| GET | `/api/v1/admin/bridge/agents` | Admin/Manager/Cashier | Danh sách tất cả Bridge Agent và trạng thái kết nối |
| POST | `/api/v1/admin/bridge/agents` | Admin | Đăng ký Agent mới và cấp Secret Token |
| GET | `/api/v1/admin/bridge/agents/:id` | Admin/Manager | Chi tiết Agent, nhật ký & chẩn đoán thiết bị |
| POST | `/api/v1/admin/bridge/agents/:id/commands` | Admin/Manager/Cashier | Gửi lệnh tức thời (mở cửa, in test, mở két, bật đèn) |

## 4. Trạng thái & Kết quả kiểm thử (100% Hoàn thành)
- **Shared Enums (`packages/shared/src/enums/index.ts`)**:
  - `BridgeAgentStatus` (`ONLINE`, `OFFLINE`, `ERROR`, `REVOKED`), `DeviceType` (`RFID_READER`, `QR_SCANNER`, `TURNSTILE`, `ESC_POS_PRINTER`, `CASH_DRAWER`, `COURT_RELAY`), `DeviceHealthStatus` (`OK`, `ERROR`, `DISCONNECTED`, `OUT_OF_PAPER`, `JAMMED`), `DeviceCommandType`, `DeviceCommandStatus`, `DeviceEventType`.
- **Contracts (`packages/contracts/src/bridge.ts`)**:
  - Zod Schemas & DTOs cho Handshake, Heartbeat, Commands, Events, Offline Cache Snapshot, Diagnostics.
- **Mongoose Schemas (`apps/api/src/modules/bridge/schemas/`)**:
  - `BridgeAgent`: TokenHash, SessionTokenHash, deviceStatuses map, config, lastHeartbeatAt.
  - `DeviceCommand`: Hàng đợi lệnh ưu tiên (priority 1-10), trạng thái `PENDING` -> `SENT` -> `EXECUTED` / `FAILED`, chống trùng lặp `idempotencyKey`.
  - `DeviceEvent`: Lưu vết sự kiện thiết bị, hỗ trợ cờ `isOfflineReplay` và đối soát.
- **Dịch vụ (`BridgeAgentService`, `DeviceCommandService`, `DeviceEventService`, `OfflineSyncService`)**:
  - Bắt tay xác thực (Handshake), cấp session token 24h, Heartbeat định kỳ và chẩn đoán phần cứng (Device Diagnostics).
  - Tiếp nhận sự kiện quét mã QR / thẻ RFID vào Gym, tự động xác thực và kích mở cửa xoay Turnstile 3 giây (`AUTO-OPEN-IN`).
  - Hỗ trợ check-out chiều ra, mở cửa xoay thoát (`AUTO-OPEN-OUT`).
  - Kích mở két tiền (Cash Drawer) kèm ghi nhật ký Audit Log bảo mật.
  - Sinh snapshot bộ nhớ đệm thành viên kèm chữ ký HMAC-SHA256 (`Offline Member Cache`) phục vụ chạy ngoại tuyến khi rớt mạng Internet.
  - Đồng bộ hàng đợi ngoại tuyến (`Offline Event Queue`) ngay khi mạng phục hồi, xử lý Idempotent Replay.
- **Bộ kiểm thử tự động**:
  - `bridge-agent.service.spec.ts`: 7/7 tests passed.
  - `device-command.service.spec.ts`: 8/8 tests passed.
  - `device-event.service.spec.ts`: 5/5 tests passed.
  - `offline-sync.service.spec.ts`: 3/3 tests passed.
  - Monorepo full suite: 50/50 test suites passed, 297/297 tests passed. Typecheck 0 errors, build cleanly.

