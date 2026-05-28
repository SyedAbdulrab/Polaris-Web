'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import { CURRENCIES } from '@/lib/currency';
import {
  Account,
  Expense,
  IncomeSource,
  TransactionKind,
} from '@/lib/types';

interface Props {
  accounts: Account[];
  incomeSources: IncomeSource[];
  expenses: Expense[];
  defaultAccountId?: string;
  defaultKind?: TransactionKind;
  onSaved: () => void;
  onCancel: () => void;
}

const KINDS: { value: TransactionKind; label: string; hint: string }[] = [
  { value: 'INFLOW', label: 'Money in', hint: 'Deposit, salary, refund' },
  { value: 'OUTFLOW', label: 'Money out', hint: 'Spend, bill, withdrawal' },
  { value: 'TRANSFER', label: 'Transfer', hint: 'Between your accounts' },
  { value: 'ADJUSTMENT', label: 'Adjustment', hint: 'Reconcile balance drift' },
];

const COMMON_INFLOW_CATEGORIES = ['salary', 'freelance', 'refund', 'gift', 'interest', 'dividend', 'other'];
const COMMON_OUTFLOW_CATEGORIES = ['food', 'housing', 'transport', 'utilities', 'health', 'shopping', 'subscriptions', 'entertainment', 'other'];

