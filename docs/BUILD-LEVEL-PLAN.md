# Build Plan Theo Develop Va Testing

Tai lieu nay duoc to chuc theo 2 track chinh:
- **Develop**
- **Testing**

Va trong moi track se chia theo tung module de de quan ly.

---

## 1) DEVELOP

## Module: Auth
### Setup
- `AUTH-SETUP-01`: User/Role/Permission schema + migration
- `AUTH-SETUP-02`: Seed default roles + admin account
### BE
- `AUTH-BE-01`: Register/Login/Refresh APIs
- `AUTH-BE-02`: Token rotation + logout revoke (Redis)
- `AUTH-BE-03`: RBAC guard + decorator
### FE
- `AUTH-FE-01`: Login/Register screens
- `AUTH-FE-02`: Auth store + interceptor + protected routes

## Module: Classroom & Enrollment
### Setup
- `CLASS-SETUP-01`: Classroom/enrollment entities + migration
### BE
- `CLASS-BE-01`: Class CRUD APIs
- `CLASS-BE-02`: Enrollment apply/approve/reject APIs
### FE
- `CLASS-FE-01`: Classroom dashboard
- `CLASS-FE-02`: Member management UI

## Module: Problem & Testcase
### Setup
- `PROB-SETUP-01`: Problem/testcase entities + migration
### BE
- `PROB-BE-01`: Problem CRUD APIs
- `PROB-BE-02`: Testcase CRUD APIs (public/hidden)
### FE
- `PROB-FE-01`: Problem creator/editor
- `PROB-FE-02`: Testcase editor (text/upload)

## Module: Submission
### Setup
- `SUB-SETUP-01`: Submission/result entities + migration
### BE
- `SUB-BE-01`: Submission create API
- `SUB-BE-02`: Source/object key mapping + persistence
### FE
- `SUB-FE-01`: Code editor workspace
- `SUB-FE-02`: Submission history + verdict details

## Module: Judge Worker (Code)
### Setup
- `JUDGE-CODE-SETUP-01`: Queue topics, payload schema, retry policy
### BE
- `JUDGE-CODE-BE-01`: Queue producer
- `JUDGE-CODE-BE-02`: Verdict mapper + persister API contract
### FE
- `JUDGE-CODE-FE-01`: Verdict/status model mapping for UI
### Worker
- `JUDGE-CODE-WK-01`: Worker consumer core
- `JUDGE-CODE-WK-02`: Code compile/run pipeline

## Module: Sandbox
### Setup
- `SAND-SETUP-01`: Base Docker images + runtime profiles
### BE
- `SAND-BE-01`: Sandbox policy config exposure (time/memory/lang)
### FE
- `SAND-FE-01`: Display limits/config in assignment/problem UI
### Worker
- `SAND-WK-01`: Docker driver adapter
- `SAND-WK-02`: Resource limits (cpu/memory/time)
- `SAND-WK-03`: Security profile (network/seccomp)
- `SAND-WK-04`: Language execution scripts

## Module: Realtime
### Setup
- `WS-SETUP-01`: Event naming convention + room strategy
### BE
- `WS-BE-01`: Socket gateway + JWT handshake
- `WS-BE-02`: Worker -> gateway event emitter
### FE
- `WS-FE-01`: Realtime listener + UI updates

## Module: Storage (MinIO)
### Setup
- `STO-SETUP-01`: MinIO bucket policy + CORS + env config
### BE
- `STO-BE-01`: Presign upload/download APIs
- `STO-BE-02`: Bind object key APIs
### FE
- `STO-FE-01`: Upload test route (image/file/zip/folder)

## Module: AI Testcase
### Setup
- `AI-SETUP-01`: Provider keys/config + model routing policy
### BE
- `AI-BE-01`: AI provider client + retry/backoff
- `AI-BE-02`: Prompt/context builder
- `AI-BE-03`: Generation job orchestrator
- `AI-BE-04`: Parse/validate output schema
- `AI-BE-05`: Persist generated testcase draft
- `AI-BE-06`: Review/approve/reject APIs
### FE
- `AI-FE-01`: AI generate + review UI

