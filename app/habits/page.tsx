'use client';

import { useCallback, useEffect, useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { StreakForm } from '@/components/forms/StreakForm';
import { StreakRibbon } from '@/components/charts/StreakRibbon';
import { api } from '@/lib/api';
import { authStore } from '@/lib/auth';
import { relativeDay } from '@/lib/currency';
import { Streak } from '@/lib/types';

export default function HabitsPage() {
  const [streaks, setStreaks] = useState<Streak[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    if (!authStore.isAuthenticated()) return;
    const data = await api.get<Streak[]>('/api/v1/streaks');
    setStreaks(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const builds = (streaks ?? []).filter((s) => s.type === 'POSITIVE');
  const avoids = (streaks ?? []).filter((s) => s.type === 'NEGATIVE');

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
          <p className="mt-0.5 text-sm text-soft">Build the chain. Don't break it.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm">
          + New streak
        </button>
      </div>

      {streaks == null ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : streaks.length === 0 ? (
        <Card>
          <EmptyState
            title="No streaks yet"
            description={`Two flavours: "Build" (do this every day) and "Avoid" (don't do this any day). Both work the same — log every day to keep the chain.`}
            action={
              <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm">
                Start your first streak
              </button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <Section
            title="Build"
            subtitle="Habits you want to do every day"
            streaks={builds}
            onChange={load}
            kind="build"
          />
          <Section
            title="Avoid"
            subtitle="Things you want to abstain from"
            streaks={avoids}
            onChange={load}
            kind="avoid"
          />
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Start a streak">
        <StreakForm
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>
    </AppShell>
  );
}

function Section({
  title,
  subtitle,
  streaks,
  onChange,
  kind,
}: {
  title: string;
  subtitle: string;
  streaks: Streak[];
  onChange: () => void;
  kind: 'build' | 'avoid';
}) {
  if (streaks.length === 0) return null;
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-mute">{title}</h2>
        <span className="text-2xs text-mute">·</span>
        <span className="text-2xs text-mute">{subtitle}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {streaks.map((s) => (
          <StreakItem key={s.id} streak={s} onChange={onChange} kind={kind} />
        ))}
      </div>
    </div>
  );
}

function StreakItem({
  streak,
  onChange,
  kind,
}: {
  streak: Streak;
  onChange: () => void;
  kind: 'build' | 'avoid';
}) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastLogged = streak.lastLoggedDate ? new Date(streak.lastLoggedDate) : null;
  if (lastLogged) lastLogged.setHours(0, 0, 0, 0);
  const loggedToday = lastLogged?.getTime() === today.getTime();

  async function logToday() {
    setBusy(true);
    try {
      await api.post(`/api/v1/streaks/${streak.id}/log`);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function breakIt() {
    setBusy(true);
    setConfirming(false);
    try {
      await api.post(`/api/v1/streaks/${streak.id}/break`);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${streak.name}" entirely? This can't be undone.`)) return;
    setBusy(true);
    try {
      await api.del(`/api/v1/streaks/${streak.id}`);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  const logLabel = kind === 'build' ? 'Done today' : 'Still clean';
  const slipLabel = kind === 'build' ? 'Missed' : 'Slipped';

  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium">{streak.name}</div>
          <div className="text-2xs text-mute">
            {streak.lastLoggedDate ? `last ${relativeDay(streak.lastLoggedDate)}` : 'never logged'} ·{' '}
            longest {streak.longestCount}d
          </div>
        </div>
        <button onClick={remove} className="btn-ghost btn-sm text-mute hover:text-danger">
          ×
        </button>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tabular-nums text-star-400">{streak.currentCount}</span>
        <span className="text-sm text-soft">days</span>
        {loggedToday && (
          <span className="ml-auto inline-flex items-center gap-1 text-2xs text-success">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            logged
          </span>
        )}
      </div>

      <div className="mt-4">
        <StreakRibbon streak={streak} />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={logToday}
          disabled={busy || loggedToday}
          className={`flex-1 ${loggedToday ? 'btn-secondary' : 'btn-primary'}`}
        >
          {loggedToday ? '✓ Logged' : logLabel}
        </button>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            disabled={busy || streak.currentCount === 0}
            className="btn-secondary"
            title="Reset streak to 0"
          >
            {slipLabel}
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={breakIt} disabled={busy} className="btn-danger btn-sm">
              Confirm reset
            </button>
            <button onClick={() => setConfirming(false)} className="btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
