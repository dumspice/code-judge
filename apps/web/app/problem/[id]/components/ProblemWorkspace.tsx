'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Problem, problemsApi } from '@/services/problem.apis';
import { submissionsApi, Submission } from '@/services/submission.apis';
import { storageApi } from '@/services/storage.apis';
import { aiHintApi, type RequestHintResult } from '@/services/ai-hint.apis';
import ProblemDescription from './ProblemDescription';
import CodeEditorPanel from './CodeEditorPanel';
import ConsolePanel from './ConsolePanel';
import AiHintDrawer, { type HintUiState } from './AiHintDrawer';
import AiHintFab from './AiHintFab';
import { useSocket } from '@/providers/socket-provider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { contestsApi, Contest } from '@/services/contest.apis';
import { getClassroomDetail } from '@/services/classroom.apis';

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
export type TestCaseResult = {
  testCaseId: string;
  status: string;
  runtimeMs?: number;
  memoryMb?: number;
  output?: string | null;
  error?: string | null;
  passed: boolean;
  isHidden: boolean;
};

export type SubmissionResult = {
  status: string;
  testsPassed: number;
  testsTotal: number;
  runtimeMs?: number;
  memoryMb?: number;
  errorMessage?: string;
  language?: string | null;
  caseResults?: {
    testCases: TestCaseResult[];
  };
};

interface ProblemWorkspaceProps {
  initialProblemId: string;
  contestId?: string;
}

