import { Metadata } from 'next';
import { getPublicCoreUrl } from '@/lib/public-config';
import { cookies } from 'next/headers';
import { Problem, problemsApi, setAccessToken } from '@/services/auth.apis';
import ClassworkList from '@/components/dashboard/class-detail/ClassworkList';

export const metadata: Metadata = {
  title: 'Classwork | CodeJudge',
  description: 'View class assignments',
};

export default async function ClassworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const BASE_URL = getPublicCoreUrl();
  
  // Refresh token on server side
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieStore.toString(),
      },
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      const result = data.result ?? data;
      setAccessToken(result.accessToken);
    }
  } catch (error) {
    console.warn('Failed to refresh token on server:', error);
  }

  const problemsResult = await problemsApi.findAll({ limit: 50 });
  const initialProblems = problemsResult.items as Problem[];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <ClassworkList classId={id} initialProblems={initialProblems} />
    </div>
  );
}
