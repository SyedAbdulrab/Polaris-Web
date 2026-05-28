'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { shortDate } from '@/lib/format';
import { MetricSnapshot } from '@/lib/types';

interface Props {
  snapshots: MetricSnapshot[];
}

export function SnapshotChart({ snapshots }: Props) {
  if (snapshots.length === 0) {
    return (
      <div className="card h-80">
        <div className="card-title">Income vs expenses (last 90 days)</div>
        <div className="mt-12 text-center text-slate-500 text-sm">
          No snapshots yet — they'll start appearing after the daily cron runs (or hit
          <code className="mx-1 px-1 rounded bg-ink-800 text-star-400">POST /metrics/snapshot</code>).
        </div>
      </div>
    );
  }

  const data = snapshots.map((s) => ({
    date: shortDate(s.date),
    income: Number(s.totalIncome),
    expenses: Number(s.totalExpenses),
    mrr: Number(s.projectedMRR),
  }));

  return (
    <div className="card h-80">
      <div className="card-title">Income vs expenses · Projected MRR (recent snapshots)</div>
      <div className="mt-4 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
              formatter={(v: number) =>
                v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
              }
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="income" stroke="#22c55e" fill="#22c55e22" />
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="#ef444422" />
            <Area type="monotone" dataKey="mrr" stroke="#f59e0b" fill="#f59e0b22" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