export default function ProblemWorkspace({ initialProblemId, contestId }: ProblemWorkspaceProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [activeProblemId, setActiveProblemId] = useState(initialProblemId);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<string>('PYTHON');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  const lastSubmissionIdRef = useRef<string | null>(null);
  const [hintState, setHintState] = useState<HintUiState>('idle');
  const [hintData, setHintData] = useState<RequestHintResult | null>(null);
  const [hintError, setHintError] = useState<string | null>(null);
  const [hintDrawerOpen, setHintDrawerOpen] = useState(false);
  const [hintPulse, setHintPulse] = useState(false);
  const latestHintRequestRef = useRef<string | null>(null);
  const hintCachedSubmissionRef = useRef<string | null>(null);
  const processedSubmissionsRef = useRef<Set<string>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { socket } = useSocket();

  const [contest, setContest] = useState<Contest | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Restore sidebar state from localStorage safely on mount
  useEffect(() => {
    const saved = localStorage.getItem('contest-sidebar-open');
    if (saved !== null) {
      setIsSidebarOpen(saved === 'true');
    }
  }, []);

  // Save to localStorage when it changes
  const handleToggleSidebar = (open: boolean) => {
    setIsSidebarOpen(open);
    localStorage.setItem('contest-sidebar-open', String(open));
  };

  // Sync state when URL dynamic parameters change (e.g. forward/back browser navigation)
  useEffect(() => {
    setActiveProblemId(initialProblemId);
  }, [initialProblemId]);

  // Intercept list item clicks to update internally without unmounting
  const handleProblemSwitch = (newProblemId: string) => {
    if (newProblemId === activeProblemId) return;

    // Update address bar without Next.js unmount/remount
    const newUrl = `/problem/${newProblemId}?contestId=${contestId}`;
    window.history.pushState(null, '', newUrl);

    // Trigger localized component-level state fetch
    setActiveProblemId(newProblemId);
  };

  useEffect(() => {
    if (!activeProblemId) return;

    const fetchProblem = async () => {
      try {
        setLoadingProblem(true);
        const data = await problemsApi.findById(activeProblemId);

        // Validate classroom enrollment if this problem is assigned to a class
        if (data.assignments && data.assignments.length > 0 && user?.role !== 'ADMIN') {
          let hasAccess = false;
          for (const assignment of data.assignments) {
            try {
              await getClassroomDetail(assignment.classRoomId);
              hasAccess = true;
              break;
            } catch (err) {
              // Not enrolled in this classroom
            }
          }

          if (!hasAccess) {
            toast.error('Unauthorized', {
              description: 'This problem belongs to a class you are not enrolled in.',
            });
            router.push('/dashboard');
            return;
          }
        }

        setProblem(data);
        setCode('');
        setResult(null);
      } catch (err: any) {
        console.error('Failed to fetch problem:', err);
        toast.error('Error loading problem', {
          description: err.message || 'Failed to load problem.',
        });
      } finally {
        setLoadingProblem(false);
      }
    };

    fetchProblem();
  }, [activeProblemId, user, router]);

  useEffect(() => {
    if (!contestId) {
      setContest(null);
      return;
    }

    const fetchContest = async () => {
      try {
        const data = await contestsApi.findById(contestId);

        // Validate classroom enrollment if this contest is assigned to a class
        const classRoomId = (data as any).assignments?.[0]?.classRoomId;
        if (classRoomId) {
          try {
            await getClassroomDetail(classRoomId);
          } catch (classroomErr) {
            toast.error('Unauthorized', {
              description: 'You are not enrolled in the class hosting this contest.',
            });
            router.push('/dashboard');
            return;
          }
        }

        setContest(data);

        // Validate contest accessibility
        const now = new Date();
        const startAt = new Date(data.startAt);
        const endAt = new Date(data.endAt);

        if (now < startAt) {
          // Contest hasn't started
          toast.error('Contest Not Started', {
            description: `This contest will start on ${startAt.toLocaleString()}. You cannot access problems yet.`,
            duration: 4000,
          });

          const classRoomId = (data as any).assignments?.[0]?.classRoomId || '';
          setTimeout(() => {
            if (classRoomId) {
              router.push(`/dashboard/${classRoomId}/contests/${contestId}`);
            } else {
              router.push(`/dashboard/contests/${contestId}`);
            }
          }, 2000);
          return;
        }

        if (now > endAt) {
          // Contest has ended
          toast.warning('Contest Ended', {
            description: `This contest ended on ${endAt.toLocaleString()}. You cannot submit solutions anymore.`,
            duration: 4000,
          });

          const classRoomId = (data as any).assignments?.[0]?.classRoomId || '';
          setTimeout(() => {
            if (classRoomId) {
              router.push(`/dashboard/${classRoomId}/contests/${contestId}`);
            } else {
              router.push(`/dashboard/contests/${contestId}`);
            }
          }, 2000);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch contest details for sidebar:', error);
      }
    };

    fetchContest();
  }, [contestId, router]);

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!contest?.endAt) return;

    const updateTimer = () => {
      const end = new Date(contest.endAt).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Contest Ended');
        setIsUrgent(true);

        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;

          const classRoomId = (contest as any).assignments?.[0]?.classRoomId || '';
          const targetContestId = contest.id || '7b75bdf7-b067-4908-b768-6add8012d4cc';

          toast.warning('Contest Ended!', {
            description: 'The contest has ended. Redirecting you to the contest overview page...',
            duration: 3000,
          });

          setTimeout(() => {
            if (classRoomId) {
              router.push(`/dashboard/${classRoomId}/contests/${targetContestId}`);
            } else {
              router.push(`/dashboard/contests/${targetContestId}`);
            }
          }, 2000);
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = seconds.toString().padStart(2, '0');

      setTimeLeft(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
      setIsUrgent(diff < 10 * 60 * 1000);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [contest?.endAt, contest, router]);

  const loadSubmissions = useCallback(async () => {
    if (!user || !problem?.id) return;
    try {
      const data = await submissionsApi.findAll({ userId: user.id, problemId: problem.id });
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  }, [user, problem?.id]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    if (socket) {
      const handleFinished = (data: any) => {
        if (data.submissionId && data.submissionId !== lastSubmissionIdRef.current) {
          return;
        }
        if (data.submissionId) {
          if (processedSubmissionsRef.current.has(data.submissionId)) {
            return;
          }
          processedSubmissionsRef.current.add(data.submissionId);
        }
        setIsRunning(false);
        setIsSubmitting(false);
        if (data.submissionId) {
          setLastSubmissionId(data.submissionId);
        }
        setResult({
          status: data.status,
          testsPassed: data.testsPassed ?? 0,
          testsTotal: data.testsTotal ?? 0,
          runtimeMs: data.runtimeMs,
          memoryMb: data.memoryMb,
          errorMessage: data.error,
          language: data.language,
          caseResults: data.caseResults,
        });

        if (!data.isDryRun) {
          loadSubmissions();
        }

        if (data.status === 'Accepted') {
          setHintDrawerOpen(false);
          setHintPulse(false);
          setHintState('idle');
          setHintData(null);
        } else {
          setHintPulse(true);
        }
      };

      const handleFailed = (data: any) => {
        if (data.submissionId && data.submissionId !== lastSubmissionIdRef.current) {
          return;
        }
        if (data.submissionId) {
          if (processedSubmissionsRef.current.has(data.submissionId)) {
            return;
          }
          processedSubmissionsRef.current.add(data.submissionId);
        }
        setIsRunning(false);
        setIsSubmitting(false);
        if (data.submissionId) {
          setLastSubmissionId(data.submissionId);
        }
        setResult({
          status: 'Error',
          testsPassed: data.testsPassed ?? 0,
          testsTotal: data.testsTotal ?? 0,
          errorMessage: data.error || 'Judging failed',
          language: data.language,
          caseResults: data.caseResults,
        });
        if (!data.isDryRun) {
          loadSubmissions();
        }
        setHintPulse(true);
      };

      socket.on('submission:finished', handleFinished);
      socket.on('submission:failed', handleFailed);

      return () => {
        socket.off('submission:finished', handleFinished);
        socket.off('submission:failed', handleFailed);
      };
    }
  }, [socket, loadSubmissions]);

  const fetchHint = useCallback(
    async (problemId: string, submissionId: string, options?: { force?: boolean }) => {
      if (!user) return;
      if (
        !options?.force &&
        hintCachedSubmissionRef.current === submissionId &&
        hintData?.submissionId === submissionId &&
        hintState === 'ready'
      ) {
        return;
      }

      latestHintRequestRef.current = submissionId;
      setHintState('loading');
      setHintError(null);
      if (hintData?.submissionId !== submissionId) {
        setHintData(null);
      }

      try {
        const response = await aiHintApi.requestHint(problemId, submissionId);
        if (latestHintRequestRef.current !== submissionId) return;
        setHintData(response);
        setHintState('ready');
        hintCachedSubmissionRef.current = submissionId;
      } catch (err: unknown) {
        if (latestHintRequestRef.current !== submissionId) return;
        const message = err instanceof Error ? err.message : 'Không thể tải gợi ý AI';
        setHintError(message);
        setHintState('error');
      }
    },
    [user, hintData, hintState],
  );

  const hintAvailable = Boolean(
    user && !contestId && result && result.status !== 'Accepted' && lastSubmissionId,
  );

  useEffect(() => {
    if (!contestId) return;
    setHintDrawerOpen(false);
    setHintPulse(false);
  }, [contestId]);

  useEffect(() => {
    if (!hintPulse) return;
    const timer = setTimeout(() => setHintPulse(false), 2500);
    return () => clearTimeout(timer);
  }, [hintPulse, lastSubmissionId]);

  const handleRequestHint = useCallback(async () => {
    if (contestId) {
      toast.info('Gợi ý AI tắt trong contest', {
        description: 'Khi thi contest bạn cần tự giải bài, không dùng gợi ý AI.',
      });
      return;
    }
    if (!problem?.id || !lastSubmissionId) return;
    setHintDrawerOpen(true);
    setHintPulse(false);
    await fetchHint(problem.id, lastSubmissionId, {
      force: hintState === 'error',
    });
  }, [contestId, problem?.id, lastSubmissionId, fetchHint, hintState]);

  // Synchronize language dropdown with problem default language when switching problems
  useEffect(() => {
    if (!problem) return;
    const supported = problem.supportedLanguages || [];
    if (supported.length > 0) {
      setLanguage(supported[0].toUpperCase());
    } else {
      setLanguage('PYTHON');
    }
  }, [problem?.id, problem?.supportedLanguages]);

  // Load code from localStorage or default template when problem or language changes
  useEffect(() => {
    if (!problem) return;
    const saved = localStorage.getItem(`code-${problem.id}-${language.toUpperCase()}`);
    if (saved) {
      setCode(saved);
    } else {
      setCode(getTemplateForLanguage(problem, language));
    }
  }, [problem?.id, language]);

  // Save code to localStorage specific to problem and language
  useEffect(() => {
    if (!problem || !code) return;
    localStorage.setItem(`code-${problem.id}-${language.toUpperCase()}`, code);
  }, [code, problem?.id, language]);

  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const handleSubmit = async (language: string, isDryRun: boolean = false) => {
    if (!problem) {
      toast.error('Problem Not Loaded', {
        description: 'Please wait until the problem details are fully loaded.',
      });
      return;
    }

    if (!user) {
      toast.error('Authentication Required', { description: 'Please log in to submit your code.' });
      return;
    }

    if (!code.trim()) {
      toast.error('Empty Code', { description: 'Please write some code before submitting.' });
      return;
    }

    if (isDryRun) {
      setIsRunning(true);
    } else {
      setIsSubmitting(true);
    }
    setResult(null);
    setLastSubmissionId(null);
    lastSubmissionIdRef.current = null;
    setHintState('idle');
    setHintData(null);
    setHintError(null);
    setHintDrawerOpen(false);
    setHintPulse(false);
    latestHintRequestRef.current = null;
    hintCachedSubmissionRef.current = null;

    try {
      const submissionId = `sub-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
      const optionLang = language.toUpperCase();
      const ext =
        optionLang === 'PYTHON'
          ? 'py'
          : optionLang === 'JAVASCRIPT'
            ? 'js'
            : optionLang === 'TYPESCRIPT'
              ? 'ts'
              : optionLang === 'JAVA'
                ? 'java'
                : optionLang === 'GO'
                  ? 'go'
                  : optionLang === 'RUST'
                    ? 'rs'
                    : optionLang === 'CPP'
                      ? 'cpp'
                      : 'txt';

      const presign = await storageApi.presignUpload({
        resourceKind: 'submission-source',
        submissionId,
        fileName: `solution.${ext}`,
      });

      const wrappedCode = appendDriverCode(code, problem, optionLang);

      await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: wrappedCode,
      });

      const created = await submissionsApi.create({
        userId: user.id,
        problemId: problem.id,
        contestId: (contestId || null) as string | undefined,
        mode: problem.mode,
        language: optionLang,
        sourceCodeObjectKey: presign.objectKey,
        isDryRun,
      });
      setLastSubmissionId(created.submissionId);
      lastSubmissionIdRef.current = created.submissionId;

    } catch (error: any) {
      console.warn('Submission failed:', error.message || error);
      toast.error('Submission Error', { description: error.message || 'Failed to submit code.' });
      setIsRunning(false);
      setIsSubmitting(false);
    }
  };

  const contestSubmissionsCount = submissions.filter(
    (sub) => sub.contestId === contestId && !sub.isDryRun,
  ).length;

  const hasReachedSubmissionLimit =
    contest !== null &&
    contest.maxSubmissionsPerProblem !== null &&
    contest.maxSubmissionsPerProblem > 0 &&
    contestSubmissionsCount >= contest.maxSubmissionsPerProblem;

  const submissionLimitText =
    contest && contest.maxSubmissionsPerProblem
      ? `Limit Reached (${contestSubmissionsCount}/${contest.maxSubmissionsPerProblem})`
      : undefined;

  return (
    <div
      className={cn(
        'h-screen flex flex-col bg-background text-foreground transition-colors duration-300',
        isDarkMode && 'dark',
      )}
    >
      <div className="flex flex-1 overflow-hidden relative">
        {/* Contest Sidebar */}
        {contest && (
          <div
            className={cn(
              'flex flex-col border-r border-border/50 transition-all duration-300 relative z-20 shrink-0',
              isDarkMode
                ? 'bg-[#0c0c0e]/95 backdrop-blur-md text-foreground'
                : 'bg-[#f8fafc]/95 backdrop-blur-md text-foreground',
              isSidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden border-r-0',
            )}
          >
            {/* Sidebar Header */}
            <div
              className={cn(
                'flex flex-col border-b border-border/50 px-5 py-4 shrink-0 gap-2.5',
                isDarkMode ? 'bg-muted/10' : 'bg-muted/30',
              )}
            >
              <div className="flex items-center justify-between overflow-hidden w-full">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] shrink-0">
                    <Trophy size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                      Contest
                    </p>
                    <h3
                      className="truncate text-xs font-bold text-foreground"
                      title={contest.title}
                    >
                      {contest.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleSidebar(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              {/* Real-time Countdown Timer */}
              {timeLeft && (
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-bold border transition-all duration-300 w-full shadow-sm',
                    isUrgent
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse'
                      : isDarkMode
                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                        : 'bg-amber-500/10 border-amber-500/25 text-amber-600',
                  )}
                >
                  <div
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      isUrgent ? 'bg-rose-500 animate-ping' : 'bg-amber-500 animate-pulse',
                    )}
                  />
                  <span className="font-mono text-xs">{timeLeft}</span>
                  <span className="text-[9px] font-medium opacity-80 text-muted-foreground">
                    {timeLeft === 'Contest Ended' ? '' : 'remaining'}
                  </span>
                </div>
              )}
            </div>

            {/* Problems List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {contest.problems?.map((cp, idx) => {
                const isCurrent = cp.problem.id === problem?.id;
                const difficultyColor =
                  cp.problem.difficulty === 'EASY'
                    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                    : cp.problem.difficulty === 'MEDIUM'
                      ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                      : 'text-rose-500 bg-rose-500/10 border-rose-500/20';

                return (
                  <a
                    key={cp.problem.id}
                    href={`/problem/${cp.problem.id}?contestId=${contestId}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleProblemSwitch(cp.problem.id);
                    }}
                    className={cn(
                      'flex items-start gap-3 rounded-xl p-3 text-left border transition-all duration-200 cursor-pointer active:scale-98 leading-relaxed',
                      isCurrent
                        ? isDarkMode
                          ? 'bg-blue-600/15 border-blue-500/40 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.08)]'
                          : 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                        : isDarkMode
                          ? 'bg-background border-border/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                          : 'bg-card border-border/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground shadow-sm',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border',
                        isCurrent
                          ? isDarkMode
                            ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                            : 'bg-blue-100 border-blue-300 text-blue-600'
                          : 'bg-muted/40 border-border text-muted-foreground',
                      )}
                    >
                      {idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'truncate text-xs font-semibold leading-none mb-1',
                          isCurrent
                            ? isDarkMode
                              ? 'text-blue-400 font-bold'
                              : 'text-blue-600 font-bold'
                            : 'text-foreground/90',
                        )}
                      >
                        {cp.problem.title}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.2 text-[8px] font-bold border uppercase tracking-wider scale-90 origin-left',
                            difficultyColor,
                          )}
                        >
                          {cp.problem.difficulty}
                        </span>

                        <span className="text-[10px] text-muted-foreground/60 font-medium">
                          {cp.points} pts
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Sidebar Toggle Trigger (integrated right on the edge) */}
        {contest && (
          <button
            onClick={() => handleToggleSidebar(!isSidebarOpen)}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-20 w-4 border border-l-0 border-border/50 rounded-r-lg flex items-center justify-center transition-all duration-300 cursor-pointer z-30 active:scale-95 group shadow-lg',
              isDarkMode
                ? 'bg-[#0a0a0c] text-muted-foreground hover:text-foreground shadow-black/30'
                : 'bg-white text-muted-foreground hover:text-foreground shadow-slate-200/50',
              isSidebarOpen ? 'left-[280px]' : 'left-0',
            )}
            title={isSidebarOpen ? 'Collapse Contest Sidebar' : 'Expand Contest Sidebar'}
          >
            {isSidebarOpen ? (
              <ChevronLeft
                size={12}
                className="transition-transform group-hover:-translate-x-0.5"
              />
            ) : (
              <ChevronRight
                size={12}
                className="transition-transform group-hover:translate-x-0.5"
              />
            )}
          </button>
        )}

        {loadingProblem || !problem ? (
          <div
            className={cn(
              'flex-1 flex flex-col items-center justify-center transition-colors duration-300',
              isDarkMode ? 'bg-[#0a0a0c]' : 'bg-slate-50',
            )}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                Loading workspace...
              </p>
            </div>
          </div>
        ) : (
          <>
            <ProblemDescription
              problem={problem}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              submissions={submissions}
              isDarkMode={isDarkMode}
              contestId={contestId}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={handleToggleSidebar}
            />
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden border-l border-border/50">
              <CodeEditorPanel
                problem={problem}
                code={code}
                setCode={setCode}
                language={language}
                setLanguage={setLanguage}
                isRunning={isRunning || isSubmitting}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                isDarkMode={isDarkMode}
                toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                hasReachedSubmissionLimit={hasReachedSubmissionLimit}
                submissionLimitText={submissionLimitText}
              />
              <ConsolePanel
                isRunning={isRunning || isSubmitting}
                result={result}
                problem={problem}
              />
            </div>
          </>
        )}
      </div>
      {problem && (
        <>
          <AiHintFab
            visible={hintAvailable && !hintDrawerOpen}
            loading={hintState === 'loading'}
            ready={hintState === 'ready'}
            pulse={hintPulse}
            onClick={handleRequestHint}
          />
          <AiHintDrawer
            open={hintDrawerOpen}
            onClose={() => setHintDrawerOpen(false)}
            state={hintState}
            data={hintData}
            errorMessage={hintError}
          />
        </>
      )}
    </div>
  );
}

