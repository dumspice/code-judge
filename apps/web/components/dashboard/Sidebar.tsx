'use client';

import { Home, Calendar, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/store/sidebar-store';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';

const menuItems = [
  { icon: Home, label: 'Classroom', path: '/dashboard' },
  { icon: Calendar, label: 'Schedule', path: '/dashboard/schedule' },
];

const adminMenuItems = [{ icon: Settings, label: 'Admin Panel', path: '/dashboard/admin' }];

export default function Sidebar() {
  const pathname = usePathname();
  const isOpen = useSidebarStore((state) => state.isOpen);
  const user = useAuthStore((state) => state.user);

  const allMenuItems = user?.role === 'ADMIN' ? [...menuItems, ...adminMenuItems] : menuItems;

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-200 transition-all duration-300 ease-in-out group shadow-sm z-40',
        isOpen ? 'w-64' : 'w-[72px] hover:w-64',
      )}
    >
      <div className="flex flex-col gap-2 p-3">
        {allMenuItems.map((item, index) => (
          <Link
            href={item.path}
            key={index}
            className={cn(
              'flex items-center h-12 px-3 rounded-xl hover:bg-slate-100 cursor-pointer text-gray-600 hover:text-blue-600 transition-colors',
              pathname === item.path ? 'bg-slate-100 text-blue-600' : '',
            )}
          >
            <item.icon className="w-6 h-6 min-w-[24px]" />
            <span
              className={cn(
                'ml-4 font-medium whitespace-nowrap transition-all duration-300',
                isOpen ? 'opacity-100' : 'opacity-0 invisible',
                'group-hover:opacity-100 group-hover:visible',
              )}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
