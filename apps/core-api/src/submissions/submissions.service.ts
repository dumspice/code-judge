import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SubmissionGateway } from '../realtime/submission.gateway';
import { JUDGE_QUEUE } from '../queues/tokens';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { buildSubmissionSourceObjectKey } from '../storage/storage-key.builder';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @Inject(JUDGE_QUEUE) private readonly judgeQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly realtime: SubmissionGateway,
    private readonly storage: StorageService,
  ) {}

  async createAndEnqueue(dto: CreateSubmissionDto) {
    // Dev-friendly upsert: ensure User/Problem exist so the base flow runs immediately.
    await this.prisma.user.upsert({
      where: { id: dto.userId },
      update: {},
      create: {
        id: dto.userId,
        name: dto.userId,
        email: `${dto.userId}@example.com`,
        role: 'STUDENT',
        isActive: true,
        instructorVerification: 'NONE',
      },
    });

    const problemSlug = devProblemSlug(dto.problemId);
    await this.prisma.problem.upsert({
      where: { id: dto.problemId },
      update: { mode: dto.mode as any },
      create: {
        id: dto.problemId,
        slug: problemSlug,
        title: dto.problemId,
        description: null,
        statementMd: null,
        difficulty: 'EASY',
        mode: dto.mode as any,
        timeLimitMs: 1000,
        memoryLimitMb: 256,
        isPublished: true,
        visibility: 'PUBLIC',
        supportedLanguages: [],
        maxTestCases: 100,
      },
    });

    const sourceCode = dto.sourceCode ?? null;
    const shouldExternalizeCode = sourceCode !== null && sourceCode.length > 8192;
    const externalizedObjectKey = dto.sourceCodeObjectKey ?? null;
    const submission = await this.prisma.submission.create({
      data: {
        userId: dto.userId,
        problemId: dto.problemId,
        mode: dto.mode as any,
        context: 'PRACTICE',
        judgePriority: 0,
        sourceCode: shouldExternalizeCode ? null : sourceCode,
        sourceCodeObjectKey: externalizedObjectKey,
      },
    });

    if (shouldExternalizeCode && sourceCode) {
      const objectKey = buildSubmissionSourceObjectKey(submission.id, 'source.txt');
      await this.storage.putObject(objectKey, sourceCode, {
        'Content-Type': 'text/plain',
        submissionId: submission.id,
        problemId: dto.problemId,
        ownerId: dto.userId,
      });
      await this.prisma.submission.update({
        where: { id: submission.id },
        data: { sourceCodeObjectKey: objectKey },
      });
      submission.sourceCodeObjectKey = objectKey;
    }

    await this.judgeQueue.add(
      'judge',
      { submissionId: submission.id },
      {
        jobId: submission.id,
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    // Immediate feedback for UI.
    this.realtime.emitToUser(dto.userId, 'submission:created', {
      submissionId: submission.id,
      status: submission.status,
    });

    return submission;
  }
}

/** Slug duy nhất cho dev upsert (ký tự an toàn URL; fallback khi chuỗi rỗng). */
function devProblemSlug(problemId: string): string {
  const raw = problemId.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return raw.length > 0 ? raw : `p-${problemId.replace(/[^a-zA-Z0-9-_]/g, '') || 'unknown'}`;
}

