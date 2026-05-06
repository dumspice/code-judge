# MinIO Storage Integration

Tài liệu này mô tả chuẩn lưu trữ object cho `code-judge` khi dùng MinIO (S3-compatible).

## 1) Docker local

`docker-compose.yml` đã có service `minio`:

- API: `http://localhost:9000`
- Console: `http://localhost:9001`
- User/password local mặc định: `minioadmin/minioadmin` (chỉ dùng local)

## 2) Biến môi trường

Áp dụng cho cả Core API và Worker:

- `MINIO_ENDPOINT=localhost`
- `MINIO_PORT=9000`
- `MINIO_USE_SSL=false`
- `MINIO_ACCESS_KEY=minioadmin`
- `MINIO_SECRET_KEY=minioadmin`
- `MINIO_BUCKET=codejudge`
- `MINIO_REGION=us-east-1`
- `MINIO_PUBLIC_BASE_URL=http://localhost:9000` (tuỳ chọn)

## 3) Taxonomy object key

- `avatars/{userId}/{yyyy}/{mm}/{uuid}.{ext}`
- `submissions/{submissionId}/source/{fileName}`
- `submissions/{submissionId}/artifacts/{artifactName}`
- `golden-solutions/{problemId}/{goldenSolutionId}/{fileName}`
- `ai-jobs/{jobId}/input/{fileName}`
- `ai-jobs/{jobId}/generated-testcases/{index}/input.txt`
- `ai-jobs/{jobId}/generated-testcases/{index}/expected.txt`
- `exports/{contestId}/{exportId}.{ext}`

## 4) Luồng đã tích hợp

- Core API:
  - `StorageModule` + `StorageService` (presign PUT/GET, put/remove object).
  - `POST /storage/presign/upload` để cấp presigned PUT URL.
  - `GET /storage/presign/download?objectKey=...` để cấp presigned GET URL.
  - `POST /users/me/avatar/upload-url` + `POST /users/me/avatar/confirm`.
  - Submission source code lớn (>8KB) sẽ externalize sang MinIO.
- Worker:
  - Ghi `judge.log` và testcase stub output vào MinIO.

## 5) DB object key columns (backward-compatible)

Migration bổ sung các cột:

- `User.imageObjectKey`
- `Submission.sourceCodeObjectKey`
- `GoldenSolution.sourceCodeObjectKey`
- `AiGenerationJob.inputDocObjectKey`
- `ReportExport.fileObjectKey`

Khi chưa có object key, hệ thống vẫn fallback các trường cũ (`image`, `sourceCode`, `inputDocUrl`, `fileUrl`).

## 6) Kế hoạch migrate dữ liệu cũ

1. Viết script batch đọc record có field cũ nhưng thiếu `...ObjectKey`.
2. Upload dữ liệu cũ lên MinIO theo taxonomy.
3. Cập nhật cột object key trong transaction theo batch nhỏ.
4. Re-run idempotent (bỏ qua item đã có object key).
5. Sau khi ổn định, giảm dần phụ thuộc vào field text/url cũ.

## 7) Verification checklist

- Upload avatar bằng presigned URL và xác nhận object key thành công.
- Tạo submission có source lớn, kiểm tra DB lưu `sourceCodeObjectKey`.
- Worker hoàn tất job, kiểm tra có `judge.log` và testcase object key.
- Presigned download URL hoạt động trước và sau khi hết hạn.
- Kiểm tra từ chối object key không hợp lệ hoặc URL hết hạn.
