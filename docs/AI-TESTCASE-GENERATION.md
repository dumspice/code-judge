# Sinh test case bằng AI và liên kết với Problem (Core API)

Tài liệu mô tả **trạng thái triển khai** trong `apps/core-api`, **luồng API**, **dữ liệu**, **cấu hình** và **hạn chế** (đặc biệt `ProblemMode.PROJECT`).

**Tham chiếu mã nguồn (điểm vào chính):**

- `src/ai-testcase/ai-testcase.service.ts` — logic gọi OpenAI / Google, parse JSON, lưu DB
- `src/ai-testcase/ai-testcase.controller.ts` — route nhóm `/ai-testcase`
- `src/ai-testcase/ai-testcase.prompt.ts` — prompt hệ thống, schema Zod, `buildAiTestcaseMessages`
- `src/problems/problems.controller.ts` — `POST /problems/generate-test-cases-draft` (alias admin)
- `src/problems/problems.service.ts` — tạo/cập nhật problem kèm `testCases` thủ công
- `prisma/schema.prisma` — `TestCase`, `AiGenerationJob`, `ProblemMode`, `AiJobStatus`

---

## 1. Kết luận nhanh: đã có hay chưa?

| Khả năng | Trạng thái | Ghi chú |
|----------|------------|---------|
| Sinh **bản nháp** test case (JSON), **không** ghi `TestCase` vào DB | **Đã có** | `generateDraft` — dùng chung cho admin và form “preview” trước khi tạo problem |
| Sinh test case và **ghi DB** gắn với một `Problem` đã tồn tại (`mode = ALGO`) | **Đã có** | `POST /ai-testcase/generate-and-save` — **append** sau test case hiện có (`orderIndex` tăng dần) |
| Sinh test case cho problem **`mode = PROJECT`** | **Một phần (stub)** | Chỉ tạo `AiGenerationJob` + metadata `plannedObjectKeys`; **không** insert `TestCase`; comment code: storage chưa tích hợp |
| Thêm test case **thủ công** khi tạo/sửa problem | **Đã có** | `CreateProblemDto` / `UpdateProblemDto` có `testCases[]` |
| Upload tài liệu bổ sung cho job AI | **Đã có** | Presign upload `resourceKind: ai-input` (`StorageController`) → client PUT lên MinIO → `POST /storage/bind-object-key` với `resourceKind: 'ai-input'` gắn `objectKey` vào `AiGenerationJob` — xem mục 3.3 |

**Tổng kết:** Với **bài lập trình thuật toán (`ALGO`)**, luồng sinh test case bằng AI **đã được triển khai đầy đủ** (draft + lưu DB + job audit). Với **`PROJECT`**, phần lưu test case thật **chưa** — chỉ setup kế hoạch key trong storage.

---

## 2. Kiến trúc tổng quan

```
[Client]
   │
   ├─ POST /problems/generate-test-cases-draft   (ADMIN, JWT)  ──┐
   ├─ POST /ai-testcase/generate-draft           (ADMIN, JWT)  ──┼─► AiTestcaseService.generateDraft()
   ├─ POST /ai-testcase/quick-generate           (ADMIN, JWT)  ──┘
   │
   └─ POST /ai-testcase/generate-and-save        (JWT, creator hoặc ADMIN)
          │
          ├─ PROJECT → job SUCCEEDED + structuredOutput (không createMany TestCase)
          └─ ALGO    → generateDraft → parse OK → transaction:
                        testCase.createMany + aiGenerationJob.update(SUCCEEDED)
```

`generateDraft` gọi LLM (OpenAI Chat Completions `response_format: json_object` hoặc Google Generative Language API `responseMimeType: application/json`), sau đó **parse** chuỗi trả về (hỗ trợ markdown fence, trích JSON cân bằng ngoặc) và validate bằng **Zod** (`generatedTestcaseSchema`).

---

## 3. API endpoints

### 3.1 Nhóm `problems` (`ProblemsController`)

