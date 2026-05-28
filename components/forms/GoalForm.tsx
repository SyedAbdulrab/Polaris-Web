'use client';

import { FormEvent, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import { useCurrency } from '@/lib/currency-context';

interface Props {
  onSaved: () => void;
  onCancel: () => void;
}

const CATEGORIES = ['emergency', 'travel', 'savings', 'debt', 'investment', 'purchase', 'other'];

export function GoalForm({ onSaved, onCancel }: Props) {
  const { code, symbol, toUsd } = useCurrency();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('savings');
  const [targetDisplay, setTargetDisplay] = useState('');
  const [currentDisplay, setCurrentDisplay] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/api/v1/goals', {
        name,
        category,
        targetAmount: toUsd(Number(targetDisplay)),
        currentAmount: currentDisplay ? toUsd(Number(currentDisplay)) : 0,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });
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
        <label className="label">Name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          placeholder="e.g. Emergency fund, Tokyo trip"
        />
      </div>

      <div>
        <label className="label">Category</label>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Target ({code})</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-mute">
              {symbol}
            </span>
            <input
              type="number"
              step="0.01"
              min={0}
              className="input pl-8"
              value={targetDisplay}
              onChange={(e) => setTargetDisplay(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="label">Saved so far ({code})</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-mute">
              {symbol}
            </span>
            <input
              type="number"
              step="0.01"
              min={0}
              className="input pl-8"
              value={currentDisplay}
              onChange={(e) => setCurrentDisplay(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="label">Deadline (optional)</label>
        <input
          type="date"
          className="input"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
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
          {busy ? 'Creating…' : 'Add goal'}
        </button>
      </div>
    </form>
  );
}
