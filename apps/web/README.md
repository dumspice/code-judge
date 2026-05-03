# Web (`apps/web`)

## Mục đích

`web` là frontend Next.js cho:

- Tạo bài nộp (`Submission`).
- Kết nối Socket.io và nhận trạng thái chấm bài realtime.
- Làm nền tảng để mở rộng dashboard/ranking/contest UI.

## Luồng hiện tại (base)

1. Người dùng nhập `userId`, `problemId`, `mode`, `sourceCode`.
2. UI gọi `POST /submissions` đến Core API.
3. UI nghe các events:
   - `submission:created`
   - `submission:progress`
   - `submission:finished`
   - `submission:failed`
4. UI cập nhật status và logs theo thời gian thực.

## Thư mục/file quan trọng

- `components/ui/*`: component giao diện theo [shadcn/ui](https://ui.shadcn.com/) (preset base-nova, Tailwind v4). Chi tiết: [components/ui/README.md](components/ui/README.md).
- `components.json`: cấu hình shadcn (alias, theme, style).
- `lib/*`: helper frontend (`cn`, `getPublicCoreUrl`). Chi tiết: [lib/README.md](lib/README.md).
- `app/page.tsx`: trang demo submission + realtime (dùng Card, Button, Input, Select, Table, Badge, …).
- `app/layout.tsx`: app layout + font Geist.
- `app/globals.css`: Tailwind + theme token (CSS variables) cho shadcn.

## Scripts

- `npm run dev`: chạy Next.js local (port 3001).
- `npm run build`: build production.
- `npm run start`: chạy production build.
