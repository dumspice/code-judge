import 'dotenv/config';
import IORedis from 'ioredis';
import { Worker } from 'bullmq';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { JUDGE_SUBMISSIONS_QUEUE_NAME } from './lib/constants';
import { getOptionalEnv, getRequiredEnv } from './lib/env';
import { createWorkerLogger } from './lib/logger';
import { sleep } from './lib/sleep';
import { putArtifactObject } from './lib/storage';

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

/**
 * Xử lý một job chấm bài (hiện tại là stub).
 *
 * @param job - job BullMQ; `job.data.submissionId` khớp với id bản ghi `Submission` trong DB.
 */
async function processSubmission(job: any) {
  const { submissionId } = job.data as { submissionId: string };

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: SubmissionStatus.Running,
      logs:
        (await prisma.submission.findUnique({ where: { id: submissionId }, select: { logs: true } }))
          ?.logs ?? '',
    },
  });

  job.updateProgress({ pct: 10, log: 'Start judge (stub).' });
  await sleep(500);

  job.updateProgress({ pct: 50, log: 'Running tests (stub).' });
  await sleep(800);

  const logObjectKey = `submissions/${submissionId}/artifacts/judge.log`;
  const caseInputObjectKey = `ai-jobs/${submissionId}/generated-testcases/0/input.txt`;
  const caseExpectedObjectKey = `ai-jobs/${submissionId}/generated-testcases/0/expected.txt`;

  await putArtifactObject(logObjectKey, 'Accepted (stub)\n', {
    submissionId,
    contentType: 'text/plain',
  });
  await putArtifactObject(caseInputObjectKey, '1 2\n');
  await putArtifactObject(caseExpectedObjectKey, '3\n');

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: SubmissionStatus.Accepted,
      score: 100,
      runtimeMs: 123,
      memoryMb: 64,
      logs: `Accepted (stub)\n`,
      caseResults: {
        logObjectKey,
        generatedTestcases: [
          {
            inputObjectKey: caseInputObjectKey,
            expectedObjectKey: caseExpectedObjectKey,
          },
        ],
      } as any,
    },
  });

  job.updateProgress({ pct: 100, log: 'Finished.' });
  return { submissionId, status: SubmissionStatus.Accepted };
}

async function main() {
  const worker = new Worker(JUDGE_SUBMISSIONS_QUEUE_NAME, processSubmission, {
    connection,
    concurrency: 1,
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
