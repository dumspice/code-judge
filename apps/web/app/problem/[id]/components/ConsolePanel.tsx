'use client';

import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Terminal, Zap, Cpu } from 'lucide-react';
import type { SubmissionResult } from './ProblemWorkspace';
import { cn } from '@/lib/utils';

type ConsolePanelProps = {
  isRunning: boolean;
  result: SubmissionResult | null;
};

export default function ConsolePanel({ isRunning, result }: ConsolePanelProps) {
  return (
    <div className="flex h-[300px] flex-col border-t border-border/50 bg-muted/10">
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Terminal size={14} className="text-blue-500" />
          Console Output
        </div>
        
        {result && (
          <div className={cn(
            "flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
            result.status === 'Accepted' ? "text-emerald-500" : "text-rose-500"
          )}>
            {result.status === 'Accepted' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {result.status}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {isRunning ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
              <Zap size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Judging your submission...</p>
          </div>
        ) : result ? (
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-6">
              <div className="group rounded-2xl border border-border/50 bg-background p-5 transition-all hover:bg-muted/30 hover:shadow-xl hover:-translate-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={10} className="text-blue-500" />
                  Testcases
                </p>
                <p className="text-2xl font-bold">
                  <span className={cn(result.testsPassed === result.testsTotal ? "text-emerald-500" : "text-amber-500")}>
                    {result.testsPassed}
                  </span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-muted-foreground">{result.testsTotal}</span>
                </p>
              </div>

              <div className="group rounded-2xl border border-border/50 bg-background p-5 transition-all hover:bg-muted/30 hover:shadow-xl hover:-translate-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Zap size={10} className="text-amber-500" />
                  Runtime
                </p>
                <p className="text-2xl font-bold">
                  {result.runtimeMs ?? '--'} <span className="text-xs text-muted-foreground font-medium uppercase">ms</span>
                </p>
              </div>

              <div className="group rounded-2xl border border-border/50 bg-background p-5 transition-all hover:bg-muted/30 hover:shadow-xl hover:-translate-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Cpu size={10} className="text-purple-500" />
                  Memory
                </p>
                <p className="text-2xl font-bold">
                  {result.memoryMb ?? '--'} <span className="text-xs text-muted-foreground font-medium uppercase">mb</span>
                </p>
              </div>
            </div>
            
            {result.errorMessage && (
               <div className="group relative rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                 <h4 className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-3">Error Output</h4>
                 <div className="text-sm font-mono text-rose-200/80 whitespace-pre-wrap bg-background rounded-lg p-4 border border-rose-500/10">
                   {result.errorMessage}
                 </div>
               </div>
            )}
            
            {result.status === 'Accepted' && (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-3" />
                <h3 className="text-xl font-bold text-emerald-400 mb-1">Success!</h3>
                <p className="text-sm text-emerald-500/70">Your code passed all requirements and constraints.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30">
            <Terminal size={48} className="text-muted-foreground" />
            <p className="text-sm font-medium tracking-wide">Run or Submit to view results</p>
          </div>
        )}
      </div>
    </div>
  );
}