| Method | Path | Auth | Vai trò | Handler |
|--------|------|------|---------|---------|
| `POST` | `/problems/generate-test-cases-draft` | Bearer JWT | `ADMIN` | `AiTestcaseService.generateDraft(dto)` |

Body: `GenerateAiTestcaseDto` (xem mục 4). **Trùng hành vi** với `POST /ai-testcase/generate-draft` — tiện đặt route dưới tag “problems” trong Swagger.

### 3.2 Nhóm `ai-testcase` (`AiTestcaseController`)

| Method | Path | Auth | Vai trò | Mô tả |
|--------|------|------|---------|--------|
| `POST` | `/ai-testcase/quick-generate` | JWT | `ADMIN` | Rút gọn input (`title`, `statement`, `ioSpec?`, `provider?`, `model?`) → map sang `generateDraft` với tham số mặc định cố định (vd. `maxTestCases: 8`) |
| `POST` | `/ai-testcase/generate-draft` | JWT | `ADMIN` | Sinh bản nháp đầy đủ từ `GenerateAiTestcaseDto` |
| `POST` | `/ai-testcase/generate-and-save` | JWT | Mọi user đăng nhập (kiểm tra quyền trong service) | Body: `GenerateAndSaveAiTestcaseDto` — **bắt buộc** `problemId`. Chỉ **creator** của problem hoặc **ADMIN** |
| `GET` | `/ai-testcase/problems/:problemId/documents` | JWT | Creator problem / creator job / ADMIN | Liệt kê job có `inputDocObjectKey != null` |
| `GET` | `/ai-testcase/jobs/:jobId/document/download` | JWT | Tương tự | Presigned download URL (query `expiresInSeconds` tùy chọn) |

**Lưu ý định tuyến Nest:** Trong `ProblemsController`, route `GET :id` đứng sau `GET /` — không xung đột với `POST .../generate-test-cases-draft` vì method khác nhau.

### 3.3 Luồng gắn file đầu vào cho job AI (Storage)

1. Tạo `AiGenerationJob` (thường qua `generate-and-save` hoặc tạo job riêng nếu sau này có endpoint) — cần biết `jobId`.
2. `POST /storage/presign/upload` với `resourceKind: 'ai-input'`, `jobId`, `fileName` → nhận `uploadUrl` + `objectKey`.
3. Client upload file bằng presigned PUT.
4. `POST /storage/bind-object-key` với `resourceKind: 'ai-input'`, `recordId: jobId`, `objectKey`, metadata file (`fileName`, `contentType`, `sizeBytes`) → cập nhật `inputDocObjectKey`, `inputDocUrl`, v.v. trên `AiGenerationJob`.
5. Đọc lại: `GET /ai-testcase/problems/:problemId/documents` hoặc presigned download `GET /ai-testcase/jobs/:jobId/document/download`.

**Lưu ý:** `supplementaryText` trong DTO sinh test case là text inline; tách biệt với file upload qua storage ở trên (file có thể được đưa vào prompt ở tầng client bằng cách extract text trước, hoặc mở rộng backend sau này để đọc object từ MinIO).

**Hạn chế luồng:** Presign `ai-input` cần `jobId`, nhưng `AiGenerationJob` hiện **chỉ** được tạo bên trong `generate-and-save` (client không nhận `jobId` trước khi LLM chạy xong). Muốn “upload tài liệu trước → rồi mới sinh test” trong một phiên bản API gọn, cần thêm bước tạo job `PENDING` (endpoint riêng hoặc trả `jobId` sớm) rồi mới gọi sinh.

---

## 4. DTO chính

### 4.1 `GenerateAiTestcaseDto` (`dto/generate-ai-testcase.dto.ts`)

Dùng cho **draft** (và là input logic của `generateDraft` khi `generate-and-save` chạy cho ALGO).