function getInputsCount(problem: any): number {
  if (!problem || !problem.testCases || problem.testCases.length === 0) {
    return 1;
  }
  const firstInput = problem.testCases[0].input || '';
  const tokens = firstInput.trim().split(/\s+/).filter(Boolean);
  return tokens.length;
}

function getParamNamesForProblem(problem: any): string[] {
  if (!problem) return ['n'];
  
  const slug = (problem.slug || '').toLowerCase();
  const title = (problem.title || '').toLowerCase();
  
  // 1. Array-based problems
  if (slug.includes('array') || slug.includes('sum-array') || title.includes('dãy số') || title.includes('mảng')) {
    return ['arr'];
  }
  
  // 2. String-based problems
  if (slug.includes('string') || slug.includes('palindrome') || title.includes('chuỗi') || title.includes('xâu')) {
    return ['s'];
  }
  
  // 3. Perfect square / single number checking
  if (slug.includes('perfect-square') || title.includes('chính phương') || title.includes('nguyên dương')) {
    return ['n'];
  }
  
  // 4. Two numbers max / sum
  if (slug.includes('two-numbers') || slug.includes('two') || slug.includes('double') || title.includes('hai số') || title.includes('2 số')) {
    return ['a', 'b'];
  }

  // Fallback to inputs count
  const inputsCount = getInputsCount(problem);
  if (inputsCount === 1) {
    return ['n'];
  } else if (inputsCount === 2) {
    return ['a', 'b'];
  } else if (inputsCount === 3) {
    return ['a', 'b', 'c'];
  } else {
    const args = [];
    for (let i = 1; i <= inputsCount; i++) {
      args.push(`arg${i}`);
    }
    return args;
  }
}

