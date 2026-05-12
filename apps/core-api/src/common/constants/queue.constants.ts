/**
 * Hằng số liên quan tới hàng đợi BullMQ.
 *
 * Giữ tên queue ở một nơi để Core API và Worker luôn khớp nhau
 * (Worker hiện khai báo lại cùng giá trị trong `apps/worker/src/lib/constants.ts`).
 * Tên không được chứa `:` (giới hạn BullMQ).
 */
export const JUDGE_SUBMISSIONS_QUEUE_NAME = 'judge-submissions' as const;

/** Queue chạy verify testcase với golden (worker xử lý — phải trùng `apps/worker/src/lib/constants.ts`). */
export const GOLDEN_VERIFY_QUEUE_NAME = 'golden-verify' as const;
