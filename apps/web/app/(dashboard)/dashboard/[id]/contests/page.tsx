import { Metadata } from 'next';
import ClassContestsTab from '@/components/dashboard/class-detail/ClassContestsTab';

export const metadata: Metadata = {
  title: 'Manage Contests | CodeJudge',
  description: 'Create and manage contests for your class',
};

export default async function ClassContestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ClassContestsTab classId={id} />
    </div>
  );
}
