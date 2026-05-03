# Core API (`apps/core-api`)

## Mục đích

`core-api` là backend trung tâm (NestJS) cho:

- HTTP API (tạo submissions, quản lý LMS/auth sau này).
- Realtime updates qua Socket.io.
- Queue producer + queue events listener (BullMQ/Redis).
- Truy cập database PostgreSQL thông qua Prisma.

## Luồng cơ bản hiện tại

1. Client gọi `POST /submissions`.
2. API tạo record `Submission` trong DB.
3. API đẩy job vào queue `judge:submissions`.
4. API phát event realtime cho `room=user:<userId>`.
5. Worker xử lý job và cập nhật state, Core lắng nghe queue events để push status đến client.

## Thư mục quan trọng

- `src/common/*`: hằng số dùng chung (queue, socket room), env keys, utils (`sleep`, `requireEnv`). Chi tiết: [src/common/README.md](src/common/README.md).
- `src/main.ts`: điểm vào ứng dụng NestJS.
- `src/app.module.ts`: module gốc.
- `src/submissions/*`: endpoint và service xử lý submit.
- `src/realtime/*`: gateway Socket.io.
- `src/queues/*`: setup BullMQ + QueueEvents.
- `src/prisma/*`: PrismaService, kết nối DB.
- `prisma/schema.prisma`: schema entities.
- `prisma.config.ts`: datasource config cho Prisma v7.

## Scripts

- `npm run dev`: chạy local với ts-node-dev.
- `npm run build`: compile TypeScript.
- `npm run start`: chạy bản build.
- `npm run prisma:generate`: generate Prisma client.
- `npm run prisma:migrate`: tạo/chạy migration local.
- `npm run prisma:studio`: mở Prisma Studio.
