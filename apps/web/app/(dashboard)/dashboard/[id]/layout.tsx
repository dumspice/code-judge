import ClassTabs from '@/components/dashboard/class-detail/class-tabs';

export default function ClassDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white -mx-6 -mt-6 mb-6 px-6">
        <ClassTabs classId={params.id} />
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
