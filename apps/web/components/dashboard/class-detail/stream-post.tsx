import { MoreVertical, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StreamPostProps {
  author: string;
  time: string;
  content: string;
  type?: 'announcement' | 'assignment';
}

export default function StreamPost({ author, time, content, type = 'announcement' }: StreamPostProps) {
  return (
    <div className="flex bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex-shrink-0 mr-4 mt-1">
        {type === 'assignment' ? (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-gray-700" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold text-lg">
            {author.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{author}</h3>
            <p className="text-xs text-gray-500">{time}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
}
