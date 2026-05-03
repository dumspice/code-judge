/**
 * Logger đơn giản có prefix — đủ cho worker CLI, tránh rải `console.log` lộn xộn.
 *
 * Sau này có thể thay bằng `pino`/`winston` mà không đổi call-site nhiều
 * (giữ interface `info/warn/error`).
 */
export function createWorkerLogger(scope: string) {
  const p = `[${scope}]`;
  return {
    info: (...args: unknown[]) => console.log(p, ...args),
    warn: (...args: unknown[]) => console.warn(p, ...args),
    error: (...args: unknown[]) => console.error(p, ...args),
  };
}
