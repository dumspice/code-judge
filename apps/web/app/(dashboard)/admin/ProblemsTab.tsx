'use client';

import { useState, useEffect } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  problemsApi,
  type Problem,
  type CreateProblemDto,
  type UpdateProblemDto,
} from '@/services/api';
import { Plus, Search } from 'lucide-react';

export default function ProblemsTab() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
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
    supportedLanguages: ['PYTHON', 'JAVASCRIPT'],
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
      supportedLanguages: ['PYTHON', 'JAVASCRIPT'],
      maxTestCases: 100,
      testCases: [],
    });
  };

  const handleShowCreate = () => {
    resetForm();
    setShowCreateForm(true);
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
        supportedLanguages: data.supportedLanguages ?? ['PYTHON', 'JAVASCRIPT'],
        maxTestCases: data.maxTestCases,
        testCases: data.testCases ?? [],
      });
      setEditingProblemId(problem.id);
      setShowCreateForm(true);
    } catch (error) {
      console.error('Failed to load problem details:', error);
    }
  };

  const handleCancel = () => {
    resetForm();
    setShowCreateForm(false);
  };

  useEffect(() => {
    loadProblems();
  }, []);

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

  const loadProblems = async () => {
    try {
      const result = await problemsApi.findAll({ limit: 50 });
      setProblems(result.items);
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingProblemId) {
        await problemsApi.update(editingProblemId, formData);
      } else {
        await problemsApi.create(formData);
      }
      handleCancel();
      loadProblems();
    } catch (error) {
      console.error('Failed to save problem:', error);
    }
  };

  const handleDelete = async (problemId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa problem này?')) {
      return;
    }
    try {
      await problemsApi.delete(problemId);
      if (editingProblemId === problemId) {
        handleCancel();
      }
      loadProblems();
    } catch (error) {
      console.error('Failed to delete problem:', error);
    }
  };

  const filteredProblems = problems.filter(
    (problem) =>
      problem.title.toLowerCase().includes(search.toLowerCase()) ||
      problem.description?.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4" />
          <Input
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>
        <Button onClick={handleShowCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Problem
        </Button>
      </div>

      {showCreateForm && (
        <Card className="border-2 border-dashed border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {editingProblemId ? 'Edit Problem' : 'Create New Problem'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Problem title"
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Problem description"
              />
            </div>

            <div>
              <Label htmlFor="statementMd">Statement (Markdown)</Label>
              <Textarea
                id="statementMd"
                value={formData.statementMd}
                onChange={(e) => setFormData({ ...formData, statementMd: e.target.value })}
                placeholder="Problem statement in markdown"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="timeLimit">Time Limit (ms)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={formData.timeLimitMs}
                  onChange={(e) =>
                    setFormData({ ...formData, timeLimitMs: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="memoryLimit">Memory Limit (MB)</Label>
                <Input
                  id="memoryLimit"
                  type="number"
                  value={formData.memoryLimitMb}
                  onChange={(e) =>
                    setFormData({ ...formData, memoryLimitMb: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxTestCases">Max Test Cases</Label>
                <Input
                  id="maxTestCases"
                  type="number"
                  value={formData.maxTestCases}
                  onChange={(e) =>
                    setFormData({ ...formData, maxTestCases: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Test Cases</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTestCase}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Test Case
                </Button>
              </div>
              <div className="space-y-2">
                {(formData.testCases || []).map((tc, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`input-${index}`}>Input</Label>
                        <Textarea
                          id={`input-${index}`}
                          value={tc.input}
                          onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                          placeholder="Test case input"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`output-${index}`}>Expected Output</Label>
                        <Textarea
                          id={`output-${index}`}
                          value={tc.expectedOutput}
                          onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                          placeholder="Expected output"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`hidden-${index}`}
                            checked={tc.isHidden}
                            onChange={(e) => updateTestCase(index, 'isHidden', e.target.checked)}
                          />
                          <Label htmlFor={`hidden-${index}`}>Hidden</Label>
                        </div>
                        <div>
                          <Label htmlFor={`weight-${index}`}>Weight</Label>
                          <Input
                            id={`weight-${index}`}
                            type="number"
                            value={tc.weight}
                            onChange={(e) =>
                              updateTestCase(index, 'weight', Number(e.target.value))
                            }
                            className="w-20"
                            min="1"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTestCase(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={handleCancel} className="px-6">
                Cancel
              </Button>
              <Button onClick={handleSave} className="px-6">
                <Plus className="w-4 h-4 mr-2" />
                {editingProblemId ? 'Save Changes' : 'Create Problem'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Problems ({filteredProblems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Time Limit</TableHead>
                <TableHead>Memory Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProblems.map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell className="font-medium">{problem.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        problem.difficulty === 'EASY'
                          ? 'default'
                          : problem.difficulty === 'MEDIUM'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {problem.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>{problem.mode}</TableCell>
                  <TableCell>{problem.timeLimitMs}ms</TableCell>
                  <TableCell>{problem.memoryLimitMb}MB</TableCell>
                  <TableCell>
                    <Badge variant={problem.isPublished ? 'default' : 'secondary'}>
                      {problem.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(problem.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(problem)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(problem.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
