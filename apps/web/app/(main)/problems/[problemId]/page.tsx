'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Cloud, FileInput, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useAuthStore } from '@/store/auth-store';
import { io, Socket } from 'socket.io-client';
import { Problem, problemsApi } from '@/services/problem.apis';
import { Submission, submissionsApi } from '@/services/submission.apis';
import { diagnoseApiError, logApiErrorDiagnostics } from '@/lib/api-error-diagnostics';

const languageOptions = [
  { value: 'PYTHON', label: 'Python', extension: 'py' },
  { value: 'JAVASCRIPT', label: 'JavaScript', extension: 'js' },
  { value: 'JAVA', label: 'Java', extension: 'java' },
  { value: 'CPP', label: 'C++', extension: 'cpp' },
];

export default function ProblemDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawProblemId = params?.problemId;
  const problemId = Array.isArray(rawProblemId) ? rawProblemId[0] : (rawProblemId ?? '');
  const contestId = searchParams.get('contestId');
  const user = useAuthStore((state) => state.user);

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState('PYTHON');
  const [sourceCode, setSourceCode] = useState('');
  const [fileName, setFileName] = useState('main.py');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [submissionInfo, setSubmissionInfo] = useState<Submission | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<Submission[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const loadSubmissionHistory = useCallback(async () => {
    if (!user || !problemId) return;

    setHistoryError(null);
    setHistoryLoading(true);

    try {
      const items = await submissionsApi.findAll({
        userId: user.id,
        problemId,
      });
      setSubmissionHistory(items);
    } catch (error) {
      console.error('Không thể tải lịch sử submission:', error);
      const d = diagnoseApiError(error, { operation: 'loadSubmissionHistory' });
      logApiErrorDiagnostics(d);
      setHistoryError(`${d.title}: ${d.userMessage}`);
    } finally {
      setHistoryLoading(false);
    }
  }, [user, problemId]);

  useEffect(() => {
    if (!user || !problemId) return;
    loadSubmissionHistory();
  }, [user, problemId, loadSubmissionHistory]);

  useEffect(() => {
    if (!user) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_CORE_URL || 'http://localhost:3000', {
      query: { userId: user.id },
    });

    socketRef.current = socketInstance;
    console.log('Connecting to WebSocket with userId:', user.id);

    socketInstance.on('submission:created', (data) => {
      console.log('Submission created:', data);
      loadSubmissionHistory();
    });

    socketInstance.on('submission:finished', (data) => {
      console.log('Submission finished:', data);
      setSubmissionHistory((prev) =>
        prev.map((sub) =>
          sub.id === data.submissionId
            ? {
                ...sub,
                status: data.status,
                score: data.score,
                updatedAt: new Date().toISOString(),
              }
            : sub,
        ),
      );

      setSubmissionInfo((prev) =>
        prev && prev.id === data.submissionId
          ? {
              ...prev,
              status: data.status,
              score: data.score,
              updatedAt: new Date().toISOString(),
            }
          : prev,
      );

      if (data.status === 'Accepted') {
        setFeedback({
          type: 'success',
          message: `Submission thành công! Điểm: ${data.score || 0}`,
        });
      }
    });

    socketInstance.on('submission:failed', (data) => {
      console.log('Submission failed:', data);
      setSubmissionHistory((prev) =>
        prev.map((sub) =>
          sub.id === data.submissionId
            ? {
                ...sub,
                status: data.status,
                error: data.error,
                updatedAt: new Date().toISOString(),
              }
            : sub,
        ),
      );

      setSubmissionInfo((prev) =>
        prev && prev.id === data.submissionId
          ? {
              ...prev,
              status: data.status,
              error: data.error,
              updatedAt: new Date().toISOString(),
            }
          : prev,
      );

      setFeedback({
        type: 'error',
        message: `Submission thất bại: ${data.error}`,
      });
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user, loadSubmissionHistory]);

  useEffect(() => {
    const loadProblem = async () => {
      if (!problemId) return;
      setLoading(true);
      try {
        const data = await problemsApi.findById(problemId);
        setProblem(data);
        setLanguage(data.supportedLanguages?.[0] ?? 'PYTHON');
      } catch (error) {
        console.error('Failed to load problem:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProblem();
  }, [problemId]);

  useEffect(() => {
    const option = languageOptions.find((item) => item.value === language);
    if (option) {
      setFileName((current) => {
        const currentExtension = current.split('.').pop();
        return currentExtension
          ? current.replace(/\.[^.]+$/, `.${option.extension}`)
          : `main.${option.extension}`;
      });
    }
  }, [language]);

  const supportedLanguages =
    problem?.supportedLanguages ?? languageOptions.map((item) => item.value);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (!file) {
      return;
    }

    setFileName(file.name);
    const text = await file.text();
    setSourceCode(text);
  };

  const handleSubmit = async () => {
    setFeedback(null);

    if (!user) {
      setFeedback({ type: 'error', message: 'Vui lòng đăng nhập để nộp bài.' });
      return;
    }

    if (!sourceCode.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng cung cấp mã nguồn hoặc tải lên file.' });
      return;
    }

    setSubmitting(true);

    try {
      /** Core API tự upload MinIO khi mã > 8192 ký tự — không cần presign + UUID client. */
      const created = await submissionsApi.create({
        userId: user.id,
        problemId,
        contestId: contestId ?? undefined,
        mode: problem?.mode ?? 'ALGO',
        language,
        sourceCode,
      });

      setSubmissionInfo({
        id: created.submissionId,
        status: created.status,
        score: null,
        error: null,
        logs: null,
        caseResults: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await loadSubmissionHistory();

      setFeedback({
        type: 'success',
        message: 'Nộp bài thành công! Hệ thống đang chấm. Vui lòng kiểm tra trạng thái sau.',
      });
      setSourceCode('');
      setSelectedFile(null);
    } catch (error) {
      const d = diagnoseApiError(error, { operation: 'submitProblem' });
      logApiErrorDiagnostics(d, { problemId });
      console.error(error);
      setFeedback({
        type: 'error',
        message: `${d.title}: ${d.userMessage}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-background/80 p-10 text-center text-lg text-muted-foreground">
          Đang tải thông tin bài toán...
        </div>
      </main>
    );
  }

  if (!problem) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-background/80 p-10 text-center text-lg text-destructive">
          Không tìm thấy bài toán. Vui lòng kiểm tra lại đường dẫn.
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-10">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
            Problem Detail
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{problem.title}</h1>
          <p className="max-w-2xl text-muted-foreground">
            {problem.description ?? 'Đây là bài toán hiện có thể nộp code trực tiếp.'}
          </p>
        </div>
        <Button variant="secondary" size="lg" asChild>
          <Link href="/">Trở về trang chủ</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-6 rounded-3xl border border-border bg-card p-7 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Difficulty</p>
              <p className="text-base font-semibold">{problem.difficulty}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mode</p>
              <p className="text-base font-semibold">{problem.mode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time Limit</p>
              <p className="text-base font-semibold">{problem.timeLimitMs} ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Memory Limit</p>
              <p className="text-base font-semibold">{problem.memoryLimitMb} MB</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Statement</h2>
            <div className="rounded-2xl border border-border bg-background p-5 whitespace-pre-wrap text-sm leading-7">
              {problem.statementMd ||
                problem.description ||
                'Không có nội dung chi tiết cho bài toán này.'}
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileInput className="w-5 h-5" /> Lịch sử submission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user ? (
                <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive-900">
                  Đăng nhập để xem lịch sử nộp bài cho bài toán này.
                </div>
              ) : historyLoading ? (
                <div className="rounded-xl border border-border bg-background/80 p-4 text-sm text-muted-foreground">
                  Đang tải lịch sử nộp bài...
                </div>
              ) : historyError ? (
                <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive-900">
                  {historyError}
                </div>
              ) : submissionHistory.length === 0 ? (
                <div className="rounded-xl border border-border bg-background/80 p-4 text-sm text-muted-foreground">
                  Chưa có submission nào cho bài toán này.
                </div>
              ) : (
                <div className="space-y-4">
                  {submissionHistory.map((submission) => (
                    <div
                      key={submission.id}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Submission ID</p>
                          <p className="font-mono text-sm">{submission.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {new Date(submission.createdAt).toLocaleString()}
                          </p>
                          <p className="font-semibold">{submission.status}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Điểm</p>
                          <p className="font-semibold">{submission.score ?? '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Cập nhật</p>
                          <p>{new Date(submission.updatedAt).toLocaleString()}</p>
                        </div>
                        {submission.error ? (
                          <div>
                            <p className="text-sm text-muted-foreground">Lỗi</p>
                            <p className="text-destructive text-sm">{submission.error}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Cloud className="w-5 h-5" /> Nộp code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {!user ? (
                <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive-900">
                  Vui lòng đăng nhập để nộp bài.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fileUpload">Upload file code</Label>
                    <Input
                      id="fileUpload"
                      type="file"
                      accept=".py,.js,.ts,.java,.cpp,.c"
                      onChange={handleFileChange}
                    />
                    {selectedFile ? (
                      <p className="text-sm text-muted-foreground">Đã chọn: {selectedFile.name}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={language}
                      onValueChange={(value) => setLanguage(value ?? 'PYTHON')}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sourceCode">Source Code</Label>
                    <Textarea
                      id="sourceCode"
                      value={sourceCode}
                      onChange={(event) => setSourceCode(event.target.value)}
                      rows={12}
                      placeholder="Dán mã nguồn hoặc chọn file để tải lên..."
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                    <p>Source code được tải lên MinIO và Lambda sẽ xử lý chấm bài.</p>
                    <p>
                      File sẽ được lưu trữ dưới tên: <strong>{fileName}</strong>
                    </p>
                  </div>

                  {feedback ? (
                    <div
                      className={`rounded-xl border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900' : 'border-destructive bg-destructive/10 text-destructive-900'}`}
                    >
                      {feedback.message}
                    </div>
                  ) : null}

                  {submissionInfo ? (
                    <div className="rounded-2xl border border-border bg-background p-4 text-sm space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Submission ID:{' '}
                        <span className="font-mono text-sm text-foreground">
                          {submissionInfo.id}
                        </span>
                      </p>
                      <p>
                        Trạng thái: <span className="font-semibold">{submissionInfo.status}</span>
                      </p>
                      {submissionInfo.score !== null ? (
                        <p>
                          Điểm: <span className="font-semibold">{submissionInfo.score}</span>
                        </p>
                      ) : null}
                      {submissionInfo.error ? (
                        <p className="text-destructive">Lỗi: {submissionInfo.error}</p>
                      ) : null}
                      <p className="text-muted-foreground">
                        {['Accepted', 'Wrong', 'Error'].includes(submissionInfo.status)
                          ? 'Kết quả đã cập nhật.'
                          : 'Đang chờ kết quả chấm.'}
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p>Source code sẽ được lưu vào MinIO storage.</p>
                      <p>Hệ thống sử dụng AWS Lambda để chấm bài với khả năng xử lý tải cao.</p>
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="inline-flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {submitting ? 'Đang nộp...' : 'Nộp bài'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
