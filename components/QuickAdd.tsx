'use client';

import { FormEvent, useState } from 'react';

import { api, ApiError } from '@/lib/api';

type Mode = 'income' | 'expense' | 'streak' | 'log';

interface Props {
  onAdded: () => void;
}

const FREQ = ['MONTHLY', 'WEEKLY', 'ANNUAL', 'ONE_TIME'] as const;
const INCOME_TYPES = ['SALARY', 'COMMISSION', 'PENSION', 'OTHER'] as const;

export function QuickAdd({ onAdded }: Props) {
  const [mode, setMode] = useState<Mode>('income');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // shared
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<(typeof FREQ)[number]>('MONTHLY');
  const [type, setType] = useState<(typeof INCOME_TYPES)[number]>('SALARY');
  const [category, setCategory] = useState('');
  // log
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');
  // streak
  const [streakType, setStreakType] = useState<'POSITIVE' | 'NEGATIVE'>('POSITIVE');

  function reset() {
    setName('');
    setAmount('');
    setCategory('');
    setMood('');
    setNote('');
    setTags('');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(false);

    try {
      if (mode === 'income') {
        await api.post('/api/v1/income', {
          name,
          type,
          amount: Number(amount),
          frequency,
          startDate: new Date().toISOString(),
          isActive: true,
        });
      } else if (mode === 'expense') {
        await api.post('/api/v1/expenses', {
          name,
          category: category || 'general',
          amount: Number(amount),
          frequency,
          startDate: new Date().toISOString(),
          isActive: true,
        });
      } else if (mode === 'streak') {
        await api.post('/api/v1/streaks', { name, type: streakType });
      } else {
        await api.post('/api/v1/logs', {
          date: new Date().toISOString(),
          mood: mood ? Number(mood) : undefined,
          note: note || undefined,
          tags: tags ? tags.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        });
      }
      setSuccess(true);
      reset();
      onAdded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed');
    } finally {
      setBusy(false);
      setTimeout(() => setSuccess(false), 1500);
    }
  }

  return (
    <div className="card">
      <div className="card-title">Quick add</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(['income', 'expense', 'streak', 'log'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              mode === m ? 'bg-star-500 text-ink-950' : 'bg-ink-800 text-slate-300'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        {(mode === 'income' || mode === 'expense') && (
          <>
            <input
              className="input"
              placeholder={mode === 'income' ? 'Income name' : 'Expense name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <select
                className="input w-40"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as (typeof FREQ)[number])}
              >
                {FREQ.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            {mode === 'income' ? (
              <select
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value as (typeof INCOME_TYPES)[number])}
              >
                {INCOME_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            ) : (
              <input
                className="input"
                placeholder="Category (e.g. housing, food)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            )}
          </>
        )}

        {mode === 'streak' && (
          <>
            <input
              className="input"
              placeholder="Streak name (e.g. No nicotine)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <select
              className="input"
              value={streakType}
              onChange={(e) => setStreakType(e.target.value as 'POSITIVE' | 'NEGATIVE')}
            >
              <option value="POSITIVE">POSITIVE</option>
              <option value="NEGATIVE">NEGATIVE</option>
            </select>
          </>
        )}

        {mode === 'log' && (
          <>
            <div className="flex gap-2">
              <input
                className="input w-24"
                type="number"
                min={1}
                max={10}
                placeholder="Mood 1–10"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              />
              <input
                className="input"
                placeholder="Tags (comma separated, e.g. high,win)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <textarea
              className="input"
              rows={2}
              placeholder="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </>
        )}

        {error && <div className="text-sm text-bad">{error}</div>}
        {success && <div className="text-sm text-good">Added.</div>}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? '...' : `Add ${mode}`}
        </button>
      </form>
    </div>
  );
}
