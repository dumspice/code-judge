import Image from 'next/image';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PersonItemProps {
  name: string;
  avatarUrl?: string;
}

export default function PersonItem({ name, avatarUrl }: PersonItemProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 group hover:bg-gray-50 px-2 rounded-md transition-colors cursor-pointer">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <Image src={avatarUrl} alt={name} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {name.charAt(0)}
          </div>
        )}
        <span className="font-medium text-gray-900">{name}</span>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-black hover:bg-gray-200 rounded-full">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
