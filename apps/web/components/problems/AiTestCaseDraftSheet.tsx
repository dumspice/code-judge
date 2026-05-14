'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { GenerateTestCasesDraftResult } from '@/services/problem.apis';

type Locale = 'vi' | 'en';

type PreviewCase = {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  weight: number;
};

const COPY: Record<
  Locale,
  {
    title: string;
    description: string;
    model: string;
    provider: string;
    prompt: string;
    parseTitle: string;
    notesTitle: string;
    revNotesTitle: string;
    emptyFiltered: string;
    preview: (n: number) => string;
    emptyInput: string;
    input: string;
    output: string;
    noData: string;
    close: string;
    append: string;
    replace: string;
  }
> = {
  vi: {
    title: 'Test case từ AI (bản nháp)',
    description:
      'Kiểm tra input/output trước khi ghi vào form. Có thể chỉnh sửa lại sau khi áp dụng.',
    model: 'Model:',
    provider: 'Provider:',
    prompt: 'Prompt:',
    parseTitle: 'Parse',
    notesTitle: 'Ghi chú AI',
    revNotesTitle: 'Ghi chú revision',
    emptyFiltered:
      'Không có test case nào sau khi lọc. Thử bổ sung đề bài rõ hơn hoặc chỉnh ioSpec ở bản sau.',
    preview: (n) => `Xem trước (${n} case)`,
    emptyInput: '(trống)',
    input: 'Input',
    output: 'Output',
    noData: 'Chưa có dữ liệu.',
    close: 'Đóng',
    append: 'Thêm vào cuối',
    replace: 'Thay thế toàn bộ',
  },
  en: {
    title: 'AI test cases (draft)',
    description: 'Review input/output before merging into the form. You can edit after applying.',
    model: 'Model:',
    provider: 'Provider:',
    prompt: 'Prompt:',
    parseTitle: 'Parse',
    notesTitle: 'AI notes',
    revNotesTitle: 'Revision notes',
    emptyFiltered:
      'No test cases after filtering. Try a clearer statement or adjust ioSpec and generate again.',
    preview: (n) => `Preview (${n} cases)`,
    emptyInput: '(empty)',
    input: 'Input',
    output: 'Output',
    noData: 'No data yet.',
    close: 'Close',
    append: 'Append to end',
    replace: 'Replace all',
  },
};

export function AiTestCaseDraftSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftResult: GenerateTestCasesDraftResult | null;
  previewCases: PreviewCase[];
  onApplyReplace: () => void;
  onApplyAppend: () => void;
  locale?: Locale;
}) {
  const {
    open,
    onOpenChange,
    draftResult,
    previewCases,
    onApplyReplace,
    onApplyAppend,
    locale = 'vi',
  } = props;
  const t = COPY[locale];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col gap-0 p-0 h-full max-h-dvh"
      >
        <SheetHeader className="border-b shrink-0 text-left px-4 py-3 pr-12">
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
          {draftResult ? (
            <>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium text-foreground">{t.model}</span> {draftResult.model}{' '}
                  · <span className="font-medium text-foreground">{t.provider}</span>{' '}
                  {draftResult.provider}
                </p>
                <p>
                  <span className="font-medium text-foreground">{t.prompt}</span>{' '}
                  {draftResult.promptVersion}
                </p>
              </div>

              {draftResult.parseError ? (
                <div
                  role="alert"
                  className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
                >
                  <p className="font-medium">{t.parseTitle}</p>
                  <p className="mt-1 whitespace-pre-wrap break-words">{draftResult.parseError}</p>
                </div>
              ) : null}

              {draftResult.parsed?.notes ? (
                <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                  <p className="font-medium text-foreground mb-1">{t.notesTitle}</p>
                  <p className="whitespace-pre-wrap break-words text-muted-foreground">
                    {draftResult.parsed.notes}
                  </p>
                </div>
              ) : null}

              {draftResult.parsed?.revisionNotes ? (
                <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                  <p className="font-medium text-foreground mb-1">{t.revNotesTitle}</p>
                  <p className="whitespace-pre-wrap break-words text-muted-foreground">
                    {draftResult.parsed.revisionNotes}
                  </p>
                </div>
              ) : null}

              {previewCases.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.emptyFiltered}</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium">{t.preview(previewCases.length)}</p>
                  {previewCases.map((tc, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border bg-card p-3 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">#{i + 1}</span>
                        <span className="text-muted-foreground">
                          {tc.isHidden ? 'Hidden' : 'Public'} · weight {tc.weight}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-0.5">{t.input}</p>
                        <pre className="font-mono whitespace-pre-wrap break-words bg-muted/50 rounded p-2 max-h-28 overflow-y-auto">
                          {tc.input || t.emptyInput}
                        </pre>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-0.5">{t.output}</p>
                        <pre className="font-mono whitespace-pre-wrap break-words bg-muted/50 rounded p-2 max-h-28 overflow-y-auto">
                          {tc.expectedOutput || t.emptyInput}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t.noData}</p>
          )}
        </div>

        <SheetFooter className="border-t shrink-0 flex-col sm:flex-row gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t.close}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={previewCases.length === 0}
            onClick={onApplyAppend}
          >
            {t.append}
          </Button>
          <Button type="button" disabled={previewCases.length === 0} onClick={onApplyReplace}>
            {t.replace}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
