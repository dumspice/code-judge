'use client';

import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type ContestLeaderboardUpdatedPayload } from '@/lib/realtime-events';

/**
 * Join contest room and reload leaderboard when any participant finishes a run.
 * Payload is minimal (no case results) — safe for all viewers in the contest.
 */
export function useContestLeaderboardRealtime(
  socket: Socket | null,
  contestId: string | undefined,
  onUpdate: () => void,
) {
  useEffect(() => {
    if (!socket || !contestId) return;

    const join = () => {
      socket.emit(SOCKET_EVENTS.CLIENT_JOIN_CONTEST, { contestId });
    };

    const onLeaderboardUpdated = (payload: ContestLeaderboardUpdatedPayload) => {
      if (payload.contestId === contestId) {
        onUpdate();
      }
    };

    if (socket.connected) {
      join();
    } else {
      socket.once('connect', join);
    }

    socket.on(SOCKET_EVENTS.CONTEST_LEADERBOARD_UPDATED, onLeaderboardUpdated);

    return () => {
      socket.off('connect', join);
      socket.off(SOCKET_EVENTS.CONTEST_LEADERBOARD_UPDATED, onLeaderboardUpdated);
      socket.emit(SOCKET_EVENTS.CLIENT_LEAVE_CONTEST, { contestId });
    };
  }, [socket, contestId, onUpdate]);
}
