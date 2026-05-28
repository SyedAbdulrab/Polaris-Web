'use client';

import { FormEvent, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import { Account, AccountKind } from '@/lib/types';
import { CURRENCIES, CurrencyCode } from '@/lib/currency';

interface Props {
  onSaved: () => void;
  onCancel: () => void;
  initial?: Account;
}

const KINDS: { value: AccountKind; label: string; hint: string; icon: string }[] = [
  { value: 'CHECKING', label: 'Checking', hint: 'Day-to-day spending', icon: '◯' },
  { value: 'SAVINGS', label: 'Savings', hint: 'Set-aside funds', icon: '◉' },
  { value: 'CASH', label: 'Cash', hint: 'Wallet, envelope', icon: '◇' },
  { value: 'CREDIT_CARD', label: 'Credit card', hint: 'Revolving balance', icon: '▢' },
  { value: 'INVESTMENT', label: 'Investment', hint: 'Stocks, retirement', icon: '◈' },
  { value: 'LOAN', label: 'Loan', hint: 'Debt you owe', icon: '▽' },
];

export function AccountForm({ onSaved, onCancel, initial }: Props) {
  const isEdit = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? '');
  const [kind, setKind] = useState<AccountKind>(initial?.kind ?? 'CHECKING');
  const [currency, setCurrency] = useState<CurrencyCode>(
    (initial?.currency as CurrencyCode) ?? 'USD',
  );
  const [institution, setInstitution] = useState(initial?.institution ?? '');
  const [openingBalance, setOpeningBalance] = useState(
    initial?.openingBalance ? String(Number(initial.openingBalance)) : '0',
  );
  const [openingDate, setOpeningDate] = useState(
    initial?.openingDate
      ? initial.openingDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
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
        kind,
        currency,
        institution: institution.trim() || undefined,
        openingBalance: round2(Number(openingBalance)),
        openingDate: new Date(openingDate).toISOString(),
        isActive: true,
      };
      if (isEdit && initial) {
        await api.patch(`/api/v1/accounts/${initial.id}`, body);
      } else {
        await api.post('/api/v1/accounts', body);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  const symbol = CURRENCIES[currency].symbol;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. HBL Checking, Cash, Vanguard Brokerage"
          autoFocus
        />
      </div>

      <div>
        <label className="label">Kind</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                kind === k.value
                  ? 'border-star-500/60 bg-star-500/10'
                  : 'border-border bg-elevated hover:border-divider'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className={kind === k.value ? 'text-star-400' : 'text-mute'}>{k.icon}</span>
                {k.label}
              </div>
              <div className="mt-0.5 text-2xs text-mute">{k.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Currency</label>
          <select
            className="input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            disabled={isEdit}
            title={isEdit ? "Currency can't change after creation — balances are stored in this currency." : undefined}
          >
            {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
              <option key={c} value={c}>
                {CURRENCIES[c].code} · {CURRENCIES[c].name}
              </option>
            ))}
          </select>
          {!isEdit && (
            <div className="mt-1 text-2xs text-mute">
              The native currency this account holds. Can't be changed later.
            </div>
          )}
        </div>
        <div>
          <label className="label">Institution (optional)</label>
          <input
            className="input"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="HBL, Chase, Vanguard…"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Opening balance ({currency})</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-mute">
              {symbol}
            </span>
            <input
              type="number"
              step="0.01"
              className="input pl-8"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="label">As of</label>
          <input
            type="date"
            className="input"
            value={openingDate}
            onChange={(e) => setOpeningDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="rounded-lg bg-elevated/50 border border-border px-3 py-2.5 text-2xs text-soft">
        Tip: enter the balance as it stood on the "as of" date. Then add transactions for any
        money in or out since then — current balance is computed automatically.
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
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add account'}
        </button>
      </div>
    </form>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
