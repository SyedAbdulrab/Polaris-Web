'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { CompositionDonut, DonutLegend, paletteAt } from '@/components/charts/CompositionDonut';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { IncomeForm } from '@/components/forms/IncomeForm';
import { AccountForm } from '@/components/forms/AccountForm';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { authStore } from '@/lib/auth';
import { useCurrency } from '@/lib/currency-context';
import { relativeDay } from '@/lib/currency';
import {
  Account,
  Expense,
  Frequency,
  IncomeSource,
  Transaction,
  TransactionKind,
} from '@/lib/types';

type Tab = 'recurring' | 'accounts' | 'transactions';

export default function MoneyPage() {
  const { format, formatNative, convertToDisplay, code: displayCode } = useCurrency();

  const [tab, setTab] = useState<Tab>('recurring');
  const [income, setIncome] = useState<IncomeSource[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  const [recurringTab, setRecurringTab] = useState<'income' | 'expense'>('income');
  const [modal, setModal] = useState<
    | null
    | { kind: 'income'; editing?: IncomeSource }
    | { kind: 'expense'; editing?: Expense }
    | { kind: 'account'; editing?: Account }
    | { kind: 'transaction'; defaultAccountId?: string; defaultKind?: TransactionKind }
  >(null);

  const load = useCallback(async () => {
    if (!authStore.isAuthenticated()) return;
    const [inc, exp, acc, tx] = await Promise.all([
      api.get<IncomeSource[]>('/api/v1/income'),
      api.get<Expense[]>('/api/v1/expenses'),
      api.get<Account[]>('/api/v1/accounts'),
      api.get<Transaction[]>('/api/v1/transactions?limit=200'),
    ]);
    setIncome(inc);
    setExpenses(exp);
    setAccounts(acc);
    setTransactions(tx);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function removeIncome(id: string) {
    if (!confirm('Delete this income rule?')) return;
    await api.del(`/api/v1/income/${id}`);
    load();
  }
  async function removeExpense(id: string) {
    if (!confirm('Delete this expense rule?')) return;
    await api.del(`/api/v1/expenses/${id}`);
    load();
  }
  async function removeAccount(id: string) {
    if (!confirm('Delete this account? Transactions on it will also be removed.')) return;
    await api.del(`/api/v1/accounts/${id}`);
    load();
  }
  async function removeTransaction(id: string) {
    if (!confirm('Delete this transaction?')) return;
    await api.del(`/api/v1/transactions/${id}`);
    load();
  }

  // ----- Aggregates -----
  const totalMonthlyIncome = (income ?? [])
    .filter((i) => i.isActive)
    .reduce((acc, i) => acc + monthly(Number(i.amount), i.frequency), 0);
  const totalMonthlyExpenses = (expenses ?? [])
    .filter((e) => e.isActive)
    .reduce((acc, e) => acc + monthly(Number(e.amount), e.frequency), 0);

  const incomeSlices = (income ?? [])
    .filter((i) => i.isActive)
    .map((i, idx) => ({
      name: i.name,
      value: monthly(Number(i.amount), i.frequency),
      color: paletteAt(idx),
    }));

  const byCat = new Map<string, number>();
  for (const e of expenses ?? []) {
    if (!e.isActive) continue;
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + monthly(Number(e.amount), e.frequency));
  }
  const expenseSlices = Array.from(byCat.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: paletteAt(i + 1),
    }));

  // Net worth — sum of all account balances converted to display currency.
  const netWorth = useMemo(() => {
    if (!accounts) return 0;
    return accounts
      .filter((a) => a.isActive)
      .reduce((acc, a) => acc + convertToDisplay(a.currentBalance, a.currency), 0);
  }, [accounts, convertToDisplay]);

  // Map accounts by id for transaction rendering.
  const accountById = useMemo(() => {
    const m = new Map<string, Account>();
    (accounts ?? []).forEach((a) => m.set(a.id, a));
    return m;
  }, [accounts]);
  const incomeById = useMemo(() => {
    const m = new Map<string, IncomeSource>();
    (income ?? []).forEach((i) => m.set(i.id, i));
    return m;
  }, [income]);
  const expenseById = useMemo(() => {
    const m = new Map<string, Expense>();
    (expenses ?? []).forEach((e) => m.set(e.id, e));
    return m;
  }, [expenses]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Money</h1>
          <p className="mt-0.5 text-sm text-soft">
            Recurring rules, accounts and the transactions that move between them.
          </p>
        </div>
        <div className="flex gap-2">
          {tab === 'recurring' && (
            <button
              onClick={() => setModal({ kind: recurringTab })}
              className="btn-primary btn-sm"
            >
              + Add {recurringTab === 'income' ? 'income' : 'expense'}
            </button>
          )}
          {tab === 'accounts' && (
            <button onClick={() => setModal({ kind: 'account' })} className="btn-primary btn-sm">
              + Add account
            </button>
          )}
          {tab === 'transactions' && (
            <button
              onClick={() => setModal({ kind: 'transaction' })}
              className="btn-primary btn-sm"
            >
              + Log transaction
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 inline-flex rounded-lg bg-elevated p-1">
        {(
          [
            { v: 'recurring', label: 'Recurring' },
            { v: 'accounts', label: 'Accounts' },
            { v: 'transactions', label: 'Transactions' },
          ] as { v: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              tab === t.v ? 'bg-canvas text-text shadow-soft' : 'text-mute hover:text-soft'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'recurring' && (
        <RecurringTab
          recurringTab={recurringTab}
          setRecurringTab={setRecurringTab}
          income={income}
          expenses={expenses}
          totalMonthlyIncome={totalMonthlyIncome}
          totalMonthlyExpenses={totalMonthlyExpenses}
          incomeSlices={incomeSlices}
          expenseSlices={expenseSlices}
          format={format}
          onAdd={() => setModal({ kind: recurringTab })}
          onEdit={(id) => {
            if (recurringTab === 'income') setModal({ kind: 'income', editing: income?.find((x) => x.id === id) });
            else setModal({ kind: 'expense', editing: expenses?.find((x) => x.id === id) });
          }}
          onDelete={(id) => (recurringTab === 'income' ? removeIncome(id) : removeExpense(id))}
        />
      )}

      {tab === 'accounts' && (
        <AccountsTab
          accounts={accounts}
          netWorth={netWorth}
          displayCode={displayCode}
          formatNative={formatNative}
          onAdd={() => setModal({ kind: 'account' })}
          onEdit={(a) => setModal({ kind: 'account', editing: a })}
          onDelete={removeAccount}
          onLogTx={(accountId) => setModal({ kind: 'transaction', defaultAccountId: accountId })}
        />
      )}

      {tab === 'transactions' && (
        <TransactionsTab
          transactions={transactions}
          accountById={accountById}
          incomeById={incomeById}
          expenseById={expenseById}
          formatNative={formatNative}
          onAdd={() => setModal({ kind: 'transaction' })}
          onDelete={removeTransaction}
        />
      )}

      <Modal
        open={modal != null}
        onClose={() => setModal(null)}
        title={
          modal?.kind === 'income'
            ? modal.editing
              ? 'Edit income source'
              : 'Add income source'
            : modal?.kind === 'expense'
              ? modal.editing
                ? 'Edit expense'
                : 'Add expense'
              : modal?.kind === 'account'
                ? modal.editing
                  ? 'Edit account'
                  : 'Add account'
                : modal?.kind === 'transaction'
                  ? 'Log transaction'
                  : ''
        }
        width={modal?.kind === 'transaction' || modal?.kind === 'account' ? 'lg' : 'md'}
      >
        {modal?.kind === 'income' && (
          <IncomeForm
            initial={modal.editing}
            onSaved={() => {
              setModal(null);
              load();
            }}
            onCancel={() => setModal(null)}
          />
        )}
        {modal?.kind === 'expense' && (
          <ExpenseForm
            initial={modal.editing}
            onSaved={() => {
              setModal(null);
              load();
            }}
            onCancel={() => setModal(null)}
          />
        )}
        {modal?.kind === 'account' && (
          <AccountForm
            initial={modal.editing}
            onSaved={() => {
              setModal(null);
              load();
            }}
            onCancel={() => setModal(null)}
          />
        )}
        {modal?.kind === 'transaction' && (
          <TransactionForm
            accounts={accounts ?? []}
            incomeSources={income ?? []}
            expenses={expenses ?? []}
            defaultAccountId={modal.defaultAccountId}
            defaultKind={modal.defaultKind}
            onSaved={() => {
              setModal(null);
              load();
            }}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </AppShell>
  );
}

// ---------- Recurring tab ----------

function RecurringTab({
  recurringTab,
  setRecurringTab,
  income,
  expenses,
  totalMonthlyIncome,
  totalMonthlyExpenses,
  incomeSlices,
  expenseSlices,
  format,
  onAdd,
  onEdit,
  onDelete,
}: {
  recurringTab: 'income' | 'expense';
  setRecurringTab: (t: 'income' | 'expense') => void;
  income: IncomeSource[] | null;
  expenses: Expense[] | null;
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  incomeSlices: { name: string; value: number; color: string }[];
  expenseSlices: { name: string; value: number; color: string }[];
  format: (v: number) => string;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg bg-elevated p-1">
        {(['income', 'expense'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setRecurringTab(t)}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
              recurringTab === t ? 'bg-canvas text-text shadow-soft' : 'text-mute hover:text-soft'
            }`}
          >
            {t === 'income' ? 'Income' : 'Expenses'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title={recurringTab === 'income' ? 'Income sources' : 'Expenses'}
          hint={
            recurringTab === 'income'
              ? `${income?.filter((i) => i.isActive).length ?? 0} active · ${format(totalMonthlyIncome)}/month`
              : `${expenses?.filter((e) => e.isActive).length ?? 0} active · ${format(totalMonthlyExpenses)}/month`
          }
        >
          {recurringTab === 'income' ? (
            income == null ? (
              <Skeleton className="h-64" />
            ) : income.length === 0 ? (
              <EmptyState
                title="No income rules"
                description="Add a recurring income rule to populate projections and the cashflow chart."
                action={
                  <button onClick={onAdd} className="btn-primary btn-sm">
                    Add first income
                  </button>
                }
              />
            ) : (
              <RuleTable
                rows={income.map((i) => ({
                  id: i.id,
                  name: i.name,
                  meta: `${i.type.charAt(0) + i.type.slice(1).toLowerCase()} · ${freqLabel(i.frequency)}`,
                  amountUsd: Number(i.amount),
                  monthlyUsd: monthly(Number(i.amount), i.frequency),
                }))}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )
          ) : expenses == null ? (
            <Skeleton className="h-64" />
          ) : expenses.length === 0 ? (
            <EmptyState
              title="No expense rules"
              description="Track your recurring outflows."
              action={
                <button onClick={onAdd} className="btn-primary btn-sm">
                  Add first expense
                </button>
              }
            />
          ) : (
            <RuleTable
              rows={expenses.map((e) => ({
                id: e.id,
                name: e.name,
                meta: `${e.category} · ${freqLabel(e.frequency)}`,
                amountUsd: Number(e.amount),
                monthlyUsd: monthly(Number(e.amount), e.frequency),
              }))}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </Card>

        <Card title={recurringTab === 'income' ? 'Income mix' : 'Expense mix'} hint="Monthly equivalent">
          {recurringTab === 'income' ? (
            incomeSlices.length === 0 ? (
              <EmptyState title="—" />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <CompositionDonut
                  slices={incomeSlices}
                  centerLabel="Monthly"
                  centerValue={totalMonthlyIncome}
                />
                <div className="w-full">
                  <DonutLegend slices={incomeSlices} />
                </div>
              </div>
            )
          ) : expenseSlices.length === 0 ? (
            <EmptyState title="—" />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <CompositionDonut
                slices={expenseSlices}
                centerLabel="Monthly"
                centerValue={totalMonthlyExpenses}
              />
              <div className="w-full">
                <DonutLegend slices={expenseSlices} />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function RuleTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: { id: string; name: string; meta: string; amountUsd: number; monthlyUsd: number }[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { format } = useCurrency();
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-elevated/40 text-2xs uppercase tracking-wider text-mute">
            <th className="px-3 py-2 text-left font-medium">Name</th>
            <th className="px-3 py-2 text-right font-medium">Amount</th>
            <th className="hidden px-3 py-2 text-right font-medium md:table-cell">Monthly</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-hover/40">
              <td className="px-3 py-2.5">
                <div className="text-sm font-medium">{r.name}</div>
                <div className="text-2xs text-mute">{r.meta}</div>
              </td>
              <td className="px-3 py-2.5 text-right text-sm tabular-nums">{format(r.amountUsd)}</td>
              <td className="hidden px-3 py-2.5 text-right text-sm tabular-nums text-soft md:table-cell">
                {format(r.monthlyUsd)}
              </td>
              <td className="px-3 py-2.5 text-right">
                <div className="inline-flex gap-1">
                  <button onClick={() => onEdit(r.id)} className="btn-ghost btn-sm">
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(r.id)}
                    className="btn-ghost btn-sm text-danger hover:bg-danger/10"
                  >
                    ×
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Accounts tab ----------

function AccountsTab({
  accounts,
  netWorth,
  displayCode,
  formatNative,
  onAdd,
  onEdit,
  onDelete,
  onLogTx,
}: {
  accounts: Account[] | null;
  netWorth: number;
  displayCode: string;
  formatNative: (v: number, code: string) => string;
  onAdd: () => void;
  onEdit: (a: Account) => void;
  onDelete: (id: string) => void;
  onLogTx: (accountId: string) => void;
}) {
  if (accounts == null) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    );
  }
  if (accounts.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No accounts yet"
          description="Add your bank accounts, cash, credit cards. Each one keeps its own currency. Net worth is the sum, converted to your display currency."
          action={
            <button onClick={onAdd} className="btn-primary btn-sm">
              Add first account
            </button>
          }
        />
      </Card>
    );
  }

  const activeCount = accounts.filter((a) => a.isActive).length;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="card-title">Net worth</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums text-text">
              {formatNative(netWorth, displayCode)}
            </div>
          </div>
          <div className="text-2xs text-mute">
            Sum across {activeCount} active account{activeCount === 1 ? '' : 's'} · in {displayCode}
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((a) => (
          <AccountCard
            key={a.id}
            account={a}
            formatNative={formatNative}
            onEdit={() => onEdit(a)}
            onDelete={() => onDelete(a.id)}
            onLogTx={() => onLogTx(a.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AccountCard({
  account,
  formatNative,
  onEdit,
  onDelete,
  onLogTx,
}: {
  account: Account;
  formatNative: (v: number, code: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  onLogTx: () => void;
}) {
  const isDebt = account.kind === 'CREDIT_CARD' || account.kind === 'LOAN';
  const balance = account.currentBalance;
  const balanceTone = isDebt
    ? balance > 0 ? 'text-danger' : 'text-text'
    : balance >= 0 ? 'text-text' : 'text-danger';

  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium">{account.name}</div>
          <div className="text-2xs text-mute">
            {kindLabel(account.kind)}
            {account.institution ? ` · ${account.institution}` : ''}
          </div>
        </div>
        <span className="chip">{account.currency}</span>
      </div>

      <div className="mt-4">
        <div className="text-2xs text-mute">{isDebt ? 'Outstanding' : 'Balance'}</div>
        <div className={`mt-0.5 text-2xl font-semibold tabular-nums ${balanceTone}`}>
          {formatNative(balance, account.currency)}
        </div>
        {!account.isActive && (
          <div className="mt-1 text-2xs text-warn">archived</div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={onLogTx} className="btn-primary btn-sm flex-1">
          + Transaction
        </button>
        <button onClick={onEdit} className="btn-secondary btn-sm">
          Edit
        </button>
        <button
          onClick={onDelete}
          className="btn-ghost btn-sm text-mute hover:text-danger"
          aria-label="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function kindLabel(k: Account['kind']): string {
  return {
    CHECKING: 'Checking',
    SAVINGS: 'Savings',
    CASH: 'Cash',
    CREDIT_CARD: 'Credit card',
    INVESTMENT: 'Investment',
    LOAN: 'Loan',
    OTHER: 'Other',
  }[k];
}

// ---------- Transactions tab ----------

function TransactionsTab({
  transactions,
  accountById,
  incomeById,
  expenseById,
  formatNative,
  onAdd,
  onDelete,
}: {
  transactions: Transaction[] | null;
  accountById: Map<string, Account>;
  incomeById: Map<string, IncomeSource>;
  expenseById: Map<string, Expense>;
  formatNative: (v: number, code: string) => string;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | TransactionKind>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  const filtered = (transactions ?? []).filter((t) => {
    if (filter !== 'all' && t.kind !== filter) return false;
    if (accountFilter !== 'all' && t.accountId !== accountFilter) return false;
    return true;
  });

  if (transactions == null) {
    return <Skeleton className="h-64" />;
  }
  if (transactions.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No transactions yet"
          description="Log a transaction to start tracking actual money movement. Recurring rules are projections; transactions are reality."
          action={
            <button onClick={onAdd} className="btn-primary btn-sm">
              Log first transaction
            </button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-elevated p-1">
          {(['all', 'INFLOW', 'OUTFLOW', 'TRANSFER', 'ADJUSTMENT'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-md px-3 py-1 text-2xs font-medium uppercase tracking-wider transition-all ${
                filter === k ? 'bg-canvas text-text shadow-soft' : 'text-mute hover:text-soft'
              }`}
            >
              {k === 'all' ? 'All' : k}
            </button>
          ))}
        </div>
        {accountById.size > 1 && (
          <select
            className="input w-auto text-xs"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
          >
            <option value="all">All accounts</option>
            {Array.from(accountById.values()).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
        <div className="ml-auto text-2xs text-mute">
          {filtered.length} of {transactions.length}
        </div>
      </div>

      <Card bodyClassName="!mt-0 -mx-5 -my-5 overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-elevated/40 text-2xs uppercase tracking-wider text-mute">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Account</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const acc = accountById.get(t.accountId);
                const linked =
                  t.sourceIncomeId && incomeById.get(t.sourceIncomeId)?.name
                    ? `↳ ${incomeById.get(t.sourceIncomeId)!.name}`
                    : t.sourceExpenseId && expenseById.get(t.sourceExpenseId)?.name
                      ? `↳ ${expenseById.get(t.sourceExpenseId)!.name}`
                      : null;
                const sign = signFor(t.kind);
                const tone =
                  t.kind === 'INFLOW' || (t.kind === 'ADJUSTMENT' && sign > 0)
                    ? 'text-success'
                    : t.kind === 'OUTFLOW'
                      ? 'text-danger'
                      : 'text-soft';
                return (
                  <tr key={t.id} className="border-b border-border last:border-b-0 hover:bg-hover/40">
                    <td className="px-4 py-3 text-2xs text-soft tabular-nums">
                      {relativeDay(t.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{acc?.name ?? '—'}</div>
                      <div className="text-2xs text-mute">{acc?.currency}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {t.description ?? <span className="text-mute italic">—</span>}
                      </div>
                      {linked && <div className="mt-0.5 text-2xs text-star-400">{linked}</div>}
                    </td>
                    <td className="px-4 py-3 text-2xs text-soft">
                      <span className="chip">{labelKind(t.kind)}</span>
                      {t.category && <span className="ml-1 text-mute">· {t.category}</span>}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm tabular-nums font-medium ${tone}`}>
                      {sign < 0 ? '−' : sign > 0 ? '+' : ''}
                      {acc ? formatNative(Number(t.amount), acc.currency) : Number(t.amount).toFixed(2)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <button
                        onClick={() => onDelete(t.id)}
                        className="btn-ghost btn-sm text-mute hover:text-danger"
                        aria-label="Delete"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function labelKind(k: TransactionKind) {
  return {
    INFLOW: 'In',
    OUTFLOW: 'Out',
    TRANSFER: 'Transfer',
    ADJUSTMENT: 'Adj',
  }[k];
}

function signFor(k: TransactionKind) {
  switch (k) {
    case 'INFLOW':
      return +1;
    case 'OUTFLOW':
      return -1;
    case 'TRANSFER':
      return -1; // shown from source-account perspective
    case 'ADJUSTMENT':
      return +1;
  }
}

// ---------- Helpers ----------

function freqLabel(f: Frequency) {
  switch (f) {
    case 'MONTHLY':
      return 'Monthly';
    case 'WEEKLY':
      return 'Weekly';
    case 'ANNUAL':
      return 'Annual';
    case 'ONE_TIME':
      return 'One-time';
  }
}

function monthly(amount: number, freq: Frequency) {
  switch (freq) {
    case 'WEEKLY':
      return amount * 4.333;
    case 'ANNUAL':
      return amount / 12;
    case 'MONTHLY':
      return amount;
    case 'ONE_TIME':
      return 0;
  }
}
