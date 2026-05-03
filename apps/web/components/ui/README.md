# Thư mục `components/ui` (shadcn/ui)

Các component UI **copy vào repo** theo [shadcn/ui](https://ui.shadcn.com/), preset **base-nova**, tương thích **Tailwind CSS v4** và **Next.js 15**.

## Cấu hình

- **`components.json`** (thư mục gốc `apps/web`): alias `@/components`, `@/lib/utils`, style `base-nova`, theme `neutral`, CSS variables.
- **`app/globals.css`**: import `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`; định nghĩa token màu (`:root` / `.dark`) và `@theme inline` cho Tailwind v4.
- **`tailwind.config.ts`**: `content` gồm `app/` và `components/` để class trong UI không bị purge.

## Component hiện có

| File | Vai trò |
|------|---------|
| `button.tsx` | Nút bấm, variants qua `class-variance-authority`; primitive từ `@base-ui/react/button`. |
| `card.tsx` | Khối nội dung: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`. |
| `input.tsx` | Ô nhập một dòng; `@base-ui/react/input`. |
| `label.tsx` | Nhãn form; hỗ trợ `htmlFor` / `peer` styling. |
| `textarea.tsx` | Ô nhập nhiều dòng (mã nguồn). |
| `select.tsx` | Chọn giá trị (dropdown); `@base-ui/react/select` + portal/popup. |
| `badge.tsx` | Trạng thái / nhãn nhỏ; variants qua `cva`. |
| `table.tsx` | Bảng: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, … |

## Thêm component mới

Trong thư mục `apps/web`:

```bash
npx shadcn@latest add <tên-component> -y
```

Ví dụ: `dialog`, `tabs`, `dropdown-menu`, `toast`, `skeleton`.

## Ghi chú

- **Không** import UI từ npm dạng “một package duy nhất”; mã nằm trong repo để tùy biến (LMS, dark mode, density).
- Font: `app/layout.tsx` dùng **Geist** qua `next/font/google`, biến `--font-sans` khớp theme trong `globals.css`.
