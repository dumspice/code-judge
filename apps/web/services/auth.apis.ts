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
// Auth
// ---------------------------------------------------------------------------

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
