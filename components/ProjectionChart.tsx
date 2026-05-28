'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ProjectionScenario } from '@/lib/types';

interface Props {
  baseline: ProjectionScenario;
  upside: ProjectionScenario;
  downside: ProjectionScenario;
}

export function ProjectionChart({ baseline, upside, downside }: Props) {
  const data = baseline.points.map((p, i) => ({
    month: `M${p.month}`,
    baseline: round(p.net),
    upside: round(upside.points[i]?.net ?? 0),
    downside: round(downside.points[i]?.net ?? 0),
  }));

  return (
    <div className="card h-80">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="card-title">12-month projection (cumulative net)</div>
          <div className="mt-1 text-xs text-slate-500">
            Upside = commissions × 1.5. Downside = zero commissions.
          </div>
        </div>
      </div>
      <div className="mt-4 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
              formatter={(v: number) =>
                v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
              }
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="upside" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="baseline" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="downside" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
