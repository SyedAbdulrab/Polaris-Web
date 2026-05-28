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
import { shortDate } from '@/lib/currency';
import { MetricSnapshot } from '@/lib/types';

interface Props {
  snapshots: MetricSnapshot[];
}

export function CashflowChart({ snapshots }: Props) {
  const { format, formatCompact } = useCurrency();

  const data = snapshots.map((s) => ({
    date: shortDate(s.date),
    income: Number(s.totalIncome),
    expenses: Number(s.totalExpenses),
    mrr: Number(s.projectedMRR),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="inc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="exp-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2330" vertical={false} />
          <XAxis dataKey="date" stroke="#6b7080" fontSize={11} tickLine={false} axisLine={false} />
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
            formatter={(value: unknown, name: string) => [
              format(Number(value)),
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
          <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fill="url(#inc-fill)" />
          <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#exp-fill)" />
          <Line type="monotone" dataKey="mrr" stroke="#f5b400" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
