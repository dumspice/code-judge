'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import InviteModal from '@/components/dashboard/class-detail/invite-modal';
import PersonItem from '@/components/dashboard/class-detail/person-item';

import { authApi } from '@/services/auth.apis';
import { getClassroomPeople, removeMember } from '@/services/classroom.apis';

export default function PeoplePage() {
  const params = useParams();
  const classRoomId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [me, setMe] = useState<any>(null);

  const load = async () => {
    const [people, user] = await Promise.all([getClassroomPeople(classRoomId), authApi.me()]);
    setData(people);
    setMe(user);
  };

  useEffect(() => {
    load();
  }, [classRoomId]);

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await removeMember(classRoomId, userId);
      // reload data
      await load();
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member');
    }
  };

  if (!data) return <div>Loading...</div>;

  const isOwner = me?.id === data.ownerId;

  return (
    <div className="max-w-3xl mx-auto space-y-10 mt-8 px-4">
      {/* Teachers */}
      <section>
        <div className="border-b pb-2 mb-2">
          <h2 className="text-3xl text-[#1967d2]">Teachers</h2>
        </div>

        <div className="divide-y">
          {data.teachers.map((t: any) => (
            <PersonItem key={t.id} name={t.name} avatarUrl={t.image} />
          ))}
        </div>
      </section>

      {/* Students */}
      <section>
        <div className="flex justify-between border-b pb-2 mb-2">
          <h2 className="text-3xl text-[#1967d2]">Students</h2>

          <div className="flex gap-4 items-center">
            <span className="text-sm text-[#1967d2]">{data.students.length} students</span>

            {/* chỉ owner mới thấy */}
            {isOwner && <InviteModal classRoomId={classRoomId} />}
          </div>
        </div>

        <div className="divide-y">
          {data.students.map((s: any) => (
            <PersonItem
              key={s.id}
              name={s.name}
              avatarUrl={s.image}
              showRemove={isOwner && s.id !== me?.id}
              onRemove={() => handleRemove(s.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
