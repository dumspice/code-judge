import { MoreVertical, FolderOpen, Contact2 } from 'lucide-react';
import Link from 'next/link';

interface ClassCardProps {
  title: string;
  subTitle: string;
  teacher: string;
  bannerBg: string;
  avatar: string;
}

export default function ClassCard({ title, subTitle, teacher, bannerBg, avatar }: ClassCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group cursor-pointer relative h-[280px] flex flex-col">
      {/* Banner phần trên */}
      <div className={`${bannerBg} p-4 h-[100px] relative text-white`}>
        <div className="flex justify-between items-start">
          <Link
            href={`/dashboard/${title}`}
            className="font-bold text-xl hover:underline truncate pr-6"
          >
            {title}
          </Link>
        </div>
        <p className="text-sm truncate">{subTitle}</p>
        <p className="text-xs mt-2 hover:underline">{teacher}</p>

        {/* Avatar đè lên đường kẻ */}
        <img
          src={avatar}
          alt="teacher"
          className="absolute -bottom-8 right-4 w-16 h-16 rounded-full border-4 border-white object-cover"
        />
      </div>

      {/* Phần giữa trống */}
      <div className="flex-1" />

      {/* Footer chứa icon actions */}
      <div className="border-t border-gray-100 p-3 flex justify-end gap-4 text-gray-500">
        {/* Navigate vào phần mọi người */}
        <Link href={`/dashboard/${title}/people`}>
          <Contact2 className="w-5 h-5 hover:text-blue-500" />
        </Link>

        {/* Navigate vào phần bài tập */}
        <Link href={`/dashboard/${title}/classwork`}>
          <FolderOpen className="w-5 h-5 hover:text-blue-500" />
        </Link>
      </div>
    </div>
  );
}
