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

export const metadata: Metadata = {
  title: 'Classwork | CodeJudge',
  description: 'View class assignments',
};

export default function ClassworkPage() {
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
          {assignments.map((assignment) => (
            <AssignmentItem
              key={assignment.id}
              title={assignment.title}
              dueDate={assignment.dueDate}
              status={assignment.status}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
