/**
 * Tên biến môi trường dùng trong dự án (tránh magic string rải rác).
 *
 * Lưu ý: giá trị thực tế vẫn đọc qua `ConfigService` hoặc `process.env` tùy chỗ;
 * object này chỉ để thống nhất key string.
 */
export const EnvKeys = {
  /** Cổng HTTP của Core API (mặc định thường 3000). */
  PORT: 'PORT',
  /** Chuỗi kết nối PostgreSQL cho Prisma. */
  DATABASE_URL: 'DATABASE_URL',
  /** Redis URL cho BullMQ / cache. */
  REDIS_URL: 'REDIS_URL',
  /** Secret ký JWT (bắt buộc khi bật module auth). */
  JWT_SECRET: 'JWT_SECRET',
  /** Thời hạn access token tính bằng giây (ví dụ `3600`). Mặc định trong code: 604800 (7 ngày). */
  JWT_EXPIRES_IN: 'JWT_EXPIRES_IN',
  /** Secret riêng cho refresh token (tách khỏi access token secret). */
  JWT_REFRESH_SECRET: 'JWT_REFRESH_SECRET',
  /** Thời hạn refresh token tính bằng giây. Mặc định trong code: 604800 (7 ngày). */
  JWT_REFRESH_EXPIRES_IN: 'JWT_REFRESH_EXPIRES_IN',
  /** Google OAuth Client ID. */
  GOOGLE_CLIENT_ID: 'GOOGLE_CLIENT_ID',
  /** Google OAuth Client Secret. */
  GOOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
  /** Google OAuth Callback URL. */
  GOOGLE_CALLBACK_URL: 'GOOGLE_CALLBACK_URL',
} as const;

export type EnvKey = (typeof EnvKeys)[keyof typeof EnvKeys];
