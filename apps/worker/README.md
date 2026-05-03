# Worker (`apps/worker`)

## Mục đích

`worker` là process tách riêng để xử lý các jobs chấm bài trong queue BullMQ.

Lợi ích:

- Không làm block HTTP API.
- Có thể scale độc lập theo tải (tăng số worker instances).
- Thuận tiện thay đổi pipeline judge (algo mode/project mode) mà không ảnh hưởng API.

## Luồng hiện tại (base)

- Nhận job từ queue `judge:submissions`.
- Update `Submission` trong DB tu `Pending -> Running -> Accepted` (stub).
- Gửi progress (`job.updateProgress`) để Core API emit realtime về client.

## Thư mục/file quan trọng

- `src/lib/*`: helper dùng chung (logger, env, sleep, hằng số queue). Chi tiết: [src/lib/README.md](src/lib/README.md).
- `src/index.ts`: điểm vào worker, setup Redis + BullMQ Worker + Prisma.

## Scripts

- `npm run dev`: chạy worker local (watch mode).
- `npm run build`: compile TypeScript.
- `npm run start`: chạy bản build.
