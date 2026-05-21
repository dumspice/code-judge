'use client';

import { useAuthStore } from '@/store/auth-store';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@/lib/realtime-events';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinSubmission: (submissionId: string) => void;
  leaveSubmission: (submissionId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinSubmission: () => {},
  leaveSubmission: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, loading } = useAuthStore();
  const activeSubmissionRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    const apiUrl = process.env.NEXT_PUBLIC_CORE_URL || 'http://localhost:3000';

    const socketInstance = io(apiUrl, {
      withCredentials: true,
      reconnectionAttempts: 5,
      autoConnect: !!user,
    });

    if (!user) {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.connect();
    setSocket(socketInstance);

    return () => {
      if (activeSubmissionRef.current) {
        socketInstance.emit(SOCKET_EVENTS.CLIENT_LEAVE_SUBMISSION, {
          submissionId: activeSubmissionRef.current,
        });
        activeSubmissionRef.current = null;
      }
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user?.id, loading]);

  const joinSubmission = useCallback(
    (submissionId: string) => {
      if (!socket?.connected) return;
      if (activeSubmissionRef.current && activeSubmissionRef.current !== submissionId) {
        socket.emit(SOCKET_EVENTS.CLIENT_LEAVE_SUBMISSION, {
          submissionId: activeSubmissionRef.current,
        });
      }
      activeSubmissionRef.current = submissionId;
      socket.emit(SOCKET_EVENTS.CLIENT_JOIN_SUBMISSION, { submissionId });
    },
    [socket],
  );

  const leaveSubmission = useCallback(
    (submissionId: string) => {
      if (!socket) return;
      socket.emit(SOCKET_EVENTS.CLIENT_LEAVE_SUBMISSION, { submissionId });
      if (activeSubmissionRef.current === submissionId) {
        activeSubmissionRef.current = null;
      }
    },
    [socket],
  );

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinSubmission, leaveSubmission }}>
      {children}
    </SocketContext.Provider>
  );
};
