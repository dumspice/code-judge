'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, List, Calendar, Trophy, Shield, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { contestsApi, type Contest } from '@/services/auth.apis';

export default function ContestDetailPage() {
  const params = useParams();
  const rawContestId = params?.contestId;
  const contestId = Array.isArray(rawContestId) ? rawContestId[0] : rawContestId;

  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId) return;

    const loadContest = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await contestsApi.findById(contestId);
        setContest(data);
      } catch (err) {
        console.error('Failed to load contest:', err);
        setError('Không thể tải thông tin contest. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    loadContest();
  }, [contestId]);

  if (!contestId) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-background/80 p-10 text-center text-lg text-destructive">
          Contest ID không hợp lệ.
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-background/80 p-10 text-center text-lg text-muted-foreground">
          Đang tải contest...
        </div>
      </main>
    );
  }

  if (error || !contest) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-background/80 p-10 text-center text-lg text-destructive">
          {error ?? 'Contest không tồn tại hoặc đã xảy ra lỗi.'}
        </div>
      </main>
    );
  }

  const startAt = contest.startAt ? new Date(contest.startAt).toLocaleString() : 'Chưa khai báo';
  const endAt = contest.endAt ? new Date(contest.endAt).toLocaleString() : 'Chưa khai báo';

  return (
    <main className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-10">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
            Contest Detail
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{contest.title}</h1>
          <p className="max-w-2xl text-muted-foreground">
            {contest.description || 'Không có mô tả contest.'}
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
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={
                  contest.status === 'RUNNING'
                    ? 'secondary'
                    : contest.status === 'ENDED'
                      ? 'destructive'
                      : 'default'
                }
              >
                {contest.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Start At</p>
              <p className="font-semibold">{startAt}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End At</p>
              <p className="font-semibold">{endAt}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Feedback Policy</p>
              <p className="font-semibold">{contest.testFeedbackPolicy}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max submissions/problem</p>
              <p className="font-semibold">
                {contest.maxSubmissionsPerProblem ?? 'Không giới hạn'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" />
              <span>Contest metadata</span>
            </div>
            <p>{contest.description || 'Contest này chưa có nội dung mô tả chi tiết.'}</p>
          </div>
        </section>

        <div className="space-y-6">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <List className="w-5 h-5" /> Danh sách bài toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!contest.problems || contest.problems.length === 0 ? (
                <div className="rounded-xl border border-border bg-background/80 p-4 text-sm text-muted-foreground">
                  Contest chưa có bài toán nào.
                </div>
              ) : (
                <div className="space-y-4">
                  {contest.problems.map((item) => (
                    <div
                      key={item.problemId}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">
                            <Link
                              href={`/problems/${item.problemId}`}
                              className="hover:text-primary"
                            >
                              {item.problem?.title ?? item.problemId}
                            </Link>
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.problem?.description
                              ? item.problem.description.slice(0, 120) + '...'
                              : 'Không có mô tả ngắn.'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/10 px-3 py-1">
                            <Trophy className="w-4 h-4" /> {item.points ?? '-'} pts
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/10 px-3 py-1">
                            <Zap className="w-4 h-4" />{' '}
                            {item.timeLimitMsOverride ?? item.problem?.timeLimitMs ?? '-'} ms
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/10 px-3 py-1">
                            <BarChart3 className="w-4 h-4" />{' '}
                            {item.memoryLimitMbOverride ?? item.problem?.memoryLimitMb ?? '-'} MB
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
