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
  contestsApi,
  problemsApi,
  type Contest,
  type Problem,
  type CreateContestDto,
  type UpdateContestDto,
} from '@/services/auth.apis';
import { Plus, Search, Calendar } from 'lucide-react';

export default function ContestsTab() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<CreateContestDto>({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    testFeedbackPolicy: 'SUMMARY_ONLY',
    maxSubmissionsPerProblem: undefined,
    password: '',
    problems: [],
  });

  const resetForm = () => {
    setEditingContestId(null);
    setFormData({
      title: '',
      description: '',
      startAt: '',
      endAt: '',
      testFeedbackPolicy: 'SUMMARY_ONLY',
      maxSubmissionsPerProblem: undefined,
      password: '',
      problems: [],
    });
  };

  const handleShowCreate = () => {
    resetForm();
    setShowCreateForm(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contestsResult, problemsResult] = await Promise.all([
        contestsApi.findAll({ limit: 50 }),
        problemsApi.findAll({ limit: 100 }),
      ]);
      setContests(contestsResult.items);
      setProblems(problemsResult.items);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingContestId) {
        await contestsApi.update(editingContestId, formData as UpdateContestDto);
      } else {
        await contestsApi.create(formData);
      }
      resetForm();
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to save contest:', error);
    }
  };

  const handleEdit = async (contest: Contest) => {
    try {
      const data = await contestsApi.findById(contest.id);
      setFormData({
        title: data.title,
        description: data.description ?? '',
        startAt: data.startAt.slice(0, 16),
        endAt: data.endAt.slice(0, 16),
        testFeedbackPolicy: data.testFeedbackPolicy,
        maxSubmissionsPerProblem: data.maxSubmissionsPerProblem ?? undefined,
        password: '',
        problems:
          data.problems?.map((item) => ({
            problemId: item.problemId,
            points: item.points,
            orderIndex: item.orderIndex,
            timeLimitMsOverride: item.timeLimitMsOverride ?? undefined,
            memoryLimitMbOverride: item.memoryLimitMbOverride ?? undefined,
          })) ?? [],
      });
      setEditingContestId(contest.id);
      setShowCreateForm(true);
    } catch (error) {
      console.error('Failed to load contest details:', error);
    }
  };

  const handleDelete = async (contestId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa contest này?')) {
      return;
    }
    try {
      await contestsApi.delete(contestId);
      if (editingContestId === contestId) {
        resetForm();
        setShowCreateForm(false);
      }
      loadData();
    } catch (error) {
      console.error('Failed to delete contest:', error);
    }
  };

  const handleCancel = () => {
    resetForm();
    setShowCreateForm(false);
  };

  const addProblemToContest = (problemId: string) => {
    if (!formData.problems?.find((p) => p.problemId === problemId)) {
      setFormData({
        ...formData,
        problems: [
          ...(formData.problems || []),
          { problemId, points: 100, orderIndex: (formData.problems?.length || 0) + 1 },
        ],
      });
    }
  };

  const removeProblemFromContest = (problemId: string) => {
    setFormData({
      ...formData,
      problems: formData.problems?.filter((p) => p.problemId !== problemId) || [],
    });
  };

  const filteredContests = contests.filter(
    (contest) =>
      contest.title.toLowerCase().includes(search.toLowerCase()) ||
      contest.description?.toLowerCase().includes(search.toLowerCase()),
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
            placeholder="Search contests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>
        <Button onClick={handleShowCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Contest
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingContestId ? 'Edit Contest' : 'Create New Contest'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contest title"
                />
              </div>
              <div>
                <Label htmlFor="password">Password (optional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty for public contest"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Contest description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startAt">Start Time</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endAt">End Time</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testFeedbackPolicy">Test Feedback Policy</Label>
                <Select
                  value={formData.testFeedbackPolicy}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, testFeedbackPolicy: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUMMARY_ONLY">Summary Only</SelectItem>
                    <SelectItem value="VERBOSE">Verbose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maxSubmissions">Max Submissions per Problem</Label>
                <Input
                  id="maxSubmissions"
                  type="number"
                  value={formData.maxSubmissionsPerProblem || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxSubmissionsPerProblem: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div>
              <Label>Problems</Label>
              <div className="border rounded-md p-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {formData.problems?.map((contestProblem) => {
                    const problem = problems.find((p) => p.id === contestProblem.problemId);
                    return (
                      <Badge
                        key={contestProblem.problemId}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeProblemFromContest(contestProblem.problemId)}
                      >
                        {problem?.title} (x)
                      </Badge>
                    );
                  })}
                </div>
                <Select
                  onValueChange={(value) => typeof value === 'string' && addProblemToContest(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add problem..." />
                  </SelectTrigger>
                  <SelectContent>
                    {problems
                      .filter((p) => !formData.problems?.find((cp) => cp.problemId === p.id))
                      .map((problem) => (
                        <SelectItem key={problem.id} value={problem.id}>
                          {problem.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingContestId ? 'Save Changes' : 'Create Contest'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contests ({filteredContests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Problems</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContests.map((contest) => (
                <TableRow key={contest.id}>
                  <TableCell className="font-medium">{contest.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contest.status === 'RUNNING'
                          ? 'default'
                          : contest.status === 'ENDED'
                            ? 'secondary'
                            : contest.status === 'PUBLISHED'
                              ? 'outline'
                              : 'destructive'
                      }
                    >
                      {contest.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(contest.startAt).toLocaleString()}</TableCell>
                  <TableCell>{new Date(contest.endAt).toLocaleString()}</TableCell>
                  <TableCell>{contest.problems?.length || 0}</TableCell>
                  <TableCell>{new Date(contest.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(contest)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(contest.id)}
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
