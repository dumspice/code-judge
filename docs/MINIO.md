# MinIO (S3-compatible) — setup & lưu trữ object

Tài liệu duy nhất cho MinIO trong `code-judge`: chạy local, cấu hình env, quy ước key, luồng API/worker, và kiểm tra nhanh.

## 1. Tổng quan

- MinIO chạy qua Docker Compose (`docker-compose.yml`), volume `minio_data` giữ dữ liệu.
- **API**: `http://localhost:9000` — **Console**: `http://localhost:9001`
- Tài khoản root local (Compose): `minioadmin` / `minioadmin` — chỉ dùng dev/local.

## 2. Điều kiện & khởi động

- Docker đang chạy; làm việc từ thư mục gốc repo `code-judge`.

Chỉ MinIO:

```bash
docker compose up -d minio
docker compose ps minio
```

Toàn bộ stack (Postgres, Redis, MinIO):

```bash
docker compose up -d
```

## 3. Đăng nhập Console

- Mở [http://localhost:9001](http://localhost:9001)
- Username: `minioadmin`, Password: `minioadmin`

## 4. Biến môi trường

Áp dụng cho **Core API** (`apps/core-api/.env` hoặc tương đương) và **Worker** (`apps/worker/.env`). Tên biến thống nhất với `EnvKeys` trong `apps/core-api/src/common/config/env.keys.ts`.

| Biến | Ý nghĩa | Gợi ý local |
|------|---------|---------------|
| `MINIO_ENDPOINT` | Host API (không gồm `http://`) | `localhost` |
| `MINIO_PORT` | Cổng API | `9000` |
| `MINIO_USE_SSL` | `true` / `false` | `false` |
| `MINIO_ACCESS_KEY` | Access key | `minioadmin` |
| `MINIO_SECRET_KEY` | Secret key | `minioadmin` |
| `MINIO_BUCKET` | Bucket mặc định | `codejudge` (trùng `STORAGE_DEFAULT_BUCKET` trong code) |
| `MINIO_REGION` | Region S3-compatible | `us-east-1` |
| `MINIO_PUBLIC_BASE_URL` | Base URL khi dựng link hiển thị (tuỳ chọn, **chủ yếu Core API**) | Ví dụ `http://localhost:9000` |

Ví dụ `.env` Core API / Worker (local):

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=codejudge
MINIO_REGION=us-east-1
# MINIO_PUBLIC_BASE_URL=http://localhost:9000
```

Bucket được **tự tạo** khi cần (lần upload/presign đầu tiên qua `StorageService.ensureBucketExists()`).

## 5. Hành vi lưu trữ (Core API)

`StorageService` (`apps/core-api/src/storage/storage.service.ts`):

- **Presigned PUT** / **GET** qua client MinIO (mặc định TTL 900 giây nếu không chỉ định khác).
- **`putObject` / `removeObject`** cho server-side ghi/xoá.
- **`getObjectUrl(objectKey)`**: `{base}/{bucket}/{objectKey}` với `base` = `MINIO_PUBLIC_BASE_URL` (bỏ slash cuối) hoặc fallback `http(s)://{endpoint}:{port}` theo `MINIO_USE_SSL`.
- Sau khi đảm bảo bucket tồn tại, service cố gắng áp **bucket policy public read cho `s3:GetObject`** (nếu set thất bại chỉ log cảnh báo, không chặn luồng chính).

## 6. Taxonomy object key

Khớp `storage-key.builder.ts`:

- `avatars/{userId}/{yyyy}/{mm}/{uuid}.{ext}`
- `submissions/{submissionId}/source/{fileName}`
- `submissions/{submissionId}/artifacts/{artifactName}`
- `golden-solutions/{problemId}/{goldenSolutionId}/{fileName}`
- `ai-jobs/{jobId}/input/{fileName}`
- `ai-jobs/{jobId}/generated-testcases/{index}/input.txt` và `.../expected.txt`
- `exports/{contestId}/{exportId}.{ext}`

## 7. Luồng đã tích hợp

**Core API**

- `POST /storage/presign/upload` — presigned PUT.
- `GET /storage/presign/download?objectKey=...` — presigned GET.
- `POST /users/me/avatar/upload-url` + `POST /users/me/avatar/confirm` (JWT).
- Source code submission lớn có thể **externalize** lên MinIO (kèm cột object key trong DB).

**Worker**

- Ghi artifact như `judge.log`, output testcase stub, v.v. qua MinIO (cấu hình env như mục 4; xem `apps/worker/src/lib/storage.ts`).

## 8. DB: cột `*ObjectKey` (tương thích ngược)

Các cột object key (ví dụ `User.imageObjectKey`, `Submission.sourceCodeObjectKey`, …). Khi chưa có key, hệ thống vẫn có thể dùng field cũ (`image`, `sourceCode`, URL text, …).

**Migrate dữ liệu cũ (định hướng)**

1. Batch đọc bản ghi có field cũ nhưng thiếu `...ObjectKey`.
2. Upload lên MinIO đúng taxonomy.
3. Cập nhật cột object key theo batch nhỏ trong transaction.
4. Script idempotent (bỏ qua bản ghi đã có key).
5. Sau ổn định, giảm phụ thuộc field text/URL cũ.

## 9. Verification checklist

- Upload avatar qua presign + confirm object key thành công.
- Submission source lớn: DB có `sourceCodeObjectKey` khi dùng luồng externalize.
- Worker: có artifact log/testcase trên bucket.
- Presigned download hoạt động trong thời hạn; từ chối key/URL không hợp lệ đúng kỳ vọng.

## 10. Smoke test nhanh

**Presign upload (không cần JWT tùy cấu hình route)**

```http
POST /storage/presign/upload
Content-Type: application/json

{
  "resourceKind": "submission-artifact",
  "submissionId": "test-sub-1",
  "fileName": "hello.txt"
}
```

Kỳ vọng: `uploadUrl`, `bucket`, `objectKey`. Sau đó `PUT` nội dung file lên `uploadUrl`.

**Avatar (JWT)**

```http
POST /users/me/avatar/upload-url
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "extension": "png" }
```

Trên Console: bucket `codejudge`, ví dụ `submissions/test-sub-1/artifacts/hello.txt`, `avatars/...`.

## 11. Lệnh vận hành local

```bash
docker compose restart minio
docker compose logs -f minio
docker compose stop minio
docker compose rm -f minio   # giữ volume minio_data
```

## 12. Troubleshooting

| Hiện tượng | Hướng xử lý |
|------------|-------------|
| `Connection refused` tại `:9000` | `docker compose ps minio`, xem logs |
| `Access Denied` | Kiểm tra `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` trùng `MINIO_ROOT_*` trong Compose |
| Upload OK nhưng không thấy object | Đúng bucket `MINIO_BUCKET` và `objectKey` trả về |
| Recreate container mất file | Tránh xoá volume `minio_data` |

Chạy app cùng infra (ví dụ):

```bash
docker compose up -d
npm run dev -w @code-judge/core-api
npm run dev -w @code-judge/worker
```
