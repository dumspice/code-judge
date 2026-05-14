import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmissionGateway } from '../realtime/submission.gateway';
import { JUDGE_QUEUE_EVENTS } from './tokens';

type ProgressData = {
  pct?: number;
  log?: string;
};

@Injectable()
export class BullMqEventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BullMqEventsService.name);

  constructor(
    @Inject(JUDGE_QUEUE_EVENTS) private readonly queueEvents: any,
    private readonly prisma: PrismaService,
    private readonly realtime: SubmissionGateway,
  ) {}

  onModuleInit() {
    this.queueEvents.on('progress', async (event: { jobId: string; data: ProgressData }) => {
      const { jobId, data } = event ?? {};
      if (!jobId) return;

      const submission = await this.prisma.submission.findUnique({
        where: { id: jobId },
        select: { userId: true, status: true },
      });
      if (!submission) return;

      this.realtime.emitToUser(submission.userId, 'submission:progress', {
        submissionId: jobId,
        status: submission.status,
        progressPct: data?.pct ?? null,
        logChunk: data?.log ?? null,
      });
    });

    this.queueEvents.on('completed', async (event: { jobId: string }) => {
      const { jobId } = event ?? {};
      if (!jobId) return;

      const submission = await this.prisma.submission.findUnique({
        where: { id: jobId },
        select: { userId: true, status: true, score: true, runtimeMs: true, memoryMb: true, logs: true, contestId: true },
      });
      if (!submission) return;

      const payload = {
        submissionId: jobId,
        status: submission.status,
        score: submission.score ?? null,
        runtimeMs: submission.runtimeMs ?? null,
        memoryMb: submission.memoryMb ?? null,
        contestId: submission.contestId ?? null,
      };

      // Emit to private room for the submitter
      this.realtime.emitToUser(submission.userId, 'submission:finished', payload);

      // Emit to ALL if it's a contest submission (for leaderboards)
      if (submission.contestId) {
        this.realtime.emitToAll('submission:finished', payload);
      }
    });

    this.queueEvents.on('failed', async (event: { jobId: string; failedReason: string }) => {
      const { jobId, failedReason } = event ?? {};
      if (!jobId) return;

      const submission = await this.prisma.submission.findUnique({
        where: { id: jobId },
        select: { userId: true, status: true, error: true, contestId: true },
      });
      if (!submission) return;

      const payload = {
        submissionId: jobId,
        status: submission.status,
        error: submission.error ?? failedReason ?? 'Unknown error',
        contestId: submission.contestId ?? null,
      };

      this.realtime.emitToUser(submission.userId, 'submission:failed', payload);

      if (submission.contestId) {
        this.realtime.emitToAll('submission:failed', payload);
      }
    });

    this.logger.log('BullMQ queue events listeners attached');
  }

  async onModuleDestroy() {
    this.queueEvents?.removeAllListeners?.();
  }
}

