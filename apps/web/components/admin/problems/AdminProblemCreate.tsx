'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Plus,
  ArrowLeft,
  Beaker,
  Clock,
  Database,
  Globe,
  Lock,
  Save,
  Trash2,
  Languages,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  CreateAdminProblemDto,
  problemsApi,
  UpdateProblemDto,
  type GenerateTestCasesDraftResult,
} from '@/services/problem.apis';
import { ApiRequestError } from '@/services/api-client';
import { toast } from 'sonner';

const DIFFICULTY_AI_LABEL: Record<'EASY' | 'MEDIUM' | 'HARD', string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

function mapAiDraftToFormTestCases(
  parsed: GenerateTestCasesDraftResult['parsed'],
): Array<{ input: string; expectedOutput: string; isHidden: boolean; weight: number }> {
  if (!parsed?.testCases?.length) return [];
  return parsed.testCases
    .map((tc) => ({
      input: (tc.input ?? '').trim(),
      expectedOutput: (tc.expectedOutput ?? '').trim(),
      isHidden: Boolean(tc.isHidden),
      weight: typeof tc.weight === 'number' && tc.weight > 0 ? tc.weight : 1,
    }))
    .filter((tc) => tc.input.length > 0 || tc.expectedOutput.length > 0);
}

function buildStatementPayloadForAi(form: {
  description?: string;
  statementMd?: string;
}): string {
  const desc = form.description?.trim();
  const stmt = form.statementMd?.trim() ?? '';
  if (desc) {
    return `## Mô tả ngắn\n${desc}\n\n---\n\n${stmt}`;
  }
  return stmt;
}

/** Ngôn ngữ lưu trên problem thường là UPPERCASE; prompt AI dùng dạng thường. */
function mapLanguagesForAi(langs: string[] | undefined): string[] | undefined {
  if (!langs?.length) return undefined;
  return langs.map((l) => l.trim().toLowerCase()).filter(Boolean);
}

type AiGenOptionsState = {
  ioSpec: string;
  supplementaryText: string;
  provider: '' | 'openai' | 'google';
  model: string;
  maxSuggestions: number;
  revisionSummary: string;
  revisionFeedback: string;
  revisionValidatorLines: string;
};

const defaultAiGenOptions: AiGenOptionsState = {
  ioSpec: '',
  supplementaryText: '',
  provider: '',
  model: '',
  maxSuggestions: 10,
  revisionSummary: '',
  revisionFeedback: '',
  revisionValidatorLines: '',
};

type AdminProblemFormValues = CreateAdminProblemDto & { dueAt?: string };

