'use client';

import { FormEvent, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import { StreakType } from '@/lib/types';

interface Props {
  onSaved: () => void;
  onCancel: () => void;
}

const KIND_OPTIONS: {
  value: StreakType;
  title: string;
  prompt: string;
  examples: string[];
}[] = [
  {
    value: 'POSITIVE',
    title: 'Build',
    prompt: 'A habit you want to do every day',
    examples: ['Daily walk', 'Read 30 minutes', 'Gym', 'Stretch'],
  },
  {
    value: 'NEGATIVE',
    title: 'Avoid',
    prompt: 'Something you want to abstain from',
    examples: ['No nicotine', 'No sugar', 'No social media', 'No alcohol'],
  },
];

export function StreakForm({ onSaved, onCancel }: Props) {
  const [kind, setKind] = useState<StreakType>('POSITIVE');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opt = KIND_OPTIONS.find((o) => o.value === kind)!;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/api/v1/streaks', { name, type: kind });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">What kind of streak?</label>
        <div className="grid grid-cols-2 gap-2">
          {KIND_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setKind(o.value)}
              className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                kind === o.value
                  ? 'border-star-500/60 bg-star-500/10'
                  : 'border-border bg-elevated hover:border-divider'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className={kind === o.value ? 'text-star-400' : 'text-mute'}>
                  {o.value === 'POSITIVE' ? '↑' : '⊘'}
                </span>
                {o.title}
              </div>
              <div className="mt-0.5 text-2xs text-mute">{o.prompt}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Name your streak</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          placeholder={opt.examples[0]}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {opt.examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setName(ex)}
              className="chip hover:border-divider hover:text-text"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-elevated/50 border border-border px-3 py-2.5 text-2xs text-soft">
        {kind === 'POSITIVE'
          ? 'Tap "Done" each day you do it. Miss a day → break the chain.'
          : 'Tap "Still clean" each day you avoid it. Slip → break the chain.'}
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Creating…' : `Start streak`}
        </button>
      </div>
    </form>
  );
}
