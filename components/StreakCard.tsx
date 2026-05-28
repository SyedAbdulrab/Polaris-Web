'use client';

import { useState } from 'react';

import { api } from '@/lib/api';
import { Streak } from '@/lib/types';

interface Props {
  streak: Streak;
  onChange: () => void;
}

export function StreakCard({ streak, onChange }: Props) {
  const [busy, setBusy] = useState(false);

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
    try {
      await api.post(`/api/v1/streaks/${streak.id}/break`);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  const accent = streak.type === 'POSITIVE' ? 'text-star-500' : 'text-bad';
  const lastLogged = streak.lastLoggedDate
    ? new Date(streak.lastLoggedDate).toLocaleDateString()
    : 'never';

  return (
    <div className="card flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{streak.name}</div>
          <div className="text-xs text-slate-500">last logged · {lastLogged}</div>
        </div>
        <div className={`text-3xl font-bold ${accent}`}>{streak.currentCount}</div>
      </div>
      <div className="mt-2 text-xs text-slate-500">longest · {streak.longestCount} days</div>
      <div className="mt-4 flex gap-2">
        <button onClick={logToday} disabled={busy} className="btn-primary flex-1">
          Log today
        </button>
        <button onClick={breakIt} disabled={busy} className="btn-ghost">
          Break
        </button>
      </div>
    </div>
  );
}
