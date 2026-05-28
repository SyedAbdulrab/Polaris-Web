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
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-[460px] w-[820px] -translate-x-1/2 rounded-full bg-star-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[600px] rounded-full bg-info/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-star-500/10 text-3xl text-star-500 shadow-glow">
            ★
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Polaris</h1>
          <p className="mt-1.5 text-sm text-soft">Your north-star life metrics.</p>
        </div>

        <div className="card animate-fade-in">
          <div className="mb-5 grid grid-cols-2 rounded-lg bg-elevated p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-md py-2 text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-canvas text-text shadow-soft' : 'text-mute hover:text-soft'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-md py-2 text-sm font-medium transition-all ${
                mode === 'register' ? 'bg-canvas text-text shadow-soft' : 'text-mute hover:text-soft'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input
                  id="name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? (
                <>
                  <Spinner /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : mode === 'login' ? (
                'Sign in →'
              ) : (
                'Create account →'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-2xs text-mute">
          {mode === 'login' ? (
            <>New here? <button onClick={() => setMode('register')} className="text-star-400 hover:underline">Create an account</button>.</>
          ) : (
            <>Already have one? <button onClick={() => setMode('login')} className="text-star-400 hover:underline">Sign in</button>.</>
          )}
        </p>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
