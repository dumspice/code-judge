import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SOCKET_EVENTS } from '../common';
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
        select: { userId: true, problemId: true, contestId: true, status: true },
      });
      if (!submission) return;

      const payload = {
        submissionId: jobId,
        userId: submission.userId,
        problemId: submission.problemId,
        contestId: submission.contestId ?? null,
        status: submission.status,
        progressPct: data?.pct ?? null,
        logChunk: data?.log ?? null,
      };

      this.realtime.emitToUser(submission.userId, SOCKET_EVENTS.SUBMISSION_PROGRESS, payload);
      this.realtime.emitToSubmission(jobId, SOCKET_EVENTS.SUBMISSION_PROGRESS, payload);
    });

    this.queueEvents.on('completed', async (event: { jobId: string }) => {
      const { jobId } = event ?? {};
      if (!jobId) return;

      const submission = await this.prisma.submission.findUnique({
        where: { id: jobId },
        select: {
          userId: true,
          problemId: true,
          status: true,
          score: true,
          runtimeMs: true,
          memoryMb: true,
          logs: true,
          contestId: true,
          testsPassed: true,
          testsTotal: true,
          language: true,
          isDryRun: true,
          error: true,
          compileLog: true,
          caseResults: true,
        },
      });
      if (!submission) return;

      let sanitizedCaseResults = null;
      if (submission.caseResults) {
        try {
          const resultsObj = JSON.parse(JSON.stringify(submission.caseResults));
          if (resultsObj.testCases && Array.isArray(resultsObj.testCases)) {
            const problemTestCases = await this.prisma.testCase.findMany({
              where: { problemId: submission.problemId },
              select: { id: true, isHidden: true },
            });
            const hiddenMap = new Map(problemTestCases.map(tc => [tc.id, tc.isHidden]));

            resultsObj.testCases = resultsObj.testCases.map((tc: any) => {
              const isHidden = hiddenMap.get(tc.testCaseId) ?? tc.isHidden ?? false;
              if (isHidden) {
                return {
                  ...tc,
                  isHidden: true,
                  output: '[Hidden Test Case]',
                  error: tc.error ? '[Hidden Test Case]' : null,
                };
              }
              return {
                ...tc,
                isHidden: false,
              };
            });
          }
          sanitizedCaseResults = resultsObj;
        } catch (e) {
          sanitizedCaseResults = submission.caseResults;
        }
      }

      const payload = {
        submissionId: jobId,
        userId: submission.userId,
        problemId: submission.problemId,
        status: submission.status,
        score: submission.score ?? null,
        runtimeMs: submission.runtimeMs ?? null,
        memoryMb: submission.memoryMb ?? null,
        error: submission.error ?? null,
        compileLog: submission.compileLog ?? null,
        contestId: submission.contestId ?? null,
        testsPassed: submission.testsPassed ?? 0,
        testsTotal: submission.testsTotal ?? 0,
        language: submission.language ?? null,
        isDryRun: submission.isDryRun ?? false,
        caseResults: sanitizedCaseResults,
      };

      this.realtime.emitToUser(submission.userId, SOCKET_EVENTS.SUBMISSION_FINISHED, payload);
      this.realtime.emitToSubmission(jobId, SOCKET_EVENTS.SUBMISSION_FINISHED, payload);

      if (submission.contestId) {
        this.realtime.emitContestLeaderboardUpdated(submission.contestId, {
          contestId: submission.contestId,
          submissionId: jobId,
          userId: submission.userId,
          problemId: submission.problemId,
          status: submission.status,
        });
      }
    });

    this.queueEvents.on('failed', async (event: { jobId: string; failedReason: string }) => {
      const { jobId, failedReason } = event ?? {};
      if (!jobId) return;

      const submission = await this.prisma.submission.findUnique({
        where: { id: jobId },
        select: {
          userId: true,
          problemId: true,
          status: true,
          error: true,
          contestId: true,
          testsPassed: true,
          testsTotal: true,
          language: true,
          isDryRun: true,
          caseResults: true,
        },
      });
      if (!submission) return;

      let sanitizedCaseResults = null;
      if (submission.caseResults) {
        try {
          const resultsObj = JSON.parse(JSON.stringify(submission.caseResults));
          if (resultsObj.testCases && Array.isArray(resultsObj.testCases)) {
            const problemTestCases = await this.prisma.testCase.findMany({
              where: { problemId: submission.problemId },
              select: { id: true, isHidden: true },
            });
            const hiddenMap = new Map(problemTestCases.map(tc => [tc.id, tc.isHidden]));

            resultsObj.testCases = resultsObj.testCases.map((tc: any) => {
              const isHidden = hiddenMap.get(tc.testCaseId) ?? tc.isHidden ?? false;
              if (isHidden) {
                return {
                  ...tc,
                  isHidden: true,
                  output: '[Hidden Test Case]',
                  error: tc.error ? '[Hidden Test Case]' : null,
                };
              }
              return {
                ...tc,
                isHidden: false,
              };
            });
          }
          sanitizedCaseResults = resultsObj;
        } catch (e) {
          sanitizedCaseResults = submission.caseResults;
        }
      }

      const payload = {
        submissionId: jobId,
        userId: submission.userId,
        problemId: submission.problemId,
        status: submission.status,
        error: submission.error ?? failedReason ?? 'Unknown error',
        contestId: submission.contestId ?? null,
        testsPassed: submission.testsPassed ?? 0,
        testsTotal: submission.testsTotal ?? 0,
        language: submission.language ?? null,
        isDryRun: submission.isDryRun ?? false,
        caseResults: sanitizedCaseResults,
      };

      this.realtime.emitToUser(submission.userId, SOCKET_EVENTS.SUBMISSION_FAILED, payload);
      this.realtime.emitToSubmission(jobId, SOCKET_EVENTS.SUBMISSION_FAILED, payload);

      if (submission.contestId) {
        this.realtime.emitContestLeaderboardUpdated(submission.contestId, {
          contestId: submission.contestId,
          submissionId: jobId,
          userId: submission.userId,
          problemId: submission.problemId,
          status: submission.status,
        });
      }
    });

    this.logger.log('BullMQ queue events listeners attached');
  }

  async onModuleDestroy() {
    this.queueEvents?.removeAllListeners?.();
  }
}
