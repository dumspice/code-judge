'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import ClassCard from '@/components/dashboard/ClassCard';
import { getClassroomBannerColor } from '@/lib/classroom-banner';

import { archiveClassroom, restoreClassroom } from '@/services/classroom.apis';
import { useClassroomStore } from '@/store/classroom-store';
import { useAuthStore } from '@/store/auth-store';

export default function StudentDashboardPage() {
  const { teaching, enrolled, loading, fetchClassrooms } = useClassroomStore(
    useShallow((s) => ({
      teaching: s.teaching,
      enrolled: s.enrolled,
      loading: s.loading,
      fetchClassrooms: s.fetchClassrooms,
    })),
  );

  const classrooms = useMemo(() => [...teaching, ...enrolled], [teaching, enrolled]);
  const activeClasses = useMemo(() => classrooms.filter((c) => c.isActive), [classrooms]);
  const user = useAuthStore((s) => s.user);

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this class?')) return;
    try {
      await archiveClassroom(id);
      await fetchClassrooms();
    } catch (error) {
      console.error(error);
      alert('Failed to archive class');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreClassroom(id);
      await fetchClassrooms();
    } catch (error) {
      console.error(error);
      alert('Failed to restore class');
    }
  };

  const handleLeave = async (id: string) => {
    if (!confirm('Are you sure you want to archive (leave) this class?')) return;
    try {
      // Vì bạn muốn đổi tên thành Archive cho cả Member, nên hành động này 
      // sẽ tương đương với việc Unenroll đối với họ.
      // Bạn có thể bổ sung API unenroll ở đây nếu cần.
      alert('Hành động Archive (Rời lớp) đang được xử lý...');
      await fetchClassrooms();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading && classrooms.length === 0) {
    return <div>Loading classrooms...</div>;
  }

  if (activeClasses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
        <p className="text-lg font-medium">No active classrooms yet.</p>
        <p className="text-sm">Join a class or check your archived classes in the sidebar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {activeClasses.map((item) => {
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
            onLeave={() => handleLeave(item.id)}
          />
        );
      })}
    </div>
  );
}
