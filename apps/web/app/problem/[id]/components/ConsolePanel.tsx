import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { SubmissionResult } from './ProblemWorkspace';

type ConsolePanelProps = {
  isRunning: boolean;
  result: SubmissionResult | null;
};

export default function ConsolePanel({ isRunning, result }: ConsolePanelProps) {
  return (
    <div className="flex h-[250px] flex-col border-t border-border bg-muted/20">
      <div className="flex items-center gap-6 border-b border-border px-4 py-3 text-sm">
        <button className="font-medium text-foreground">Test Result</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isRunning ? (
          <div className="flex items-center gap-3 text-yellow-500">
            <div className="h-3 w-3 animate-pulse rounded-full bg-yellow-500" />
            Judging Submission...
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              {result.status === 'Accepted' ? (
                <><CheckCircle2 size={18} className="text-green-600 dark:text-green-400" /> <span className="text-green-600 dark:text-green-400">Accepted</span></>
              ) : result.status === 'Wrong' ? (
                <><XCircle size={18} className="text-destructive" /> <span className="text-destructive">Wrong Answer</span></>
              ) : (
                <><AlertCircle size={18} className="text-orange-500" /> <span className="text-orange-500">{result.status}</span></>
              )}
            </div>

            {/* HIỂN THỊ CHI TIẾT SỐ LƯỢNG TESTCASE ĐÃ PASS (MỚI) */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Testcases Passed:</span>
              <span className="font-semibold text-foreground">{result.testsPassed} / {result.testsTotal}</span>
            </div>

            {result.runtimeMs && result.memoryMb && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Runtime</p>
                  <p className="mt-2 text-lg font-semibold">{result.runtimeMs} ms</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Memory</p>
                  <p className="mt-2 text-lg font-semibold">{result.memoryMb} MB</p>
                </div>
              </div>
            )}
            
            {result.errorMessage && (
               <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive whitespace-pre-wrap font-mono">
                 {result.errorMessage}
               </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Run or Submit your code to see results.</div>
        )}
      </div>
    </div>
  );
}