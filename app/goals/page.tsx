'use client';

import { useCallback, useEffect, useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { GoalForm } from '@/components/forms/GoalForm';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { authStore } from '@/lib/auth';
import { useCurrency } from '@/lib/currency-context';
import { Goal } from '@/lib/types';

export default function GoalsPage() {
  const { format } = useCurrency();
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [adjusting, setAdjusting] = useState<{ id: string; current: number } | null>(null);

  const load = useCallback(async () => {
    if (!authStore.isAuthenticated()) return;
    const data = await api.get<Goal[]>('/api/v1/goals');
    setGoals(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm('Delete this goal?')) return;
    await api.del(`/api/v1/goals/${id}`);
    load();
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="mt-0.5 text-sm text-soft">Money targets you're working toward.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm">
          + New goal
        </button>
      </div>

      {goals == null ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <EmptyState
            title="No goals yet"
            description="Set a target — emergency fund, trip, debt-free date — and watch progress fill up."
            action={
              <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm">
                Add first goal
              </button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const target = Number(g.targetAmount);
            const current = Number(g.currentAmount);
            const pct = target > 0 ? Math.min(1, current / target) : 0;
            const remaining = Math.max(0, target - current);
            const reached = pct >= 1;
            const deadlineDate = g.deadline ? new Date(g.deadline) : null;
            const days = deadlineDate
              ? Math.ceil((deadlineDate.getTime() - Date.now()) / 86_400_000)
              : null;

            return (
              <div key={g.id} className="card card-hover">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{g.name}</div>
                    <div className="text-2xs text-mute">{g.category}</div>
                  </div>
                  {reached && <span className="chip-accent">✓ done</span>}
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-semibold tabular-nums">{format(current)}</span>
                    <span className="text-sm text-mute tabular-nums">of {format(target)}</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-elevated">
                    <div
                      className={`h-full transition-all duration-700 ${
                        reached ? 'bg-success' : 'bg-star-500'
                      }`}
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-2xs text-mute">
                    <span>{(pct * 100).toFixed(1)}%</span>
                    <span>{format(remaining)} to go</span>
                  </div>
                </div>

                {deadlineDate && (
                  <div
                    className={`mt-4 rounded-md border px-2.5 py-1.5 text-2xs ${
                      days != null && days < 0
                        ? 'border-danger/30 bg-danger/10 text-danger'
                        : days != null && days < 30
                          ? 'border-warn/30 bg-warn/10 text-warn'
                          : 'border-border bg-elevated text-soft'
                    }`}
                  >
                    {days != null && days < 0
                      ? `Overdue by ${-days}d`
                      : days != null
                        ? `Due in ${days}d · ${deadlineDate.toLocaleDateString()}`
                        : deadlineDate.toLocaleDateString()}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setAdjusting({ id: g.id, current })}
                    className="btn-secondary btn-sm flex-1"
                  >
                    Update progress
                  </button>
                  <button
                    onClick={() => remove(g.id)}
                    className="btn-ghost btn-sm text-mute hover:text-danger"
                    aria-label="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New goal">
        <GoalForm
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <Modal open={adjusting != null} onClose={() => setAdjusting(null)} title="Update progress">
        {adjusting && (
          <AdjustProgress
            id={adjusting.id}
            currentUsd={adjusting.current}
            onSaved={() => {
              setAdjusting(null);
              load();
            }}
            onCancel={() => setAdjusting(null)}
          />
        )}
      </Modal>
    </AppShell>
  );
}

function AdjustProgress({
  id,
  currentUsd,
  onSaved,
  onCancel,
}: {
  id: string;
  currentUsd: number;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { code, symbol, fromUsd, toUsd } = useCurrency();
  const [val, setVal] = useState(String(round2(fromUsd(currentUsd))));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/api/v1/goals/${id}`, { currentAmount: toUsd(Number(val)) });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Saved so far ({code})</label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-mute">
            {symbol}
          </span>
          <input
            type="number"
            step="0.01"
            min={0}
            className="input pl-8"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button onClick={save} disabled={busy} className="btn-primary">
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
