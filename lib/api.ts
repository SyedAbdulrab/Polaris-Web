'use client';

import { authStore } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  // Skip the auth header (used by login/register/refresh).
  anonymous?: boolean;
  // Internal — don't recurse forever on a 401.
  _retried?: boolean;
}

async function rawRequest<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!opts.anonymous) {
    const token = authStore.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  // Refresh-token rotation: if access token expired, try refresh once.
  if (res.status === 401 && !opts.anonymous && !opts._retried) {
    const refreshed = await tryRefresh();
    if (refreshed) return rawRequest<T>(path, { ...opts, _retried: true });
    authStore.clear();
    if (typeof window !== 'undefined') window.location.href = '/login';
  }

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && 'message' in body && String(body.message)) ||
      `Request failed with ${res.status}`;
    throw new ApiError(message, res.status, body);
  }
  return body as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = authStore.getRefreshToken();
  if (!refreshToken) return false;
  try {
    const data = await rawRequest<{ accessToken: string; refreshToken: string }>(
      '/api/v1/auth/refresh',
      { method: 'POST', body: { refreshToken }, anonymous: true },
    );
    authStore.setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T = unknown>(path: string) => rawRequest<T>(path),
  post: <T = unknown>(path: string, body?: unknown, opts: RequestOptions = {}) =>
    rawRequest<T>(path, { ...opts, method: 'POST', body }),
  patch: <T = unknown>(path: string, body?: unknown) =>
    rawRequest<T>(path, { method: 'PATCH', body }),
  del: <T = unknown>(path: string) => rawRequest<T>(path, { method: 'DELETE' }),
};
