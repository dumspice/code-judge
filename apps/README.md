# Tổng quan Apps

Thư mục `apps/` chứa 3 ứng dụng chính của hệ thống:

- `core-api`: NestJS modular monolith cho API, auth, websocket realtime, queue producer.
- `worker`: Node.js worker xử lý BullMQ jobs (judge pipeline).
- `web`: Next.js frontend cho submission và theo dõi trạng thái realtime.

Nguyên tắc tách app:

- Tách theo trách nhiệm để dễ scale và dễ chuyển sang microservices sau này.
- Cùng chia sẻ workspace (`npm workspaces`) để quản lý dependency và script dễ dàng.

## Tài liệu liên quan

- Cấu hình ESLint/Prettier và các thư mục `common`/`lib`: [docs/CAU-HINH-VA-UTILS.md](../docs/CAU-HINH-VA-UTILS.md).
