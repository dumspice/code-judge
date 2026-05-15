import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SubmissionGateway } from '../realtime/submission.gateway';
import { JUDGE_QUEUE } from '../queues/tokens';
import { JUDGE_JOB_MAX_ATTEMPTS } from '../common/constants/queue.constants';
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
    if (!dto.sourceCode && !dto.sourceCodeObjectKey) {
      throw new BadRequestException('sourceCode or sourceCodeObjectKey is required');
    }

    // Optimization: Use findUnique instead of upsert to reduce DB load during high concurrency
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new BadRequestException(`User ${dto.userId} not found. Please seed the database.`);
    }

    const problem = await this.prisma.problem.findUnique({ where: { id: dto.problemId } });
    if (!problem) {
      throw new BadRequestException(`Problem ${dto.problemId} not found. Please seed the database.`);
    }

    let contestId: string | undefined;
    let context: 'PRACTICE' | 'CONTEST' = 'PRACTICE';
    if (dto.contestId) {
      const contest = await this.prisma.contest.findUnique({
        where: { id: dto.contestId },
        include: {
          problems: { where: { problemId: dto.problemId }, select: { problemId: true } },
        },
      });
      if (!contest) {
        throw new BadRequestException('Contest không tồn tại');
      }
      if (contest.problems.length === 0) {
        throw new BadRequestException('Problem không thuộc contest');
      }
      contestId = dto.contestId;
      context = 'CONTEST';
    }

    const sourceCode = dto.sourceCode ?? null;
    const shouldExternalizeCode = sourceCode !== null && sourceCode.length > 8192;
    const externalizedObjectKey = dto.sourceCodeObjectKey ?? null;
    const submission = await this.prisma.submission.create({
      data: {
        userId: dto.userId,
        problemId: dto.problemId,
        mode: dto.mode as any,
        context,
        contestId,
        language: dto.language ?? null,
        attemptNumber: 1,
        judgePriority: 0,
        status: 'Pending',
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
        attempts: JUDGE_JOB_MAX_ATTEMPTS,
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

  async findById(submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        status: true,
        score: true,
        error: true,
        logs: true,
        caseResults: true,
        language: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission không tồn tại');
    }

    return submission;
  }

  async findMany(filter: { userId?: string; problemId?: string }) {
    const where: Record<string, unknown> = {};
    if (filter.userId) {
      where.userId = filter.userId;
    }
    if (filter.problemId) {
      where.problemId = filter.problemId;
    }

    if (Object.keys(where).length === 0) {
      return [];
    }

    return this.prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        score: true,
        error: true,
        logs: true,
        caseResults: true,
        language: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

/** Slug duy nhất cho dev upsert (ký tự an toàn URL; fallback khi chuỗi rỗng). */
function devProblemSlug(problemId: string): string {
  const raw = problemId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return raw.length > 0 ? raw : `p-${problemId.replace(/[^a-zA-Z0-9-_]/g, '') || 'unknown'}`;
}
