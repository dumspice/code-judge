import 'dotenv/config';
import IORedis from 'ioredis';
import { Worker } from 'bullmq';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { JUDGE_SUBMISSIONS_QUEUE_NAME } from './lib/constants';
import { getOptionalEnv, getRequiredEnv } from './lib/env';
import { createWorkerLogger } from './lib/logger';
import { sleep } from './lib/sleep';
import { getObjectString, putArtifactObject } from './lib/storage';

const log = createWorkerLogger('worker');

// Redis: BullMQ yêu cầu `maxRetriesPerRequest: null` khi dùng làm connection.
const redisUrl = getOptionalEnv(process.env.REDIS_URL, 'redis://localhost:6379');
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Prisma 7: bắt buộc có adapter Postgres.
const connectionString = getRequiredEnv('DATABASE_URL', process.env.DATABASE_URL);
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const lambdaFunctionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
const awsRegion = getOptionalEnv(
  process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION,
  'us-east-1',
);
const lambdaClient = lambdaFunctionName
  ? new LambdaClient({
      region: awsRegion,
      credentials: {
        accessKeyId: getRequiredEnv('AWS_ACCESS_KEY_ID', process.env.AWS_ACCESS_KEY_ID),
        secretAccessKey: getRequiredEnv('AWS_SECRET_ACCESS_KEY', process.env.AWS_SECRET_ACCESS_KEY),
      },
    })
  : null;

