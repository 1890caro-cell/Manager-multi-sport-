# Kế hoạch triển khai: M24 DevOps, Bảo mật & Giám sát (DevOps, Security & Monitoring)

Người phụ trách: T7 (QA & DevOps) · Giai đoạn: GĐ5 - GĐ6 · Ngày công ước lượng (spec 8.2): 40 ngày công

## 1. Phạm vi
- **Làm:**
  - `F24.1`: Containerization & Multi-stage Dockerfiles cho toàn bộ ứng dụng:
    - `apps/api/Dockerfile`: Biên dịch NestJS, tối ưu image kích thước nhỏ, non-root user.
    - `apps/web/Dockerfile`: Biên dịch Next.js 14 App Router, standalone build, asset optimization.
    - `apps/admin/Dockerfile`: Biên dịch Next.js 14 App Router trang quản trị.
    - `apps/pos/Dockerfile`: Biên dịch Next.js 14 App Router màn hình POS cảm ứng.
  - `F24.2`: Docker Compose Orchestration:
    - Cập nhật `docker-compose.yml`: Chạy toàn bộ stack cục bộ (Mongo replica set 1 node, Redis, API, Web, Admin, POS, Prometheus, Grafana).
    - Tạo `docker-compose.prod.yml`: Cấu hình production có restart policies, health checks, log rotation, network isolation, resource limits (CPU/Memory limits).
  - `F24.3`: Reverse Proxy, Routing & Bảo mật với Nginx (`deploy/nginx/nginx.conf`):
    - Định tuyến cổng tập trung:
      - `/*` -> Web khách hàng (`apps/web:3000`)
      - `/admin/*` -> Trang quản trị (`apps/admin:3000`)
      - `/pos/*` -> Giao diện quầy POS (`apps/pos:3000`)
      - `/api/*` -> Backend API NestJS (`apps/api:3000`)
      - `/socket.io/*` -> Bridge Agent & Realtime WebSocket (`apps/api:3000`)
    - Bảo mật:
      - Rate limiting 60 req/min cho IP thông thường, chống DDOS, burst 20 reqs.
      - Chống clickjacking (`X-Frame-Options: SAMEORIGIN`).
      - Chống MIME sniffing (`X-Content-Type-Options: nosniff`).
      - Content Security Policy (CSP), Referrer-Policy, Strict-Transport-Security (HSTS).
      - Giới hạn payload upload tối đa 10MB (`client_max_body_size 10M`).
  - `F24.4`: Giám sát & Cảnh báo (Prometheus & Grafana):
    - Cấu hình cào số liệu `deploy/monitoring/prometheus/prometheus.yml` (API metrics `/metrics`, MongoDB, Redis, Nginx status).
    - Tự động nạp cấu hình Datasource và Dashboard Grafana (`deploy/monitoring/grafana/`).
    - Bảng điều khiển Grafana giám sát toàn diện (`sports-overview.json`): Tỷ lệ lỗi HTTP 5xx, p95/p99 request latency, số lượng kết nối CCU, số phiên gaming đang hoạt động, bộ đếm tải phòng gym, độ trễ Redis Lock.
  - `F24.5`: Tự động hóa CI/CD với GitHub Actions (`.github/workflows/ci.yml`):
    - Pipeline tự động kích hoạt trên mỗi Pull Request và commit vào nhánh chính.
    - Chạy tuần tự: Cài đặt phụ thuộc pnpm -> Turborepo typecheck (7 packages) -> Kiểm thử tự động (52 test suites, 320 tests) -> Quét lỗ hổng bảo mật -> Build toàn bộ dự án.

## 2. Bất biến liên quan (Rule 00-invariants.md & SPEC Section 10)
1. **Network Isolation**: Cơ sở dữ liệu MongoDB và Redis chỉ nằm trong mạng nội bộ docker network `backend-net`, tuyệt đối không mở port ra Internet công cộng ở môi trường Production.
2. **Non-Root Execution**: Tất cả container chạy dưới quyền user không đặc quyền (`node` / `appuser`).
3. **Idempotent CI/CD**: Pipeline CI độc lập, tái tạo được 100% qua pnpm lockfile.