- Bắt buộc: `title`, `statement` (tối đa 20k ký tự).
- Tùy chọn: `difficulty`, `timeLimitMs`, `memoryLimitMb`, `supportedLanguages`, `maxTestCases` (1–100, mặc định logic 10 nếu không set), `ioSpec`, `supplementaryText`, `provider` (`openai` | `google`), `model`.
- **`revision`**: object tùy chọn để **vòng cải tiện prompt** — `promptVersionUsed`, `previousOutputSummary`, `userFeedback`, `validatorIssues[]`. Được đưa vào prompt user trong `buildAiTestcaseMessages`.

### 4.2 `GenerateAndSaveAiTestcaseDto` (`dto/generate-and-save-ai-testcase.dto.ts`)

- Bắt buộc: `problemId`.
- `createdById` trong body: **deprecated**, server **luôn** dùng `userId` từ JWT.
- Tùy chọn: `maxTestCases`, `ioSpec`, `supplementaryText`, `provider`, `model`.

Giá trị đề bài lấy từ DB: `title`, `statementMd ?? description`, `difficulty`, `timeLimitMs`, `memoryLimitMb`, `supportedLanguages`, `maxTestCases` (có thể override bởi `input.maxTestCases`).

### 4.3 `QuickGenerateAiTestcaseDto`

Chỉ các field tối thiểu để admin thử nhanh.

---

## 5. Schema output từ AI (Zod)

Định nghĩa trong `ai-testcase.prompt.ts`:

```json
{
  "testCases": [
    {
      "input": "string (min 1)",
      "expectedOutput": "string (min 1)",
      "isHidden": false,
      "weight": 1,
      "explanation": "optional"
    }
  ],
  "notes": "optional",
  "revisionNotes": "optional"
}
```

- Sau parse, service kiểm tra `testCases.length <= (input.maxTestCases ?? 10)` (draft path).
- Field `explanation` / `notes` / `revisionNotes` **không** được map vào bảng `TestCase` khi lưu — chỉ `input`, `expectedOutput`, `isHidden`, `weight`.

---

## 6. Hành vi `generate-and-save` theo `ProblemMode`

### 6.1 `ALGO`

1. Tạo `AiGenerationJob` (`status: PENDING` → `RUNNING`).
2. Gọi `generateDraft` với context lấy từ problem.
3. Nếu **parse lỗi**: job `FAILED`, lưu `structuredOutput.raw`, `parseError`; trả về `persistedTestCaseCount: 0`.
4. Nếu **parse OK**: tính `nextOrderIndex = max(orderIndex) + 1`, `createMany` test case, job `SUCCEEDED`, lưu `structuredOutput` gồm provider/model/parsed/raw.

### 6.2 `PROJECT`

- Tạo job, sau đó **không** gọi LLM.
- Cập nhật job `SUCCEEDED` với `structuredOutput` mô tả `plannedObjectKeys` (từ `buildAiGeneratedTestcaseObjectKeys(jobId, index)`).
- Trả về `persistedTestCaseCount: 0`, `projectSetup.storageIntegrated: false`.

Đây là **placeholder** cho tương lai (lưu artifact input/expected lên object storage thay vì chỉ DB text).

---

## 7. Cơ sở dữ liệu

### 7.1 `TestCase`

- Khóa duy nhất `(problemId, orderIndex)`.
- Sinh AI **append** luôn sau bản ghi hiện có để tránh va chạm `orderIndex`.

### 7.2 `AiGenerationJob`

- `status`: `PENDING` | `RUNNING` | `SUCCEEDED` | `FAILED`.
- `structuredOutput` (JSON): kết quả parse, raw model, hoặc metadata PROJECT.
- `inputDocObjectKey`, `inputDocUrl`, tên file, content-type, size — phục vụ tài liệu đính kèm (nếu luồng upload gán các field này).

---

## 8. Cấu hình môi trường

