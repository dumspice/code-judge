'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { Problem } from '@/services/problem.apis';
import { submissionsApi, Submission } from '@/services/submission.apis';
import { storageApi } from '@/services/storage.apis';
import ProblemDescription from './ProblemDescription';
import CodeEditorPanel from './CodeEditorPanel';
import ConsolePanel from './ConsolePanel';
import { useSocket } from '@/providers/socket-provider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  status: string;
  testsPassed: number;
  testsTotal: number;
  runtimeMs?: number;
  memoryMb?: number;
  errorMessage?: string;
};

interface ProblemWorkspaceProps {
  problem: Problem;
}

export default function ProblemWorkspace({ problem }: ProblemWorkspaceProps) {
  const user = useAuthStore((state) => state.user);
  const [code, setCode] = useState('');
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
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Initialize code from localStorage or default
  useEffect(() => {
    const saved = localStorage.getItem(`code-${problem.id}`);
    if (saved) {
      setCode(saved);
    } else {
      const lang = problem.supportedLanguages?.[0]?.toLowerCase();
      if (lang === 'python') setCode('# Write your code here\n');
      else if (lang === 'javascript' || lang === 'typescript') setCode('// Write your code here\n');
      else if (lang === 'cpp') setCode('#include <iostream>\nusing namespace std;\n\nint main() {\n  return 0;\n}\n');
      else setCode('');
    }
  }, [problem.id, problem.supportedLanguages]);

  // Save code to localStorage
  useEffect(() => {
    if (code) {
      localStorage.setItem(`code-${problem.id}`, code);
    }
  }, [code, problem.id]);

  const loadSubmissions = useCallback(async () => {
    if (!user || !problem.id) return;
    try {
      const data = await submissionsApi.findAll({ userId: user.id, problemId: problem.id });
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  }, [user, problem.id]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // WebSocket Setup
  useEffect(() => {
    if (!user) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_CORE_URL || 'http://localhost:3000', {
      query: { userId: user.id },
    });

    socketRef.current = socketInstance;

    socketInstance.on('submission:finished', (data) => {
      // Check if this submission belongs to the current problem
      // Note: Backend should ideally send problemId in the payload
      setIsRunning(false);
      setResult({
        status: data.status,
        testsPassed: data.testsPassed || 0,
        testsTotal: data.testsTotal || 0,
        runtimeMs: data.runtimeMs,
        memoryMb: data.memoryMb,
        errorMessage: data.error,
      });
      loadSubmissions();
      
      if (data.status === 'Accepted') {
        toast.success('Accepted!', { description: `All ${data.testsTotal} test cases passed.` });
      } else {
        toast.error(data.status, { description: data.error || 'Some test cases failed.' });
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user, problem.id, loadSubmissions]);

  const handleSubmit = async (language: string) => {
    if (!user) {
      toast.error('Authentication Required', { description: 'Please log in to submit your code.' });
      return;
    }

    if (!code.trim()) {
      toast.error('Empty Code', { description: 'Please write some code before submitting.' });
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      const submissionId = `sub-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
      const optionLang = language.toUpperCase();
      const ext = optionLang === 'PYTHON' ? 'py' : 
                  optionLang === 'JAVASCRIPT' ? 'js' : 
                  optionLang === 'TYPESCRIPT' ? 'ts' :
                  optionLang === 'JAVA' ? 'java' :
                  optionLang === 'CPP' ? 'cpp' : 'txt';
      
      const presign = await storageApi.presignUpload({
        resourceKind: 'submission-source',
        submissionId,
        fileName: `solution.${ext}`,
      });

      await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: code,
      });

      await submissionsApi.create({
        userId: user.id,
        problemId: problem.id,
        mode: problem.mode,
        language: optionLang,
        sourceCodeObjectKey: presign.objectKey,
      });

      toast.info('Submission Received', { description: 'Your code is being judged...' });
    } catch (error: any) {
      console.error('Submission failed:', error);
      toast.error('Submission Error', { description: error.message || 'Failed to submit code.' });
      setIsRunning(false);
    }
  };

  return (
    <div className={cn('h-screen flex flex-col bg-background text-foreground transition-colors duration-300', isDarkMode && 'dark')}>
      <div className="flex flex-1 overflow-hidden">
        <ProblemDescription 
          problem={problem} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          submissions={submissions}
          isDarkMode={isDarkMode}
        />
        <div className="flex flex-1 flex-col overflow-hidden border-l border-border/50">
          <CodeEditorPanel 
            problem={problem}
            code={code} 
            setCode={setCode} 
            isRunning={isRunning} 
            onSubmit={handleSubmit}
            isDarkMode={isDarkMode}
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
          />
          <ConsolePanel isRunning={isRunning} result={result} />
        </div>
      </div>
    </div>
  );
}