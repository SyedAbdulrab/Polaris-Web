'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL ?? 'https://grafana.abdulrab.store';
const POLL_MS = 15_000;

// Terminus shape: { status, info, error, details } where each check is { status: 'up' | 'down', ... }
interface HealthCheck {
  status: string;
  [key: string]: unknown;
}
interface HealthResponse {
  status?: string;
  info?: Record<string, HealthCheck>;
  error?: Record<string, HealthCheck>;
  details?: Record<string, HealthCheck>;
}

type Overall = 'loading' | 'ok' | 'degraded' | 'unreachable';

export default function GrafanaPage() {
  const [overall, setOverall] = useState<Overall>('loading');
  const [data, setData] = useState<HealthResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);

  const poll = useCallback(async () => {
    setRefreshing(true);
    const started = performance.now();
    try {
      const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
      const body: HealthResponse | null = await res.json().catch(() => null);
      if (!mounted.current) return;
      setLatencyMs(Math.round(performance.now() - started));
      setData(body);
      setOverall(res.ok && body?.status === 'ok' ? 'ok' : 'degraded');
    } catch {
      if (!mounted.current) return;
      setLatencyMs(null);
      setData(null);
      setOverall('unreachable');
    } finally {
      if (mounted.current) {
        setCheckedAt(new Date());
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [poll]);

  const checks = Object.entries(data?.details ?? {});

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Observability</h1>
        <p className="mt-0.5 text-sm text-soft">
          Live system health and the Grafana metrics dashboard.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Grafana"
          hint="Host, container and API metrics — latency, traffic, errors, CPU & memory."
        >
          <p className="text-sm text-soft">
            Dashboards are powered by Prometheus scraping the API, node-exporter and cAdvisor. The
            board opens in a new tab and is protected by its own login.
          </p>
          <a
            href={GRAFANA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-sm mt-4 inline-flex"
          >
            Open Grafana
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <p className="mt-3 break-all font-mono text-2xs text-mute">{GRAFANA_URL}</p>
        </Card>

        <Card
          title="API health"
          hint={`Auto-refreshes every ${POLL_MS / 1000}s`}
          actions={
            <button onClick={poll} disabled={refreshing} className="btn-ghost btn-sm">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={refreshing ? 'animate-spin' : ''}
                aria-hidden
              >
                <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Refresh
            </button>
          }
        >
          <div className="flex items-center gap-3">
            <StatusBadge overall={overall} />
            <div className="text-sm">
              <div className="font-medium">{OVERALL_LABEL[overall]}</div>
              <div className="text-2xs text-mute">
                {checkedAt ? `Checked ${checkedAt.toLocaleTimeString()}` : 'Checking…'}
                {latencyMs != null && ` · ${latencyMs}ms`}
              </div>
            </div>
          </div>

          <dl className="mt-4 space-y-2">
            {checks.length > 0 ? (
              checks.map(([name, check]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg border border-border bg-elevated px-3 py-2"
                >
                  <dt className="text-sm capitalize">{name}</dt>
                  <dd className="flex items-center gap-1.5">
                    <Dot up={check.status === 'up'} />
                    <span className="text-xs text-soft">{check.status}</span>
                  </dd>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-border bg-elevated px-3 py-2 text-xs text-mute">
                {overall === 'unreachable'
                  ? 'No response from the API. It may be down, restarting, or blocked by the network.'
                  : 'No individual checks reported.'}
              </div>
            )}
          </dl>

          <p className="mt-4 break-all font-mono text-2xs text-mute">{API_BASE}/health</p>
        </Card>
      </div>
    </AppShell>
  );
}

const OVERALL_LABEL: Record<Overall, string> = {
  loading: 'Checking…',
  ok: 'All systems operational',
  degraded: 'Degraded — one or more checks failing',
  unreachable: 'Unreachable',
};

function StatusBadge({ overall }: { overall: Overall }) {
  const map: Record<Overall, { ring: string; bg: string; text: string }> = {
    loading: { ring: 'ring-mute/30', bg: 'bg-mute/15', text: 'text-mute' },
    ok: { ring: 'ring-success/30', bg: 'bg-success/15', text: 'text-success' },
    degraded: { ring: 'ring-warn/30', bg: 'bg-warn/15', text: 'text-warn' },
    unreachable: { ring: 'ring-danger/30', bg: 'bg-danger/15', text: 'text-danger' },
  };
  const s = map[overall];
  return (
    <span className={`flex h-10 w-10 items-center justify-center rounded-full ring-1 ${s.ring} ${s.bg}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${s.text.replace('text-', 'bg-')} ${overall === 'ok' ? 'animate-pulse' : ''}`} />
    </span>
  );
}

function Dot({ up }: { up: boolean }) {
  return <span className={`h-2 w-2 rounded-full ${up ? 'bg-success' : 'bg-danger'}`} />;
}
