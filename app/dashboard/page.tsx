'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { CompositionDonut, DonutLegend, paletteAt } from '@/components/charts/CompositionDonut';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/MetricCard';
import { ProjectionChart } from '@/components/charts/ProjectionChart';
import { Skeleton } from '@/components/ui/Skeleton';
import { CashflowChart } from '@/components/charts/CashflowChart';
import { StreakRibbon } from '@/components/charts/StreakRibbon';
import { api } from '@/lib/api';
import { authStore } from '@/lib/auth';
import { useCurrency } from '@/lib/currency-context';
import { percent, relativeDay } from '@/lib/currency';
import { Account, DashboardPayload, Transaction } from '@/lib/types';

export default function DashboardPage() {
  const { format, formatNative, convertToDisplay, code: displayCode } = useCurrency();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshotting, setSnapshotting] = useState(false);

  const load = useCallback(async () => {
    try {
      const payload = await api.get<DashboardPayload>('/api/v1/dashboard');
      setData(payload);
    } catch {
      // 401 → AppShell redirect
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStore.isAuthenticated()) load();
    else setLoading(false);
  }, [load]);

  async function takeSnapshot() {
    setSnapshotting(true);
    try {
      await api.post('/api/v1/metrics/snapshot');
      await load();
    } finally {
      setSnapshotting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        subtitle={
          data
            ? `Overview as of ${new Date(data.asOf).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}`
            : 'Your overview'
        }
        actions={
          <button onClick={takeSnapshot} disabled={snapshotting} className="btn-secondary btn-sm">
            {snapshotting ? 'Snapshotting…' : 'Take snapshot'}
          </button>
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : !data ? (
        <Card>
          <EmptyState
            title="No data yet"
            description="Add your first income source or expense to start seeing your metrics."
            action={
              <Link href="/money" className="btn-primary btn-sm">
                Go to Money
              </Link>
            }
          />
        </Card>
      ) : (
        <DashboardContent
          data={data}
          format={format}
          formatNative={formatNative}
          convertToDisplay={convertToDisplay}
          displayCode={displayCode}
        />
      )}
    </AppShell>
  );
}

function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-44" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

