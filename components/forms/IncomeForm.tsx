'use client';

import { FormEvent, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import { useCurrency } from '@/lib/currency-context';
import { Frequency, IncomeType } from '@/lib/types';

interface Props {
  onSaved: () => void;
  onCancel: () => void;
  initial?: {
    id?: string;
    name?: string;
    type?: IncomeType;
    amount?: string; // USD
    frequency?: Frequency;
    startDate?: string;
  };
}

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'ONE_TIME', label: 'One-time' },
];

const TYPES: { value: IncomeType; label: string; hint: string }[] = [
  { value: 'SALARY', label: 'Salary', hint: 'Predictable paycheck' },
  { value: 'COMMISSION', label: 'Commission', hint: 'Variable, deals-based' },
  { value: 'PENSION', label: 'Pension', hint: 'Retirement / annuity' },
  { value: 'OTHER', label: 'Other', hint: 'Anything else' },
];

export function IncomeForm({ onSaved, onCancel, initial }: Props) {
  const { code, symbol, fromUsd, toUsd } = useCurrency();
  const isEdit = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<IncomeType>(initial?.type ?? 'SALARY');
  // Form holds amount in *display* currency; we convert to USD on submit.
  const [amountDisplay, setAmountDisplay] = useState(
    initial?.amount ? String(round2(fromUsd(Number(initial.amount)))) : '',
  );
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? 'MONTHLY');
  const [startDate, setStartDate] = useState(
    initial?.startDate ? initial.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = {
        name,
        type,
        amount: toUsd(Number(amountDisplay)),
        frequency,
        startDate: new Date(startDate).toISOString(),
        isActive: true,
      };
      if (isEdit) {
        await api.patch(`/api/v1/income/${initial!.id}`, body);
      } else {
        await api.post('/api/v1/income', body);
      }
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
          placeholder="e.g. Day-job salary"
          autoFocus
        />
      </div>

      <div>
        <label className="label">Type</label>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                type === t.value
                  ? 'border-star-500/60 bg-star-500/10'
                  : 'border-border bg-elevated hover:border-divider'
              }`}
            >
              <div className="text-sm font-medium">{t.label}</div>
              <div className="text-2xs text-mute">{t.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount ({code})</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-mute">
              {symbol}
            </span>
            <input
              type="number"
              step="0.01"
              min={0}
              className="input pl-8"
              value={amountDisplay}
              onChange={(e) => setAmountDisplay(e.target.value)}
              required
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label className="label">Frequency</label>
          <select
            className="input"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
          >
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Started on</label>
        <input
          type="date"
          className="input"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
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
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add income'}
        </button>
      </div>
    </form>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