## Module: Judge Worker (Project)
### Setup
- `JUDGE-PROJ-SETUP-01`: Project submission manifest schema
- `JUDGE-PROJ-SETUP-02`: Assignment build/test config schema
### BE
- `JUDGE-PROJ-BE-01`: Assignment build/test config APIs
- `JUDGE-PROJ-BE-02`: Score breakdown + rubric mapper
### FE
- `JUDGE-PROJ-FE-01`: Project upload + progress UI
- `JUDGE-PROJ-FE-02`: Build/test logs + score viewer
### Worker
- `JUDGE-PROJ-WK-01`: Artifact extractor + workspace prep
- `JUDGE-PROJ-WK-02`: Build phase executor
- `JUDGE-PROJ-WK-03`: Test phase executor
- `JUDGE-PROJ-WK-04`: Build/test logs + artifact uploader

## Module: Observability & Ops
### Setup
- `OPS-SETUP-01`: Docker compose dev/test profiles
- `OPS-SETUP-02`: Seed data + bootstrap scripts
### BE
- `OPS-BE-01`: Structured logging + correlation id
- `OPS-BE-02`: Health/readiness endpoints
- `OPS-BE-03`: Queue metrics endpoints/dashboard feed
### FE
- `OPS-FE-01`: Internal admin monitor page (queue/job overview)

---

## 2) TESTING

## Module: Auth
- `AUTH-TEST-01`: Unit tests auth services/token utils
- `AUTH-TEST-02`: Integration tests register/login/refresh/logout
- `AUTH-TEST-03`: FE e2e auth flow + route guard

## Module: Classroom & Enrollment
- `CLASS-TEST-01`: API integration class CRUD
- `CLASS-TEST-02`: API integration enrollment states
- `CLASS-TEST-03`: FE e2e create class/join/approve

## Module: Problem & Testcase
- `PROB-TEST-01`: Validation/permission tests
- `PROB-TEST-02`: Hidden/public testcase behavior tests
- `PROB-TEST-03`: FE form behavior/error state tests

## Module: Submission
- `SUB-TEST-01`: Submission API contract tests
- `SUB-TEST-02`: Source persistence/object key tests
- `SUB-TEST-03`: FE submit + history rendering e2e

## Module: Judge Worker (Code)
- `JUDGE-CODE-TEST-01`: End-to-end queue -> worker -> verdict
- `JUDGE-CODE-TEST-02`: Verdict mapping tests (AC/WA/TLE/RE)
- `JUDGE-CODE-TEST-03`: Retry/dead-letter behavior tests

## Module: Sandbox
- `SAND-TEST-01`: Timeout/memory limit tests
- `SAND-TEST-02`: Security escape tests (fork bomb/path abuse)
- `SAND-TEST-03`: Multi-language execution smoke tests

## Module: Realtime
- `WS-TEST-01`: Event ordering tests
- `WS-TEST-02`: Reconnect/missed event tests
- `WS-TEST-03`: Multi-client status consistency tests

## Module: Storage (MinIO)
- `STO-TEST-01`: Presign expiration/access tests
- `STO-TEST-02`: Upload matrix tests (image/file/zip/folder)
- `STO-TEST-03`: Download validation + permission tests

## Module: AI Testcase
- `AI-TEST-01`: Prompt accuracy benchmark
- `AI-TEST-02`: Schema parse robustness tests
- `AI-TEST-03`: Latency/failure fallback tests
- `AI-TEST-04`: Review permission + audit tests

## Module: Judge Worker (Project)
- `JUDGE-PROJ-TEST-01`: Happy path project build/test pass
- `JUDGE-PROJ-TEST-02`: Build fail scenario tests
- `JUDGE-PROJ-TEST-03`: Test fail + partial scoring tests
- `JUDGE-PROJ-TEST-04`: Artifact security tests (zip bomb/path traversal)
- `JUDGE-PROJ-TEST-05`: Concurrent project jobs performance tests

## Module: Regression & Release
- `REL-TEST-01`: Cross-module smoke test (full user flow)
- `REL-TEST-02`: P0/P1 bug bash
- `REL-TEST-03`: Staging deploy + final sanity checks

---

## 3) Uu tien thuc hien de xay dung theo muc do kho

1. **Develop + Testing cho Code Judge core truoc**
   - Auth -> Problem/Testcase -> Submission -> Judge Code -> Sandbox -> Realtime
2. **Sau do mo AI Testcase**
3. **Cuoi cung mo Project Judge**

Thu tu nay giup tach ro do kho:
- AI testcase la bai toan chat luong noi dung
- Project judge la bai toan van hanh/sandbox phuc tap nhat

