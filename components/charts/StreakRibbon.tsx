'use client';

import { Streak } from '@/lib/types';

interface Props {
  streak: Streak;
  days?: number; // how many recent days to render
}

// We don't have per-day streak logs from the backend, but we *do* know the current
// count and the last-logged date. From those two we can draw the last N days where:
//   - the most recent `currentCount` days back from lastLoggedDate are "kept"
//   - everything else is "unknown" (not "missed" — we just don't know)
// Today's cell is special: if today != lastLoggedDate, it's a "needs logging" pulse.
export function StreakRibbon({ streak, days = 21 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastLogged = streak.lastLoggedDate ? new Date(streak.lastLoggedDate) : null;
  if (lastLogged) lastLogged.setHours(0, 0, 0, 0);

  const dayMs = 86_400_000;
  const cells: { date: Date; state: 'kept' | 'unknown' | 'today-pending' }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * dayMs);
    let state: 'kept' | 'unknown' | 'today-pending' = 'unknown';

    if (lastLogged) {
      const daysFromLast = Math.round((lastLogged.getTime() - d.getTime()) / dayMs);
      if (daysFromLast >= 0 && daysFromLast < streak.currentCount) state = 'kept';
    }
    if (i === 0 && (!lastLogged || lastLogged.getTime() !== today.getTime())) {
      state = 'today-pending';
    }
    cells.push({ date: d, state });
  }

  return (
    <div className="flex flex-wrap gap-1">
      {cells.map((c, i) => {
        const className =
          c.state === 'kept'
            ? 'bg-star-500'
            : c.state === 'today-pending'
              ? 'bg-elevated border border-star-500/60 animate-pulse'
              : 'bg-elevated border border-border';
        const tooltip = `${c.date.toLocaleDateString()} — ${
          c.state === 'kept'
            ? 'kept'
            : c.state === 'today-pending'
              ? 'log today'
              : 'no record'
        }`;
        return (
          <div
            key={i}
            title={tooltip}
            className={`h-3.5 w-3.5 rounded-sm transition-colors ${className}`}
          />
        );
      })}
    </div>
  );
}
