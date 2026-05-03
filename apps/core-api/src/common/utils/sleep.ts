/**
 * Trì hoãn thực thi async một khoảng thời gian (ms).
 * Hữu ích cho stub judge, retry backoff đơn giản, hoặc demo.
 *
 * @param ms - số milliseconds cần chờ (>= 0).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
