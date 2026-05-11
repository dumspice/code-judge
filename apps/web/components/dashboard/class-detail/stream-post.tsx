import { ArrowRight, CalendarDays, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Contest } from '@/services/auth.apis';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function StreamPost(
  { id, title, endAt, createdAt, status, maxSubmissionsPerProblem, description }: Contest,
  classId: string,
) {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-black">{title}</h2>

          <div className="mt-3 flex items-center gap-2 text-gray-500">
            <CalendarDays className="h-4 w-4" />

            <span className="text-sm">
              {formatDate(createdAt)} - {formatDate(endAt)}
            </span>
          </div>
        </div>

        <div
          className={`
        rounded-full px-3 py-1 text-xs font-semibold text-white
        ${status === 'PUBLISHED' ? 'bg-black' : status === 'DRAFT' ? 'bg-gray-500' : 'bg-red-500'}
      `}
        >
          {status}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-md text-gray-500">{description}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Trophy className="h-4 w-4" />

          <span className="text-sm">
            {maxSubmissionsPerProblem
              ? `${maxSubmissionsPerProblem} submissions`
              : 'Unlimited submissions'}
          </span>
        </div>

        <Link
          href={`/dashboard/${classId}/contests/${id}`}
          className="h-10 flex items-center gap-1 cursor-pointer rounded-xl bg-black px-5 text-sm font-medium text-white hover:bg-gray-800"
        >
          <span>Join Contest</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
