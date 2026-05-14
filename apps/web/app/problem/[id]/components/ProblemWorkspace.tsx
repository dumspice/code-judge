'use client';

import { useEffect, useState } from 'react';
import ProblemDescription from './ProblemDescription';
import CodeEditorPanel from './CodeEditorPanel';
import ConsolePanel from './ConsolePanel';
import { useSocket } from '@/providers/socket-provider';

// 1. CHUẨN HÓA TYPE THEO SCHEMA
export type ProblemType = {
  id: string;
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  statementMd: string; // Dùng Markdown thay cho string thường
  timeLimitMs: number;
  memoryLimitMb: number;
  supportedLanguages: string[];
  publicTestCases: {
    id: string;
    input: string;
    expectedOutput: string;
  }[];
};

// 2. TYPE CHO KẾT QUẢ CHẤM ĐIỂM
export type SubmissionResult = {
  status: 'Accepted' | 'Wrong' | 'TimeLimitExceeded' | 'CompilationError' | 'Error';
  testsPassed: number;
  testsTotal: number;
  runtimeMs?: number;
  memoryMb?: number;
  errorMessage?: string;
};

export default function ProblemWorkspace() {
  // MOCK DATA TỪ BACKEND TRẢ VỀ
  const mockProblem: ProblemType = {
    id: 'uuid-1',
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'EASY',
    tags: ['Array', 'Hash Table'],
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    supportedLanguages: ['javascript', 'typescript', 'python', 'cpp'],
    statementMd: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.
You can return the answer in any order.

**Constraints:**
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- Only one valid answer exists.`,
    publicTestCases: [
      { id: 'tc-1', input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]' },
      { id: 'tc-2', input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]' },
    ],
  };

  const [code, setCode] = useState(`function twoSum(nums, target) {\n  \n}`);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      const handleFinished = (data: any) => {
        setIsRunning(false);
        setResult({
          status: data.status,
          testsPassed: data.testsPassed,
          testsTotal: data.testsTotal,
          runtimeMs: data.runtimeMs,
          memoryMb: data.memoryMb,
        });
      };

      const handleFailed = (data: any) => {
        setIsRunning(false);
        setResult({
          status: 'Error',
          testsPassed: 0,
          testsTotal: 0,
          errorMessage: data.error,
        });
      };

      socket.on('submission:finished', handleFinished);
      socket.on('submission:failed', handleFailed);

      return () => {
        socket.off('submission:finished', handleFinished);
        socket.off('submission:failed', handleFailed);
      };
    }
  }, [socket]);

  // Load/Save Code (Giữ nguyên)
  useEffect(() => {
    const saved = localStorage.getItem(`code-${mockProblem.id}`);
    if (saved) setCode(saved);
  }, [mockProblem.id]);

  useEffect(() => {
    localStorage.setItem(`code-${mockProblem.id}`, code);
  }, [code, mockProblem.id]);

  const runCode = async () => {
    setIsRunning(true); setResult(null);
    setTimeout(() => {
      setIsRunning(false);
      setResult({ status: 'Accepted', testsPassed: 2, testsTotal: 2, runtimeMs: 52, memoryMb: 44.2 });
    }, 1500);
  };

  const submitCode = async () => {
    setIsRunning(true); setResult(null);
    
    // Gợi ý: Gọi API POST /submissions kèm body { problemId, code, language, context: 'PRACTICE' }
    
    setTimeout(() => {
      setIsRunning(false);
      const isSuccess = Math.random() > 0.5;
      setResult(isSuccess 
        ? { status: 'Accepted', testsPassed: 15, testsTotal: 15, runtimeMs: 60, memoryMb: 45.1 }
        : { status: 'Wrong', testsPassed: 13, testsTotal: 15, runtimeMs: 58, memoryMb: 45.0 }
      );
    }, 2500);
  };

  return (
    <div className={isDarkMode ? 'dark h-full' : 'h-full'}>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-200">
        <ProblemDescription problem={mockProblem} />
        <div className="flex w-1/2 flex-col">
          <CodeEditorPanel 
            problem={mockProblem} // Truyền problem để lấy supportedLanguages
            code={code} 
            setCode={setCode} 
            isRunning={isRunning} 
            onRun={runCode} 
            onSubmit={submitCode}
            isDarkMode={isDarkMode}
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
          />
          <ConsolePanel isRunning={isRunning} result={result} />
        </div>
      </div>
    </div>
  );
}