| Biến | Ý nghĩa |
|------|---------|
| `OPENAI_API_KEY` | Bắt buộc nếu dùng provider `openai` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Bắt buộc nếu dùng provider `google` |
| `AI_DEFAULT_PROVIDER` | `openai` hoặc `google` (mặc định `openai` nếu không set) |
| `AI_DEFAULT_MODEL_OPENAI` | Mặc định `gpt-4.1-mini` |
| `AI_DEFAULT_MODEL_GOOGLE` | Mặc định `gemini-2.5-flash` |
| `AI_PROMPT_VERSION` | Chuỗi phiên bản prompt (audit), mặc định `ai-testcase-v1` |
| `AI_FAST_MODE` | `1` / `true` / `yes` / `on` — bật chế độ nhanh: không fallback provider, giảm retry, prompt “FAST MODE”, giới hạn token |
| `AI_MAX_TOKENS` | Mặc định 2000 (fast mode có thể cap thêm) |
| `AI_TEMPERATURE` | Mặc định 0.2; fast mode = 0 |

**Provider fallback:** Khi **không** bật fast mode, thử primary provider/model rồi fallback sang provider còn lại với model mặc định tương ứng.

---

## 9. Bảo mật và quyền

- `generate-draft`, `quick-generate`, `problems/generate-test-cases-draft`: decorator `@Roles(Role.ADMIN)`.
- `generate-and-save`: không gắn `@Roles` ở controller; trong service `assertUserCanManageProblemAi`: **ADMIN** hoặc `problem.creatorId === user.userId` (creator null được coi là quản lý được nếu khớp user — xem điều kiện `creatorId === null || creatorId === user.userId`).

---

## 10. Tích hợp Storage (MinIO / S3)

- `StorageController` hỗ trợ `resourceKind: 'ai-testcase'` với `jobId`, `testCaseIndex` để dựng object key (`storage-key.builder.ts`: `ai-jobs/{jobId}/generated-testcases/{index}/...`).
- Phù hợp với hướng **PROJECT** / artifact; **chưa** nối trọn vẹn với `generate-and-save` cho PROJECT (xem mục 6.2).

---

## 11. Frontend (tham chiếu)

- `apps/web/services/problems.api.ts` định nghĩa `GenerateTestCasesDraftDto` / `GenerateTestCasesDraftResult` khớp `GenerateAiTestcaseDto` và kết quả `generateDraft`.
- Cần gọi thêm `POST /ai-testcase/generate-and-save` từ UI khi muốn lưu vào problem (không chỉ draft).

---

## 12. Hạn chế và việc nên làm tiếp

1. **`PROJECT`**: Hoàn thiện lưu test/input-output qua storage và/hoặc schema riêng; hiện chỉ trả kế hoạch key.
2. **Nối file upload với prompt**: Storage + `bind-object-key` đã gắn metadata vào job; **chưa** thấy service tự đọc nội dung file từ object storage để đổ vào `supplementaryText` khi gọi LLM — hiện phụ thuộc client extract hoặc bổ sung pipeline sau.
3. **Idempotency / hàng đợi**: `generate-and-save` chạy đồng bộ trong request; job dài có thể cần queue (BullMQ đã có trong stack) nếu timeout HTTP.
4. **Chất lượng test**: Output phụ thuộc model và prompt; nên có bước review UI trước khi lưu (draft endpoint đã hỗ trợ).

---

## 13. Kiểm tra nhanh thủ công (gợi ý)

1. Đặt `OPENAI_API_KEY` hoặc `GOOGLE_GENERATIVE_AI_API_KEY`.
2. Lấy JWT **ADMIN**, `POST /problems/generate-test-cases-draft` với `title` + `statement` ngắn → nhận `parsed.testCases` hoặc `parseError` + `raw`.
3. Tạo problem `ALGO`, `POST /ai-testcase/generate-and-save` với `problemId` → kiểm tra bản ghi `TestCase` mới và `AiGenerationJob.status = SUCCEEDED`.

---

*Tài liệu được đối chiếu với source `apps/core-api` tại thời điểm soạn: 2026-05-12.*