export default function AdminProblemCreate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!editId);

  const [formData, setFormData] = useState<AdminProblemFormValues>({
    title: '',
    description: '',
    statementMd: '',
    difficulty: 'EASY',
    mode: 'ALGO',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    isPublished: true,
    visibility: 'PUBLIC',
    supportedLanguages: ['PYTHON', 'JAVASCRIPT', 'CPP', 'JAVA'],
    maxTestCases: 100,
    testCases: [],
    dueAt: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiDraftResult, setAiDraftResult] = useState<GenerateTestCasesDraftResult | null>(null);
  const [aiGenOptions, setAiGenOptions] = useState<AiGenOptionsState>(defaultAiGenOptions);

  useEffect(() => {
    if (editId) {
      loadProblem(editId);
    } else {
      setInitialLoading(false);
    }
  }, [editId]);

  const loadProblem = async (id: string) => {
    try {
      const data = await problemsApi.findById(id);
      setFormData({
        title: data.title,
        description: data.description ?? '',
        statementMd: data.statementMd ?? '',
        difficulty: data.difficulty,
        mode: data.mode,
        timeLimitMs: data.timeLimitMs,
        memoryLimitMb: data.memoryLimitMb,
        isPublished: data.isPublished,
        visibility: data.visibility,
        supportedLanguages: data.supportedLanguages ?? ['PYTHON', 'JAVASCRIPT', 'CPP', 'JAVA'],
        maxTestCases: data.maxTestCases,
        testCases: (data.testCases ?? []).map(
          ({ id, problemId, orderIndex, createdAt, updatedAt, ...rest }: any) => rest,
        ),
        dueAt: data.assignments?.[0]?.dueAt ?? undefined,
      });
    } catch (error) {
      console.error('Failed to load problem:', error);
      const msg =
        error instanceof ApiRequestError
          ? error.body.message
          : 'Không tải được dữ liệu problem.';
      toast.error(msg, { position: 'top-center' });
    } finally {
      setInitialLoading(false);
    }
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [
        ...(formData.testCases || []),
        { input: '', expectedOutput: '', isHidden: false, weight: 1 },
      ],
    });
  };

  const removeTestCase = (index: number) => {
    setFormData({
      ...formData,
      testCases: (formData.testCases || []).filter((_, i) => i !== index),
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề';
    if (!formData.description?.trim()) newErrors.description = 'Vui lòng nhập mô tả ngắn';
    if (!formData.statementMd?.trim()) newErrors.statementMd = 'Vui lòng nhập đề bài (markdown)';

    if (!formData.testCases || formData.testCases.length === 0) {
      newErrors.testCases = 'Cần ít nhất một test case';
    } else {
      formData.testCases.forEach((tc, index) => {
        if (!tc.input.trim()) newErrors[`testCase_${index}_input`] = 'Thiếu input';
        if (!tc.expectedOutput.trim()) newErrors[`testCase_${index}_output`] = 'Thiếu output mong đợi';
      });
    }

    if (editId && formData.dueAt && new Date(formData.dueAt) < new Date()) {
      newErrors.dueAt = 'Hạn nộp không được ở quá khứ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Vui lòng sửa các lỗi trong form.', { position: 'top-center' });
      return;
    }

    setLoading(true);
    try {
      // Sanitize test cases to remove properties the API doesn't expect
      const sanitizedTestCases = (formData.testCases || []).map(
        ({ id, problemId, orderIndex, createdAt, updatedAt, ...rest }: any) => rest,
      );

      const payload = {
        ...formData,
        testCases: sanitizedTestCases,
      };

      if (editId) {
        await problemsApi.update(editId, payload as UpdateProblemDto);
      } else {
        const { dueAt: _due, ...forAdmin } = payload;
        await problemsApi.createAdmin(forAdmin as CreateAdminProblemDto);
      }
      toast.success(editId ? 'Đã cập nhật problem.' : 'Đã tạo problem.', {
        position: 'top-center',
      });
      router.push('/admin/problems');
    } catch (error) {
      console.error('Failed to save problem:', error);
      const msg =
        error instanceof ApiRequestError
          ? error.body.message
          : 'Không lưu được. Kiểm tra dữ liệu hoặc thử lại sau.';
      toast.error(msg, { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 space-y-4"
        role="status"
        aria-busy="true"
        aria-label="Đang tải"
      >
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Đang tải dữ liệu problem...</p>
      </div>
    );
  }

  function updateTestCase(index: number, field: string, value: any): void {
    setFormData((prev) => {
      const newTestCases = [...(prev.testCases || [])];
      if (newTestCases[index]) {
        newTestCases[index] = { ...newTestCases[index], [field]: value };
      }
      return { ...prev, testCases: newTestCases };
    });
  }

  const clearTestCaseFieldErrors = () => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next.testCases;
      for (const k of Object.keys(next)) {
        if (k.startsWith('testCase_')) delete next[k];
      }
      return next;
    });
  };

  const previewMappedCases = aiDraftResult
    ? mapAiDraftToFormTestCases(aiDraftResult.parsed)
    : [];

  const handleGenerateAiDraft = async () => {
    if (!formData.title.trim()) {
      toast.error('Nhập tiêu đề problem trước khi gọi AI.', { position: 'top-center' });
      return;
    }
    if (!formData.statementMd?.trim()) {
      toast.error('Nhập đề bài (markdown) trước khi gọi AI.', { position: 'top-center' });
      return;
    }
    const previousDraft = aiDraftResult;
    setAiDraftLoading(true);
    setAiDraftResult(null);
    try {
      const maxCap = Math.min(formData.maxTestCases ?? 100, 25);
      const maxForAi = Math.min(
        Math.max(Math.min(aiGenOptions.maxSuggestions || 10, 25), 1),
        maxCap,
      );
      const difficultyKey = (formData.difficulty ?? 'EASY') as keyof typeof DIFFICULTY_AI_LABEL;
      const validatorIssues = aiGenOptions.revisionValidatorLines
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const hasRevision =
        Boolean(aiGenOptions.revisionSummary.trim()) ||
        Boolean(aiGenOptions.revisionFeedback.trim()) ||
        validatorIssues.length > 0;
      const revision = hasRevision
        ? {
            promptVersionUsed: previousDraft?.promptVersion,
            previousOutputSummary: aiGenOptions.revisionSummary.trim() || undefined,
            userFeedback: aiGenOptions.revisionFeedback.trim() || undefined,
            validatorIssues: validatorIssues.length ? validatorIssues : undefined,
          }
        : undefined;

      const res = await problemsApi.generateTestCasesDraft({
        title: formData.title.trim(),
        statement: buildStatementPayloadForAi({
          description: formData.description,
          statementMd: formData.statementMd,
        }),
        difficulty: DIFFICULTY_AI_LABEL[difficultyKey],
        timeLimitMs: formData.timeLimitMs,
        memoryLimitMb: formData.memoryLimitMb,
        supportedLanguages: mapLanguagesForAi(formData.supportedLanguages),
        maxTestCases: maxForAi,
        ...(aiGenOptions.ioSpec.trim() ? { ioSpec: aiGenOptions.ioSpec.trim() } : {}),
        ...(aiGenOptions.supplementaryText.trim()
          ? { supplementaryText: aiGenOptions.supplementaryText.trim() }
          : {}),
        ...(aiGenOptions.provider ? { provider: aiGenOptions.provider } : {}),
        ...(aiGenOptions.model.trim() ? { model: aiGenOptions.model.trim() } : {}),
        ...(revision ? { revision } : {}),
      });
      setAiDraftResult(res);
      setAiSheetOpen(true);
      const mapped = mapAiDraftToFormTestCases(res.parsed);
      if (res.parseError && mapped.length === 0) {
        toast.warning('AI trả lời nhưng chưa parse được test case. Xem chi tiết trong panel.', {
          position: 'top-center',
        });
      } else if (mapped.length === 0) {
        toast.warning('Không có test case hợp lệ trong phản hồi AI.', { position: 'top-center' });
      }
    } catch (error) {
      console.error(error);
      const msg =
        error instanceof ApiRequestError
          ? error.body.message
          : 'Không gọi được AI. Kiểm tra đăng nhập và cấu hình máy chủ.';
      toast.error(msg, { position: 'top-center' });
    } finally {
      setAiDraftLoading(false);
    }
  };

  const applyAiTestCases = (mode: 'replace' | 'append') => {
    if (!aiDraftResult) return;
    const mapped = mapAiDraftToFormTestCases(aiDraftResult.parsed);
    if (mapped.length === 0) {
      toast.error('Không có test case để áp dụng.', { position: 'top-center' });
      return;
    }
    clearTestCaseFieldErrors();
    setFormData((prev) => ({
      ...prev,
      testCases:
        mode === 'replace'
          ? mapped
          : [...(prev.testCases ?? []), ...mapped],
    }));
    setAiSheetOpen(false);
    toast.success(
      mode === 'replace'
        ? `Đã thay thế bằng ${mapped.length} test case từ AI.`
        : `Đã thêm ${mapped.length} test case từ AI.`,
      { position: 'top-center' },
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <Button variant="outline" size="sm" className="w-fit cursor-pointer" asChild>
            <Link href="/admin/problems">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Về danh sách
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {editId ? 'Admin — Sửa problem' : 'Admin — Tạo problem'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {editId
                ? 'Cập nhật đề và test case. Hạn nộp (nếu có) đồng bộ với bài gán lớp hiện tại.'
                : 'Tạo đề trong kho (chỉ lưu problem, không tạo bài giao trên lớp).'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/problems')}
            disabled={loading}
            className="cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="cursor-pointer bg-black hover:bg-gray-800 text-white min-w-[120px]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editId ? 'Cập nhật' : 'Lưu'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b ">
              <CardTitle className="text-xl">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Problem Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) setErrors({ ...errors, title: '' });
                  }}
                  placeholder="e.g. Find the Maximum Sum Subarray"
                  className={`text-lg font-medium h-12 rounded-xl border-gray-200 focus:border-black transition-all ${errors.title ? 'border-red-500 bg-red-50' : ''}`}
                />
                {errors.title && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Brief Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (errors.description) setErrors({ ...errors, description: '' });
                  }}
                  placeholder="A short summary of what the problem is about..."
                  className={`min-h-[80px] rounded-xl border-gray-200 focus:border-black transition-all resize-none ${errors.description ? 'border-red-500 bg-red-50' : ''}`}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{errors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="statementMd" className="text-sm font-semibold">
                  Full Problem Statement (Markdown)
                </Label>
                <Textarea
                  id="statementMd"
                  value={formData.statementMd}
                  onChange={(e) => {
                    setFormData({ ...formData, statementMd: e.target.value });
                    if (errors.statementMd) setErrors({ ...errors, statementMd: '' });
                  }}
                  placeholder="Describe the problem, input format, output format, and constraints in detail..."
                  className={`min-h-[300px] rounded-xl border-gray-200 focus:border-black transition-all font-mono text-sm leading-relaxed ${errors.statementMd ? 'border-red-500 bg-red-50' : ''}`}
                />
                {errors.statementMd && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{errors.statementMd}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-xl">Test Cases</CardTitle>
                <CardDescription>
                  Thêm thủ công hoặc dùng AI sinh bản nháp từ tiêu đề + đề bài (luôn xem trước trước khi
                  áp dụng).
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-lg cursor-pointer"
                  disabled={aiDraftLoading || loading}
                  aria-busy={aiDraftLoading}
                  onClick={() => void handleGenerateAiDraft()}
                >
                  {aiDraftLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Gợi ý AI
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTestCase}
                  className="rounded-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Case
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <details className="group rounded-xl border border-violet-200/70 bg-violet-50/35 dark:bg-violet-950/20 dark:border-violet-800/50 mb-6 overflow-hidden">
                <summary className="cursor-pointer select-none list-none px-4 py-3 text-sm font-semibold text-violet-950 dark:text-violet-100 flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-violet-600" />
                    Tùy chọn gửi kèm cho AI
                  </span>
                  <span className="text-xs font-normal text-violet-700/80 dark:text-violet-300/80">
                    ioSpec, provider, chỉnh từ lần trước…
                  </span>
                </summary>
                <div className="border-t border-violet-200/60 dark:border-violet-800/40 px-4 py-4 space-y-4 text-sm">
                  <div className="space-y-2">
                    <Label htmlFor="ai-io-spec" className="text-xs font-semibold text-foreground">
                      Đặc tả I/O (ioSpec)
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Mô tả rõ định dạng input/output (một dòng, nhiều số, v.v.). Giúp AI khớp đúng
                      format thay vì chỉ đoán từ đề bài.
                    </p>
                    <Textarea
                      id="ai-io-spec"
                      value={aiGenOptions.ioSpec}
                      onChange={(e) => setAiGenOptions((o) => ({ ...o, ioSpec: e.target.value }))}
                      placeholder='Ví dụ: "Một dòng chứa chuỗi S. In một số nguyên trên một dòng."'
                      className="min-h-[72px] rounded-lg border-violet-200/80 bg-white/90 dark:bg-background font-mono text-xs"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-supplementary" className="text-xs font-semibold">
                      Bổ sung / ràng buộc thêm
                    </Label>
                    <Textarea
                      id="ai-supplementary"
                      value={aiGenOptions.supplementaryText}
                      onChange={(e) =>
                        setAiGenOptions((o) => ({ ...o, supplementaryText: e.target.value }))
                      }
                      placeholder="Giới hạn ẩn, ví dụ cấm, hoặc ghi chú không nằm trong statement…"
                      className="min-h-[56px] rounded-lg border-violet-200/80 bg-white/90 dark:bg-background text-xs"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Số testcase gợi ý (tối đa 25)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={25}
                        value={aiGenOptions.maxSuggestions}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setAiGenOptions((o) => ({
                            ...o,
                            maxSuggestions: Number.isFinite(n) ? Math.min(25, Math.max(1, n)) : 10,
                          }));
                        }}
                        className="h-9 rounded-lg border-violet-200/80"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Không vượt quá max testcase của đề ({Math.min(formData.maxTestCases ?? 100, 25)}).
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Provider</Label>
                      <Select
                        value={aiGenOptions.provider || 'default'}
                        onValueChange={(v) =>
                          setAiGenOptions((o) => ({
                            ...o,
                            provider: v === 'default' ? '' : (v as 'openai' | 'google'),
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 rounded-lg border-violet-200/80">
                          <SelectValue placeholder="Mặc định server" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Mặc định (theo server)</SelectItem>
                          <SelectItem value="google">Google (Gemini)</SelectItem>
                          <SelectItem value="openai">OpenAI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-model" className="text-xs font-semibold">
                      Model (tuỳ chọn)
                    </Label>
                    <Input
                      id="ai-model"
                      value={aiGenOptions.model}
                      onChange={(e) => setAiGenOptions((o) => ({ ...o, model: e.target.value }))}
                      placeholder="Để trống = model mặc định (vd. gemini-2.5-flash, gpt-4.1-mini)"
                      className="h-9 rounded-lg border-violet-200/80 font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-violet-200/50 dark:border-violet-800/40">
                    <p className="text-xs font-semibold text-foreground">Chỉnh sau lần chạy trước (revision)</p>
                    <p className="text-[11px] text-muted-foreground">
                      Điền khi muốn AI sửa bản nháp trước: tóm tắt output cũ, feedback, hoặc lỗi parse /
                      validator.
                    </p>
                    <Textarea
                      value={aiGenOptions.revisionSummary}
                      onChange={(e) =>
                        setAiGenOptions((o) => ({ ...o, revisionSummary: e.target.value }))
                      }
                      placeholder="Tóm tắt lần trước (vd. thiếu biên, sai format output)…"
                      className="min-h-[48px] rounded-lg text-xs"
                      rows={2}
                    />
                    <Textarea
                      value={aiGenOptions.revisionFeedback}
                      onChange={(e) =>
                        setAiGenOptions((o) => ({ ...o, revisionFeedback: e.target.value }))
                      }
                      placeholder="Yêu cầu cụ thể cho lần chạy này…"
                      className="min-h-[48px] rounded-lg text-xs"
                      rows={2}
                    />
                    <Textarea
                      value={aiGenOptions.revisionValidatorLines}
                      onChange={(e) =>
                        setAiGenOptions((o) => ({ ...o, revisionValidatorLines: e.target.value }))
                      }
                      placeholder="validatorIssues — mỗi dòng một mục (tuỳ chọn)"
                      className="min-h-[40px] rounded-lg font-mono text-[11px]"
                      rows={2}
                    />
                  </div>
                </div>
              </details>

              <div className="space-y-4">
                {errors.testCases && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> {errors.testCases}
                  </div>
                )}
                {formData.testCases?.length === 0 ? (
                  <div
                    className={`flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl bg-gray-50/50 text-gray-400 ${errors.testCases ? 'border-red-300' : ''}`}
                  >
                    <Beaker className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-medium">No test cases added yet.</p>
                    <p className="text-sm">Click "Add Case" to begin defining tests.</p>
                  </div>
                ) : (
                  formData.testCases?.map((tc, index) => (
                    <div
                      key={index}
                      className="group relative border border-gray-100 rounded-2xl p-5 bg-gray-50/30 hover:bg-white hover:shadow-lg hover:border-black/5 transition-all duration-300"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Input
                          </Label>
                          <Textarea
                            value={tc.input}
                            onChange={(e) => {
                              updateTestCase(index, 'input', e.target.value);
                              if (errors[`testCase_${index}_input`]) {
                                const next = { ...errors };
                                delete next[`testCase_${index}_input`];
                                setErrors(next);
                              }
                            }}
                            placeholder="Input for this case"
                            className={`min-h-[100px] rounded-xl border-gray-200 focus:border-black bg-white font-mono text-xs ${errors[`testCase_${index}_input`] ? 'border-red-500 bg-red-50' : ''}`}
                          />
                          {errors[`testCase_${index}_input`] && (
                            <p className="text-[10px] text-red-500 font-medium">
                              {errors[`testCase_${index}_input`]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Expected Output
                          </Label>
                          <Textarea
                            value={tc.expectedOutput}
                            onChange={(e) => {
                              updateTestCase(index, 'expectedOutput', e.target.value);
                              if (errors[`testCase_${index}_output`]) {
                                const next = { ...errors };
                                delete next[`testCase_${index}_output`];
                                setErrors(next);
                              }
                            }}
                            placeholder="Expected output"
                            className={`min-h-[100px] rounded-xl border-gray-200 focus:border-black bg-white font-mono text-xs ${errors[`testCase_${index}_output`] ? 'border-red-500 bg-red-50' : ''}`}
                          />
                          {errors[`testCase_${index}_output`] && (
                            <p className="text-[10px] text-red-500 font-medium">
                              {errors[`testCase_${index}_output`]}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`hidden-${index}`}
                              checked={tc.isHidden}
                              onCheckedChange={(checked) =>
                                updateTestCase(index, 'isHidden', checked)
                              }
                              className="cursor-pointer"
                            />
                            <Label
                              htmlFor={`hidden-${index}`}
                              className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                            >
                              {tc.isHidden ? (
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <Globe className="w-3.5 h-3.5 text-blue-500" />
                              )}
                              {tc.isHidden ? 'Hidden Case' : 'Public Case'}
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-gray-500">Weight:</Label>
                            <Input
                              type="number"
                              value={tc.weight}
                              onChange={(e) =>
                                updateTestCase(index, 'weight', Number(e.target.value))
                              }
                              className="w-16 h-8 rounded-lg border-gray-200 text-center font-bold"
                              min="1"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTestCase(index)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg h-8 px-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Configuration */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden sticky top-24">
            <CardHeader className="border-b">
              <CardTitle className="text-xl">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Easy</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MEDIUM">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Medium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="HARD">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>Hard</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Mode</Label>
                  <Select
                    value={formData.mode}
                    onValueChange={(value: any) => setFormData({ ...formData, mode: value })}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALGO">Algorithmic</SelectItem>
                      <SelectItem value="PROJECT">Project Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Hiển thị (visibility)</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value) => {
                      if (value === 'PRIVATE' || value === 'PUBLIC' || value === 'CONTEST_ONLY') {
                        setFormData({ ...formData, visibility: value });
                      }
                    }}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Công khai (kho đề)</SelectItem>
                      <SelectItem value="PRIVATE">Riêng tư</SelectItem>
                      <SelectItem value="CONTEST_ONLY">Chỉ contest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> TIME LIMIT (ms)
                    </Label>
                    <Input
                      type="number"
                      value={formData.timeLimitMs}
                      onChange={(e) =>
                        setFormData({ ...formData, timeLimitMs: Number(e.target.value) })
                      }
                      className="rounded-xl border-gray-200 h-10 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <Database className="w-3 h-3" /> MEMORY (MB)
                    </Label>
                    <Input
                      type="number"
                      value={formData.memoryLimitMb}
                      onChange={(e) =>
                        setFormData({ ...formData, memoryLimitMb: Number(e.target.value) })
                      }
                      className="rounded-xl border-gray-200 h-10 font-bold"
                    />
                  </div>
                </div>

                {editId ? (
                <div className="space-y-2 pt-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Hạn nộp (tùy chọn)
                  </Label>
                  <Input
                    type="datetime-local"
                    min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
                      .toISOString()
                      .slice(0, 16)}
                    value={
                      formData.dueAt
                        ? new Date(
                            new Date(formData.dueAt).getTime() -
                              new Date().getTimezoneOffset() * 60000,
                          )
                            .toISOString()
                            .slice(0, 16)
                        : ''
                    }
                    onChange={(e) => {
                      const date = e.target.value;
                      setFormData({
                        ...formData,
                        dueAt: date ? new Date(date).toISOString() : undefined,
                      });
                      if (errors.dueAt) setErrors({ ...errors, dueAt: '' });
                    }}
                    className={`rounded-xl border-gray-200 h-10 ${errors.dueAt ? 'border-red-500 bg-red-50' : ''}`}
                  />
                  {errors.dueAt && (
                    <p className="text-[10px] text-red-500 font-medium">{errors.dueAt}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground italic">
                    Chỉ khi đề đã được gán trên ít nhất một lớp; cập nhật sẽ đồng bộ tiêu đề / mô tả / hạn
                    trên các bài gán đó.
                  </p>
                </div>
                ) : null}

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Status</Label>
                      <p className="text-xs text-muted-foreground">Publish to students</p>
                    </div>
                    <Switch
                      checked={formData.isPublished}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isPublished: checked })
                      }
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Languages className="w-4 h-4 text-gray-400" /> Supported Languages
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {['PYTHON', 'JAVASCRIPT', 'CPP', 'JAVA', 'GO', 'RUST'].map((lang) => {
                      const isSelected = formData.supportedLanguages?.includes(lang);
                      return (
                        <Badge
                          key={lang}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`cursor-pointer transition-all hover:scale-105 active:scale-95 ${isSelected ? 'bg-black' : 'text-gray-400'}`}
                          onClick={() => {
                            const current = formData.supportedLanguages || [];
                            const next = isSelected
                              ? current.filter((l) => l !== lang)
                              : [...current, lang];
                            setFormData({ ...formData, supportedLanguages: next });
                          }}
                        >
                          {lang}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={aiSheetOpen} onOpenChange={setAiSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0 h-full max-h-dvh">
          <SheetHeader className="border-b shrink-0 text-left px-4 py-3 pr-12">
            <SheetTitle>Test case từ AI (bản nháp)</SheetTitle>
            <SheetDescription>
              Kiểm tra input/output trước khi ghi vào form. Có thể chỉnh sửa lại sau khi áp dụng.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
            {aiDraftResult ? (
              <>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Model:</span> {aiDraftResult.model}{' '}
                    · <span className="font-medium text-foreground">Provider:</span>{' '}
                    {aiDraftResult.provider}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Prompt:</span>{' '}
                    {aiDraftResult.promptVersion}
                  </p>
                </div>

                {aiDraftResult.parseError ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
                  >
                    <p className="font-medium">Parse</p>
                    <p className="mt-1 whitespace-pre-wrap break-words">{aiDraftResult.parseError}</p>
                  </div>
                ) : null}

                {aiDraftResult.parsed?.notes ? (
                  <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                    <p className="font-medium text-foreground mb-1">Ghi chú AI</p>
                    <p className="whitespace-pre-wrap break-words text-muted-foreground">
                      {aiDraftResult.parsed.notes}
                    </p>
                  </div>
                ) : null}

                {previewMappedCases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Không có test case nào sau khi lọc. Thử bổ sung đề bài rõ hơn hoặc chỉnh ioSpec ở
                    bản sau.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">
                      Xem trước ({previewMappedCases.length} case)
                    </p>
                    {previewMappedCases.map((tc, i) => (
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
                          <p className="font-medium text-muted-foreground mb-0.5">Input</p>
                          <pre className="font-mono whitespace-pre-wrap break-words bg-muted/50 rounded p-2 max-h-28 overflow-y-auto">
                            {tc.input || '(trống)'}
                          </pre>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground mb-0.5">Output</p>
                          <pre className="font-mono whitespace-pre-wrap break-words bg-muted/50 rounded p-2 max-h-28 overflow-y-auto">
                            {tc.expectedOutput || '(trống)'}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            )}
          </div>

          <SheetFooter className="border-t shrink-0 flex-col sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setAiSheetOpen(false)}>
              Đóng
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={previewMappedCases.length === 0}
              onClick={() => applyAiTestCases('append')}
            >
              Thêm vào cuối
            </Button>
            <Button
              type="button"
              disabled={previewMappedCases.length === 0}
              onClick={() => applyAiTestCases('replace')}
            >
              Thay thế toàn bộ
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
