'use client';

/**
 * Trang demo: gửi submission qua REST và nhận cập nhật realtime qua Socket.io.
 * UI dùng shadcn/ui (preset base-nova): Card, Button, Input, Label, Select, Textarea, Badge, Table.
 */
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getPublicCoreUrl } from '@/lib/public-config';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Mode = 'ALGO' | 'PROJECT';

type SubmissionProgressPayload = {
  submissionId: string;
  status: string;
  progressPct: number | null;
  logChunk: string | null;
};

type SubmissionFinishedPayload = {
  submissionId: string;
  status: string;
  score: number | null;
  runtimeMs: number | null;
  memoryMb: number | null;
};

type SubmissionFailedPayload = {
  submissionId: string;
  status: string;
  error: string;
};

/** Ánh xạ trạng thái chấm bài → variant Badge (màu / nhấn mạnh). */
function statusToBadgeVariant(
  s: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const u = s.toLowerCase();
  if (u === 'error' || u.includes('fail')) return 'destructive';
  if (u === 'idle') return 'outline';
  if (u === 'pending') return 'secondary';
  if (u === 'running') return 'default';
  if (u === 'accepted') return 'secondary';
  return 'outline';
}

export default function Page() {
  const coreUrl = getPublicCoreUrl();

  const [userId, setUserId] = useState('user1');
  const [problemId, setProblemId] = useState('two-sum');
  const [mode, setMode] = useState<Mode>('ALGO');
  const [sourceCode, setSourceCode] = useState('print("hello")');

  const [status, setStatus] = useState('Idle');
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const submissionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socket: Socket = io(coreUrl, {
      transports: ['websocket'],
      query: { userId },
    });

    socket.on('submission:created', (payload: { submissionId?: string; status?: string }) => {
      if (!payload?.submissionId) return;
      submissionIdRef.current = payload.submissionId;
      setSubmissionId(payload.submissionId);
      setStatus(payload.status ?? 'Pending');
      setProgressPct(0);
      setLogs([]);
    });

    socket.on('submission:progress', (payload: SubmissionProgressPayload) => {
      if (!payload?.submissionId) return;
      if (submissionIdRef.current && submissionIdRef.current !== payload.submissionId) return;

      setStatus(payload.status ?? 'Running');
      setProgressPct(payload.progressPct);
      if (payload.logChunk) {
        setLogs((prev) => [...prev, payload.logChunk as string]);
      }
    });

    socket.on('submission:finished', (payload: SubmissionFinishedPayload) => {
      if (!payload?.submissionId) return;
      if (submissionIdRef.current && submissionIdRef.current !== payload.submissionId) return;

      setStatus(payload.status ?? 'Accepted');
      setProgressPct(100);
      setLogs((prev) => [
        ...prev,
        `Finished: score=${payload.score ?? '-'}, runtimeMs=${payload.runtimeMs ?? '-'}, memoryMb=${
          payload.memoryMb ?? '-'
        }`,
      ]);
    });

    socket.on('submission:failed', (payload: SubmissionFailedPayload) => {
      if (!payload?.submissionId) return;
      if (submissionIdRef.current && submissionIdRef.current !== payload.submissionId) return;

      setStatus(payload.status ?? 'Error');
      setProgressPct(null);
      setLogs((prev) => [...prev, `Failed: ${payload.error}`]);
    });

    return () => {
      socket.disconnect();
    };
  }, [coreUrl, userId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Pending');
    setProgressPct(null);
    setLogs([]);

    const res = await fetch(`${coreUrl}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, problemId, mode, sourceCode }),
    });

    if (!res.ok) {
      const text = await res.text();
      setStatus('Error');
      setLogs([`HTTP ${res.status}: ${text}`]);
      return;
    }

    const data = await res.json();
    if (data?.submissionId) {
      submissionIdRef.current = data.submissionId as string;
      setSubmissionId(data.submissionId as string);
    }
  }

  return (
    <div className={cn('min-h-screen p-6')}>
      <div className={cn('mx-auto max-w-3xl space-y-6')}>
        <div>
          <h1 className={cn('text-2xl font-semibold tracking-tight')}>Code Judge</h1>
          <p className={cn('text-sm text-muted-foreground')}>
            Nộp bài thử nghiệm và theo dõi trạng thái realtime (Socket.io).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tạo submission</CardTitle>
            <CardDescription>
              Điền thông tin và mã nguồn stub. Core API sẽ đưa job vào hàng đợi BullMQ.
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    name="userId"
                    autoComplete="off"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="problemId">Problem ID</Label>
                  <Input
                    id="problemId"
                    name="problemId"
                    autoComplete="off"
                    value={problemId}
                    onChange={(e) => setProblemId(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode">Chế độ</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                  <SelectTrigger id="mode" className="w-full">
                    <SelectValue placeholder="Chọn ALGO hoặc PROJECT" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALGO">ALGO</SelectItem>
                    <SelectItem value="PROJECT">PROJECT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceCode">Mã nguồn (stub)</Label>
                <Textarea
                  id="sourceCode"
                  name="sourceCode"
                  className="min-h-[7rem] font-mono text-sm"
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/30">
              <Button type="submit" className="w-full sm:w-auto">
                Nộp bài
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>Trạng thái</CardTitle>
              <CardDescription>Submission hiện tại và nhật ký chấm (stub).</CardDescription>
            </div>
            <Badge variant={statusToBadgeVariant(status)}>{status}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submission ID</TableHead>
                  <TableHead>Tiến độ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">{submissionId ?? '—'}</TableCell>
                  <TableCell>
                    {progressPct !== null ? `${progressPct}%` : '—'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="space-y-2">
              <Label>Logs</Label>
              <div
                className={cn(
                  'max-h-48 overflow-y-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs',
                )}
              >
                {logs.length === 0 ? (
                  <span className="text-muted-foreground">Chưa có log.</span>
                ) : (
                  logs.map((line, i) => (
                    <div key={i} className="border-b border-border/60 py-0.5 last:border-0">
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
