'use client';

import { useEffect, useState } from 'react';
import {
  Home,
  Calendar,
  Users,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/store/sidebar-store';
import Link from 'next/link';
import { Classroom, getMyClassrooms } from '@/services/classroom.apis';


const menuItems = [
  { icon: Home, label: 'Classroom', path: '/dashboard' },
  { icon: Calendar, label: 'Schedule', path: '/dashboard/schedule' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isOpen = useSidebarStore((state) => state.isOpen);

  const [isTeachingExpanded, setIsTeachingExpanded] = useState(true);
  const [isEnrolledExpanded, setIsEnrolledExpanded] = useState(true);

  const [enrolled, setEnrolled] = useState<Classroom[]>([]);

  const [teaching, setTeaching] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH CLASSROOMS
  const fetchClassrooms = async () => {
    try {
      setLoading(true);

      const data = await getMyClassrooms();

      const teachingClasses = data
        .filter((item) => item.role === 'OWNER')
        .map((item) => item.classRoom);

      const enrolledClasses = data
        .filter((item) => item.role === 'MEMBER')
        .map((item) => item.classRoom);

      setTeaching(teachingClasses);
      setEnrolled(enrolledClasses);
    } catch (err) {
      console.error('Load classrooms failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  // RENDER ITEM
  const renderItem = (item: any, key: string | number) => (
    <Link
      href={item.path}
      key={key}
      className={cn(
        'flex items-center h-12 px-3 rounded-xl hover:bg-slate-100 cursor-pointer text-gray-600 hover:text-blue-600 transition-colors',
        pathname === item.path ? 'bg-slate-100 text-blue-600' : '',
      )}
    >
      {item.icon ? (
        <item.icon className="w-6 h-6 min-w-[24px]" strokeWidth={1.5} />
      ) : (
        <div
          className={cn(
            'w-6 h-6 min-w-[24px] rounded-full flex items-center justify-center text-[11px] font-bold',
            item.color,
          )}
        >
          {item.avatar}
        </div>
      )}

      <span
        className={cn(
          'ml-4 font-medium whitespace-nowrap truncate transition-all duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 invisible',
          'group-hover:opacity-100 group-hover:visible',
        )}
      >
        {item.label}
      </span>
    </Link>
  );

  // MAP API → UI
  const teachingList = teaching.map((c) => ({
    avatar: c.name.charAt(0).toUpperCase(),
    label: c.name,
    path: `/dashboard/${c.id}`,
    color: 'bg-teal-100 text-teal-700',
  }));

  const enrolledList = enrolled.map((c) => ({
    avatar: c.name.charAt(0).toUpperCase(),
    label: c.name,
    path: `/dashboard/${c.id}`,
    color: 'bg-green-100 text-green-700',
  }));

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-200 transition-all duration-300 ease-in-out group shadow-sm z-40 flex flex-col',
        isOpen ? 'w-64' : 'w-[72px] hover:w-64',
      )}
    >
      <div className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto overflow-x-hidden">

        {/* MAIN MENU */}
        {menuItems.map((item, index) => renderItem(item, index))}

        <div className="my-1 border-t border-gray-200" />

        {/* TEACHING */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setIsTeachingExpanded(!isTeachingExpanded)}
            className="flex items-center justify-between w-full h-12 px-3 rounded-xl hover:bg-slate-100 text-gray-700"
          >
            <div className="flex items-center">
              <Users className="w-6 h-6 min-w-[24px]" />
              <span
                className={cn(
                  'ml-4 font-medium',
                  isOpen ? 'opacity-100' : 'opacity-0 invisible',
                  'group-hover:opacity-100 group-hover:visible',
                )}
              >
                Teaching
              </span>
            </div>

            {(isOpen || isTeachingExpanded) && (
              isTeachingExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )
            )}
          </button>

          {isTeachingExpanded && (
            <div className="flex flex-col gap-1">
              {loading ? (
                <div className="text-sm text-gray-400 px-3">Loading...</div>
              ) : (
                teachingList.map((item, index) =>
                  renderItem(item, `teach-${index}`),
                )
              )}
            </div>
          )}
        </div>

        <div className="my-1 border-t border-gray-200" />

        {/* ENROLLED */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setIsEnrolledExpanded(!isEnrolledExpanded)}
            className="flex items-center justify-between w-full h-12 px-3 rounded-xl hover:bg-slate-100 text-gray-700 transition-colors"
          >
            <div className="flex items-center">
              <GraduationCap className="w-6 h-6 min-w-[24px]" />
              <span
                className={cn(
                  'ml-4 font-medium',
                  isOpen ? 'opacity-100' : 'opacity-0 invisible',
                  'group-hover:opacity-100 group-hover:visible',
                )}
              >
                Enrolled
              </span>
            </div>

            {/* Icon Chevron mũi tên đóng/mở */}
            <div className={cn(
              'transition-all duration-300',
              isOpen ? 'opacity-100' : 'opacity-0 invisible',
              'group-hover:opacity-100 group-hover:visible'
            )}>
              {isEnrolledExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {/* Đưa khối danh sách này ra NGOÀI thẻ <button> */}
          {isEnrolledExpanded && (
            <div className="flex flex-col gap-1">
              {loading ? (
                <div className="text-sm text-gray-400 px-3">Loading...</div>
              ) : (
                enrolledList.map((item, index) =>
                  renderItem(item, `enrolled-${index}`),
                )
              )}
            </div>
          )}
        </div>

        <div className="mt-auto">
          {renderItem(
            {
              icon: Settings,
              label: 'Settings',
              path: '/dashboard/settings',
            },
            'settings',
          )}
        </div>
      </div>
    </aside>
  );
}