import { Metadata } from 'next';
import PersonItem from '@/components/dashboard/class-detail/person-item';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'People | CodeJudge',
  description: 'View class teachers and students',
};

export default function PeoplePage() {
  const teachers = [
    { id: 1, name: 'FSA LDC Class Master', avatarUrl: 'https://i.pravatar.cc/150?u=teacher1' },
  ];

  const students = [
    { id: 1, name: 'Đỗ Minh Quang', avatarUrl: 'https://i.pravatar.cc/150?u=student1' },
    { id: 2, name: 'Hà Gia Minh', avatarUrl: 'https://i.pravatar.cc/150?u=student2' },
    { id: 3, name: 'Nguyễn Viết Nam', avatarUrl: 'https://i.pravatar.cc/150?u=student3' },
    { id: 4, name: 'Mai Nhật Hoàng', avatarUrl: 'https://i.pravatar.cc/150?u=student4' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 mt-4 px-4 sm:px-0">
      {/* Teachers Section */}
      <section>
        <div className="flex justify-between items-end border-b border-black pb-4 mb-4">
          <h2 className="text-3xl font-normal text-black">Owner</h2>
        </div>
        <div className="space-y-1">
          {teachers.map((teacher) => (
            <PersonItem key={teacher.id} name={teacher.name} avatarUrl={teacher.avatarUrl} />
          ))}
        </div>
      </section>

      {/* Students Section */}
      <section>
        <div className="flex justify-between items-end border-b border-black pb-4 mb-4">
          <h2 className="text-3xl font-normal text-black">Student</h2>
          <span className="text-sm font-medium text-gray-700">{students.length} students</span>
        </div>
        <div className="space-y-1">
          {students.map((student) => (
            <PersonItem key={student.id} name={student.name} avatarUrl={student.avatarUrl} />
          ))}
        </div>
      </section>
    </div>
  );
}