function DashboardContent({
  data,
  format,
  formatNative,
  convertToDisplay,
  displayCode,
}: {
  data: DashboardPayload;
  format: (v: number) => string;
  formatNative: (v: number, code: string) => string;
  convertToDisplay: (v: number, srcCode: string) => number;
  displayCode: string;
}) {
  const m = data.metrics;
  const mrrTone: 'good' | 'bad' = m.projectedMRR >= 0 ? 'good' : 'bad';
  const savingsTone: 'good' | 'bad' = m.savingsRate >= 0 ? 'good' : 'bad';

  const recent = data.snapshots.slice(-14);
  const mrrSpark = recent.map((s) => Number(s.projectedMRR));
  const incSpark = recent.map((s) => Number(s.totalIncome));
  const expSpark = recent.map((s) => Number(s.totalExpenses));

  // Net worth — sum of all account balances converted into display currency.
  const accounts = data.accounts ?? [];
  const monthTransactions = data.monthTransactions ?? [];
  const netWorth = useMemo(
    () =>
      accounts
        .filter((a) => a.isActive)
        .reduce((acc, a) => acc + convertToDisplay(a.currentBalance, a.currency), 0),
    [accounts, convertToDisplay],
  );

  // "This month — actual" rollup from logged transactions, converted to display currency.
  const accountById = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const actualThisMonth = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    for (const t of monthTransactions) {
      const acc = accountById.get(t.accountId);
      if (!acc) continue;
      const v = convertToDisplay(Number(t.amount), acc.currency);
      if (t.kind === 'INFLOW') inflow += v;
      else if (t.kind === 'OUTFLOW') outflow += v;
      // Transfers are intra-account; they don't change net inflow/outflow.
      // Adjustments are reconciliation noise; intentionally excluded from monthly totals.
    }
    return { inflow, outflow, net: inflow - outflow };
  }, [monthTransactions, accountById, convertToDisplay]);

  const incomeSlices = data.activeIncomeSources.map((src, i) => ({
    name: src.name,
    value: monthly(Number(src.amount), src.frequency),
    color: paletteAt(i),
  }));

  const byCat = new Map<string, number>();
  for (const e of data.activeExpenses) {
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + monthly(Number(e.amount), e.frequency));
  }
  const expenseSlices = Array.from(byCat.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: paletteAt(i + 1),
    }));

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Net worth"
          value={formatNative(netWorth, displayCode)}
          tone="accent"
          hint={`${accounts.filter((a) => a.isActive).length || 0} accounts in ${displayCode}`}
        />
        <MetricCard
          label="Projected MRR"
          value={format(m.projectedMRR)}
          tone={mrrTone}
          hint="Recurring rules only"
          spark={mrrSpark}
        />
        <MetricCard
          label="Savings rate"
          value={percent(m.savingsRate)}
          tone={savingsTone}
          hint="(income − expenses) / income"
        />
        <MetricCard
          label="Monthly expenses"
          value={format(m.monthlyExpenses)}
          tone="bad"
          hint="Recurring rules only"
          spark={expSpark}
        />
      </div>

      <ThisMonthPanel
        actual={actualThisMonth}
        projectedIncome={m.monthlyIncome}
        projectedExpenses={m.monthlyExpenses}
        format={format}
        formatNative={formatNative}
        displayCode={displayCode}
        monthTxCount={monthTransactions.filter((t) => t.kind === 'INFLOW' || t.kind === 'OUTFLOW').length}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="12-month projection"
          hint="Baseline assumes today's recurring flows hold. Upside is +50% on commission-style income; downside zeroes commissions."
        >
          <ProjectionChart
            baseline={data.scenarios.baseline}
            upside={data.scenarios.upside}
            downside={data.scenarios.downside}
          />
        </Card>

        <Card
          title="Cashflow history"
          hint={
            data.snapshots.length === 0
              ? 'Take a snapshot to start the time-series.'
              : `${data.snapshots.length} snapshots`
          }
        >
          {data.snapshots.length === 0 ? (
            <EmptyState
              title="No snapshots yet"
              description="A snapshot stores income/expense totals for that day."
            />
          ) : (
            <CashflowChart snapshots={data.snapshots} />
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Where money comes from" hint="Active income rules, normalised to monthly">
          {incomeSlices.length === 0 ? (
            <EmptyState
              title="No income rules"
              action={
                <Link href="/money" className="btn-primary btn-sm">
                  Add income
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <CompositionDonut
                slices={incomeSlices}
                centerLabel="Monthly"
                centerValue={m.monthlyIncome}
              />
              <div className="flex-1 self-stretch">
                <DonutLegend slices={incomeSlices} />
              </div>
            </div>
          )}
        </Card>

        <Card title="Where money goes" hint="Active recurring expenses by category, monthly">
          {expenseSlices.length === 0 ? (
            <EmptyState
              title="No expenses"
              action={
                <Link href="/money" className="btn-primary btn-sm">
                  Add expense
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <CompositionDonut
                slices={expenseSlices}
                centerLabel="Monthly"
                centerValue={m.monthlyExpenses}
              />
              <div className="flex-1 self-stretch">
                <DonutLegend slices={expenseSlices} />
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Active streaks"
          actions={
            <Link href="/habits" className="btn-ghost btn-sm">
              Manage →
            </Link>
          }
        >
          {data.streaks.length === 0 ? (
            <EmptyState
              title="No streaks yet"
              action={
                <Link href="/habits" className="btn-primary btn-sm">
                  Start a streak
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {data.streaks.slice(0, 4).map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-elevated/50 px-3 py-3"
                >
                  <div className="min-w-[8rem] flex-1">
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-2xs text-mute">
                      {s.type === 'POSITIVE' ? 'Build' : 'Avoid'} ·{' '}
                      {s.lastLoggedDate ? `last ${relativeDay(s.lastLoggedDate)}` : 'never logged'}
                    </div>
                  </div>
                  <StreakRibbon streak={s} />
                  <div className="text-right">
                    <div className="text-xl font-semibold tabular-nums text-star-400">
                      {s.currentCount}
                    </div>
                    <div className="text-2xs text-mute">days</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Recent journal"
          actions={
            <Link href="/journal" className="btn-ghost btn-sm">
              All →
            </Link>
          }
        >
          {data.recentLogs.length === 0 ? (
            <EmptyState
              title="No entries"
              action={
                <Link href="/journal" className="btn-primary btn-sm">
                  Write first entry
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {data.recentLogs.slice(0, 4).map((l) => (
                <li key={l.id} className="rounded-lg bg-elevated/50 border border-border p-3">
                  <div className="flex items-center justify-between text-2xs text-mute">
                    <span>{relativeDay(l.date)}</span>
                    {l.mood != null && <span>{moodEmoji(l.mood)}</span>}
                  </div>
                  {l.note && <div className="mt-1 line-clamp-2 text-sm text-text">{l.note}</div>}
                  {l.tags && l.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {l.tags.slice(0, 4).map((t) => (
                        <span key={t} className="chip-accent">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

// Side-by-side projected vs actual for the current month.
function ThisMonthPanel({
  actual,
  projectedIncome,
  projectedExpenses,
  format,
  formatNative,
  displayCode,
  monthTxCount,
}: {
  actual: { inflow: number; outflow: number; net: number };
  projectedIncome: number;
  projectedExpenses: number;
  format: (v: number) => string;
  formatNative: (v: number, code: string) => string;
  displayCode: string;
  monthTxCount: number;
}) {
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  return (
    <Card
      title={`${monthName} so far · actual vs projected`}
      hint={
        monthTxCount === 0
          ? 'No transactions logged yet this month — add some on the Money → Transactions tab to populate this.'
          : `${monthTxCount} transaction${monthTxCount === 1 ? '' : 's'} logged this month`
      }
      actions={
        <Link href="/money" className="btn-ghost btn-sm">
          Log transaction →
        </Link>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <Compare
          label="Income in"
          actual={actual.inflow}
          projected={projectedIncome}
          tone="good"
          formatNative={formatNative}
          format={format}
          displayCode={displayCode}
        />
        <Compare
          label="Expenses out"
          actual={actual.outflow}
          projected={projectedExpenses}
          tone="bad"
          formatNative={formatNative}
          format={format}
          displayCode={displayCode}
        />
        <Compare
          label="Net"
          actual={actual.net}
          projected={projectedIncome - projectedExpenses}
          tone={actual.net >= 0 ? 'good' : 'bad'}
          formatNative={formatNative}
          format={format}
          displayCode={displayCode}
          highlight
        />
      </div>
    </Card>
  );
}

function Compare({
  label,
  actual,
  projected,
  tone,
  formatNative,
  format,
  displayCode,
  highlight,
}: {
  label: string;
  actual: number;
  projected: number;
  tone: 'good' | 'bad';
  formatNative: (v: number, code: string) => string;
  format: (v: number) => string;
  displayCode: string;
  highlight?: boolean;
}) {
  const ratio = projected > 0 ? actual / projected : null;
  const ratioPct = ratio != null ? Math.min(100, Math.max(0, ratio * 100)) : null;
  const valueColor = tone === 'good' ? 'text-success' : 'text-danger';

  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? 'border-star-500/40 bg-star-500/5' : 'border-border bg-elevated/40'
      }`}
    >
      <div className="card-title">{label} · actual</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${valueColor}`}>
        {formatNative(actual, displayCode)}
      </div>
      <div className="mt-2 flex items-baseline justify-between text-2xs text-soft">
        <span>vs projected</span>
        <span className="tabular-nums">{format(projected)}</span>
      </div>
      {ratioPct != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
          <div
            className={`h-full transition-all ${
              tone === 'good' ? 'bg-success' : 'bg-danger'
            } opacity-70`}
            style={{ width: `${ratioPct}%` }}
          />
        </div>
      )}
      {ratio != null && (
        <div className="mt-1.5 text-2xs text-mute tabular-nums">{(ratio * 100).toFixed(0)}% of projected</div>
      )}
    </div>
  );
}

function moodEmoji(m: number) {
  if (m <= 2) return '😞';
  if (m <= 4) return '😕';
  if (m <= 6) return '😐';
  if (m <= 8) return '🙂';
  return '😄';
}

function monthly(amount: number, freq: 'WEEKLY' | 'MONTHLY' | 'ANNUAL' | 'ONE_TIME'): number {
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
