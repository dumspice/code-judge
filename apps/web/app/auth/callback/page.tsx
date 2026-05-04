'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAccessToken, setRefreshToken } from '@/services/api';

/**
 * OAuth callback page: /auth/callback
 *
 * Backend redirects here after Google login with ?accessToken=...&refreshToken=...
 * This page extracts the tokens, stores them, and redirects to dashboard.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      router.replace('/');
    } else {
      // No tokens → something went wrong, go to login
      router.replace('/login');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-500" />
        <p className="text-sm text-slate-400">Completing sign in…</p>
      </div>
    </div>
  );
}
