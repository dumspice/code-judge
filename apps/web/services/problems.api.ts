import { apiFetch } from './api-client';

export interface Problem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  statementMd: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  mode: 'ALGO' | 'PROJECT';
  timeLimitMs: number;
  memoryLimitMb: number;
  isPublished: boolean;
  visibility: 'PRIVATE' | 'PUBLIC' | 'CONTEST_ONLY';
  supportedLanguages: string[] | null;
  maxTestCases: number;
  creatorId: string | null;
  createdAt: string;
  updatedAt: string;
  testCases?: Array<{
    id: string;
    orderIndex: number;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    weight: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface CreateProblemDto {
  title: string;
  description?: string;
  statementMd?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  mode?: 'ALGO' | 'PROJECT';
  timeLimitMs?: number;
  memoryLimitMb?: number;
  isPublished?: boolean;
  visibility?: 'PRIVATE' | 'PUBLIC' | 'CONTEST_ONLY';
  supportedLanguages?: string[];
  maxTestCases?: number;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
    weight?: number;
  }>;
}

/** Body for admin AI testcase draft (matches core-api GenerateAiTestcaseDto). */
export interface GenerateTestCasesDraftDto {
  title: string;
  statement: string;
  difficulty?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  supportedLanguages?: string[];
  maxTestCases?: number;
  ioSpec?: string;
  supplementaryText?: string;
  provider?: 'openai' | 'google';
  model?: string;
  revision?: {
    promptVersionUsed?: string;
    previousOutputSummary?: string;
    userFeedback?: string;
    validatorIssues?: string[];
  };
}

export interface GenerateTestCasesDraftResult {
  provider: 'openai' | 'google';
  model: string;
  promptVersion: string;
  raw: string;
  parsed: {
    testCases: Array<{
      input: string;
      expectedOutput: string;
      isHidden?: boolean;
      weight?: number;
      explanation?: string;
    }>;
    notes?: string;
    revisionNotes?: string;
  } | null;
  parseError?: string;
}

export interface UpdateProblemDto {
  title?: string;
  description?: string;
  statementMd?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  mode?: 'ALGO' | 'PROJECT';
  timeLimitMs?: number;
  memoryLimitMb?: number;
  isPublished?: boolean;
  visibility?: 'PRIVATE' | 'PUBLIC' | 'CONTEST_ONLY';
  supportedLanguages?: string[];
  maxTestCases?: number;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
    weight?: number;
  }>;
}

export const problemsApi = {
  async findAll(query?: { search?: string; page?: number; limit?: number }): Promise<{
    items: Problem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (query?.search) params.set('search', query.search);
    if (query?.page) params.set('page', query.page.toString());
    if (query?.limit) params.set('limit', query.limit.toString());
    const queryString = params.toString();
    return apiFetch(`/problems${queryString ? `?${queryString}` : ''}`);
  },

  async findById(id: string): Promise<Problem> {
    return apiFetch(`/problems/${id}`);
  },

  async generateTestCasesDraft(
    dto: GenerateTestCasesDraftDto,
  ): Promise<GenerateTestCasesDraftResult> {
    return apiFetch('/problems/generate-test-cases-draft', {
      method: 'POST',
      body: dto,
    });
  },

  async create(dto: CreateProblemDto): Promise<Problem> {
    return apiFetch('/problems', {
      method: 'POST',
      body: dto,
    });
  },

  async update(id: string, dto: UpdateProblemDto): Promise<Problem> {
    return apiFetch(`/problems/${id}`, {
      method: 'PATCH',
      body: dto,
    });
  },

  async delete(id: string): Promise<void> {
    return apiFetch(`/problems/${id}`, {
      method: 'DELETE',
    });
  },
};
