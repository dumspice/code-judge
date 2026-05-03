# Thư mục `lib` (Web / Next.js)

Các helper dùng chung cho frontend (không phải React component).

## `utils.ts`

- **`cn(...inputs)`**: gộp className (clsx) + `tailwind-merge` để tránh conflict utility Tailwind.
  - Dùng khi build UI theo style shadcn.

## `public-config.ts`

- **`getPublicCoreUrl()`**: đọc `NEXT_PUBLIC_CORE_URL`, fallback `http://localhost:3000`.
  - Dùng cho `fetch()` và `socket.io-client` trong Client Component.