function appendDriverCode(userCode: string, problem: any, language: string): string {
  const lang = language.toUpperCase();
  const params = getParamNamesForProblem(problem);
  const inputsCount = params.length;

  // If the user already wrote standard I/O code, do not append anything!
  const codeLower = userCode.toLowerCase();
  if (
    codeLower.includes('int main') ||
    codeLower.includes('input()') ||
    codeLower.includes('sys.stdin') ||
    codeLower.includes('fs.readfilesync') ||
    codeLower.includes('bufferedreader') ||
    codeLower.includes('fmt.scan')
  ) {
    return userCode;
  }

  if (lang === 'PYTHON') {
    if (inputsCount === 1) {
      return `${userCode}\n\nimport sys\nif __name__ == '__main__':\n    inputs = sys.stdin.read().split()\n    if inputs:\n        val = inputs[0]\n        try:\n            val = int(val)\n        except ValueError:\n            try:\n                val = float(val)\n            except ValueError:\n                pass\n        res = solve(val)\n        if res is not None:\n            print(res)\n`;
    } else if (inputsCount === 2) {
      return `${userCode}\n\nimport sys\nif __name__ == '__main__':\n    inputs = sys.stdin.read().split()\n    if len(inputs) >= 2:\n        args = []\n        for val in inputs[:2]:\n            try:\n                args.append(int(val))\n            except ValueError:\n                try:\n                    args.append(float(val))\n                except ValueError:\n                    args.append(val)\n        res = solve(*args)\n        if res is not None:\n            print(res)\n`;
    } else {
      return `${userCode}\n\nimport sys\nimport inspect\nif __name__ == '__main__':\n    inputs = sys.stdin.read().split()\n    if 'solve' in globals():\n        func = globals()['solve']\n        sig = inspect.signature(func)\n        num_args = len(sig.parameters)\n        args = []\n        for i in range(min(num_args, len(inputs))):\n            val = inputs[i]\n            try:\n                args.append(int(val))\n            except ValueError:\n                try:\n                    args.append(float(val))\n                except ValueError:\n                    args.append(val)\n        while len(args) < num_args:\n            args.append(None)\n        res = func(*args)\n        if res is not None:\n            print(res)\n`;
    }
  }

  if (lang === 'CPP') {
    if (inputsCount === 1) {
      return `${userCode}\n\nint main() {\n    std::ios_base::sync_with_stdio(false);\n    std::cin.tie(NULL);\n    int n;\n    if (std::cin >> n) {\n        std::cout << solve(n) << "\\n";\n    }\n    return 0;\n}\n`;
    } else if (inputsCount === 2) {
      return `${userCode}\n\nint main() {\n    std::ios_base::sync_with_stdio(false);\n    std::cin.tie(NULL);\n    int a, b;\n    if (std::cin >> a >> b) {\n        std::cout << solve(a, b) << "\\n";\n    }\n    return 0;\n}\n`;
    }
  }

  if (lang === 'JAVASCRIPT') {
    if (inputsCount === 1) {
      return `${userCode}\n\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).filter(Boolean);\nif (input.length >= 1) {\n    const n = parseInt(input[0]);\n    const res = solve(n);\n    if (res !== undefined) {\n        console.log(res);\n    }\n}\n`;
    } else if (inputsCount === 2) {
      return `${userCode}\n\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).filter(Boolean);\nif (input.length >= 2) {\n    const a = parseInt(input[0]);\n    const b = parseInt(input[1]);\n    const res = solve(a, b);\n    if (res !== undefined) {\n        console.log(res);\n    }\n}\n`;
    }
  }

  return userCode;
}

