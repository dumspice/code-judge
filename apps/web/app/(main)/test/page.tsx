'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Loader2Icon } from 'lucide-react';
import { getPublicCoreUrl } from '@/lib/public-config';

function coreApiHeaders(jsonBody = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (jsonBody) headers['Content-Type'] = 'application/json';
  return headers;
}

type ResourceKind =
  | 'ai-input'
  | 'avatar'
  | 'submission-artifact'
  | 'submission-source'
  | 'golden-solution'
  | 'ai-testcase'
  | 'export';

type PresignUploadResponse = {
  bucket: string;
  objectKey: string;
  uploadUrl: string;
};

type PresignDownloadResponse = {
  objectKey: string;
  downloadUrl: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  code: number;
  message: string;
  result: T;
};

function unwrapApiResult<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'result' in payload) {
    return (payload as ApiEnvelope<T>).result;
  }
  return payload as T;
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('space-y-4')}>
      <div>
        <h2 className={cn('text-lg font-semibold tracking-tight')}>{title}</h2>
        {description ? (
          <p className={cn('text-sm text-muted-foreground')}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function guessExtensionFromName(fileName: string): string | undefined {
  const idx = fileName.lastIndexOf('.');
  if (idx <= 0 || idx === fileName.length - 1) return undefined;
  return fileName.slice(idx + 1).toLowerCase();
}

function buildDefaultFileName(file?: File | null): string {
  if (file?.name) return file.name;
  return `upload-${new Date().toISOString().replaceAll(':', '-')}.bin`;
}

export default function TestPage() {
  const coreUrl = useMemo(() => getPublicCoreUrl().replace(/\/+$/, ''), []);

  const [resourceKind, setResourceKind] = useState<ResourceKind>('ai-input');
  const [file, setFile] = useState<File | null>(null);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);

  // resource identifiers (tuỳ kind)
  const [jobId, setJobId] = useState('test-job');
  const [userId, setUserId] = useState('test-user');
  const [submissionId, setSubmissionId] = useState('test-submission');
  const [problemId, setProblemId] = useState('test-problem');
  const [goldenSolutionId, setGoldenSolutionId] = useState('test-golden');
  const [contestId, setContestId] = useState('test-contest');
  const [exportId, setExportId] = useState('test-export');
  const [testCaseIndex, setTestCaseIndex] = useState('0');

  // filename / extension
  const [fileName, setFileName] = useState('');
  const [extension, setExtension] = useState('');
  const [expiresInSeconds, setExpiresInSeconds] = useState('900');

  // output
  const [busy, setBusy] = useState(false);
  const [folderBusy, setFolderBusy] = useState(false);
  const [folderSubmissionId, setFolderSubmissionId] = useState('test-folder');
  const [result, setResult] = useState<{
    presign?: PresignUploadResponse;
    download?: PresignDownloadResponse;
  } | null>(null);
  const [log, setLog] = useState<string>('');
  const [folderProgress, setFolderProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });
  const [folderResults, setFolderResults] = useState<
    Array<{ fileName: string; objectKey: string; downloadUrl?: string }>
  >([]);
  const [folderLog, setFolderLog] = useState<string>('');

  const effectiveFileName = useMemo(() => {
    const v = fileName.trim();
    return v ? v : buildDefaultFileName(file);
  }, [fileName, file]);

  const effectiveExtension = useMemo(() => {
    const v = extension.trim();
    if (v) return v;
    const guessed = guessExtensionFromName(effectiveFileName);
    return guessed ?? 'bin';
  }, [extension, effectiveFileName]);

  const imagePreviewUrl = useMemo(() => {
    if (!file) return null;
    if (!file.type.startsWith('image/')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  async function onUpload() {
    if (!file) {
      setLog('Vui lòng chọn file trước.');
      return;
    }

    setBusy(true);
    setResult(null);
    setLog('');

    try {
      const ttl = expiresInSeconds.trim() ? Number(expiresInSeconds.trim()) : 900;
      const body: Record<string, unknown> = {
        resourceKind,
        expiresInSeconds: Number.isFinite(ttl) ? ttl : 900,
      };

      if (resourceKind === 'ai-input') {
        body.jobId = jobId.trim() || 'unknown';
        body.fileName = effectiveFileName;
      }
      if (resourceKind === 'avatar') {
        body.userId = userId.trim() || 'unknown';
        body.extension = effectiveExtension;
      }
      if (resourceKind === 'submission-artifact') {
        body.submissionId = submissionId.trim() || 'unknown';
        body.fileName = effectiveFileName;
      }
      if (resourceKind === 'submission-source') {
        body.submissionId = submissionId.trim() || 'unknown';
        body.fileName = effectiveFileName;
      }
      if (resourceKind === 'golden-solution') {
        body.problemId = problemId.trim() || 'unknown';
        body.goldenSolutionId = goldenSolutionId.trim() || 'unknown';
        body.fileName = effectiveFileName;
      }
      if (resourceKind === 'ai-testcase') {
        body.jobId = jobId.trim() || 'unknown';
        body.testCaseIndex = Number(testCaseIndex.trim() || '0');
        body.fileName = effectiveFileName;
      }
      if (resourceKind === 'export') {
        body.contestId = contestId.trim() || 'unknown';
        body.exportId = exportId.trim() || 'unknown';
        body.extension = effectiveExtension;
      }

      setLog((s) => s + `1) Xin presign upload từ Core API: ${coreUrl}/storage/presign/upload\n`);
      const presignRes = await fetch(`${coreUrl}/storage/presign/upload`, {
        method: 'POST',
        headers: coreApiHeaders(true),
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!presignRes.ok) {
        const txt = await presignRes.text().catch(() => '');
        throw new Error(`Presign upload failed (${presignRes.status}): ${txt}`);
      }
      const presignPayload = (await presignRes.json()) as unknown;
      const presign = unwrapApiResult<PresignUploadResponse>(presignPayload);
      setLog((s) => s + `   bucket=${presign.bucket}\n   objectKey=${presign.objectKey}\n\n`);

      setLog((s) => s + `2) PUT file trực tiếp lên MinIO bằng presigned URL\n`);
      const putRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: file.type ? { 'Content-Type': file.type } : undefined,
        body: file,
      });
      if (!putRes.ok) {
        const txt = await putRes.text().catch(() => '');
        throw new Error(`PUT to MinIO failed (${putRes.status}): ${txt}`);
      }
      setLog((s) => s + `   PUT OK\n\n`);

      setLog((s) => s + `3) Xin presign download để test tải lại\n`);
      const downloadRes = await fetch(
        `${coreUrl}/storage/presign/download?objectKey=${encodeURIComponent(presign.objectKey)}&expiresInSeconds=${encodeURIComponent(String(ttl))}`,
        { method: 'GET', headers: coreApiHeaders(), credentials: 'include' },
      );
      if (!downloadRes.ok) {
        const txt = await downloadRes.text().catch(() => '');
        throw new Error(`Presign download failed (${downloadRes.status}): ${txt}`);
      }
      const downloadPayload = (await downloadRes.json()) as unknown;
      const download = unwrapApiResult<PresignDownloadResponse>(downloadPayload);
      setLog((s) => s + `   downloadUrl OK\n`);

      setResult({ presign, download });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLog((s) => (s ? `${s}\n\n` : '') + `Lỗi: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  async function onUploadFolder() {
    if (folderFiles.length === 0) {
      setFolderLog('Vui lòng chọn folder (hoặc nhiều file) trước.');
      return;
    }

    const ttl = expiresInSeconds.trim() ? Number(expiresInSeconds.trim()) : 900;
    const expires = Number.isFinite(ttl) ? ttl : 900;

    setFolderBusy(true);
    setFolderResults([]);
    setFolderLog('');
    setFolderProgress({ done: 0, total: folderFiles.length });

    try {
      const sid = folderSubmissionId.trim() || `folder-${Date.now()}`;
      setFolderLog((s) => s + `submissionId (folder): ${sid}\n\n`);

      for (let i = 0; i < folderFiles.length; i++) {
        const f = folderFiles[i]!;
        const relativeName = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;

        setFolderLog((s) => s + `#${i + 1}/${folderFiles.length} ${relativeName}\n`);

        const presignRes = await fetch(`${coreUrl}/storage/presign/upload`, {
          method: 'POST',
          headers: coreApiHeaders(true),
          credentials: 'include',
          body: JSON.stringify({
            resourceKind: 'submission-artifact',
            submissionId: sid,
            fileName: relativeName,
            expiresInSeconds: expires,
          }),
        });
        if (!presignRes.ok) {
          const txt = await presignRes.text().catch(() => '');
          throw new Error(`Presign upload failed (${presignRes.status}): ${txt}`);
        }
        const presignPayload = (await presignRes.json()) as unknown;
        const presign = unwrapApiResult<PresignUploadResponse>(presignPayload);

        const putRes = await fetch(presign.uploadUrl, {
          method: 'PUT',
          headers: f.type ? { 'Content-Type': f.type } : undefined,
          body: f,
        });
        if (!putRes.ok) {
          const txt = await putRes.text().catch(() => '');
          throw new Error(`PUT to MinIO failed (${putRes.status}): ${txt}`);
        }

        const downloadRes = await fetch(
          `${coreUrl}/storage/presign/download?objectKey=${encodeURIComponent(presign.objectKey)}&expiresInSeconds=${encodeURIComponent(String(expires))}`,
          { method: 'GET', headers: coreApiHeaders(), credentials: 'include' },
        );
        const download = downloadRes.ok
          ? unwrapApiResult<PresignDownloadResponse>(((await downloadRes.json()) as unknown))
          : undefined;

        setFolderResults((prev) => [
          ...prev,
          { fileName: relativeName, objectKey: presign.objectKey, downloadUrl: download?.downloadUrl },
        ]);
        setFolderProgress({ done: i + 1, total: folderFiles.length });
        setFolderLog((s) => s + `   OK → ${presign.objectKey}\n\n`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setFolderLog((s) => (s ? `${s}\n` : '') + `Lỗi: ${msg}\n`);
    } finally {
      setFolderBusy(false);
    }
  }

  return (
    <div className={cn('bg-background p-6 md:p-10')}>
      <div className={cn('mx-auto max-w-4xl space-y-10')}>
        <header className={cn('space-y-2 border-b border-border pb-6')}>
          <p className={cn('text-xs font-medium uppercase tracking-wider text-muted-foreground')}>Test</p>
          <h1 className={cn('text-3xl font-semibold tracking-tight')}>Upload tài liệu → MinIO (/test)</h1>
          <p className={cn('max-w-2xl text-sm text-muted-foreground')}>
            UI này gọi Core API để xin <code className={cn('rounded bg-muted px-1 py-0.5 text-xs')}>presigned URL</code>{' '}
            rồi upload trực tiếp lên MinIO. Hỗ trợ ảnh, file bất kỳ, và <code className={cn('rounded bg-muted px-1 py-0.5 text-xs')}>.zip</code>{' '}
            (để upload cả folder, hãy zip folder lại trước). Cần đăng nhập web (có access token) để gọi API storage.
          </p>
          <p className={cn('text-xs text-muted-foreground')}>
            Core API URL hiện tại: <code className={cn('rounded bg-muted px-1')}>{coreUrl}</code> (từ{' '}
            <code className={cn('rounded bg-muted px-1')}>NEXT_PUBLIC_CORE_URL</code>)
          </p>
        </header>

        <Section
          title="1) Chọn file"
          description="Chọn ảnh / file / zip để upload. Ảnh sẽ có preview."
        >
          <Card>
            <CardContent className={cn('space-y-4 pt-6')}>
              <div className={cn('grid gap-2')}>
                <Label htmlFor="cj-test-file">File</Label>
                <Input
                  id="cj-test-file"
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    setResult(null);
                    setLog('');
                    if (f) setFileName((prev) => (prev.trim() ? prev : f.name));
                    if (f && resourceKind === 'avatar') {
                      const ext = guessExtensionFromName(f.name);
                      if (ext) setExtension((prev) => (prev.trim() ? prev : ext));
                    }
                  }}
                />
                <div className={cn('text-xs text-muted-foreground')}>
                  {file ? (
                    <>
                      <span className={cn('font-medium text-foreground')}>{file.name}</span> — {file.type || 'unknown'} —{' '}
                      {Math.round(file.size / 1024)} KB
                    </>
                  ) : (
                    'Chưa chọn file.'
                  )}
                </div>
              </div>

              {imagePreviewUrl ? (
                <div className={cn('space-y-2')}>
                  <div className={cn('text-xs font-medium text-muted-foreground')}>Preview</div>
                  <div className={cn('overflow-hidden rounded-lg border')}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreviewUrl} alt="preview" className={cn('max-h-[240px] w-full object-contain bg-muted/20')} />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </Section>

        <Section
          title="1b) Upload folder (nhiều file)"
          description="Chọn cả folder (Chrome/Edge) để upload từng file. Nếu bạn muốn giữ cấu trúc thư mục trong 1 object, hãy zip folder trước và upload ở bước 1."
        >
          <Card>
            <CardContent className={cn('space-y-4 pt-6')}>
              <div className={cn('grid gap-2')}>
                <Label htmlFor="cj-test-folder">Folder</Label>
                <Input
                  id="cj-test-folder"
                  type="file"
                  multiple
                  // @ts-expect-error - non-standard attribute for folder picking
                  webkitdirectory=""
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setFolderFiles(files);
                    setFolderResults([]);
                    setFolderLog('');
                    setFolderProgress({ done: 0, total: files.length });
                  }}
                />
                <div className={cn('text-xs text-muted-foreground')}>
                  {folderFiles.length ? `${folderFiles.length} file(s) đã chọn.` : 'Chưa chọn folder.'}
                </div>
              </div>

              <div className={cn('grid gap-2 md:grid-cols-2')}>
                <div className={cn('grid gap-2')}>
                  <Label htmlFor="cj-folder-submissionid">submissionId (dùng cho objectKey)</Label>
                  <Input
                    id="cj-folder-submissionid"
                    value={folderSubmissionId}
                    onChange={(e) => setFolderSubmissionId(e.target.value)}
                    placeholder="test-folder"
                  />
                </div>
                <div className={cn('flex items-end justify-between gap-2')}>
                  <div className={cn('text-xs text-muted-foreground')}>
                    Tiến độ: <code className={cn('rounded bg-muted px-1')}>{folderProgress.done}</code>/
                    <code className={cn('rounded bg-muted px-1')}>{folderProgress.total}</code>
                  </div>
                  <Button onClick={onUploadFolder} disabled={folderBusy || folderFiles.length === 0}>
                    {folderBusy ? <Loader2Icon className={cn('mr-2 h-4 w-4 animate-spin')} /> : null}
                    Upload folder
                  </Button>
                </div>
              </div>

              {folderResults.length ? (
                <div className={cn('space-y-2')}>
                  <div className={cn('text-xs font-medium text-muted-foreground')}>Kết quả</div>
                  <div className={cn('space-y-2')}>
                    {folderResults.slice(0, 20).map((r) => (
                      <div key={`${r.objectKey}`} className={cn('rounded-lg border p-3 text-xs')}>
                        <div className={cn('font-medium text-foreground')}>{r.fileName}</div>
                        <div className={cn('text-muted-foreground')}>
                          objectKey: <code className={cn('rounded bg-muted px-1')}>{r.objectKey}</code>
                        </div>
                        {r.downloadUrl ? (
                          <div className={cn('pt-1')}>
                            <a
                              className={cn('text-primary underline underline-offset-4')}
                              href={r.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              tải
                            </a>
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {folderResults.length > 20 ? (
                      <div className={cn('text-xs text-muted-foreground')}>
                        Đang hiển thị 20/{folderResults.length} item đầu.
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className={cn('space-y-2')}>
                <Label htmlFor="cj-folder-log">Log (folder)</Label>
                <Textarea
                  id="cj-folder-log"
                  value={folderLog}
                  readOnly
                  className={cn('min-h-[140px] font-mono text-xs')}
                  placeholder="Log upload folder sẽ xuất hiện ở đây..."
                />
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section
          title="2) Cấu hình object key"
          description="Chọn resourceKind và các trường liên quan để Core API dựng objectKey."
        >
          <Card>
            <CardContent className={cn('space-y-6 pt-6')}>
              <div className={cn('grid gap-2')}>
                <Label htmlFor="cj-kind">resourceKind</Label>
                <Select
                  value={resourceKind}
                  onValueChange={(v) => {
                    if (!v) return;
                    setResourceKind(v as ResourceKind);
                    setResult(null);
                    setLog('');
                  }}
                >
                  <SelectTrigger id="cj-kind" className={cn('w-full')}>
                    <SelectValue placeholder="Chọn..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai-input">ai-input (tài liệu input)</SelectItem>
                    <SelectItem value="avatar">avatar (ảnh đại diện)</SelectItem>
                    <SelectItem value="submission-source">submission-source</SelectItem>
                    <SelectItem value="submission-artifact">submission-artifact (zip/output)</SelectItem>
                    <SelectItem value="golden-solution">golden-solution</SelectItem>
                    <SelectItem value="ai-testcase">ai-testcase</SelectItem>
                    <SelectItem value="export">export</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2')}>
                <div className={cn('grid gap-2')}>
                  <Label htmlFor="cj-filename">fileName</Label>
                  <Input
                    id="cj-filename"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder={file?.name ?? 'example.zip'}
                  />
                  <div className={cn('text-xs text-muted-foreground')}>
                    Dùng để dựng objectKey (nếu bỏ trống sẽ lấy mặc định từ file).
                  </div>
                </div>

                <div className={cn('grid gap-2')}>
                  <Label htmlFor="cj-expires">expiresInSeconds</Label>
                  <Input
                    id="cj-expires"
                    inputMode="numeric"
                    value={expiresInSeconds}
                    onChange={(e) => setExpiresInSeconds(e.target.value)}
                    placeholder="900"
                  />
                </div>
              </div>

              {resourceKind === 'ai-input' ? (
                <div className={cn('grid gap-4 md:grid-cols-2')}>
                  <div className={cn('grid gap-2')}>
                    <Label htmlFor="cj-jobid">jobId</Label>
                    <Input id="cj-jobid" value={jobId} onChange={(e) => setJobId(e.target.value)} />
                  </div>
                  <div className={cn('flex items-end')}>
                    <Badge variant="secondary">objectKey: ai-jobs/&lt;jobId&gt;/input/&lt;fileName&gt;</Badge>
                  </div>
                </div>
              ) : null}

              {resourceKind === 'avatar' ? (
                <div className={cn('grid gap-4 md:grid-cols-2')}>
                  <div className={cn('grid gap-2')}>
                    <Label htmlFor="cj-userid">userId</Label>
                    <Input id="cj-userid" value={userId} onChange={(e) => setUserId(e.target.value)} />
                  </div>
                  <div className={cn('grid gap-2')}>
                    <Label htmlFor="cj-ext">extension</Label>
                    <Input
                      id="cj-ext"
                      value={extension}
                      onChange={(e) => setExtension(e.target.value)}
                      placeholder={effectiveExtension}
                    />
                  </div>
                </div>
              ) : null}

              {resourceKind === 'submission-artifact' || resourceKind === 'submission-source' ? (
                <div className={cn('grid gap-4 md:grid-cols-2')}>
                  <div className={cn('grid gap-2')}>
                    <Label htmlFor="cj-submissionid">submissionId</Label>
                    <Input
                      id="cj-submissionid"
                      value={submissionId}
                      onChange={(e) => setSubmissionId(e.target.value)}
                    />
                  </div>
                  <div className={cn('flex items-end')}>
                    <Badge variant="secondary">objectKey: submissions/&lt;id&gt;/...</Badge>
                  </div>
                </div>
              ) : null}

              {resourceKind === 'golden-solution' ? (
                <div className={cn('grid gap-4 md:grid-cols-2')}>
                  <div className={cn('grid gap-2')}>
                    <Label htmlFor="cj-problemid">problemId</Label>
                    <Input id="cj-problemid" value={problemId} onChange={(e) => setProblemId(e.target.value)} />
                  </div>
                  <div className={cn('grid gap-2')}>
                    <Label htmlFor="cj-goldenid">goldenSolutionId</Label>
                    <Input
                      id="cj-goldenid"
                      value={goldenSolutionId}
                      onChange={(e) => setGoldenSolutionId(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              {resourceKind === 'ai-testcase' ? (
                <div className={cn('grid gap-4 md:grid-cols-2')}>
                  <div className={cn('grid gap-2')}>
                    <Label htmlFor="cj-jobid-2">jobId</Label>
                    <Input id="cj-jobid-2" value={jobId} onChange={(e) => setJobId(e.target.value)} />
                  </div>
                  <div className={cn('grid gap-2')}>
                    <Label htmlFor="cj-tc-index">testCaseIndex</Label>
                    <Input
                      id="cj-tc-index"
                      inputMode="numeric"
                      value={testCaseIndex}
                      onChange={(e) => setTestCaseIndex(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              {resourceKind === 'export' ? (
                <div className={cn('grid gap-4 md:grid-cols-2')}>
                  <div className={cn('grid gap-2')}>
                    <Label htmlFor="cj-contestid">contestId</Label>
                    <Input id="cj-contestid" value={contestId} onChange={(e) => setContestId(e.target.value)} />
                  </div>
                  <div className={cn('grid gap-2')}>
                    <Label htmlFor="cj-exportid">exportId</Label>
                    <Input id="cj-exportid" value={exportId} onChange={(e) => setExportId(e.target.value)} />
                  </div>
                  <div className={cn('grid gap-2 md:col-span-2')}>
                    <Label htmlFor="cj-ext-2">extension</Label>
                    <Input
                      id="cj-ext-2"
                      value={extension}
                      onChange={(e) => setExtension(e.target.value)}
                      placeholder={effectiveExtension}
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
            <CardFooter className={cn('flex flex-col gap-3 border-t bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between')}>
              <div className={cn('text-xs text-muted-foreground')}>
                <span className={cn('font-medium text-foreground')}>Lưu ý</span>: MinIO object key sẽ được sanitize (ký tự lạ sẽ thành <code className={cn('rounded bg-muted px-1')}>-</code>).
              </div>
              <Button onClick={onUpload} disabled={busy}>
                {busy ? <Loader2Icon className={cn('mr-2 h-4 w-4 animate-spin')} /> : null}
                Upload
              </Button>
            </CardFooter>
          </Card>
        </Section>

        <Section title="3) Kết quả" description="Hiển thị objectKey, link tải lại và log request.">
          <Card>
            <CardContent className={cn('space-y-4 pt-6')}>
              {result?.presign ? (
                <div className={cn('space-y-1 text-sm')}>
                  <div>
                    <span className={cn('text-muted-foreground')}>bucket:</span>{' '}
                    <code className={cn('rounded bg-muted px-1')}>{result.presign.bucket}</code>
                  </div>
                  <div>
                    <span className={cn('text-muted-foreground')}>objectKey:</span>{' '}
                    <code className={cn('rounded bg-muted px-1')}>{result.presign.objectKey}</code>
                  </div>
                  {result.download?.downloadUrl ? (
                    <div className={cn('pt-2')}>
                      <a
                        className={cn('text-primary underline underline-offset-4')}
                        href={result.download.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mở link tải (presigned download)
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className={cn('text-sm text-muted-foreground')}>Chưa có kết quả.</div>
              )}

              <div className={cn('space-y-2')}>
                <Label htmlFor="cj-log">Log</Label>
                <Textarea
                  id="cj-log"
                  value={log}
                  readOnly
                  className={cn('min-h-[180px] font-mono text-xs')}
                  placeholder="Log sẽ xuất hiện ở đây..."
                />
              </div>
            </CardContent>
          </Card>
        </Section>
      </div>
    </div>
  );
}
