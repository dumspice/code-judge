/**
 * Quy ước đặt tên room và event Socket.io cho realtime submission / contest.
 */

export const SOCKET_USER_ROOM_PREFIX = 'user:' as const;
export const SOCKET_CONTEST_ROOM_PREFIX = 'contest:' as const;
export const SOCKET_SUBMISSION_ROOM_PREFIX = 'submission:' as const;

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
  CLIENT_HELLO: 'client:hello',
  CLIENT_HELLO_ACK: 'client:hello:ack',
} as const;

export function socketUserRoom(userId: string): string {
  return `${SOCKET_USER_ROOM_PREFIX}${userId}`;
}

export function socketContestRoom(contestId: string): string {
  return `${SOCKET_CONTEST_ROOM_PREFIX}${contestId}`;
}

export function socketSubmissionRoom(submissionId: string): string {
  return `${SOCKET_SUBMISSION_ROOM_PREFIX}${submissionId}`;
}
