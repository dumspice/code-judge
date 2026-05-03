/**
 * Định dạng JSON thống nhất cho mọi HTTP response từ Core API (kể cả lỗi).
 * Client chỉ cần đọc `success`; dữ liệu nghiệp vụ nằm trong `result`.
 */
export interface ApiResponse<T = unknown> {
  /** Trùng HTTP status (ví dụ 200, 401, 422) để đối chiếu nhanh. */
  code: number;
  success: boolean;
  /** Mô tả ngắn; lỗi validate có thể là nhiều câu gộp bằng `; `. */
  message: string;
  /** Dữ liệu trả về khi thành công; lỗi có thể là `null` hoặc chi tiết bổ sung. */
  result: T | null;
}
