/**
 * Đọc biến môi trường với quy ước rõ ràng (bắt buộc / tuỳ chọn + default).
 */

/** Biến bắt buộc: thiếu hoặc rỗng → ném lỗi. */
export function getRequiredEnv(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === '') {
    throw new Error(`Biến môi trường bắt buộc thiếu hoặc rỗng: ${name}`);
  }
  return value;
}

/**
 * Biến tuỳ chọn: nếu không có thì dùng `defaultValue`.
 *
 * @param value - giá trị đã đọc (vd `process.env.REDIS_URL`).
 * @param defaultValue - fallback an toàn cho môi trường dev.
 */
export function getOptionalEnv(value: string | undefined, defaultValue: string): string {
  if (value === undefined || value.trim() === '') return defaultValue;
  return value;
}
