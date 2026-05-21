'use client';

import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type SubmissionRealtimePayload } from '@/lib/realtime-events';

export type SubmissionRealtimeFilter = {
  userId: string;
  problemId?: string;
  contestId?: string | null;
  /** When set, only events for this submission id are handled. */
  activeSubmissionId?: string | null;
};

export type SubmissionRealtimeHandlers = {
  onFinished?: (data: SubmissionRealtimePayload) => void;
  onFailed?: (data: SubmissionRealtimePayload) => void;
  onProgress?: (data: SubmissionRealtimePayload) => void;
  onCreated?: (data: SubmissionRealtimePayload) => void;
};

function matchesFilter(data: SubmissionRealtimePayload, filter: SubmissionRealtimeFilter): boolean {
  if (data.userId !== filter.userId) return false;
  if (filter.problemId && data.problemId !== filter.problemId) return false;
  if (filter.contestId) {
    if (data.contestId !== filter.contestId) return false;
  } else if (data.contestId) {
    return false;
  }
  if (filter.activeSubmissionId && data.submissionId !== filter.activeSubmissionId) {
    return false;
  }
  return true;
}

/**
 * Scoped submission socket listeners. Server emits only to user:/submission: rooms;
 * client-side filter is defense in depth.
 */
export function useSubmissionRealtime(
  socket: Socket | null,
  filter: SubmissionRealtimeFilter | null,
  handlers: SubmissionRealtimeHandlers,
) {
  const handlersRef = useRef(handlers);
  const processedRef = useRef<Set<string>>(new Set());

  handlersRef.current = handlers;

  useEffect(() => {
    if (!socket || !filter?.userId) return;

    const shouldProcess = (data: SubmissionRealtimePayload, eventKey: string) => {
      if (!matchesFilter(data, filter)) return false;
      const dedupeKey = `${eventKey}:${data.submissionId}`;
      if (processedRef.current.has(dedupeKey)) return false;
      processedRef.current.add(dedupeKey);
      return true;
    };

    const onFinished = (data: SubmissionRealtimePayload) => {
      if (!shouldProcess(data, 'finished')) return;
      handlersRef.current.onFinished?.(data);
    };

    const onFailed = (data: SubmissionRealtimePayload) => {
      if (!shouldProcess(data, 'failed')) return;
      handlersRef.current.onFailed?.(data);
    };

    const onProgress = (data: SubmissionRealtimePayload) => {
      if (!matchesFilter(data, filter)) return;
      handlersRef.current.onProgress?.(data);
    };

    const onCreated = (data: SubmissionRealtimePayload) => {
      if (!matchesFilter(data, filter)) return;
      handlersRef.current.onCreated?.(data);
    };

    socket.on(SOCKET_EVENTS.SUBMISSION_FINISHED, onFinished);
    socket.on(SOCKET_EVENTS.SUBMISSION_FAILED, onFailed);
    socket.on(SOCKET_EVENTS.SUBMISSION_PROGRESS, onProgress);
    socket.on(SOCKET_EVENTS.SUBMISSION_CREATED, onCreated);

    return () => {
      socket.off(SOCKET_EVENTS.SUBMISSION_FINISHED, onFinished);
      socket.off(SOCKET_EVENTS.SUBMISSION_FAILED, onFailed);
      socket.off(SOCKET_EVENTS.SUBMISSION_PROGRESS, onProgress);
      socket.off(SOCKET_EVENTS.SUBMISSION_CREATED, onCreated);
    };
  }, [socket, filter?.userId, filter?.problemId, filter?.contestId, filter?.activeSubmissionId]);
}
