'use client';

import { useState } from 'react';
import {
  Home,
  Calendar,
  Users,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/store/sidebar-store';
import Link from 'next/link';

const menuItems = [
  { icon: Home, label: 'Classroom', path: '/dashboard' },
  { icon: Calendar, label: 'Schedule', path: '/dashboard/schedule' },
];

const teachingList = [
  { avatar: 'H', label: 'hhiha', path: '/dashboard/teaching/hhiha', color: 'bg-teal-100 text-teal-700' },
];

const enrolledList = [
  { avatar: 'V', label: 'VNR-SE1810-NET', path: '/dashboard/enrolled/vnr', color: 'bg-green-100 text-green-700' },
  { avatar: 'M', label: 'MLN131-SE1810.NET', path: '/dashboard/enrolled/mln', color: 'bg-purple-100 text-purple-700' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isOpen = useSidebarStore((state) => state.isOpen);

  // State để quản lý đóng/mở accordion
  const [isTeachingExpanded, setIsTeachingExpanded] = useState(true);
  const [isEnrolledExpanded, setIsEnrolledExpanded] = useState(true);

  // Component phụ để render từng item
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
        <div className={cn("w-6 h-6 min-w-[24px] rounded-full flex items-center justify-center text-[11px] font-bold", item.color)}>
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

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-200 transition-all duration-300 ease-in-out group shadow-sm z-40 flex flex-col',
        isOpen ? 'w-64' : 'w-[72px] hover:w-64',
      )}
    >
      {/* Phần nội dung chính có thể cuộn */}
      <div className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto overflow-x-hidden custom-scrollbar">

        {/* Main Menu Items */}
        {menuItems.map((item, index) => renderItem(item, index))}

        <div className="my-1 border-t border-gray-200" />

        {/* Teaching Section */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setIsTeachingExpanded(!isTeachingExpanded)}
            className="flex items-center justify-between w-full h-12 px-3 rounded-xl hover:bg-slate-100 text-gray-700 transition-colors"
          >
            <div className="flex items-center">
              <Users className="w-6 h-6 min-w-[24px]" strokeWidth={1.5} />
              <span className={cn(
                'ml-4 font-medium whitespace-nowrap transition-all duration-300',
                isOpen ? 'opacity-100' : 'opacity-0 invisible',
                'group-hover:opacity-100 group-hover:visible'
              )}>
                Teaching
              </span>
            </div>
            <div className={cn(
              'transition-all duration-300',
              isOpen ? 'opacity-100' : 'opacity-0 invisible',
              'group-hover:opacity-100 group-hover:visible'
            )}>
              {isTeachingExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {isTeachingExpanded && (
            <div className="flex flex-col gap-1">
              {teachingList.map((item, index) => renderItem(item, `teaching-${index}`))}
            </div>
          )}
        </div>

        <div className="my-1 border-t border-gray-200" />

        {/* Enrolled Section */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setIsEnrolledExpanded(!isEnrolledExpanded)}
            className="flex items-center justify-between w-full h-12 px-3 rounded-xl hover:bg-slate-100 text-gray-700 transition-colors"
          >
            <div className="flex items-center">
              <GraduationCap className="w-6 h-6 min-w-[24px]" strokeWidth={1.5} />
              <span className={cn(
                'ml-4 font-medium whitespace-nowrap transition-all duration-300',
                isOpen ? 'opacity-100' : 'opacity-0 invisible',
                'group-hover:opacity-100 group-hover:visible'
              )}>
                Enrolled
              </span>
            </div>
            <div className={cn(
              'transition-all duration-300',
              isOpen ? 'opacity-100' : 'opacity-0 invisible',
              'group-hover:opacity-100 group-hover:visible'
            )}>
              {isEnrolledExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {isEnrolledExpanded && (
            <div className="flex flex-col gap-1">
              {enrolledList.map((item, index) => renderItem(item, `enrolled-${index}`))}
            </div>
          )}
        </div>

        <div className="my-1 border-t border-gray-200" />

        {/* Settings Item */}
        <div className="mt-auto">
          {renderItem({ icon: Settings, label: 'Settings', path: '/dashboard/settings' }, 'settings')}
        </div>
      </div>
    </aside>
  );
}