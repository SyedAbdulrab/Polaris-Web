'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import { useCurrency } from '@/lib/currency-context';

export interface DonutSlice {
  name: string;
  value: number; // in USD (base currency)
  color: string;
}

interface Props {
  slices: DonutSlice[];
  centerLabel?: string;
  centerValue: number; // in USD
  size?: number;
}

const PALETTE = ['#f5b400', '#22c55e', '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e', '#fbbf24', '#06b6d4'];

export function paletteAt(i: number): string {
  return PALETTE[i % PALETTE.length];
}

export function CompositionDonut({ slices, centerLabel, centerValue, size = 200 }: Props) {
  const { format } = useCurrency();
  const total = slices.reduce((acc, s) => acc + s.value, 0);

  if (!slices.length || total === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full border border-dashed border-divider"
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <div className="text-2xs text-mute uppercase tracking-wider">{centerLabel ?? 'Total'}</div>
          <div className="mt-1 text-lg font-semibold">{format(0)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            innerRadius={size * 0.32}
            outerRadius={size * 0.46}
            paddingAngle={2}
            stroke="none"
            isAnimationActive
          >
            {slices.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {centerLabel && (
          <div className="text-2xs text-mute uppercase tracking-wider">{centerLabel}</div>
        )}
        <div className="mt-0.5 text-xl font-semibold">{format(centerValue)}</div>
      </div>
    </div>
  );
}

export function DonutLegend({ slices }: { slices: DonutSlice[] }) {
  const { format } = useCurrency();
  const total = slices.reduce((a, s) => a + s.value, 0);
  if (!slices.length || total === 0) return null;
  return (
    <ul className="space-y-2">
      {slices.map((s) => {
        const pct = (s.value / total) * 100;
        return (
          <li key={s.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: s.color }}
              />
              <span className="truncate text-text">{s.name}</span>
            </span>
            <span className="flex shrink-0 items-baseline gap-2">
              <span className="tabular-nums text-soft">{format(s.value)}</span>
              <span className="text-2xs tabular-nums text-mute">{pct.toFixed(0)}%</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
