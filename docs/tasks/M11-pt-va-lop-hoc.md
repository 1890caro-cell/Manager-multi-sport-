# Kế hoạch triển khai: M11 PT, Lớp học & Nhân sự huấn luyện viên

Người phụ trách: T5 (Backend Core) + T4 (Giao diện) · Giai đoạn: GĐ3 · Ngày công ước lượng (spec 8.2): 35 ngày công

## 1. Phạm vi
- **Làm:**
  - `F11.1`: Hồ sơ nhân sự (`StaffProfile`):
    - Thông tin liên kết tài khoản `User` (vai trò `TRAINER` / `STAFF` / `CASHIER`).
    - Chứng chỉ (`certifications`), chuyên môn, trạng thái làm việc (`ACTIVE`, `ON_LEAVE`, `TERMINATED`).
  - `F11.2`: Hồ sơ Huấn luyện viên cá nhân (PT Profile):
    - Chuyên môn (`specialties`: Gym, Yoga, Boxing, Pilates, Bơi lội, Phục hồi chức năng...).
    - Giới thiệu (`bio`), ảnh đại diện, số năm kinh nghiệm, đơn giá buổi tập PT 1-1 (`hourlyRate`).
    - Công khai cho khách hàng tra cứu, xem đánh giá và đặt lịch.
  - `F11.3`: Lịch làm việc và phân ca (`StaffShift`):
    - Quản lý xếp ca nhân viên: ngày, ca làm việc (`MORNING`, `AFTERNOON`, `EVENING`, `NIGHT`), giờ bắt đầu/kết thúc.
    - Nhân viên tra cứu lịch ca của cá nhân.
  - `F11.4`: Chấm công cơ bản (`AttendanceRecord`):
    - Check-in vào ca và Check-out ra ca tại POS hoặc ứng dụng nhân viên.
    - Ghi nhận thời gian thực tế, vị trí/thiết bị chấm công.
  - `F11.5`: Quản lý Lớp học nhóm (`ClassTemplate` & `ClassSession`):
    - Mẫu lớp: Tên lớp, loại bộ môn (`ClassType`: `YOGA`, `ZUMBA`, `PILATES`, `BOXING`, `SPINNING`, `AEROBIC`), PT phụ trách, sức chứa tối đa (`capacity`), giá vé buổi học (`pricePerSession`), lịch định kỳ trong tuần.
    - Tự động sinh các buổi học theo lịch (`ClassSession`: ngày học, giờ học, phòng học, số lượng đã đăng ký `bookedCount`).
  - `F11.6`: Khách hàng đăng ký & tham gia lớp (`ClassRegistration`):
    - Đặt chỗ tham gia buổi học, kiểm soát không vượt quá sức chứa lớp (`bookedCount < capacity`).
    - **Bất biến**: Không thanh toán bằng ví nội bộ cho học phí lớp (dùng Tiền mặt, VietQR hoặc trừ gói combo).
    - Hủy đăng ký theo thời hạn cấu hình (mặc định trước 12 giờ để hoàn tiền).
    - Điểm danh học viên khi vào lớp (`CHECKED_IN`).
  - `F11.7`: Hủy / Dời lịch buổi học:
    - Huấn luyện viên hoặc quản lý hủy buổi: tự động thông báo và hoàn tiền/hoàn buổi cho toàn bộ học viên đã đăng ký.
  - `F11.8`: Đặt lịch PT 1-1 (`PtBookingSession`):
    - Khách hàng đặt lịch tập 1-1 theo khung giờ rảnh của PT.
    - Kiểm tra xung đột: **Bất biến PT không bị trùng giờ** (không trùng giữa 2 buổi PT 1-1 và không trùng với ca dạy lớp nhóm).
    - Khấu trừ buổi tập từ Gói Combo (qua M15 `deductPackageItem`) hoặc thanh toán trực tiếp.
  - `F11.9`: Quản lý buổi dạy & Bảo mật dữ liệu học viên (Data Privacy):
    - PT xem lịch dạy, danh sách học viên trong ca, ghi chú giáo án, chỉ số thể lực học viên.
    - **Bất biến**: Huấn luyện viên chỉ xem được dữ liệu học viên của chính mình.
  - `F11.10`: Thưởng & Báo cáo số buổi dạy:
    - Ghi nhận tiền thưởng buổi dạy (`bonusAmount`).
    - Báo cáo tổng số ca dạy, số giờ PT 1-1 và số lớp đã hoàn thành theo tháng phục vụ bộ phận kế toán.

