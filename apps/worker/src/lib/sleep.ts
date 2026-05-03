/**
 * Chờ `ms` milliseconds (dùng trong pipeline judge stub / demo).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
