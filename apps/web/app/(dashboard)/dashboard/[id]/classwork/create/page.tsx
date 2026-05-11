import { Metadata } from 'next';
import ClassProblemCreate from '@/components/dashboard/class-detail/ClassProblemCreate';

export const metadata: Metadata = {
  title: 'Create Problem | CodeJudge',
  description: 'Design a new programming problem for your class',
};

export default async function CreateProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="py-8">
      <ClassProblemCreate classId={id} />
    </div>
  );
}
