'use client';

import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

interface Props {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = '#f5b400', height = 38 }: Props) {
  if (!data.length) return null;
  const points = data.map((v, i) => ({ i, v }));
  const id = `sg-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
