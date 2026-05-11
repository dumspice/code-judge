'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, Send, Maximize2, Moon, Sun } from 'lucide-react';
import type { ProblemType } from './ProblemWorkspace';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type CodeEditorPanelProps = {
  problem: ProblemType;
  code: string;
  setCode: (val: string) => void;
  isRunning: boolean;
  onRun: () => void;
  onSubmit: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

export default function CodeEditorPanel({ 
  problem, code, setCode, isRunning, onRun, onSubmit, isDarkMode, toggleDarkMode 
}: CodeEditorPanelProps) {
  
  // Khởi tạo ngôn ngữ mặc định là ngôn ngữ đầu tiên trong mảng
  const [language, setLanguage] = useState(problem.supportedLanguages[0] || 'javascript');

  const handleEditorWillMount = (monacoInstance: any) => {
    monacoInstance.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c678dd' },
      ],
      colors: { 'editor.background': '#131316' },
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3 transition-colors">
        <div className="flex items-center gap-3">
          
          {/* MAP TỪ SUPPORTED LANGUAGES CHUẨN XÁC VỚI BÀI TẬP */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring capitalize"
          >
            {problem.supportedLanguages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>

          <button onClick={toggleDarkMode} className="rounded-lg border border-border bg-background p-2 hover:bg-muted transition-colors flex items-center justify-center w-9 h-9">
            {isDarkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-foreground" />}
          </button>
          <button className="rounded-lg border border-border bg-background p-2 hover:bg-muted transition-colors flex items-center justify-center w-9 h-9">
            <Maximize2 size={16} className="text-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onRun} disabled={isRunning} className="flex items-center gap-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 px-4 py-2 text-sm font-medium transition disabled:opacity-50 text-secondary-foreground">
            <Play size={16} /> Run
          </button>
          <button onClick={onSubmit} disabled={isRunning} className="flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
            <Send size={16} /> Submit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme={isDarkMode ? 'custom-dark' : 'light'}
          beforeMount={handleEditorWillMount}
          options={{ fontSize: 15, minimap: { enabled: false }, padding: { top: 16 } }}
        />
      </div>
    </div>
  );
}