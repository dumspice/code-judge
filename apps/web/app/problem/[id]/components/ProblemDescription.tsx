import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clock, HardDrive } from 'lucide-react';
import type { ProblemType } from './ProblemWorkspace';

export default function ProblemDescription({ problem }: { problem: ProblemType }) {
  // Map màu theo difficulty
  const difficultyColor = 
    problem.difficulty === 'EASY' ? 'text-green-600 dark:text-green-400 bg-green-500/10' :
    problem.difficulty === 'MEDIUM' ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10' :
    'text-red-600 dark:text-red-400 bg-red-500/10';

  return (
    <div className="w-1/2 border-r border-border overflow-y-auto">
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{problem.title}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${difficultyColor}`}>
            {problem.difficulty}
          </span>
        </div>

        {/* CÁC THÔNG SỐ GIỚI HẠN LẤY TỪ SCHEMA */}
        <div className="mt-3 flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{problem.timeLimitMs} ms</span>
          </div>
          <div className="flex items-center gap-1">
            <HardDrive size={14} />
            <span>{problem.memoryLimitMb} MB</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {problem.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-8 px-6 py-6">
        {/* RENDER MARKDOWN THAY VÌ STRING THƯỜNG */}
        <section className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {problem.statementMd}
          </ReactMarkdown>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Examples</h2>
          {/* LẤY DỮ LIỆU TỪ TESTCASE PUBLIC */}
          {problem.publicTestCases.map((tc, index) => (
            <div key={tc.id} className="rounded-xl border border-border bg-card p-4 mb-4">
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Input:</span> {tc.input}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Output:</span> {tc.expectedOutput}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}