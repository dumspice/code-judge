'use client';

import ClassDropdown from '@/components/dashboard/schedule/ClassDropdown';
import WeekNavigation from '@/components/dashboard/schedule/WeekNavigation';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';

  const handleFilter = (type: 'problem' | 'contest') => {
    const params = new URLSearchParams(searchParams.toString());

    if (filter === type) {
      params.delete('filter');
    } else {
      params.set('filter', type);
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-5 mb-4">
        <ClassDropdown />
        <WeekNavigation />
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleFilter('problem')}
            className={`border p-1 rounded-full transition cursor-pointer
              ${
                filter === 'problem'
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'bg-indigo-50/70 border-indigo-500 text-indigo-500'
              }`}
          >
            Problem
          </Button>
          <Button
            onClick={() => handleFilter('contest')}
            className={`border p-1 rounded-full transition cursor-pointer
              ${
                filter === 'contest'
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-amber-50/70 border-amber-500 text-amber-500'
              }`}
          >
            Contest
          </Button>
        </div>
      </div>

      <div className="flex-1">{children}</div>
    </div>
  );
}
