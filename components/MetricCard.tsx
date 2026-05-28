import { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { Sparkline } from '@/components/charts/Sparkline';

interface Props {
  label: string;
  value: string;
  hint?: string;
  tone?: 'good' | 'bad' | 'neutral' | 'accent';
  delta?: { value: string; positive: boolean };
  spark?: number[];
  icon?: ReactNode;
}

export function MetricCard({ label, value, hint, tone = 'neutral', delta, spark, icon }: Props) {
  const valueColor =
    tone === 'good'
      ? 'text-success'
      : tone === 'bad'
        ? 'text-danger'
        : tone === 'accent'
          ? 'text-star-400'
          : 'text-text';

  const sparkColor =
    tone === 'good' ? '#22c55e' : tone === 'bad' ? '#ef4444' : tone === 'accent' ? '#f5b400' : '#9aa0b0';

  return (
    <div className="card card-hover relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="card-title">{label}</div>
        {icon && <div className="text-mute">{icon}</div>}
      </div>
      <div className={cn('mt-2 text-2xl font-semibold tabular-nums tracking-tight', valueColor)}>
        {value}
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        {hint && <div className="text-2xs text-mute">{hint}</div>}
        {delta && (
          <div
            className={cn(
              'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-2xs font-medium tabular-nums',
              delta.positive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
            )}
          >
            <span>{delta.positive ? '↑' : '↓'}</span>
            {delta.value}
          </div>
        )}
      </div>
      {spark && spark.length > 1 && (
        <div className="-mx-5 -mb-5 mt-4 px-2 pt-2 opacity-90">
          <Sparkline data={spark} color={sparkColor} height={36} />
        </div>
      )}
    </div>
  );
}
