import { Metadata } from 'next';
import { getPublicCoreUrl } from '@/lib/public-config';
import { cookies } from 'next/headers';
import ClassworkList from '@/components/dashboard/class-detail/ClassworkList';
import { Problem, problemsApi } from '@/services/problem.apis';

export const metadata: Metadata = {
  title: 'Classwork | CodeJudge',
  description: 'View class assignments',
};

export default async function ClassworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const BASE_URL = getPublicCoreUrl();

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const problemsResult = await problemsApi.findAll(
    {
      limit: 50,
      classRoomId: id,
    },
    {
      headers: {
        Cookie: cookieHeader,
      },
    },
  );
  const initialProblems = problemsResult.items as Problem[];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <ClassworkList classId={id} initialProblems={initialProblems} />
    </div>
  );
}
