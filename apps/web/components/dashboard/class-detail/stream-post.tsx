import { ArrowRight, CalendarDays, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Contest } from '@/services/contest.apis';
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

export function AssignmentPost({
  assignment,
  classId,
}: {
  assignment: any;
  classId: string;
}) {
  const { title, description, publishedAt, dueAt, problem, contest } = assignment;
  
  // Distinguish between Problem, Contest, and Deleted
  const type = problem ? 'Problem' : contest ? 'Contest' : 'Post';
  
  const link = problem 
    ? `/dashboard/${classId}/problems/${problem.id}` 
    : contest 
    ? `/dashboard/${classId}/contests/${contest.id}` 
    : null;

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md border-l-4 border-l-black">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {type}
            </span>
            <span className="text-xs text-gray-400">{formatDate(publishedAt)}</span>
          </div>
          <h2 className="text-lg font-bold text-black">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{description}</p>
          )}
          
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {dueAt && (
              <div className="flex items-center gap-1.5 text-rose-600">
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">Due: {formatDate(dueAt)}</span>
              </div>
            )}
          </div>
        </div>

        {link && (
          <Link
            href={link}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-black hover:bg-black hover:text-white transition-all shadow-sm border border-gray-100"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
        )}
      </div>
    </div>
  );
}
