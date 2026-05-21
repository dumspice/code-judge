/** Mirror of core-api socket event names (keep in sync). */
export const SOCKET_EVENTS = {
  SUBMISSION_CREATED: 'submission:created',
  SUBMISSION_PROGRESS: 'submission:progress',
  SUBMISSION_FINISHED: 'submission:finished',
  SUBMISSION_FAILED: 'submission:failed',
  CONTEST_LEADERBOARD_UPDATED: 'contest:leaderboard:updated',
  CLIENT_JOIN_CONTEST: 'client:join-contest',
  CLIENT_LEAVE_CONTEST: 'client:leave-contest',
  CLIENT_JOIN_SUBMISSION: 'client:join-submission',
  CLIENT_LEAVE_SUBMISSION: 'client:leave-submission',
} as const;

export type SubmissionRealtimePayload = {
  submissionId: string;
  userId: string;
  problemId: string;
  contestId?: string | null;
  status: string;
  score?: number | null;
  runtimeMs?: number | null;
  memoryMb?: number | null;
  error?: string | null;
  compileLog?: string | null;
  testsPassed?: number;
  testsTotal?: number;
  language?: string | null;
  isDryRun?: boolean;
  caseResults?: unknown;
  progressPct?: number | null;
  logChunk?: string | null;
};

export type ContestLeaderboardUpdatedPayload = {
  contestId: string;
  submissionId: string;
  userId: string;
  problemId: string;
  status: string;
};
