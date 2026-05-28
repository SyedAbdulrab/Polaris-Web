'use client';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useCurrency } from '@/lib/currency-context';
import { ProjectionScenario } from '@/lib/types';

interface Props {
  baseline: ProjectionScenario;
  upside: ProjectionScenario;
  downside: ProjectionScenario;
}

// All numeric values stay in USD until render time. Recharts is happy with USD,
// and the formatter functions handle the conversion-to-display-currency step.
export function ProjectionChart({ baseline, upside, downside }: Props) {
  const { format, formatCompact } = useCurrency();

  const data = baseline.points.map((p, i) => ({
    month: `M${p.month}`,
    upside: round(upside.points[i]?.net ?? 0),
    baseline: round(p.net),
    downside: round(downside.points[i]?.net ?? 0),
    band: [
      round(downside.points[i]?.net ?? 0),
      round(upside.points[i]?.net ?? 0),
    ] as [number, number],
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="band-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5b400" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#f5b400" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2330" vertical={false} />
          <XAxis dataKey="month" stroke="#6b7080" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#6b7080"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCompact(v)}
            width={56}
          />
          <Tooltip
            cursor={{ stroke: '#262a36' }}
            contentStyle={{
              background: '#14171f',
              border: '1px solid #1f2330',
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: '#9aa0b0', marginBottom: 4 }}
            formatter={(value: unknown, name: string) => {
              if (name === 'band') return [null, null];
              const label = name.charAt(0).toUpperCase() + name.slice(1);
              return [format(Number(value)), label];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="circle"
            formatter={(value) => {
              if (value === 'band') return null;
              return value.charAt(0).toUpperCase() + value.slice(1);
            }}
          />
          <Area
            type="monotone"
            dataKey="band"
            fill="url(#band-fill)"
            stroke="none"
            isAnimationActive={false}
            legendType="none"
          />
          <Line
            type="monotone"
            dataKey="upside"
            stroke="#22c55e"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="baseline"
            stroke="#f5b400"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="downside"
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