export function TransactionForm({
  accounts,
  incomeSources,
  expenses,
  defaultAccountId,
  defaultKind,
  onSaved,
  onCancel,
}: Props) {
  const activeAccounts = useMemo(() => accounts.filter((a) => a.isActive), [accounts]);

  const [accountId, setAccountId] = useState<string>(
    defaultAccountId ?? activeAccounts[0]?.id ?? '',
  );
  const [kind, setKind] = useState<TransactionKind>(defaultKind ?? 'OUTFLOW');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [sourceIncomeId, setSourceIncomeId] = useState<string>('');
  const [sourceExpenseId, setSourceExpenseId] = useState<string>('');
  const [transferToAccountId, setTransferToAccountId] = useState<string>('');
  const [transferToAmount, setTransferToAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const account = activeAccounts.find((a) => a.id === accountId);
  const destAccount = activeAccounts.find((a) => a.id === transferToAccountId);
  const isCrossCurrencyTransfer =
    kind === 'TRANSFER' && account && destAccount && account.currency !== destAccount.currency;

  // Reset source links when kind changes — they're only valid for INFLOW/OUTFLOW respectively.
  useEffect(() => {
    if (kind !== 'INFLOW') setSourceIncomeId('');
    if (kind !== 'OUTFLOW') setSourceExpenseId('');
    if (kind !== 'TRANSFER') {
      setTransferToAccountId('');
      setTransferToAmount('');
    }
  }, [kind]);

  // Auto-fill amount + category when a recurring source is selected.
  useEffect(() => {
    if (sourceIncomeId) {
      const src = incomeSources.find((s) => s.id === sourceIncomeId);
      if (src) {
        if (!amount) setAmount(String(Number(src.amount)));
        if (!category) setCategory(src.type.toLowerCase());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceIncomeId]);
  useEffect(() => {
    if (sourceExpenseId) {
      const src = expenses.find((e) => e.id === sourceExpenseId);
      if (src) {
        if (!amount) setAmount(String(Number(src.amount)));
        if (!category) setCategory(src.category);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceExpenseId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!account) {
      setError('Pick an account first');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        accountId,
        date: new Date(date).toISOString(),
        amount: round2(Number(amount)),
        kind,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
      };
      if (kind === 'INFLOW' && sourceIncomeId) body.sourceIncomeId = sourceIncomeId;
      if (kind === 'OUTFLOW' && sourceExpenseId) body.sourceExpenseId = sourceExpenseId;
      if (kind === 'TRANSFER') {
        if (!transferToAccountId) throw new Error('Pick a destination account');
        body.transferToAccountId = transferToAccountId;
        if (isCrossCurrencyTransfer) {
          if (!transferToAmount) throw new Error('Enter the credited amount in the destination currency');
          body.transferToAmount = round2(Number(transferToAmount));
        }
      }
      await api.post('/api/v1/transactions', body);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (activeAccounts.length === 0) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-soft">
          You need at least one account before logging a transaction. Create one first.
        </p>
        <button type="button" onClick={onCancel} className="btn-secondary btn-sm">
          OK
        </button>
      </div>
    );
  }

  const symbol = account ? (CURRENCIES as Record<string, { symbol: string }>)[account.currency]?.symbol ?? '' : '';
  const destSymbol = destAccount
    ? (CURRENCIES as Record<string, { symbol: string }>)[destAccount.currency]?.symbol ?? ''
    : '';
  const categoryHints =
    kind === 'INFLOW' ? COMMON_INFLOW_CATEGORIES : kind === 'OUTFLOW' ? COMMON_OUTFLOW_CATEGORIES : [];

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Type</label>
        <div className="grid grid-cols-2 gap-2">
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
              <div className="text-sm font-medium">{k.label}</div>
              <div className="text-2xs text-mute">{k.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{kind === 'TRANSFER' ? 'From account' : 'Account'}</label>
        <select
          className="input"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
        >
          {activeAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {a.currency}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount {account ? `(${account.currency})` : ''}</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-mute">
              {symbol}
            </span>
            <input
              type="number"
              step="0.01"
              min={0}
              className="input pl-8"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      {kind === 'TRANSFER' && (
        <>
          <div>
            <label className="label">To account</label>
            <select
              className="input"
              value={transferToAccountId}
              onChange={(e) => setTransferToAccountId(e.target.value)}
              required
            >
              <option value="">Pick destination…</option>
              {activeAccounts
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.currency}
                  </option>
                ))}
            </select>
          </div>
          {isCrossCurrencyTransfer && (
            <div>
              <label className="label">
                Credited amount ({destAccount?.currency})
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-mute">
                  {destSymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className="input pl-8"
                  value={transferToAmount}
                  onChange={(e) => setTransferToAmount(e.target.value)}
                  required
                  placeholder={`Enter ${destAccount?.currency} amount actually received`}
                />
              </div>
              <div className="mt-1 text-2xs text-mute">
                Cross-currency transfer. Enter the exact amount that landed in the destination,
                accounting for fees and FX spread.
              </div>
            </div>
          )}
        </>
      )}

      {kind !== 'TRANSFER' && (
        <>
          <div>
            <label className="label">Category</label>
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={kind === 'INFLOW' ? 'e.g. salary, freelance' : 'e.g. food, housing'}
              list="cat-hints"
            />
            <datalist id="cat-hints">
              {categoryHints.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {categoryHints.length > 0 && !category && (
              <div className="mt-2 flex flex-wrap gap-1">
                {categoryHints.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className="chip hover:border-divider hover:text-text"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {kind === 'INFLOW' && incomeSources.length > 0 && (
            <div>
              <label className="label">Link to recurring income (optional)</label>
              <select
                className="input"
                value={sourceIncomeId}
                onChange={(e) => setSourceIncomeId(e.target.value)}
              >
                <option value="">— none —</option>
                {incomeSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type})
                  </option>
                ))}
              </select>
              <div className="mt-1 text-2xs text-mute">
                Mark this as the actual payment for an income rule. Lets you compare projected vs
                received.
              </div>
            </div>
          )}

          {kind === 'OUTFLOW' && expenses.length > 0 && (
            <div>
              <label className="label">Link to recurring expense (optional)</label>
              <select
                className="input"
                value={sourceExpenseId}
                onChange={(e) => setSourceExpenseId(e.target.value)}
              >
                <option value="">— none —</option>
                {expenses.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.category})
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      <div>
        <label className="label">Note (optional)</label>
        <input
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was it?"
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
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
