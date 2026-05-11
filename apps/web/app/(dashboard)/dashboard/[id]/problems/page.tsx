import { Metadata } from 'next';
import ClassProblemsTab from '@/components/dashboard/class-detail/ClassProblemsTab';

export const metadata: Metadata = {
  title: 'Manage Problems | CodeJudge',
  description: 'View and manage programming problems for your class',
};

export default async function ClassProblemsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ClassProblemsTab classId={id} />
    </div>
  );
}
