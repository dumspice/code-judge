'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/auth-store';

/**
 * OAuth callback page: /auth/callback
 *
 * Backend redirects here after Google login, with the refreshToken set in a secure HttpOnly cookie.
 * This page calls refreshSession() to obtain the accessToken and then redirects to the dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const completeLogin = async () => {
      const success = await authApi.refreshSession();
      if (success) {
        await useAuthStore.getState().refreshUser();
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };

    completeLogin();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-500" />
        <p className="text-sm text-slate-400">Completing sign in…</p>
      </div>
    </div>
  );
}
