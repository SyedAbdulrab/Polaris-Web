'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { LogEntry } from '@/lib/types';

interface Props {
  logs: LogEntry[];
}

const MOOD_LABEL: Record<number, string> = {
  1: '😞 Low',
  2: '😕 Meh',
  3: '😐 OK',
  4: '🙂 Good',
  5: '😄 Great',
};

export function MoodChart({ logs }: Props) {
  const data = logs
    .filter((l) => l.mood != null)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({
      date: new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: clampMood(l.mood as number),
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-divider text-xs text-mute">
        No mood data yet — add a log entry to start tracking.
      </div>
    );
  }

  return (
    <div className="h-40">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2330" vertical={false} />
          <XAxis dataKey="date" stroke="#6b7080" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            stroke="#6b7080"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={32}
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
            formatter={(v: unknown) => [MOOD_LABEL[Number(v)] ?? v, 'Mood']}
          />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#8b5cf6' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function clampMood(m: number) {
  if (m <= 2) return 1;
  if (m <= 4) return 2;
  if (m <= 6) return 3;
  if (m <= 8) return 4;
  return 5;
}
