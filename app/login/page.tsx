'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api, ApiError } from '@/lib/api';
import { authStore, StoredUser } from '@/lib/auth';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const path = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : { email, password, name: name.trim() || undefined };
      const data = await api.post<AuthResponse>(path, body, { anonymous: true });
      authStore.setTokens(data.accessToken, data.refreshToken);
      authStore.setUser(data.user);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-star-500">★</span> Polaris
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Your north-star metrics.</p>
        </div>

        <div className="card">
          <div className="mb-5 flex gap-2 rounded-lg bg-ink-800 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === 'login' ? 'bg-ink-950 text-star-500' : 'text-slate-400'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === 'register' ? 'bg-ink-950 text-star-500' : 'text-slate-400'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label" htmlFor="name">Name (optional)</label>
                <input
                  id="name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Abdul"
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="me@polaris.local"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <div className="text-sm text-bad">{error}</div>}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
