'use client';

import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { tryRefresh } from '@/services/api-client';

/**
 * accessToken TTL = 15 phút → silent refresh mỗi 13 phút để luôn có token hợp lệ.
 * Điều này ngăn 401 xảy ra khi user ngồi trên một trang lâu mà không navigate.
 */
const SILENT_REFRESH_INTERVAL_MS = 13 * 60 * 1000; // 13 phút

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Lần đầu load: lấy thông tin user (gọi /auth/me, interceptor xử lý 401 nếu cần)
    refreshUser();

    // Silent refresh định kỳ: chủ động gia hạn accessToken trước khi hết hạn
    timerRef.current = setInterval(async () => {
      const { user } = useAuthStore.getState();
      // Chỉ refresh khi đang đăng nhập
      if (user) {
        await tryRefresh();
      }
    }, SILENT_REFRESH_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refreshUser]);

  return <>{children}</>;
}
