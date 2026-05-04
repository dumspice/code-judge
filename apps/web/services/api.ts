/**
 * Reusable API client for Core API.
 *
 * Features:
 *  - Attaches accessToken from memory on every request.
 *  - Auto-refreshes token on 401 and retries the original request once.
 *  - Token storage: accessToken in memory, refreshToken in localStorage.
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

export function setRefreshToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('refreshToken', token);
  } else {
    localStorage.removeItem('refreshToken');
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

/** Clear all auth state (logout). */
export function clearTokens() {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('refreshToken');
  }
}

// ---------------------------------------------------------------------------
// Refresh logic
// ---------------------------------------------------------------------------

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const data = await res.json();
      // The response is wrapped in envelope: { result: { accessToken, refreshToken } }
      const result = data.result ?? data;
      setAccessToken(result.accessToken);
      setRefreshToken(result.refreshToken);
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

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

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
export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
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
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  };

  let res = await doFetch();

  // Auto refresh on 401
  if (res.status === 401 && getRefreshToken()) {
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

// ---------------------------------------------------------------------------
// Auth-specific API calls
// ---------------------------------------------------------------------------

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
}

export const authApi = {
  async register(name: string, email: string, password: string): Promise<AuthTokens> {
    const tokens = await apiFetch<AuthTokens>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    return tokens;
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    const tokens = await apiFetch<AuthTokens>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    return tokens;
  },

  async me(): Promise<UserProfile> {
    return apiFetch<UserProfile>('/auth/me');
  },

  logout() {
    clearTokens();
  },

  /** Google OAuth: redirect browser to backend /auth/google. */
  googleLogin() {
    window.location.href = `${BASE_URL}/auth/google`;
  },
};