function getTemplateForLanguage(problem: any, language: string): string {
  const lang = language.toUpperCase();

  // 1. Prioritize templateCode from database
  if (problem.templateCode && typeof problem.templateCode === 'object') {
    const dbTemplate = (problem.templateCode as Record<string, string>)[lang];
    if (dbTemplate) {
      return dbTemplate;
    }
  }

  const params = getParamNamesForProblem(problem);
  const inputsCount = params.length;

  if (lang === 'PYTHON') {
    const paramsStr = params.map(p => `${p}: int`).join(', ');
    const typedParams = params.map(p => `# Tham số ${p} là giá trị đầu vào tự động`).join('\n');
    return `# Viết logic giải thuật của bạn trong hàm solve\n${typedParams}\n\ndef solve(${paramsStr}) -> any:\n    # Viết code ở đây\n    pass\n`;
  }

  if (lang === 'CPP') {
    const paramsStr = params.map(p => `int ${p}`).join(', ');
    const returnType = 'int'; 
    return `// Viết logic giải thuật của bạn trong hàm solve\n#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\n${returnType} solve(${paramsStr}) {\n    // Viết code ở đây\n    \n}\n`;
  }

  if (lang === 'JAVASCRIPT') {
    const paramsStr = params.join(', ');
    const jsdocs = params.map(p => ` * @param {number} ${p}`).join('\n');
    return `/**\n${jsdocs}\n * @return {any}\n */\nfunction solve(${paramsStr}) {\n    // Viết code ở đây\n    \n}\n`;
  }

  // Fallbacks for other languages
  if (lang === 'TYPESCRIPT') {
    return `// Viết code của bạn ở đây\nimport * as fs from 'fs';\n\nfunction main() {\n    const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\n    if (!input || input.length === 0 || input[0] === '') return;\n    \n    // Logic của bạn\n}\n\nmain();\n`;
  }
  if (lang === 'JAVA') {
    return `// Viết code của bạn ở đây\nimport java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // String line = br.readLine();\n        \n        // Logic của bạn\n    }\n}\n`;
  }
  if (lang === 'GO') {
    return `// Viết code của bạn ở đây\npackage main\n\nimport (\n\t"fmt"\n)\n\nfunc main() {\n\t// var n int\n\t// fmt.Scan(&n)\n}\n`;
  }
  if (lang === 'RUST') {
    return `// Viết code của bạn ở đây\nuse std::io::{self, BufRead};\n\nfn main() {\n    let stdin = io::stdin();\n    for line in stdin.lock().lines() {\n        let line = line.unwrap();\n        // Logic của bạn\n    }\n}\n`;
  }

  return `// Write your code here\n`;
}
