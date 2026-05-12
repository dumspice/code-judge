/**
 * Core API barrel: HTTP client re-exports, auth endpoints, and domain API clients.
 */

import {
  apiFetch,
  clearTokens,
  getApiBaseUrl,
  setAccessToken,
  tryRefresh,
} from './api-client';

export {
  apiFetch,
  ApiRequestError,
  clearTokens,
  getAccessToken,
  getApiBaseUrl,
  setAccessToken,
  type ApiError,
} from './api-client';

// ---------------------------------------------------------------------------
// Token storage is now strictly cookie-based (HttpOnly).
// ---------------------------------------------------------------------------

// Refresh logic

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(headers?: Headers): Promise<boolean> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshHeaders = new Headers({ 'Content-Type': 'application/json' });
      if (headers?.has('Cookie')) {
        refreshHeaders.set('Cookie', headers.get('Cookie')!);
      }

      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: refreshHeaders,
        credentials: 'include',
      });

      if (!res.ok) {
        return false;
      }
      return true;
    } catch {
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
    const refreshed = await tryRefresh(new Headers(options.headers));
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

export interface AuthSuccess {
  success: boolean;
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

export const authApi = {
  async register(name: string, email: string, password: string): Promise<AuthSuccess> {
    return apiFetch<AuthSuccess>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
  },

  async login(email: string, password: string): Promise<AuthSuccess> {
    return apiFetch<AuthSuccess>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  async me(): Promise<UserProfile> {
    return apiFetch<UserProfile>('/auth/me');
  },

  async logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      // Cookies are cleared by the backend
    }
  },

  googleLogin() {
    window.location.href = `${getApiBaseUrl()}/auth/google`;
  },

  async refreshSession(): Promise<boolean> {
    return tryRefresh();
  },
};

// ---------------------------------------------------------------------------
// Other domains (split modules)
// ---------------------------------------------------------------------------

export {
  problemsApi,
  type CreateProblemDto,
  type GenerateTestCasesDraftDto,
  type GenerateTestCasesDraftResult,
  type Problem,
  type UpdateProblemDto,
} from './problems.api';

export {
  contestsApi,
  type Contest,
  type CreateContestDto,
  type UpdateContestDto,
} from './contests.api';

export { submissionsApi, type CreateSubmissionDto, type Submission } from './submissions.api';

export { storageApi, type PresignUploadResponse } from './storage.api';
