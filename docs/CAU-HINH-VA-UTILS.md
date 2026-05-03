# Cấu hình chung & tiện ích (monorepo `code-judge`)

Tài liệu này mô tả **tác dụng từng file config ở root** và **các thư mục common/lib** trong từng app. Phần “giải thích từng dòng” chi tiết nhất nằm trong comment trực tiếp trong source và trong `apps/core-api/src/common/README.md`.

---

## Root — file cấu hình

### `eslint.config.mjs`

- **Mục đích**: ESLint 9 (flat config) cho toàn repo.
- **Nội dung chính**:
  - `ignores`: bỏ qua `node_modules`, `dist`, `.next`, `coverage`, và một số file do framework tự sinh / CommonJS config (`next.config.js`, `postcss.config.js`, `next-env.d.ts`).
  - `eslint.configs.recommended`: rule cơ bản JS.
  - `typescript-eslint` recommended: rule khuyến nghị cho TS (phiên bản không bật type-aware để đơn giản monorepo).
  - `eslint-config-prettier`: tắt rule xung đột với Prettier.
  - `rules`: nới `no-explicit-any`, cảnh báo unused vars có ignore `_` prefix.

**Lưu ý Next.js**: `next build` có thể cảnh báo “Next.js plugin was not detected” vì cấu hình ESLint hiện tại ưu tiên monorepo đơn giản; có thể bổ sung `eslint-config-next` ở bước sau nếu cần rule chuyên biệt App Router.

### `.prettierrc`

- **Mục đích**: định dạng code thống nhất (semicolon, singleQuote, printWidth, …).

### `.prettierignore`

- **Mục đích**: không format `node_modules`, artifact build, lockfile.

### `.editorconfig`

- **Mục đích**: IDE tự chỉnh indent / newline / charset nhất quán.

### `package.json` (scripts)

- **`lint` / `lint:fix`**: chạy ESLint toàn repo.
- **`format` / `format:check`**: chạy Prettier.

---

## `apps/core-api/src/common/`

Xem chi tiết: [apps/core-api/src/common/README.md](../apps/core-api/src/common/README.md).

Tóm tắt:

- Hằng số queue + socket room.
- Key env thống nhất.
- `sleep`, `requireEnv`.

**Điểm tích hợp hiện tại**:

- `src/queues/bullmq.module.ts` dùng `JUDGE_SUBMISSIONS_QUEUE_NAME`.
- `src/realtime/submission.gateway.ts` dùng `socketUserRoom`.
- `src/prisma/prisma.service.ts` dùng `EnvKeys` + `requireEnv`.

---

## `apps/worker/src/lib/`

Xem: [apps/worker/src/lib/README.md](../apps/worker/src/lib/README.md).

- Logger có prefix, đọc env, `sleep`, hằng số queue (phải khớp Core API).

**Điểm tích hợp**: `src/index.ts` dùng toàn bộ helper thay vì rải logic thô.

---

## `apps/web/lib/`

Xem: [apps/web/lib/README.md](../apps/web/lib/README.md).

- `cn()` cho Tailwind/shadcn.
- `getPublicCoreUrl()` cho REST + Socket.io.

## `apps/web/components/ui/` (shadcn/ui)

Xem: [apps/web/components/ui/README.md](../apps/web/components/ui/README.md).

- Component UI copy từ registry shadcn (preset **base-nova**, Tailwind v4).
- `components.json` cấu hình alias và theme; thêm component: `npx shadcn@latest add <tên> -y` trong `apps/web`.

**Cấu hình path alias**: `apps/web/tsconfig.json` có `baseUrl` + `paths["@/*"]` để import `@/lib/...`.

**Điểm tích hợp**: `app/page.tsx` dùng `getPublicCoreUrl`, `cn`, và các component `@/components/ui/*`.

### `app/page.tsx` — giải thích theo khối (khuyến nghị)

File này khá dài; ta mô tả theo **khối** để dễ bảo trì:

1. **`'use client'`**: đánh dấu Client Component (cần hooks + Socket.io trên trình duyệt).
2. **Import**:
   - React hooks: quản lý state + lifecycle.
   - `socket.io-client`: kết nối realtime.
   - `@/lib/public-config` + `@/lib/utils`: helper dùng chung.
3. **Types** (`Submission*Payload`): mô tả hình dạng payload từ server (giảm `any`).
4. **`coreUrl`**: base URL Core API; dùng cho `fetch` và `io(coreUrl, ...)`.
5. **State**: input form + trạng thái hiển thị (status, logs, submissionId).
6. **`submissionIdRef`**: ref để lọc event realtime theo submission hiện tại (tránh race khi user submit liên tiếp).
7. **`useEffect` (socket)**:
   - tạo socket, subscribe events, cleanup `disconnect` khi `userId` đổi/unmount.
8. **`onSubmit`**:
   - `POST /submissions`, xử lý lỗi HTTP, parse JSON.
9. **JSX**:
   - form nhập liệu + panel hiển thị submission/logs; `cn(...)` gom className.

---

## Ghi chú về “giải thích từng dòng code”

- Với file ngắn (utils/constants): README + comment trong file đã đủ chi tiết.
- Với file dài (vd `page.tsx`): nên mô tả theo **khối chức năng** (state, effect socket, submit handler, JSX sections) để tránh tài liệu trùng lặp và khó bảo trì; phần khối đã được comment ở đầu file.