function tryParseJson(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeLanguage(language: string) {
  const normalized = language?.trim().toUpperCase();
  switch (normalized) {
    case 'PYTHON':
      return 'python';
    case 'JAVASCRIPT':
    case 'JS':
      return 'javascript';
    case 'JAVA':
      return 'java';
    case 'CPP':
    case 'C++':
      return 'cpp';
    default:
      return language?.toLowerCase() ?? language;
  }
}

function unwrapLambdaResult(payload: unknown): unknown {
  if (payload === null || payload === undefined) {
    return payload;
  }

  if (typeof payload === 'string') {
    return unwrapLambdaResult(tryParseJson(payload));
  }

  if (typeof payload !== 'object') {
    return payload;
  }

  const result = payload as Record<string, unknown>;

  if (typeof result.body === 'string') {
    return unwrapLambdaResult(tryParseJson(result.body));
  }

  if (result.payload !== undefined) {
    return unwrapLambdaResult(result.payload);
  }

  if (result.result !== undefined) {
    return unwrapLambdaResult(result.result);
  }

  if (Array.isArray(result.results)) {
    return result;
  }

  return result;
}

/**
 * Xử lý một job chấm bài (hiện tại là stub).
 *
 * @param job - job BullMQ; `job.data.submissionId` khớp với id bản ghi `Submission` trong DB.
 */
async function processSubmission(job: any) {
  const { submissionId } = job.data as { submissionId: string };

  const existingSubmission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      logs: true,
      userId: true,
      problemId: true,
      contestId: true,
      language: true,
      sourceCode: true,
      sourceCodeObjectKey: true,
    },
  });

  if (!existingSubmission) {
    throw new Error(`Submission not found: ${submissionId}`);
  }

  // Lấy thông tin problem và test cases
  const problem = await prisma.problem.findUnique({
    where: { id: existingSubmission.problemId },
    select: {
      id: true,
      timeLimitMs: true,
      memoryLimitMb: true,
      testCases: {
        select: {
          id: true,
          orderIndex: true,
          input: true,
          expectedOutput: true,
          isHidden: true,
          weight: true,
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!problem) {
    throw new Error(`Problem not found: ${existingSubmission.problemId}`);
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: SubmissionStatus.Running,
      logs: existingSubmission.logs ?? '',
    },
  });

  job.updateProgress({ pct: 10, log: 'Starting judge process.' });

  console.log('existingSubmission', existingSubmission);

  let sourceCode = existingSubmission.sourceCode;
  if (!sourceCode && existingSubmission.sourceCodeObjectKey) {
    try {
      sourceCode = await getObjectString(existingSubmission.sourceCodeObjectKey);
      log.info(
        `Loaded source code from MinIO object ${existingSubmission.sourceCodeObjectKey} (len=${sourceCode.length})`,
      );
      console.log(
        `Loaded source code from MinIO object ${existingSubmission.sourceCodeObjectKey} (len=${sourceCode.length})`,
      );
    } catch (storageError) {
      const errorMessage = `Failed to load source from MinIO object ${existingSubmission.sourceCodeObjectKey}: ${(storageError as Error).message}`;
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.Error,
          error: errorMessage,
          logs: `${existingSubmission.logs ?? ''}\n${errorMessage}`,
        },
      });
      throw new Error(errorMessage);
    }
  }

  if (sourceCode === '') {
    const errorMessage = 'Loaded source code is empty';
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.Error,
        error: errorMessage,
        logs: `${existingSubmission.logs ?? ''}\n${errorMessage}`,
      },
    });
    throw new Error(errorMessage);
  }

  if (!sourceCode) {
    const errorMessage =
      'Submission source code is missing and no sourceCodeObjectKey is available';
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.Error,
        error: errorMessage,
        logs: `${existingSubmission.logs ?? ''}\n${errorMessage}`,
      },
    });
    throw new Error(errorMessage);
  }

  if (lambdaClient && lambdaFunctionName) {
    try {
      const testCaseResults = [];
      let totalScore = 0;
      let totalWeight = 0;
      let logs = '';
      let hasError = false;

      const payloadObj = {
        submissionId,
        userId: existingSubmission.userId,
        problemId: existingSubmission.problemId,
        contestId: existingSubmission.contestId,
        language: normalizeLanguage(existingSubmission.language as string),
        code: sourceCode,
        sourceCodeObjectKey: existingSubmission.sourceCodeObjectKey,
        timeLimit: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
        bucket: getOptionalEnv(process.env.MINIO_BUCKET, 'codejudge'),
        testCases: problem.testCases.map((testCase) => ({
          id: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          isHidden: testCase.isHidden,
          weight: testCase.weight,
          orderIndex: testCase.orderIndex,
        })),
        // Thêm flag để Lambda biết có thể xử lý song song
        enableParallelExecution: true,
      };

      const payload = JSON.stringify(payloadObj);
      console.log('Lambda request payload:', payloadObj);

      const command = new InvokeCommand({
        FunctionName: lambdaFunctionName,
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(payload),
      });

      const response = await lambdaClient.send(command);
      const responsePayload = response.Payload
        ? Buffer.from(response.Payload).toString('utf8')
        : null;

      console.log('Lambda raw response payload:', responsePayload);

      let lambdaResult: any = null;
      if (responsePayload) {
        lambdaResult = unwrapLambdaResult(responsePayload);
      }

      if (response.FunctionError || response.StatusCode !== 200 || !lambdaResult) {
        logs += `Lambda invocation failed\n`;
        logs += `  responseFunctionError=${response.FunctionError} statusCode=${response.StatusCode}\n`;
        logs += `  payload=${responsePayload}\n`;
        hasError = true;
      } else if (lambdaResult.compileError) {
        logs += `Compile error:\n${lambdaResult.compileError}\n`;
        hasError = true;
      } else if (!Array.isArray(lambdaResult.results)) {
        logs += 'Unexpected Lambda result format\n';
        logs += `payload=${responsePayload}\n`;
        hasError = true;
      } else {
        for (let i = 0; i < problem.testCases.length; i++) {
          const testCase = problem.testCases[i];
          const resultItem = lambdaResult.results[i] ?? {};
          const output = String(resultItem.output ?? '').trim();
          const expectedOutput = testCase.expectedOutput.trim();
          const passed = resultItem.status === 'ACCEPTED' && output === expectedOutput;

          const caseResult = {
            testCaseId: testCase.id,
            status: String(resultItem.status ?? 'Error'),
            runtimeMs: resultItem.time ?? null,
            memoryMb: resultItem.memory ?? null,
            output,
            error:
              resultItem.status === 'ACCEPTED'
                ? null
                : String(resultItem.output ?? resultItem.stderr ?? ''),
            passed,
          };

          testCaseResults.push(caseResult);

          if (passed) {
            console.log(`Test case ${i + 1}: PASSED`);
            totalScore += testCase.weight;
            logs += `Test case ${i + 1}: PASSED (weight: ${testCase.weight})\n`;
          } else {
            console.log(`Test case ${i + 1}: FAILED`);
            logs += `Test case ${i + 1}: FAILED\n`;
            logs += `  Expected: ${expectedOutput}\n`;
            logs += `  Got: ${output}\n`;
          }

          totalWeight += testCase.weight;
        }
      }

      const finalScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
      let finalStatus: SubmissionStatus = SubmissionStatus.Accepted;
      if (hasError) {
        finalStatus = SubmissionStatus.Error;
      } else if (finalScore === 0) {
        finalStatus = SubmissionStatus.Wrong;
      } else if (finalScore < 100) {
        finalStatus = SubmissionStatus.Wrong;
      }

      const logObjectKey = `submissions/${submissionId}/artifacts/judge.log`;
      await putArtifactObject(logObjectKey, logs, {
        submissionId,
        contentType: 'text/plain',
      });

      const updateData: any = {
        status: finalStatus,
        score: finalScore,
        logs,
        caseResults: {
          logObjectKey,
          testCases: testCaseResults,
        },
      };

      await prisma.submission.update({ where: { id: submissionId }, data: updateData });
      job.updateProgress({ pct: 100, log: 'Finished judging all test cases.' });
      return { submissionId, status: finalStatus, score: finalScore };
    } catch (lambdaError) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.Error,
          error: (lambdaError as Error).message,
          logs: `${existingSubmission.logs ?? ''}\nLambda error: ${(lambdaError as Error).message}`,
        },
      });
      job.updateProgress({ pct: 100, log: 'Lambda judge failed.' });
      throw lambdaError;
    }
  }

  // Fallback: stub implementation khi không có Lambda
  job.updateProgress({ pct: 50, log: 'Running tests (stub - no Lambda configured).' });
  await sleep(800);

  const logObjectKey = `submissions/${submissionId}/artifacts/judge.log`;
  await putArtifactObject(logObjectKey, 'Accepted (stub - no Lambda)\n', {
    submissionId,
    contentType: 'text/plain',
  });

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: SubmissionStatus.Accepted,
      score: 100,
      runtimeMs: 123,
      memoryMb: 64,
      logs: `Accepted (stub - no Lambda)\n`,
      caseResults: {
        logObjectKey,
        testCases: [],
      } as any,
    },
  });

  job.updateProgress({ pct: 100, log: 'Finished (stub).' });
  return { submissionId, status: SubmissionStatus.Accepted };
}

async function main() {
  const worker = new Worker(JUDGE_SUBMISSIONS_QUEUE_NAME, processSubmission, {
    connection,
    concurrency: 10, // Giảm từ 50 xuống 10 cho local testing
  });

  worker.on('completed', (job) => {
    log.info(`completed job=${job?.id}`);
  });

  worker.on('failed', (job, err) => {
    log.error(`failed job=${job?.id} err=${err?.message}`);
  });

  log.info(`listening queue=${JUDGE_SUBMISSIONS_QUEUE_NAME} redis=${redisUrl}`);
}

main().catch((err) => {
  log.error(err);
  process.exit(1);
});
