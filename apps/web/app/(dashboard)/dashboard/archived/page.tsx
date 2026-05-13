'use client';

import ClassCard from '@/components/dashboard/ClassCard';
import { getClassroomBannerColor } from '@/lib/classroom-banner';
import { archiveClassroom, restoreClassroom } from '@/services/classroom.apis';
import { useClassroomStore } from '@/store/classroom-store';
import { useAuthStore } from '@/store/auth-store';

import { useShallow } from 'zustand/react/shallow';

export default function ArchivedDashboardPage() {
  const { archived, loading, fetchClassrooms } = useClassroomStore(
    useShallow((s) => ({
      archived: s.archived,
      loading: s.loading,
      fetchClassrooms: s.fetchClassrooms,
    })),
  );
  const user = useAuthStore((s) => s.user);

  const handleArchive = async (id: string) => {
    try {
      await archiveClassroom(id);
      await fetchClassrooms();
    } catch (error) {
      console.error(error);
      alert('Failed to archive class');
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm('Are you sure you want to restore this class?')) return;
    try {
      await restoreClassroom(id);
      await fetchClassrooms();
    } catch (error) {
      console.error(error);
      alert('Failed to restore class');
    }
  };

  if (loading && archived.length === 0) {
    return <div>Loading archived classrooms...</div>;
  }

  if (archived.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
        <p className="text-lg font-medium">No archived classrooms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Archived classes</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {archived.map((item) => {
          const bannerColors = getClassroomBannerColor(item.id);
          const isOwner = item.ownerId === user?.id;
          
          return (
            <ClassCard
              key={item.id}
              id={item.id}
              title={item.name}
              subTitle={item.academicYear ?? ''}
              teacher={item.owner?.name ?? 'Unknown'}
              bannerBg={bannerColors}
              avatar={item.owner?.image}
              isActive={item.isActive}
              isOwner={isOwner}
              onArchive={() => handleArchive(item.id)}
              onRestore={() => handleRestore(item.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
