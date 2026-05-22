# Core API automated tests

Chạy từ `apps/core-api`:

```bash
npm test
```

Hoặc từ root monorepo:

```bash
npm test
```

## Phạm vi (tier **A** — map `docs/SYSTEM-TEST-SCENARIOS.html`)

| File | Case ID |
|------|---------|
| `src/problems/problem-access.service.spec.ts` | SEC-PRB-01, 02, 03 |
| `src/auth/auth.service.spec.ts` | SEC-AUTH-02, 03 |
| `src/submissions/submissions.service.spec.ts` | JUD-F-01, SEC-STO-01, CON-CON-02 |
| `src/submissions/submissions-access.spec.ts` | SEC-SUB-01, 02 |
| `src/contests/contests.service.spec.ts` | RT-CON-02, 04 |
| `src/users/users.service.spec.ts` | ADM-F-01 |
| `src/storage/storage-access.service.spec.ts` | SEC-STO (presign) |
| `src/ai-hint/ai-hint-filter.util.spec.ts` | SEC-AI-01 (filter) |
| `src/ai-testcase/ai-testcase-io-quality.util.spec.ts` | AI-TC-02 |

## Tiếp theo (tier S)

- API E2E với `@nestjs/testing` + test DB (Docker Compose)
- Playwright cho SEC-AUTH-01 (middleware silent refresh)
