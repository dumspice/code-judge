'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { monacoLanguageId } from '@/lib/supported-languages';
import { problemsApi } from '@/services/problem.apis';
import { toast } from 'sonner';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type TestCaseInput = { input: string };

type StarterTemplateMonacoFieldProps = {
  language: string;
  templateCode: Record<string, string>;
  testCases?: TestCaseInput[];
  onTemplateChange: (templates: Record<string, string>) => void;
};

export function StarterTemplateMonacoField({
  language,
  templateCode,
  testCases,
  onTemplateChange,
}: StarterTemplateMonacoFieldProps) {
  const [loadingDefault, setLoadingDefault] = useState(false);
  const value = templateCode[language] ?? '';

  async function loadDefaultBoilerplate() {
    setLoadingDefault(true);
    try {
      const resolved = await problemsApi.previewStarterTemplates({
        supportedLanguages: [language],
        templateCode,
        testCases: testCases?.map((tc) => ({ input: tc.input ?? '' })),
      });
      const code = resolved[language];
      if (!code?.trim()) {
        toast.error(`Không tạo được boilerplate mặc định cho ${language}.`);
        return;
      }
      onTemplateChange({ ...templateCode, [language]: code });
      toast.success(`Đã tải boilerplate mặc định cho ${language}.`);
    } catch {
      toast.error('Tải boilerplate mặc định thất bại.');
    } finally {
      setLoadingDefault(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          Starter template for <span className="text-indigo-600 font-bold">{language}</span>
        </Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={loadingDefault}
            onClick={() => void loadDefaultBoilerplate()}
          >
            {loadingDefault ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : null}
            Load default
          </Button>
          <button
            type="button"
            onClick={() => {
              const updated = { ...templateCode };
              delete updated[language];
              onTemplateChange(updated);
            }}
            className="text-xs text-rose-500 hover:underline"
          >
            Reset / Clear
          </button>
        </div>
      </div>
      {!value.trim() ? (
        <p className="text-xs text-slate-500">
          Để trống sẽ dùng boilerplate mặc định (đọc stdin + hàm solve trống) khi lưu bài — hoặc bấm
          Load default để xem trước.
        </p>
      ) : null}
      <div className="border border-slate-200 rounded-lg overflow-hidden h-[250px] shadow-sm">
        <MonacoEditor
          height="100%"
          language={monacoLanguageId(language)}
          theme="vs-dark"
          value={value}
          onChange={(val) => {
            onTemplateChange({ ...templateCode, [language]: val ?? '' });
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: language === 'PYTHON' ? 4 : 4,
          }}
        />
      </div>
    </div>
  );
}
