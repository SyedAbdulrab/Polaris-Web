'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { authStore, StoredUser } from '@/lib/auth';
import { CURRENCIES, CurrencyCode, RATES_AS_OF } from '@/lib/currency';
import { useCurrency } from '@/lib/currency-context';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function SettingsPage() {
  const { code, setCode } = useCurrency();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    setUser(authStore.getUser());
  }, []);

  function exportLink(path: string, filename: string) {
    return async () => {
      const token = authStore.getAccessToken() ?? '';
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-soft">Display preferences and account.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Currency" hint={`Rates as of ${RATES_AS_OF}. Conversion is display-only.`}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => {
              const m = CURRENCIES[c];
              const active = c === code;
              return (
                <button
                  key={c}
                  onClick={() => setCode(c)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? 'border-star-500/60 bg-star-500/10'
                      : 'border-border bg-elevated hover:border-divider'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-mute">{m.symbol}</span>
                    <span className="text-sm font-medium">{m.code}</span>
                  </div>
                  <div className="mt-0.5 text-2xs text-mute">{m.name}</div>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-2xs text-mute">
            All amounts are stored in USD as the base currency. Switching here just changes how they're
            displayed and how form inputs are interpreted on the way out — your underlying data doesn't
            move.
          </p>
        </Card>

        <Card title="Account">
          <div className="space-y-3">
            <Field label="Name" value={user?.name ?? '—'} />
            <Field label="Email" value={user?.email ?? '—'} mono />
            <Field label="User ID" value={user?.id ?? '—'} mono small />
          </div>
        </Card>

        <Card title="Export your data" hint="One-shot dumps of everything for this account">
          <div className="flex flex-wrap gap-2">
            <button onClick={exportLink('/api/v1/export/json', 'polaris.json')} className="btn-secondary btn-sm">
              JSON
            </button>
            <button onClick={exportLink('/api/v1/export/csv', 'polaris.csv')} className="btn-secondary btn-sm">
              CSV
            </button>
            <button
              onClick={exportLink('/api/v1/export/pdf/monthly', 'polaris-monthly.pdf')}
              className="btn-secondary btn-sm"
            >
              Monthly PDF
            </button>
          </div>
        </Card>

        <Card title="About">
          <p className="text-sm text-soft">
            Polaris is a personal life-metrics tracker. Finances, streaks, goals, and a journal — your
            north-star numbers in one place.
          </p>
          <p className="mt-3 text-2xs text-mute">
            API · {new URL(API_BASE).host}
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  mono,
  small,
}: {
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wider text-mute">{label}</div>
      <div
        className={`mt-1 ${mono ? 'font-mono' : ''} ${small ? 'text-xs text-soft' : 'text-sm text-text'}`}
      >
        {value}
      </div>
    </div>
  );
}
