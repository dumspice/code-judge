# AWS Lambda Code Execution Integration

Tài liệu này mô tả cách hệ thống sử dụng AWS Lambda để thực thi code submissions và chấm điểm.

## Tổng quan

Khi người dùng nộp code:

1. Frontend upload source code lên MinIO
2. Backend tạo submission record và enqueue job
3. Worker lấy test cases từ database
4. Worker gọi Lambda cho từng test case
5. Lambda thực thi code và trả về kết quả
6. Worker so sánh output và tính điểm
7. Lưu kết quả vào database và MinIO

## Cấu trúc Test Cases

```sql
-- TestCase model
model TestCase {
  id             String   @id @default(uuid())
  problemId      String
  orderIndex     Int
  input          String   -- Input data cho test case
  expectedOutput String   -- Expected output
  isHidden       Boolean  -- Có ẩn test case không
  weight         Int      -- Trọng số điểm (1-100)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

## Worker Logic

### 1. Lấy Test Cases

```typescript
const problem = await prisma.problem.findUnique({
  where: { id: existingSubmission.problemId },
  select: {
    timeLimitMs: true,
    memoryLimitMb: true,
    testCases: {
      select: {
        id: true,
        input: true,
        expectedOutput: true,
        weight: true,
      },
      orderBy: { orderIndex: 'asc' },
    },
  },
});
```

### 2. Gọi Lambda cho từng Test Case

```typescript
const payload = {
  submissionId,
  language: existingSubmission.language,
  sourceCode: existingSubmission.sourceCode,
  testCaseId: testCase.id,
  testCaseInput: testCase.input,
  timeLimitMs: problem.timeLimitMs,
  memoryLimitMb: problem.memoryLimitMb,
};

const result = await lambdaClient.send(
  new InvokeCommand({
    FunctionName: lambdaFunctionName,
    Payload: Buffer.from(JSON.stringify(payload)),
  }),
);
```

### 3. So sánh và Tính Điểm

```typescript
const expectedOutput = testCase.expectedOutput.trim();
const actualOutput = result.output.trim();
const passed = actualOutput === expectedOutput;

if (passed) {
  totalScore += testCase.weight;
  logs += `Test case ${caseNumber}: PASSED\n`;
} else {
  logs += `Test case ${caseNumber}: FAILED\n`;
  logs += `  Expected: ${expectedOutput}\n`;
  logs += `  Got: ${actualOutput}\n`;
}
```

### 4. Cập nhật Database

```typescript
const finalScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

await prisma.submission.update({
  where: { id: submissionId },
  data: {
    status: finalScore === 100 ? 'Accepted' : 'Wrong',
    score: finalScore,
    logs,
    caseResults: { logObjectKey, testCases: testCaseResults },
  },
});
```

## Lambda Function

### Environment Variables (Worker)

```env
AWS_LAMBDA_FUNCTION_NAME=code-judge-executor
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Payload Format

```json
{
  "submissionId": "uuid",
  "language": "PYTHON|JAVASCRIPT|JAVA|CPP",
  "sourceCode": "source code string",
  "testCaseId": "uuid",
  "testCaseInput": "input data",
  "timeLimitMs": 1000,
  "memoryLimitMb": 256
}
```

### Response Format

```json
{
  "status": "Success|Error",
  "output": "program output",
  "runtimeMs": 123,
  "memoryMb": 64,
  "error": "error message (if any)",
  "passed": true
}
```

## Supported Languages

| Language   | Runtime    | Compile                   | Execute           |
| ---------- | ---------- | ------------------------- | ----------------- |
| Python     | python3    | -                         | `python3 main.py` |
| JavaScript | node       | -                         | `node main.js`    |
| Java       | javac/java | `javac Main.java`         | `java Main`       |
| C++        | g++        | `g++ main.cpp -o program` | `./program`       |

## Deploy Lambda Function

1. Tạo IAM role với quyền cơ bản cho Lambda
2. Zip code và deploy:

```bash
cd lambda/
zip -r lambda.zip index.js package.json

aws lambda create-function \
  --function-name code-judge-executor \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://lambda.zip \
  --timeout 30 \
  --memory-size 512
```

## Monitoring & Debugging

- Logs Lambda: AWS CloudWatch
- Worker logs: Console output
- Test case results: Lưu trong `caseResults` JSON field
- Judge logs: Lưu trong MinIO `submissions/{id}/artifacts/judge.log`

## Performance Considerations

- Lambda timeout: 30 seconds max
- Memory: 512MB recommended
- Concurrency: AWS account limits
- Cost: Pay per request + duration

## Fallback (No Lambda)

Nếu không cấu hình Lambda, worker sẽ chạy stub mode:

```typescript
// Fallback khi không có AWS_LAMBDA_FUNCTION_NAME
await prisma.submission.update({
  where: { id: submissionId },
  data: {
    status: SubmissionStatus.Accepted,
    score: 100,
    logs: 'Accepted (stub - no Lambda configured)',
  },
});
```
