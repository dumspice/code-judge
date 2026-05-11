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
  problemsApi,
  type Problem,
  type CreateProblemDto,
  type UpdateProblemDto,
} from '@/services/auth.apis';
import { 
  Plus, Search, Edit2, Trash2, Clock, Trophy, MoreVertical, 
  Beaker, Database, Globe, Lock, Save, Languages, ArrowLeft 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ClassProblemsTab({ classId }: { classId: string }) {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState<CreateProblemDto>({
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
  });

  const resetForm = () => {
    setEditingProblemId(null);
    setFormData({
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
    });
  };

  const handleShowCreate = () => {
    resetForm();
    setShowCreateForm(true);
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const result = await problemsApi.findAll({ limit: 50 });
      setProblems(result.items);
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (problem: Problem) => {
    try {
      const data = await problemsApi.findById(problem.id);
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
        testCases: data.testCases ?? [],
      });
      setEditingProblemId(problem.id);
      setShowCreateForm(true);
    } catch (error) {
      console.error('Failed to load problem details:', error);
    }
  };

  const handleDelete = async (problemId: string) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) {
      return;
    }
    try {
      await problemsApi.delete(problemId);
      loadProblems();
    } catch (error) {
      console.error('Failed to delete problem:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      alert('Please enter a title for the problem.');
      return;
    }
    
    setFormLoading(true);
    try {
      if (editingProblemId) {
        await problemsApi.update(editingProblemId, formData as UpdateProblemDto);
      } else {
        await problemsApi.create(formData);
      }
      setShowCreateForm(false);
      resetForm();
      loadProblems();
    } catch (error) {
      console.error('Failed to save problem:', error);
      alert('Failed to save problem. Please check your inputs.');
    } finally {
      setFormLoading(false);
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

  const filteredProblems = problems.filter(
    (problem) =>
      problem.title.toLowerCase().includes(search.toLowerCase()) ||
      problem.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Easy</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Medium</Badge>;
      case 'HARD':
        return <Badge className="bg-rose-500 hover:bg-rose-600">Hard</Badge>;
      default:
        return <Badge variant="secondary">{difficulty}</Badge>;
    }
  };

  if (loading && problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Loading problems...</p>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowCreateForm(false)}
              className="rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {editingProblemId ? 'Edit Problem' : 'Create Problem'}
              </h1>
              <p className="text-muted-foreground text-lg">
                {editingProblemId ? 'Update your existing problem.' : 'Design a new challenge for your students.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowCreateForm(false)} disabled={formLoading} className="cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={formLoading} className="cursor-pointer bg-black hover:bg-gray-800 text-white min-w-[120px]">
              {formLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingProblemId ? 'Update Problem' : 'Save Problem'}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="text-xl">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold">Problem Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Find the Maximum Sum Subarray"
                    className="text-lg font-medium h-12 rounded-xl border-gray-200 focus:border-black transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">Brief Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="A short summary of what the problem is about..."
                    className="min-h-[80px] rounded-xl border-gray-200 focus:border-black transition-all resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statementMd" className="text-sm font-semibold">Full Problem Statement (Markdown)</Label>
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
              <CardHeader className="border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Test Cases</CardTitle>
                  <CardDescription>Add examples and hidden test cases for evaluation.</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addTestCase} className="rounded-lg cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Case
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {formData.testCases?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl bg-gray-50/50 text-gray-400">
                      <Beaker className="w-12 h-12 mb-3 opacity-20" />
                      <p className="font-medium">No test cases added yet.</p>
                    </div>
                  ) : (
                    formData.testCases?.map((tc, index) => (
                      <div key={index} className="group relative border border-gray-100 rounded-2xl p-5 bg-gray-50/30 hover:bg-white hover:shadow-lg transition-all duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Input</Label>
                            <Textarea
                              value={tc.input}
                              onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                              className="min-h-[100px] rounded-xl border-gray-200 focus:border-black bg-white font-mono text-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Expected Output</Label>
                            <Textarea
                              value={tc.expectedOutput}
                              onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                              className="min-h-[100px] rounded-xl border-gray-200 focus:border-black bg-white font-mono text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={tc.isHidden}
                                onCheckedChange={(checked) => updateTestCase(index, 'isHidden', checked)}
                                className="cursor-pointer"
                              />
                              <Label className="text-sm font-medium flex items-center gap-1.5">
                                {tc.isHidden ? 'Hidden' : 'Public'}
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs font-bold text-gray-500">Weight:</Label>
                              <Input
                                type="number"
                                value={tc.weight}
                                onChange={(e) => updateTestCase(index, 'weight', Number(e.target.value))}
                                className="w-16 h-8 rounded-lg border-gray-200 text-center font-bold"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTestCase(index)}
                            className="text-gray-400 hover:text-red-500 rounded-lg h-8 px-2 transition-colors"
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
                        <SelectItem value="EASY">Easy</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HARD">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500">TIME (ms)</Label>
                      <Input
                        type="number"
                        value={formData.timeLimitMs}
                        onChange={(e) => setFormData({ ...formData, timeLimitMs: Number(e.target.value) })}
                        className="rounded-xl border-gray-200 h-10 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500">MEMORY (MB)</Label>
                      <Input
                        type="number"
                        value={formData.memoryLimitMb}
                        onChange={(e) => setFormData({ ...formData, memoryLimitMb: Number(e.target.value) })}
                        className="rounded-xl border-gray-200 h-10 font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Published</Label>
                      <Switch 
                        checked={formData.isPublished}
                        onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Languages className="w-4 h-4 text-gray-400" /> Languages
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {['PYTHON', 'JAVASCRIPT', 'CPP', 'JAVA'].map(lang => {
                        const isSelected = formData.supportedLanguages?.includes(lang);
                        return (
                          <Badge 
                            key={lang}
                            variant={isSelected ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              const current = formData.supportedLanguages || [];
                              const next = isSelected 
                                ? current.filter(l => l !== lang)
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Class Problems</h2>
          <p className="text-muted-foreground">Manage the bank of problems for your students.</p>
        </div>
        <Button onClick={handleShowCreate} className="bg-black hover:bg-gray-800 text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          New Problem
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-full max-w-md">
        <div className="pl-3">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        <Input
          placeholder="Search problems..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 focus-visible:ring-0 shadow-none bg-transparent"
        />
      </div>

      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="py-4 font-bold text-black pl-6">Title</TableHead>
                <TableHead className="py-4 font-bold text-black">Difficulty</TableHead>
                <TableHead className="py-4 font-bold text-black">Mode</TableHead>
                <TableHead className="py-4 font-bold text-black">Status</TableHead>
                <TableHead className="py-4 font-bold text-black text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProblems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                      <Trophy className="w-12 h-12" />
                      <p className="text-lg font-medium">No problems found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProblems.map((problem) => (
                  <TableRow key={problem.id} className="group hover:bg-black/[0.02] transition-colors">
                    <TableCell className="py-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 group-hover:text-black transition-colors">{problem.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{problem.description || 'No description'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {getDifficultyBadge(problem.difficulty)}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="text-xs font-medium uppercase tracking-wider">{problem.mode}</Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant={problem.isPublished ? 'default' : 'secondary'}>
                        {problem.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 cursor-pointer">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-xl border-gray-100">
                          <DropdownMenuItem 
                            onClick={() => handleEdit(problem)}
                            className="rounded-lg gap-2 cursor-pointer py-2"
                          >
                            <Edit2 className="w-4 h-4" /> Edit Problem
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(problem.id)}
                            className="rounded-lg gap-2 cursor-pointer py-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" /> Delete Problem
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
