import { ClipboardList, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AssignmentItemProps {
  title: string;
  dueDate?: string;
  status?: string;
}

export default function AssignmentItem({ title, dueDate, status }: AssignmentItemProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 hover:bg-gray-50 group transition-colors px-2 rounded-md cursor-pointer">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
          <ClipboardList className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        {status && <span className="hidden sm:inline-block font-medium">{status}</span>}
        {dueDate && <span className="hidden sm:inline-block">Due date {dueDate}</span>}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-black hover:bg-gray-200 rounded-full"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
