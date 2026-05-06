'use client';

import { Menu } from 'lucide-react';
import { UserNav } from '../shared/user-nav';
import { useAuthStore } from '@/store/auth-store';
import { useSidebarStore } from '@/store/sidebar-store';

export default function DashboardHeader() {
  const { user, loading } = useAuthStore();
  const toggle = useSidebarStore((state) => state.toggle);
  return (
    <header className="fixed top-0 w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-4">
        <button onClick={toggle} className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <span className="text-xl text-gray-700">Classroom</span>
      </div>

      <div className="flex items-center gap-2">{!loading && <>{user && <UserNav />}</>}</div>
    </header>
  );
}
