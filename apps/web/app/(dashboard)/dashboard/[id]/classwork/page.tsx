import { Metadata } from 'next';
import AssignmentItem from '@/components/dashboard/class-detail/assignment-item';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Contact, ChevronDown, ClipboardList } from 'lucide-react';
import { getPublicCoreUrl } from '@/lib/public-config';
import { cookies } from 'next/headers';
import { setAccessToken } from '@/services/auth.apis';
import { getClassroomDetail } from '@/services/classroom.apis';

export const metadata: Metadata = {
  title: 'Classwork | CodeJudge',
  description: 'View class assignments',
};

export default async function ClassworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const BASE_URL = getPublicCoreUrl();

  // Refresh token on server side
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieStore.toString(),
      },
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      const result = data.result ?? data;
      setAccessToken(result.accessToken);
    }
  } catch (error) {
    console.warn('Failed to refresh token on server:', error);
  }

  // Fetch classroom details
  const classroom = await getClassroomDetail(id);

  const assignments = [
    { id: 1, title: 'CV', dueDate: '11:30 14 thg 4' },
    { id: 2, title: 'Nộp bài Final Test', dueDate: 'Không có ngày đến hạn' },
    { id: 3, title: 'CIS #1', dueDate: '23:59 12 thg 4' },
    { id: 4, title: 'Final môn FEFW', dueDate: '11:30 31 thg 3' },
    { id: 5, title: 'Điểm Assignment + Final Theory (Quiz...', status: 'Đã đăng vào 19 thg 3' },
    { id: 6, title: 'FEE Exam', dueDate: '15:45 13 thg 3' },
    { id: 7, title: 'Final Test DSA', dueDate: '11:30 3 thg 3' },
    { id: 8, title: 'Final Test Database Fundamental', dueDate: '11:30 27 thg 2' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-64">
          <Select defaultValue="all">
            <SelectTrigger className="w-full bg-white border-gray-300 focus:ring-black">
              <SelectValue placeholder="Tất cả chủ đề" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="exams">Exams</SelectItem>
              <SelectItem value="assignments">Assignments</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            className="border-gray-300 text-black hover:bg-gray-100 font-medium"
          >
            <Contact className="w-4 h-4 mr-2" />
            View your assignment
          </Button>
          <Button variant="ghost" className="text-gray-600 hover:text-black">
            <ChevronDown className="w-4 h-4 mr-2" />
            Collapse all
          </Button>
        </div>
      </div>

      {/* Assignments List */}
      <div>
        {/* Topic Header (optional, shown for "Không có chủ đề" in screenshot) */}
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-xl font-medium text-gray-900">No topic</h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-black hover:bg-gray-100 rounded-full"
          >
            <ChevronDown className="w-5 h-5 transform rotate-180" />
          </Button>
        </div>
        <div className="border-t border-gray-200">
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <AssignmentItem
                key={assignment.id}
                title={assignment.title}
                dueDate={assignment.dueDate}
                status={assignment.status}
              />
            ))
          ) : (
            <div className="flex items-center justify-center mt-5">
              <h2 className="text-lg font-medium">No assignments found.</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
