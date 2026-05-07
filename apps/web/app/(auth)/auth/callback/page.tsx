'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAccessToken } from '@/services/api';
import { useAuthStore } from '@/store/auth-store';

/**
 * OAuth callback page: /auth/callback
 *
 * Backend redirects here after Google login with two things:
 *  1. HttpOnly cookie `refreshToken` (set by backend before redirect).
 *  2. `?accessToken=<jwt>` query param — stored in memory for immediate use.
 *
 * If no accessToken in query, falls back to calling /auth/refresh (uses cookie).
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const completeLogin = async () => {
      // 1. Try to grab accessToken passed directly by backend redirect
      const tokenFromQuery = searchParams.get('accessToken');

      if (tokenFromQuery) {
        setAccessToken(tokenFromQuery);
        await useAuthStore.getState().refreshUser();
        // Clean query param from URL before navigating
        router.replace('/dashboard');
        return;
      }

      // 2. Fallback: no token in query — try cookie-based refresh
      const { authApi } = await import('@/services/api');
      const success = await authApi.refreshSession();
      if (success) {
        await useAuthStore.getState().refreshUser();
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };

    completeLogin();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-500" />
        <p className="text-sm text-slate-400">Completing sign in…</p>
      </div>
    </div>
  );
}
