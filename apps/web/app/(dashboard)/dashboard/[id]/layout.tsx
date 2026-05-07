import ClassTabs from '@/components/dashboard/class-detail/class-tabs';

export default async function ClassDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white -mx-6 -mt-6 mb-6 px-6">
        <ClassTabs classId={id} />
      </div>

      <div className="flex-1">{children}</div>
    </div>
  );
}