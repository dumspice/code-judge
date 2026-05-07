'use client';

import { Code2, Menu, Plus } from 'lucide-react';
import { UserNav } from '../shared/user-nav';
import { useAuthStore } from '@/store/auth-store';
import { useSidebarStore } from '@/store/sidebar-store';
import { Button } from '../ui/button';
import { useState } from 'react';
import Link from 'next/link';

export default function DashboardHeader() {
  const { user, loading } = useAuthStore();
  const toggle = useSidebarStore((state) => state.toggle);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-4">
        <button onClick={toggle} className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
          <Code2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">CodeJudge</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full w-10 h-10 cursor-pointer hover:bg-gray-700"
          >
            <Plus className="w-10 h-10" />
          </Button>
          {isOpen && (
            <div className="absolute right-0 w-48 bg-white border border-gray-200 rounded shadow-lg">
              <div className="cursor-pointer p-2 border-b border-gray-200 text-gray-700 hover:bg-gray-100 font-medium">
                Create new classroom
              </div>
              <div className="cursor-pointer p-2 text-gray-700 hover:bg-gray-100 font-medium">
                Join a classroom
              </div>
            </div>
          )}
        </div>
        {!loading && <>{user && <UserNav />}</>}
      </div>
    </header>
  );
}
