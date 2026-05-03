# Thư mục `src/common` (Core API)

Mục đích: gom **hằng số**, **quy ước env**, và **hàm tiện ích** dùng lại trong nhiều module Nest (queue, realtime, prisma, auth sau này) mà không tạo vòng phụ thuộc vòng (feature module không nên import lẫn nhau chỉ để lấy 1 hằng số).

---

## `index.ts`

- **Tác dụng**: “barrel file” — re-export toàn bộ public API của `common/` để import gọn.
- **Các dòng**:
  - `export * from './constants/...'`: re-export hằng số queue/socket.
  - `export * from './config/...'`: re-export tên key env.
  - `export * from './utils/...'`: re-export `sleep`, `requireEnv`.

---

## `constants/queue.constants.ts`

- **Tác dụng**: một nơi duy nhất định nghĩa tên queue BullMQ cho luồng chấm bài.
- **`JUDGE_SUBMISSIONS_QUEUE_NAME`**:
  - Giá trị `'judge:submissions'`.
  - Dùng trong `BullMqModule` khi tạo `Queue` / `QueueEvents`.
  - Worker phải dùng cùng chuỗi (hiện khai báo lại trong `apps/worker/src/lib/constants.ts`).

---

## `constants/socket.constants.ts`

- **Tác dụng**: chuẩn hoá tên room Socket.io theo user.
- **`SOCKET_USER_ROOM_PREFIX`**:
  - Prefix `'user:'` để tránh trùng namespace room khác (vd `class:`, `contest:`).
- **`socketUserRoom(userId)`**:
  - Nối prefix + `userId` → room name.
  - Dùng trong `SubmissionGateway` khi `join` và khi `emit`.

---

## `config/env.keys.ts`

- **Tác dụng**: tránh “magic string” cho tên biến môi trường.
- **`EnvKeys` object**:
  - Mỗi field là một string literal (`PORT`, `DATABASE_URL`, …).
- **`EnvKey` type**:
  - Union các giá trị của `EnvKeys` — tiện cho type-safe hơn ở tương lai.

---

## `utils/sleep.ts`

- **Tác dụng**: `sleep(ms)` trả về `Promise<void>` — chờ async.
- **Tham số `ms`**: số milliseconds.
- **Ứng dụng**: stub judge, demo, backoff đơn giản.

---

## `utils/required-env.ts`

- **Tác dụng**: đọc env bắt buộc; nếu thiếu thì throw rõ ràng.
- **`requireEnv(name, value)`**:
  - `name`: tên biến để hiển thị trong lỗi.
  - `value`: thường là `process.env.X`.
  - Nếu `undefined` hoặc chuỗi rỗng/trim rỗng → `throw new Error(...)`.
  - Ngược lại trả về chuỗi đã xác thực.

---

## Gợi ý mở rộng (chưa làm)

- `common/filters/http-exception.filter.ts`: format lỗi HTTP thống nhất.
- `common/interceptors/logging.interceptor.ts`: log request id / latency.
- `common/guards/roles.guard.ts`: phân quyền theo role sau khi có JWT đầy đủ.
