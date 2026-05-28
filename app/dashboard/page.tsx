'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { GoalProgress } from '@/components/GoalProgress';
import { MetricCard } from '@/components/MetricCard';
import { ProjectionChart } from '@/components/ProjectionChart';
import { QuickAdd } from '@/components/QuickAdd';
import { SnapshotChart } from '@/components/SnapshotChart';
import { StreakCard } from '@/components/StreakCard';
import { api } from '@/lib/api';
import { authStore } from '@/lib/auth';
import { money, percent } from '@/lib/format';
import { DashboardPayload } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshotting, setSnapshotting] = useState(false);
  const user = authStore.getUser();

  const load = useCallback(async () => {
    try {
      const payload = await api.get<DashboardPayload>('/api/v1/dashboard');
      setData(payload);
    } catch {
      // api.ts will redirect to /login on 401; nothing else to do here.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authStore.isAuthenticated()) {
      router.replace('/login');
      return;
    }
    load();
  }, [load, router]);

  async function takeSnapshot() {
    setSnapshotting(true);
    try {
      await api.post('/api/v1/metrics/snapshot');
      await load();
    } finally {
      setSnapshotting(false);
    }
  }

  async function logout() {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // best-effort
    }
    authStore.clear();
    router.replace('/login');
  }

  function exportLink(path: string) {
    const token = authStore.getAccessToken() ?? '';
    // For one-shot downloads, the simplest path is a URL the user can open. We use fetch
    // here so we can include the bearer header — then we trigger a download via blob URL.
    return async () => {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() ?? 'export';
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading dashboard…</div>;
  }
  if (!data) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">No data.</div>;
  }

  const m = data.metrics;
  const mrrTone = m.projectedMRR >= 0 ? 'good' : 'bad';
  const savingsTone = m.savingsRate >= 0 ? 'good' : 'bad';

  return (
    <main className="min-h-screen px-6 py-8 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-star-500">★</span> Polaris
          </h1>
          <p className="text-sm text-slate-400">
            Hey {user?.name ?? user?.email ?? 'there'} — as of{' '}
            {new Date(data.asOf).toLocaleString()}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={takeSnapshot} disabled={snapshotting} className="btn-secondary">
            {snapshotting ? '...' : 'Take snapshot'}
          </button>
          <button onClick={exportLink('/api/v1/export/json')} className="btn-secondary">
            Export JSON
          </button>
          <button onClick={exportLink('/api/v1/export/pdf/monthly')} className="btn-secondary">
            Monthly PDF
          </button>
          <button onClick={logout} className="btn-ghost">
            Logout
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Projected MRR"
          value={money(m.projectedMRR)}
          tone={mrrTone}
          hint="Recurring income − recurring expenses"
        />
        <MetricCard
          label="Savings rate"
          value={percent(m.savingsRate)}
          tone={savingsTone}
          hint="(income − expenses) / income"
        />
        <MetricCard label="Monthly income" value={money(m.monthlyIncome)} />
        <MetricCard label="Monthly expenses" value={money(m.monthlyExpenses)} />
      </section>

      <section className="grid lg:grid-cols-2 gap-4 mb-6">
        <ProjectionChart
          baseline={data.scenarios.baseline}
          upside={data.scenarios.upside}
          downside={data.scenarios.downside}
        />
        <SnapshotChart snapshots={data.snapshots} />
      </section>

      <section className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-title">Streaks</div>
            {data.streaks.length === 0 ? (
              <div className="mt-4 text-sm text-slate-500">No streaks yet — add one →</div>
            ) : (
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {data.streaks.map((s) => (
                  <StreakCard key={s.id} streak={s} onChange={load} />
                ))}
              </div>
            )}
          </div>
          <div className="card mt-4">
            <div className="card-title">Recent log entries</div>
            {data.recentLogs.length === 0 ? (
              <div className="mt-4 text-sm text-slate-500">No entries.</div>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.recentLogs.map((l) => (
                  <li key={l.id} className="rounded-lg bg-ink-800 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-slate-400 text-xs">
                        {new Date(l.date).toLocaleDateString()}
                        {l.mood != null ? ` · mood ${l.mood}` : ''}
                      </div>
                      {l.tags && l.tags.length > 0 && (
                        <div className="flex gap-1">
                          {l.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-ink-950 px-2 py-0.5 text-[10px] text-star-400"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {l.note && <div className="mt-1 text-slate-200">{l.note}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <QuickAdd onAdded={load} />
          <div className="card">
            <div className="card-title">Goals</div>
            {data.goals.length === 0 ? (
              <div className="mt-4 text-sm text-slate-500">No goals yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {data.goals.map((g) => (
                  <GoalProgress key={g.id} goal={g} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
