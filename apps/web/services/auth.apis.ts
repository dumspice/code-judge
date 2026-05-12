/**
 * Auth API helpers and barrel re-exports (HTTP client lives in `api-client.ts`).
 */

import { apiFetch, getApiBaseUrl, tryRefresh } from './api-client';

export {
  apiFetch,
  ApiRequestError,
  getApiBaseUrl,
  tryRefresh,
  type ApiError,
} from './api-client';

// ---------------------------------------------------------------------------
// Auth-specific API calls (session = HttpOnly cookies, credentials: 'include')
// ---------------------------------------------------------------------------

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
    await apiFetch('/auth/logout', { method: 'POST' });
  },

  googleLogin() {
    window.location.href = `${getApiBaseUrl()}/auth/google`;
  },

  async refreshSession(): Promise<boolean> {
    return tryRefresh();
  },
};

// ---------------------------------------------------------------------------
// Other domains
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
