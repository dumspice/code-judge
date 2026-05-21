'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { CreateProblemDto, problemsApi, UpdateProblemDto } from '@/services/problem.apis';
import { toast } from 'sonner';
import { ProblemTagPicker } from '@/components/problems/ProblemTagPicker';
import { GenerateCodeTemplatesButton } from '@/components/problems/GenerateCodeTemplatesButton';
import { SupportedLanguagesPicker } from '@/components/problems/SupportedLanguagesPicker';
import { StarterTemplateMonacoField } from '@/components/problems/StarterTemplateMonacoField';
import { SUPPORTED_LANGUAGES } from '@/lib/supported-languages';
import { useSupportedLanguagesWithTemplates } from '@/hooks/use-supported-languages-with-templates';

export default function AdminProblemEditor({ problemId }: { problemId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!problemId);
  const [activeTemplateLang, setActiveTemplateLang] = useState<string>('PYTHON');

  const [formData, setFormData] = useState<Partial<CreateProblemDto>>({
    title: '',
    description: '',
    statementMd: '',
    difficulty: 'EASY',
    mode: 'ALGO',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    isPublished: true,
    supportedLanguages: Array.from(SUPPORTED_LANGUAGES),
    maxTestCases: 100,
    testCases: [],
    tagIds: [],
    templateCode: {},
  });

  const { handleLanguagesChange, loading: langPickerLoading } = useSupportedLanguagesWithTemplates({
    supportedLanguages: formData.supportedLanguages ?? [],
    templateCode: (formData.templateCode as Record<string, string>) ?? {},
    testCases: formData.testCases,
    activeTemplateLang,
    setActiveTemplateLang,
    onUpdate: (patch) => setFormData((prev) => ({ ...prev, ...patch })),
  });

  useEffect(() => {
    if (problemId) {
      loadProblem(problemId);
    }
  }, [problemId]);

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
        supportedLanguages: data.supportedLanguages ?? Array.from(SUPPORTED_LANGUAGES),
        maxTestCases: data.maxTestCases,
        testCases: (data.testCases ?? []).map(
          ({ id, problemId, orderIndex, createdAt, updatedAt, ...rest }: any) => rest,
        ),
        tagIds: (data.tags ?? []).map((t: any) => t.tag.id),
        templateCode: data.templateCode ?? {},
      });
      if (data.supportedLanguages && data.supportedLanguages.length > 0) {
        setActiveTemplateLang(data.supportedLanguages[0]);
      }
    } catch (error) {
      toast.error('Failed to load problem data');
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

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }

    setLoading(true);
    try {
      if (problemId) {
        await problemsApi.update(problemId, formData as UpdateProblemDto);
        toast.success('Problem updated successfully');
      } else {
        await problemsApi.create(formData as CreateProblemDto);
        toast.success('Problem created successfully');
      }
      router.push('/admin/problems');
    } catch (error) {
      toast.error('Failed to save problem');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading problem details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {problemId ? 'Edit Problem' : 'New Problem'}
            </h1>
            <p className="text-slate-500">
              {problemId
                ? 'Update your coding challenge details'
                : 'Create a new challenge for the platform'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 min-w-[140px]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {problemId ? 'Update' : 'Create'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg">Content</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Problem name..."
                  className="h-11 rounded-lg border-slate-200 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short summary..."
                  className="min-h-[80px] rounded-lg border-slate-200 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="statementMd" className="text-sm font-semibold">
                  Statement (Markdown)
                </Label>
                <Textarea
                  id="statementMd"
                  value={formData.statementMd}
                  onChange={(e) => setFormData({ ...formData, statementMd: e.target.value })}
                  placeholder="Detailed instructions..."
                  className="min-h-[300px] rounded-lg border-slate-200 focus:ring-indigo-500 font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Starter Code Templates Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Starter Code Templates (Mẫu code khởi đầu)</CardTitle>
                <CardDescription>
                  AI chỉ sinh khung đọc input và hàm solve trống — học viên tự viết logic. Để trống sẽ dùng boilerplate mặc định khi làm bài.
                </CardDescription>
              </div>
              <GenerateCodeTemplatesButton
                className="shrink-0 rounded-lg"
                title={formData.title ?? ''}
                statementMd={formData.statementMd ?? ''}
                supportedLanguages={formData.supportedLanguages ?? []}
                onGenerated={(templates) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateCode: { ...(prev.templateCode ?? {}), ...templates },
                  }))
                }
              />
            </CardHeader>
            <CardContent className="p-6">
              {!formData.supportedLanguages || formData.supportedLanguages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-sm">
                  <Languages className="w-10 h-10 mb-2 opacity-25" />
                  <p>Please select supported languages in Settings first</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Language Tab List */}
                  <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                    {formData.supportedLanguages.map((lang) => {
                      const isActive = activeTemplateLang === lang;
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setActiveTemplateLang(lang)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>

                  {activeTemplateLang && (
                    <StarterTemplateMonacoField
                      language={activeTemplateLang}
                      templateCode={(formData.templateCode as Record<string, string>) ?? {}}
                      testCases={formData.testCases}
                      onTemplateChange={(templateCode) =>
                        setFormData((prev) => ({ ...prev, templateCode }))
                      }
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Test Cases</CardTitle>
                <CardDescription>Configure validation tests</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTestCase}
                className="rounded-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {formData.testCases?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400">
                    <Beaker className="w-12 h-12 mb-2 opacity-20" />
                    <p>No test cases defined yet</p>
                  </div>
                ) : (
                  formData.testCases?.map((tc, index) => (
                    <div
                      key={index}
                      className="border border-slate-100 rounded-xl p-5 bg-slate-50/30 space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-400 uppercase">
                            Input
                          </Label>
                          <Textarea
                            value={tc.input}
                            onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                            className="min-h-[80px] rounded-lg border-slate-200 bg-white font-mono text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-400 uppercase">
                            Output
                          </Label>
                          <Textarea
                            value={tc.expectedOutput}
                            onChange={(e) =>
                              updateTestCase(index, 'expectedOutput', e.target.value)
                            }
                            className="min-h-[80px] rounded-lg border-slate-200 bg-white font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={tc.isHidden}
                              onCheckedChange={(checked) =>
                                updateTestCase(index, 'isHidden', checked)
                              }
                            />
                            <Label className="text-sm font-medium">
                              {tc.isHidden ? 'Hidden' : 'Public'}
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-bold text-slate-400">Weight</Label>
                            <Input
                              type="number"
                              value={tc.weight}
                              onChange={(e) =>
                                updateTestCase(index, 'weight', Number(e.target.value))
                              }
                              className="w-16 h-8 rounded-lg text-center font-bold"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTestCase(index)}
                          className="text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-slate-200 shadow-sm overflow-hidden sticky top-24">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Time (ms)
                    </Label>
                    <Input
                      type="number"
                      value={formData.timeLimitMs}
                      onChange={(e) =>
                        setFormData({ ...formData, timeLimitMs: Number(e.target.value) })
                      }
                      className="rounded-lg font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Database className="w-3 h-3" /> Mem (MB)
                    </Label>
                    <Input
                      type="number"
                      value={formData.memoryLimitMb}
                      onChange={(e) =>
                        setFormData({ ...formData, memoryLimitMb: Number(e.target.value) })
                      }
                      className="rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Published</Label>
                    <p className="text-xs text-slate-500">Live status</p>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPublished: checked })
                    }
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <ProblemTagPicker
                    value={formData.tagIds || []}
                    onChange={(ids) => setFormData({ ...formData, tagIds: ids })}
                    label="Problem Tags"
                    hint="Select tags that match this problem type."
                    locale="en"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <SupportedLanguagesPicker
                    value={formData.supportedLanguages ?? []}
                    onChange={(langs) => void handleLanguagesChange(langs)}
                    disabled={langPickerLoading}
                    label="Languages"
                    hint="Bật thêm ngôn ngữ sẽ tự điền starter template mặc định."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
