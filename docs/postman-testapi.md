# Hướng dẫn test API với Postman (code-judge Core API)

Tài liệu này mô tả cách import request từ file curl, cấu hình môi trường, và luồng test MinIO + JWT phù hợp với project hiện tại.

## 1) Chuẩn bị

- Chạy infrastructure: `docker compose up -d` tại root repo (Postgres, Redis, MinIO).
- Chạy API: `npm run dev -w @code-judge/core-api` (mặc định `http://localhost:3000`).
- Đảm bảo file env: copy `apps/core-api/.env.example` → `apps/core-api/.env` và set tối thiểu `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`, các biến `MINIO_*` nếu test storage.
- **Dữ liệu seed** (user/problem/contest cố định, khớp biến Postman): `npm run prisma:seed -w @code-judge/core-api`. Chi tiết: [PRISMA-SEED.md](PRISMA-SEED.md).

## 2) Import vào Postman

### Cách A — Collection JSON (khuyến nghị, đủ endpoint + biến + test script)

1. Mở Postman → **Import** → **Upload Files**.
2. Chọn file [`apps/core-api/postman/Code-Judge-Core-API.postman_collection.json`](../apps/core-api/postman/Code-Judge-Core-API.postman_collection.json).
3. Chọn collection vừa import → tab **Variables**: chỉnh `baseUrl`, `testEmail` / `testPassword` nếu cần.
4. Chạy theo thứ tự: **Auth → Login** (hoặc Register) → các request Users / Storage / Submissions.

### Cách B — Import từng cURL

1. Mở Postman → **Import** → **Raw text**.
2. Mở file [`apps/core-api/postman/import.txt`](../apps/core-api/postman/import.txt), **copy một khối** `curl ...` (không copy dòng `#`).
3. Dán → **Continue** → **Import**.

Lưu ý:

- Import curl: một số phiên bản Postman chỉ nhận một `curl` mỗi lần.
- Sau khi import, đổi `baseUrl` / cổng nếu API không chạy trên `http://localhost:3000`.

## 3) Biến môi trường trong Postman (khuyến nghị)

Tạo **Environment** (ví dụ `code-judge local`) với các biến:

| Variable | Initial value | Mô tả |
|----------|---------------|--------|
| `baseUrl` | `http://localhost:3000` | Base Core API |
| `accessToken` | *(để trống, set sau login)* | JWT Bearer |
| `objectKey` | *(tuỳ bước presign)* | Key object trên MinIO |
| `uploadUrl` | *(tuỳ bước presign)* | URL PUT từ MinIO |

Trong từng request, thay URL cố định bằng `{{baseUrl}}/auth/login`, v.v.  
Header Authorization: `Bearer {{accessToken}}`.

## 4) Response envelope

Mọi response HTTP thành công/lỗi đều bọc dạng:

```json
{
  "code": 200,
  "success": true,
  "message": "OK",
  "result": { }
}
```

Khi test trong Postman, dữ liệu nghiệp vụ nằm trong **`result`** (ví dụ `result.accessToken`, `result.uploadUrl`, `result.objectKey`).

## 5) Luồng test gợi ý

### 5.1 Auth cơ bản

1. **Register** — import request `01` từ `import.txt` (hoặc tạo tay `POST {{baseUrl}}/auth/register`).
2. **Login** — request `02`; trong **Tests** tab có thể thêm script lưu token:

```javascript
const body = pm.response.json();
if (body.result && body.result.accessToken) {
  pm.environment.set('accessToken', body.result.accessToken);
}
```

3. Gọi **GET** `{{baseUrl}}/users/me` với header `Authorization: Bearer {{accessToken}}`.

### 5.2 MinIO: presign → PUT file → verify

1. **Presign upload** — `POST {{baseUrl}}/storage/presign/upload` (request `06` hoặc `07`).
2. Copy `result.uploadUrl` và `result.objectKey` vào biến môi trường hoặc dùng trực tiếp.
3. **PUT** lên `uploadUrl` (request `08`): body là nội dung file; `Content-Type` nên khớp loại file (ví dụ `text/plain`, `image/png`).
4. Kiểm tra trên MinIO Console: `http://localhost:9001`, bucket `codejudge`, đúng `objectKey`.
5. **Presign download** — `GET {{baseUrl}}/storage/presign/download?objectKey=<encode>` (request `09`); mở `result.downloadUrl` trong trình duyệt hoặc GET bằng Postman.

### 5.3 Avatar (JWT + MinIO)

1. Login → có `accessToken`.
2. `POST {{baseUrl}}/users/me/avatar/upload-url` với body `{ "extension": "png" }`.
3. PUT file ảnh lên `result.uploadUrl`.
4. `POST {{baseUrl}}/users/me/avatar/confirm` với `{ "objectKey": "<result.objectKey>" }`.
5. `GET {{baseUrl}}/users/me` — kiểm tra `imageObjectKey` và `image`.

### 5.4 Submission (demo public)

`POST {{baseUrl}}/submissions` — request `05`.  
Nếu `sourceCode` rất lớn (>8KB), backend có thể externalize sang MinIO; có thể truyền thêm `sourceCodeObjectKey` nếu đã upload trước.

## 6) Refresh token và cookie

`POST /auth/refresh` đọc refresh token từ **cookie** `refreshToken`.

Trong Postman:

- Sau **login/register**, xem tab **Cookies** hoặc header `Set-Cookie` để lấy giá trị.
- Bật lưu cookie theo domain (Settings → tùy phiên bản) hoặc gửi thủ công:  
  `Cookie: refreshToken=<giá trị>` như request `12` trong `import.txt`.

## 7) Swagger

Khi không tắt Swagger (`NODE_ENV` không phải production và `SWAGGER_ENABLED` không bằng `0`):

- UI: `http://localhost:3000/api-docs`
- JSON: `http://localhost:3000/api-docs/json` (request `14` trong `import.txt`)

Có thể dùng Swagger UI để “Try it out” song song với Postman.

## 8) Lỗi thường gặp

| Hiện tượng | Hướng xử lý |
|------------|-------------|
| `401 Unauthorized` trên `/users/*` | Thiếu/sai JWT; login lại, cập nhật `accessToken`. |
| `Connection refused` | Core API chưa chạy hoặc sai cổng. |
| Presign OK nhưng PUT MinIO lỗi | Sai URL, URL hết hạn, hoặc MinIO chưa `docker compose up`. |
| `objectKey` trong query bị lỗi | URL-encode key (Postman thường encode tự động khi nhập param). |
| Register trùng email | Đổi email hoặc dùng user đã có + login. |

## 9) Tài liệu liên quan

- [PRISMA-SEED.md](PRISMA-SEED.md) — seed dữ liệu mẫu (khớp biến Postman).
- [MINIO.md](MINIO.md) — MinIO: chạy local, env, taxonomy, luồng storage.
- Collection Postman: [`apps/core-api/postman/Code-Judge-Core-API.postman_collection.json`](../apps/core-api/postman/Code-Judge-Core-API.postman_collection.json).
- File curl: [`apps/core-api/postman/import.txt`](../apps/core-api/postman/import.txt).
