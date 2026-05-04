/**
 * Hằng số liên quan tới hàng đợi BullMQ.
 *
 * Giữ tên queue ở một nơi để Core API và Worker luôn khớp nhau
 * (Worker hiện khai báo lại cùng giá trị trong `apps/worker/src/lib/constants.ts`).
 * Tên không được chứa `:` (giới hạn BullMQ).
 */
export const JUDGE_SUBMISSIONS_QUEUE_NAME = 'judge-submissions' as const;
