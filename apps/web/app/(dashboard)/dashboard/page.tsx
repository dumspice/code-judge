'use client';

import { useEffect, useState } from 'react';
import ClassCard from '@/components/dashboard/ClassCard';
import { getMyClassrooms, MyClassroomItem } from '@/services/classroom.apis';

const bannerColors = [
  'bg-slate-700',
  'bg-blue-600',
  'bg-teal-600',
  'bg-purple-600',
  'bg-emerald-600',
];

export default function StudentDashboardPage() {
  const [classrooms, setClassrooms] = useState<MyClassroomItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMyClassrooms();
        setClassrooms(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div>Loading classrooms...</div>;
  }

  if (!classrooms.length) {
    return <div className="text-gray-500">You have not joined any classrooms yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {classrooms.map((item, idx) => (
        <ClassCard
          key={item.classRoom.id}
          id={item.classRoom.id}
          title={item.classRoom.name}
          subTitle={item.classRoom.academicYear ?? ''}
          teacher={item.classRoom.owner.name}
          bannerBg={bannerColors[idx % bannerColors.length]}
          avatar={item.classRoom.owner.image}
        />
      ))}
    </div>
  );
}
