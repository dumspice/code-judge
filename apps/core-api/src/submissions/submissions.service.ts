import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SubmissionGateway } from '../realtime/submission.gateway';
import { JUDGE_QUEUE } from '../queues/tokens';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(
    @Inject(JUDGE_QUEUE) private readonly judgeQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly realtime: SubmissionGateway,
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
      },
    });

    await this.prisma.problem.upsert({
      where: { id: dto.problemId },
      update: { mode: dto.mode },
      create: {
        id: dto.problemId,
        title: dto.problemId,
        description: null,
        difficulty: 0,
        mode: dto.mode as any,
      },
    });

    const submission = await this.prisma.submission.create({
      data: {
        userId: dto.userId,
        problemId: dto.problemId,
        mode: dto.mode as any,
        sourceCode: dto.sourceCode ?? null,
      },
    });

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

