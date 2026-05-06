# Hướng dẫn setup và chạy MinIO (local)

Tài liệu này tập trung vào cách khởi động MinIO, kiểm tra hoạt động, và cấu hình để `core-api` + `worker` dùng được ngay.

## 1) Điều kiện cần

- Cài Docker Desktop và đảm bảo Docker đang chạy.
- Đứng tại thư mục project:

```powershell
cd c:\Users\ADMIN\Documents\GitHub\code-judge
```

## 2) Khởi động MinIO bằng Docker Compose

Project đã có sẵn service `minio` trong `docker-compose.yml`.

Chạy:

```powershell
docker compose up -d minio
```

Kiểm tra container:

```powershell
docker compose ps minio
```

Bạn sẽ thấy:
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

## 3) Đăng nhập MinIO Console

- Mở [http://localhost:9001](http://localhost:9001)
- Tài khoản local mặc định:
  - Username: `minioadmin`
  - Password: `minioadmin`

Lưu ý: chỉ dùng cặp này cho môi trường local/dev.

## 4) Cấu hình env cho Core API

Trong `apps/core-api/.env` (hoặc `.env.local`), đặt:

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

## 5) Cấu hình env cho Worker

Trong `apps/worker/.env`, đặt:

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=codejudge
MINIO_REGION=us-east-1
```

## 6) Chạy ứng dụng cùng MinIO

Ở root project:

```powershell
docker compose up -d
npm run dev -w @code-judge/core-api
npm run dev -w @code-judge/worker
```

MinIO bucket sẽ được service tự kiểm tra/tạo khi thao tác upload đầu tiên.

## 7) Smoke test nhanh

### Test A: Presigned upload URL

Gọi API:

```http
POST /storage/presign/upload
Content-Type: application/json

{
  "resourceKind": "submission-artifact",
  "submissionId": "test-sub-1",
  "fileName": "hello.txt"
}
```

Kỳ vọng: trả về `uploadUrl`, `bucket`, `objectKey`.

### Test A2: Avatar upload URL (JWT)

```http
POST /users/me/avatar/upload-url
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "extension": "png"
}
```

Kỳ vọng: trả về `uploadUrl`, `bucket`, `objectKey`.

### Test B: Upload file qua URL đã ký

Dùng `uploadUrl` vừa nhận để `PUT` nội dung file (Postman/curl).

### Test C: Kiểm tra object trên MinIO Console

- Vào bucket `codejudge`
- Kiểm tra key theo prefix đã sinh, ví dụ:
  - `submissions/test-sub-1/artifacts/hello.txt`
  - `avatars/<userId>/<yyyy>/<mm>/<uuid>.png`

## 8) Lệnh hữu ích khi vận hành local

Khởi động lại riêng MinIO:

```powershell
docker compose restart minio
```

Xem logs:

```powershell
docker compose logs -f minio
```

Dừng MinIO:

```powershell
docker compose stop minio
```

Xoá container MinIO (giữ volume):

```powershell
docker compose rm -f minio
```

## 9) Troubleshooting nhanh

- `Connection refused localhost:9000`:
  - Kiểm tra `docker compose ps minio` và logs.
- `Access Denied`:
  - Sai `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`.
- Upload thành công nhưng không thấy file:
  - Kiểm tra đúng bucket `MINIO_BUCKET`.
  - Kiểm tra đúng `objectKey` trong response.
- Dữ liệu mất sau khi recreate:
  - Đảm bảo không xoá volume `minio_data`.

---

Tài liệu chi tiết về taxonomy key, luồng tích hợp backend, migration object key: xem thêm `docs/MINIO-STORAGE.md`.