## 2. Bất biến liên quan (Rule 00-invariants & SPEC 3.6/M11)
1. **PT không bị xếp trùng giờ**: Huấn luyện viên không thể có 2 buổi dạy (lớp nhóm hoặc PT 1-1) giao nhau về mặt thời gian.
2. **Lớp học không vượt sức chứa**: Đăng ký lớp thực hiện kiểm tra nguyên tử `bookedCount < capacity`, ngăn chặn triệt để tình trạng oversell.
3. **Cấm thanh toán bằng ví nội bộ cho Lớp học & PT**: Học phí lớp và phí thuê PT không thuộc danh mục chi tiêu ví, bắt buộc thanh toán bằng Tiền mặt, VietQR hoặc khấu trừ từ Gói Combo (M15).
4. **Bảo mật dữ liệu học viên (PT Data Isolation)**: Huấn luyện viên chỉ được truy cập dữ liệu học viên mà mình trực tiếp phụ trách.
5. **Tiền VND nguyên an toàn**: Đơn giá buổi học, đơn giá PT, tiền thưởng phải là số nguyên VND an toàn (`Number.isSafeInteger`).

## 3. Hợp đồng API (packages/contracts)
| Method | Path | Quyền | Mục đích |
|---|---|---|---|
| GET | `/api/v1/pt/trainers` | Public | Danh sách hồ sơ PT công khai |
| GET | `/api/v1/pt/trainers/:id` | Public | Chi tiết hồ sơ PT & chuyên môn |
| GET | `/api/v1/classes` | Public | Danh sách lịch lớp học mở đăng ký |
| GET | `/api/v1/classes/:id` | Public | Chi tiết buổi học và số chỗ còn trống |
| POST | `/api/v1/classes/:id/register` | Customer | Đăng ký tham gia lớp học |
| POST | `/api/v1/classes/registrations/:id/cancel` | Customer | Hủy đăng ký buổi học trước hạn 12h |
| POST | `/api/v1/pt/sessions/book` | Customer | Đặt lịch tập PT 1-1 theo lịch rảnh |
| GET | `/api/v1/trainer/my-schedule` | Trainer | Lịch dạy cá nhân (Lớp + PT 1-1) |
| POST | `/api/v1/trainer/sessions/:id/check-in` | Trainer | Điểm danh học viên buổi tập |
| POST | `/api/v1/staff/attendance/check-in` | Staff | Chấm công vào ca làm việc |
| POST | `/api/v1/staff/attendance/check-out` | Staff | Chấm công ra ca làm việc |
| POST | `/api/v1/admin/classes/templates` | Admin/Manager | Tạo mẫu lớp học định kỳ |
| POST | `/api/v1/admin/classes/sessions/generate` | Admin/Manager | Sinh các buổi học từ mẫu |
| POST | `/api/v1/admin/staff/shifts` | Admin/Manager | Phân ca làm việc nhân viên |
| GET | `/api/v1/admin/pt/reports/monthly` | Admin/Manager | Báo cáo số buổi dạy và thưởng PT |

## 4. Kiểm thử & Nghiệm thu (Đã hoàn thành 100%)
- **Trạng thái**: Hoàn thành toàn diện (100%).
- **Kiểm thử đơn vị & tích hợp**:
  - `staff-management.service.spec.ts`: 7/7 tests passed (tạo, cập nhật hồ sơ PT, phân ca nhân viên, chấm công check-in / check-out, tính số phút làm việc).
  - `class-management.service.spec.ts`: 10/10 tests passed (mẫu lớp, sinh buổi tự động, bất biến cấm ví nội bộ cho học phí, trừ combo, kiểm tra sức chứa, hủy trước 12h, điểm danh).
  - `pt-booking.service.spec.ts`: 9/9 tests passed (bất biến cấm ví nội bộ, bất biến PT không bị xếp trùng giờ với PT khác hoặc lớp nhóm, bảo mật dữ liệu học viên PT privacy, báo cáo tháng).
  - `class-capacity.race.spec.ts`: 1/1 concurrency race test passed (20 học viên đồng thời tranh 2 suất lớp cuối cùng -> đúng 2 người thành công, 18 người bị từ chối `CLASS_FULL`, `bookedCount = 20`).
  - `pt-conflict.race.spec.ts`: 1/1 concurrency race test passed (10 khách hàng đồng thời đặt lịch cùng 1 HLV khung giờ 09:00 - 10:00 -> đúng 1 người thành công, 9 người bị từ chối `TRAINER_TIME_CONFLICT`).
- **Monorepo Suite**: Toàn bộ 40 test suites, 235 tests passed 100%. `turbo run typecheck build` 0 errors.

