'use client';

import { ChevronDown, ChevronUp, Lightbulb, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RequestHintResult } from '@/services/ai-hint.apis';

export type HintUiState = 'idle' | 'loading' | 'ready' | 'error';

type AiHintPanelProps = {
  visible: boolean;
  state: HintUiState;
  expanded: boolean;
  onToggleExpanded: () => void;
  data: RequestHintResult | null;
  errorMessage?: string | null;
};

export default function AiHintPanel({
  visible,
  state,
  expanded,
  onToggleExpanded,
  data,
  errorMessage,
}: AiHintPanelProps) {
  if (!visible) return null;

  const badgeLabel =
    state === 'loading' ? 'Đang tải' : state === 'ready' ? 'Sẵn sàng' : state === 'error' ? 'Lỗi' : '—';

  return (
    <div className="border-t border-border/50 bg-gradient-to-b from-violet-500/5 to-transparent">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-violet-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Gợi ý AI
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider inline-flex items-center',
              state === 'loading' && 'bg-amber-500/15 text-amber-600',
              state === 'ready' && 'bg-violet-500/15 text-violet-600',
              state === 'error' && 'bg-rose-500/15 text-rose-600',
              state === 'idle' && 'bg-muted text-muted-foreground',
            )}
          >
            {state === 'loading' && <Loader2 size={10} className="mr-1 animate-spin" />}
            {badgeLabel}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="max-h-[280px] overflow-y-auto px-6 pb-6 custom-scrollbar">
          {state === 'loading' && (
            <p className="text-sm text-muted-foreground animate-pulse">Đang phân tích submission...</p>
          )}
          {state === 'error' && (
            <p className="text-sm text-rose-500">
              {errorMessage || 'Không thể tải gợi ý. Bạn vẫn có thể thử lại sau lần chạy tiếp theo.'}
            </p>
          )}
          {state === 'ready' && data?.hints && (
            <div className="space-y-5 max-w-3xl">
              <section>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Tóm tắt
                </h4>
                <p className="text-sm leading-relaxed">{data.hints.summary}</p>
              </section>

              {data.hints.approachHints.length > 0 && (
                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Hướng làm
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-foreground/90">
                    {data.hints.approachHints.map((hint, i) => (
                      <li key={i}>{hint}</li>
                    ))}
                  </ul>
                </section>
              )}

              {data.hints.syntaxNotes.length > 0 && (
                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Cú pháp cần xem lại
                  </h4>
                  <ul className="space-y-2">
                    {data.hints.syntaxNotes.map((note, i) => (
                      <li key={i} className="rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-sm">
                        <span className="font-semibold text-violet-600 dark:text-violet-400">{note.area}</span>
                        <span className="text-muted-foreground"> — </span>
                        {note.note}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.hints.examplePatterns.length > 0 && (
                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Ví dụ minh họa (không phải đáp án bài)
                  </h4>
                  {data.hints.examplePatterns.map((ex, i) => (
                    <div key={i} className="mb-3 last:mb-0">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">{ex.title}</p>
                      <pre className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                        {ex.genericExample}
                      </pre>
                    </div>
                  ))}
                </section>
              )}

              <p className="text-sm italic text-muted-foreground border-t border-border/40 pt-3">
                {data.hints.encouragement}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
