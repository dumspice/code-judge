/**
 * Đọc biến môi trường bắt buộc: nếu thiếu hoặc rỗng thì ném lỗi rõ ràng.
 *
 * Dùng ở bootstrap hoặc factory nơi không thể tiếp tục khi thiếu cấu hình.
 *
 * @param name - tên biến môi trường (vd: `DATABASE_URL`).
 * @param value - giá trị đã đọc (vd: `process.env.DATABASE_URL`).
 */
export function requireEnv(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === '') {
    throw new Error(`Biến môi trường bắt buộc thiếu hoặc rỗng: ${name}`);
  }
  return value;
}
