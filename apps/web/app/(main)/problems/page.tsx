import { Metadata } from 'next';
import { problemsApi } from '@/services/problem.apis';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const metadata: Metadata = {
  title: 'Problems | CodeJudge',
  description: 'Practice programming problems and improve your skills',
};

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = page ? Number(page) : 1;
  const limit = 20;

  const { items: problems, total } = await problemsApi.findAll({
    search: q,
    page: currentPage,
    limit,
  });

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'MEDIUM':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'HARD':
        return 'text-rose-600 bg-rose-50 border-rose-100';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
          Problem Set
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Sharpen your coding skills with our curated collection of programming challenges.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-full max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
            <Search className="h-5 w-5" />
          </div>
          <Input
            placeholder="Search problems by title..."
            className="pl-10 h-12 rounded-xl border-gray-200 focus:ring-black focus:border-black transition-all shadow-none"
            defaultValue={q}
          />
        </div>
        <div className="flex gap-4 text-sm font-medium text-gray-500">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span> Easy
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span> Medium
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-400"></span> Hard
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
              <TableHead className="py-5 pl-8 font-bold text-gray-900 uppercase tracking-wider text-xs">Title</TableHead>
              <TableHead className="py-5 font-bold text-gray-900 uppercase tracking-wider text-xs">Difficulty</TableHead>
              <TableHead className="py-5 font-bold text-gray-900 uppercase tracking-wider text-xs">Tags</TableHead>
              <TableHead className="py-5 font-bold text-gray-900 uppercase tracking-wider text-xs text-right pr-8">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 opacity-40">
                    <Search className="w-12 h-12 mb-2" />
                    <p className="text-xl font-medium">No problems found</p>
                    <p className="text-sm">Try adjusting your search terms</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              problems.map((problem) => (
                <TableRow key={problem.id} className="group hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0">
                  <TableCell className="py-6 pl-8">
                    <Link href={`/problem/${problem.id}`} className="group-hover:text-blue-600 transition-colors">
                      <span className="text-lg font-semibold text-gray-900 block">{problem.title}</span>
                      <span className="text-xs text-gray-400 mt-1 block">ID: {problem.slug}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="py-6">
                    <Badge variant="outline" className={`px-3 py-1 rounded-full font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="flex flex-wrap gap-2">
                      {problem.tags && problem.tags.length > 0 ? (
                        problem.tags.map((item: any) => (
                          <span
                            key={item.tag.id}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium"
                          >
                            {item.tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No tags</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 text-right pr-8">
                    <Link
                      href={`/problem/${problem.id}`}
                      className="inline-flex items-center justify-center rounded-lg bg-black text-white px-5 py-2 text-sm font-bold hover:bg-gray-800 transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-black/10"
                    >
                      Solve
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-center gap-2 pt-6">
        <p className="text-sm text-gray-500">
          Showing <span className="font-bold text-black">{problems.length}</span> of <span className="font-bold text-black">{total}</span> problems
        </p>
      </div>
    </div>
  );
}
