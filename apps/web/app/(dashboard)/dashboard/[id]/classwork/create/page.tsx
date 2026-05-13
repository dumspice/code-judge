import { Metadata } from 'next';
import ClassProblemCreate from '@/components/dashboard/class-detail/ClassProblemCreate';
import { getClassroomDetail } from '@/services/classroom.apis';
import { authApi } from '@/services/auth.apis';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Create Problem | CodeJudge',
  description: 'Design a new programming problem for your class',
};

export default async function CreateProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const [classroom, user] = await Promise.all([
    getClassroomDetail(id, {
      headers: {
        Cookie: cookieHeader,
      },
    }),
    authApi.me({
      headers: {
        Cookie: cookieHeader,
      },
    }),
  ]);

  if (classroom.ownerId !== user.id) {
    redirect(`/dashboard/${id}/classwork`);
  }

  return (
    <div className="py-8">
      <ClassProblemCreate classId={id} />
    </div>
  );
}
