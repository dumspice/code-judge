/**
 * Reusable API client for Core API.
 *
 * Features:
 *  - Attaches accessToken from memory on every request.
 *  - Auto-refreshes token on 401 and retries the original request once.
 *  - Token storage: accessToken in-memory only; refreshToken in HttpOnly cookie (managed by browser).
 */

import { getPublicCoreUrl } from '@/lib/public-config';

const BASE_URL = getPublicCoreUrl();

// ---------------------------------------------------------------------------
// In-memory token store (not persisted across page refresh — refreshToken
// in localStorage will recover it).
// ---------------------------------------------------------------------------

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** Clear all auth state (logout). */
export function clearTokens() {
  accessToken = null;
}

// Refresh logic

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const data = await res.json();
      // The response is wrapped in envelope: { result: { accessToken, refreshToken } }
      const result = data.result ?? data;
      setAccessToken(result.accessToken);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Core fetch wrapper

export interface ApiError {
  code: number;
  message: string;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
  ) {
    super(body.message);
    this.name = 'ApiRequestError';
  }
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * Wrapper around `fetch` with auto-auth and retry on 401.
 *
 * Returns the unwrapped `result` from the API envelope.
 */
export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const doFetch = async (): Promise<Response> => {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  };

  let res = await doFetch();

  // Auto refresh on 401
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await doFetch();
    }
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiRequestError(res.status, {
      code: res.status,
      message: data?.message ?? res.statusText,
    });
  }

  // Unwrap envelope { result: T }
  return (data?.result ?? data) as T;
}

// Auth-specific API calls

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

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

export interface Contest {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  startAt: string;
  endAt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'RUNNING' | 'ENDED';
  testFeedbackPolicy: 'SUMMARY_ONLY' | 'VERBOSE';
  maxSubmissionsPerProblem: number | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  problems?: Array<{
    problemId: string;
    orderIndex: number;
    points: number;
    timeLimitMsOverride: number | null;
    memoryLimitMbOverride: number | null;
    problem: Problem;
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

export interface CreateSubmissionDto {
  userId: string;
  problemId: string;
  contestId?: string;
  mode: 'ALGO' | 'PROJECT';
  language?: string;
  sourceCode?: string;
  sourceCodeObjectKey?: string;
}

export interface Submission {
  id: string;
  status: string;
  score: number | null;
  error: string | null;
  logs?: string | null;
  caseResults?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContestDto {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  testFeedbackPolicy?: 'SUMMARY_ONLY' | 'VERBOSE';
  maxSubmissionsPerProblem?: number;
  password?: string;
  problems?: Array<{
    problemId: string;
    points?: number;
    orderIndex?: number;
    timeLimitMsOverride?: number;
    memoryLimitMbOverride?: number;
  }>;
}

export interface UpdateContestDto {
  title?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  testFeedbackPolicy?: 'SUMMARY_ONLY' | 'VERBOSE';
  maxSubmissionsPerProblem?: number;
  password?: string;
  problems?: Array<{
    problemId: string;
    points?: number;
    orderIndex?: number;
    timeLimitMsOverride?: number;
    memoryLimitMbOverride?: number;
  }>;
}

export const authApi = {
  async register(name: string, email: string, password: string): Promise<AuthTokens> {
    const tokens = await apiFetch<AuthTokens>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    setAccessToken(tokens.accessToken);
    return tokens;
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    const tokens = await apiFetch<AuthTokens>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setAccessToken(tokens.accessToken);
    return tokens;
  },

  async me(): Promise<UserProfile> {
    return apiFetch<UserProfile>('/auth/me');
  },

  async logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      clearTokens();
      setAccessToken(null);
    }
  },

  /** Google OAuth: redirect browser to backend /auth/google. */
  googleLogin() {
    window.location.href = `${BASE_URL}/auth/google`;
  },

  async refreshSession(): Promise<boolean> {
    return tryRefresh();
  },
};

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

export const contestsApi = {
  async findAll(query?: { search?: string; page?: number; limit?: number }): Promise<{
    items: Contest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (query?.search) params.set('search', query.search);
    if (query?.page) params.set('page', query.page.toString());
    if (query?.limit) params.set('limit', query.limit.toString());
    const queryString = params.toString();
    return apiFetch(`/contests${queryString ? `?${queryString}` : ''}`);
  },

  async findById(id: string): Promise<Contest> {
    return apiFetch(`/contests/${id}`);
  },

  async create(dto: CreateContestDto): Promise<Contest> {
    return apiFetch('/contests', {
      method: 'POST',
      body: dto,
    });
  },

  async update(id: string, dto: UpdateContestDto): Promise<Contest> {
    return apiFetch(`/contests/${id}`, {
      method: 'PATCH',
      body: dto,
    });
  },

  async delete(id: string): Promise<void> {
    return apiFetch(`/contests/${id}`, {
      method: 'DELETE',
    });
  },
};

export interface PresignUploadResponse {
  bucket: string;
  objectKey: string;
  uploadUrl: string;
}

export const storageApi = {
  async presignUpload(body: {
    resourceKind: 'submission-source';
    submissionId: string;
    fileName: string;
    expiresInSeconds?: number;
  }): Promise<PresignUploadResponse> {
    return apiFetch('/storage/presign/upload', {
      method: 'POST',
      body,
    });
  },
};

export const submissionsApi = {
  async create(dto: CreateSubmissionDto): Promise<{ submissionId: string; status: string }> {
    return apiFetch('/submissions', {
      method: 'POST',
      body: dto,
    });
  },

  async findById(id: string): Promise<Submission> {
    return apiFetch(`/submissions/${id}`);
  },

  async findAll(query?: { userId?: string; problemId?: string }): Promise<Submission[]> {
    const params = new URLSearchParams();
    if (query?.userId) params.set('userId', query.userId);
    if (query?.problemId) params.set('problemId', query.problemId);
    const queryString = params.toString();
    return apiFetch(`/submissions${queryString ? `?${queryString}` : ''}`);
  },
};
