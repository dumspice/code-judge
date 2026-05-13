'use client';

import { useState, useEffect } from 'react';
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
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CreateProblemDto, problemsApi, UpdateProblemDto } from '@/services/problem.apis';
import { ApiRequestError } from '@/services/api-client';

export default function ClassProblemCreate({
  classId,
  adminPortal,
  adminClassRoomOptions,
}: {
  classId?: string;
  adminPortal?: boolean;
  adminClassRoomOptions?: Array<{ id: string; name: string; classCode: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');

  const isAdminPortal = adminPortal === true;
  const showClassPicker =
    isAdminPortal && !editId && (adminClassRoomOptions?.length ?? 0) > 0;

  const [adminClassId, setAdminClassId] = useState(adminClassRoomOptions?.[0]?.id ?? '');

  useEffect(() => {
    if (adminClassRoomOptions?.length) {
      setAdminClassId((prev) =>
        prev && adminClassRoomOptions.some((c) => c.id === prev)
          ? prev
          : adminClassRoomOptions[0].id,
      );
    }
  }, [adminClassRoomOptions]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!editId);

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [aiIoSpec, setAiIoSpec] = useState('');
  const [aiSupplementary, setAiSupplementary] = useState('');

  const [formData, setFormData] = useState<Omit<CreateProblemDto, 'classRoomId'>>({
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

  useEffect(() => {
    if (editId) {
      loadProblem(editId);
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
        dueAt: isAdminPortal
          ? (data.assignments?.[0]?.dueAt ?? undefined)
          : (data.assignments?.find((a) => a.classRoomId === classId)?.dueAt ?? undefined),
      });
      setAiNotes(null);
    } catch (error) {
      console.error('Failed to load problem:', error);
      alert('Failed to load problem data.');
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

  const updateTestCase = (index: number, field: string, value: any) => {
    const updatedTestCases = (formData.testCases || []).map((tc, i) =>
      i === index ? { ...tc, [field]: value } : tc,
    );
    setFormData({
      ...formData,
      testCases: updatedTestCases,
    });
  };

  const handleAiGenerateTestCases = async () => {
    if (formData.mode !== 'ALGO') return;
    const title = formData.title?.trim();
    const statement = [formData.statementMd?.trim(), formData.description?.trim()]
      .filter(Boolean)
      .join('\n\n');
    if (!title) {
      alert('Vui lòng nhập tiêu đề bài trước khi gọi AI.');
      return;
    }
    if (!statement) {
      alert('Vui lòng nhập đề bài (Statement Markdown hoặc mô tả ngắn) để AI sinh testcase.');
      return;
    }
    if ((formData.testCases?.length ?? 0) > 0) {
      const ok = confirm(
        'Đã có testcase thủ công. Thay thế toàn bộ bằng kết quả AI? (Hành động không hoàn tác)',
      );
      if (!ok) return;
    }

    setAiGenerating(true);
    setAiNotes(null);
    try {
      const maxTc = Math.min(Math.max(formData.maxTestCases ?? 10, 1), 100);
      const res = await problemsApi.generateTestCasesDraft({
        title,
        statement,
        difficulty: formData.difficulty,
        timeLimitMs: formData.timeLimitMs,
        memoryLimitMb: formData.memoryLimitMb,
        supportedLanguages: formData.supportedLanguages,
        maxTestCases: maxTc,
        ioSpec: aiIoSpec.trim() || undefined,
        supplementaryText: aiSupplementary.trim() || undefined,
      });

      const cases = res.parsed?.testCases ?? [];
      if (cases.length === 0) {
        const hint = res.parseError ? ` Chi tiết: ${res.parseError}` : '';
        alert(`AI không trả về testcase hợp lệ.${hint}`);
        return;
      }

      setFormData({
        ...formData,
        testCases: cases.map((c) => ({
          input: c.input,
          expectedOutput: c.expectedOutput,
          isHidden: c.isHidden ?? false,
          weight: Math.min(100, Math.max(1, c.weight ?? 1)),
        })),
      });
      setAiNotes(res.parsed?.notes ?? null);
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.body.message : 'Không gọi được AI. Thử lại sau.';
      alert(msg);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert('Please enter a title for the problem.');
      return;
    }

    if (!editId) {
      if (!isAdminPortal && !classId) {
        alert('Thiếu mã lớp.');
        return;
      }
      if (isAdminPortal) {
        if (!adminClassRoomOptions?.length) {
          alert('Chưa có lớp nào trong hệ thống. Hãy tạo lớp trước khi tạo problem.');
          return;
        }
        if (!adminClassId) {
          alert('Vui lòng chọn lớp để gán bài tập.');
          return;
        }
      }
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
        await problemsApi.create({
          ...payload,
          classRoomId: isAdminPortal ? adminClassId : classId!,
        } as CreateProblemDto);
      }
      if (isAdminPortal) {
        router.push('/admin/problems');
      } else {
        router.push(`/dashboard/${classId}/classwork`);
      }
    } catch (error) {
      console.error('Failed to save problem:', error);
      alert('Failed to save problem. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Loading problem data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {editId ? 'Edit Problem' : 'Create Problem'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {editId
                ? 'Update the details of your existing problem.'
                : 'Design a new challenge for your students.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              if (isAdminPortal) {
                router.push('/admin/problems');
              } else {
                router.back();
              }
            }}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancel
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
                {editId ? 'Update Problem' : 'Save Problem'}
              </>
            )}
          </Button>
        </div>
      </div>

      {isAdminPortal && !editId && !adminClassRoomOptions?.length ? (
        <Card className="border-amber-200 bg-amber-50/80">
          <CardContent className="py-4 text-sm text-amber-900">
            Chưa có lớp hoạt động nào. Tạo lớp trong hệ thống trước khi tạo problem mới từ trang
            admin.
          </CardContent>
        </Card>
      ) : null}

      {showClassPicker ? (
        <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg">Gán vào lớp</CardTitle>
            <CardDescription>Problem mới sẽ được thêm vào bài tập của lớp đã chọn.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="max-w-md space-y-2">
              <Label>Lớp</Label>
              <Select
                value={adminClassId}
                onValueChange={(v) => {
                  if (v) setAdminClassId(v);
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent>
                  {adminClassRoomOptions!.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{' '}
                      <span className="text-muted-foreground">({c.classCode})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ) : null}

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
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Find the Maximum Sum Subarray"
                  className="text-lg font-medium h-12 rounded-xl border-gray-200 focus:border-black transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Brief Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A short summary of what the problem is about..."
                  className="min-h-[80px] rounded-xl border-gray-200 focus:border-black transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="statementMd" className="text-sm font-semibold">
                  Full Problem Statement (Markdown)
                </Label>
                <Textarea
                  id="statementMd"
                  value={formData.statementMd}
                  onChange={(e) => setFormData({ ...formData, statementMd: e.target.value })}
                  placeholder="Describe the problem, input format, output format, and constraints in detail..."
                  className="min-h-[300px] rounded-xl border-gray-200 focus:border-black transition-all font-mono text-sm leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl">Test Cases</CardTitle>
                <CardDescription>
                  Add examples and hidden test cases for evaluation.
                  {formData.mode === 'ALGO'
                    ? ' Bạn có thể dùng AI sinh bản nháp từ tiêu đề và đề bài, rồi chỉnh sửa trước khi lưu.'
                    : ' Sinh testcase bằng AI chỉ khả dụng khi chế độ bài là Algorithmic (ALGO).'}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={formData.mode !== 'ALGO' || aiGenerating || loading}
                  onClick={handleAiGenerateTestCases}
                  className="rounded-lg cursor-pointer gap-2"
                >
                  {aiGenerating ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  AI sinh testcase
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
              {formData.mode === 'ALGO' ? (
                <details className="mb-6 rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-3 text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700">
                    Tùy chọn cho AI (IO spec, tài liệu bổ sung)
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-io-spec">Định dạng vào/ra (tùy chọn)</Label>
                      <Textarea
                        id="ai-io-spec"
                        value={aiIoSpec}
                        onChange={(e) => setAiIoSpec(e.target.value)}
                        placeholder="Ví dụ: Dòng 1: n. Dòng 2..n+1: a[i]. In ra một số duy nhất..."
                        className="min-h-[72px] rounded-xl border-gray-200 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ai-supplementary">Bổ sung / ràng buộc thêm (tùy chọn)</Label>
                      <Textarea
                        id="ai-supplementary"
                        value={aiSupplementary}
                        onChange={(e) => setAiSupplementary(e.target.value)}
                        placeholder="Ghi chú thêm cho AI: biên dữ liệu, mod, v.v."
                        className="min-h-[72px] rounded-xl border-gray-200 text-xs"
                      />
                    </div>
                  </div>
                </details>
              ) : null}

              {aiNotes ? (
                <p className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs text-indigo-900">
                  <span className="font-semibold">Ghi chú từ AI: </span>
                  {aiNotes}
                </p>
              ) : null}

              <div className="space-y-4">
                {formData.testCases?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl bg-gray-50/50 text-gray-400">
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
                            onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                            placeholder="Input for this case"
                            className="min-h-[100px] rounded-xl border-gray-200 focus:border-black bg-white font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Expected Output
                          </Label>
                          <Textarea
                            value={tc.expectedOutput}
                            onChange={(e) =>
                              updateTestCase(index, 'expectedOutput', e.target.value)
                            }
                            placeholder="Expected output"
                            className="min-h-[100px] rounded-xl border-gray-200 focus:border-black bg-white font-mono text-xs"
                          />
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

                <div className="space-y-2 pt-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Due Date (Optional)
                  </Label>
                  <Input
                    type="datetime-local"
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
                    }}
                    className="rounded-xl border-gray-200 h-10"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Students will see this as the deadline.
                  </p>
                </div>

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
    </div>
  );
}
