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
} as const;

export type EnvKey = (typeof EnvKeys)[keyof typeof EnvKeys];
