'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/services/auth.apis';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');

  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const run = async () => {
      try {
        setLoading(true);

        if (!user) {
          router.push(`/login`);
          return;
        }

        const res = await apiFetch<{
          message: string;
          classRoomId: string;
        }>(`/invites/accept?token=${token}`, {
          method: 'POST',
        });

        router.push(`/dashboard/${res.classRoomId}`);
      } catch (err: any) {
        setError(err?.body?.message || 'Failed to accept invite');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token, user, router]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Accepting invitation...</div>;
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  return null;
}
