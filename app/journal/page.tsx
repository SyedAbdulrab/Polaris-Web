'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LogForm } from '@/components/forms/LogForm';
import { Modal } from '@/components/ui/Modal';
import { MoodChart } from '@/components/charts/MoodChart';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { authStore } from '@/lib/auth';
import { LogEntry } from '@/lib/types';

const MOOD_LABEL = ['', 'Low', 'Meh', 'OK', 'Good', 'Great'];

export default function JournalPage() {
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!authStore.isAuthenticated()) return;
    const data = await api.get<LogEntry[]>('/api/v1/logs');
    setLogs(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const knownTags = useMemo(() => {
    const set = new Set<string>();
    (logs ?? []).forEach((l) => l.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    if (!filterTag) return logs;
    return (logs ?? []).filter((l) => l.tags?.includes(filterTag));
  }, [logs, filterTag]);

  async function remove(id: string) {
    if (!confirm('Delete this entry?')) return;
    await api.del(`/api/v1/logs/${id}`);
    load();
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
          <p className="mt-0.5 text-sm text-soft">A daily log — mood, tags, and what happened.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm">
          + New entry
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {logs == null ? (
            <Skeleton className="h-72" />
          ) : (filtered ?? []).length === 0 ? (
            <Card>
              <EmptyState
                title={filterTag ? `No entries tagged "${filterTag}"` : 'No journal entries yet'}
                description="A short note each day adds up. You'll be able to filter by tag and chart your mood."
                action={
                  filterTag ? (
                    <button onClick={() => setFilterTag(null)} className="btn-secondary btn-sm">
                      Clear filter
                    </button>
                  ) : (
                    <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm">
                      Write first entry
                    </button>
                  )
                }
              />
            </Card>
          ) : (
            <>
              {filterTag && (
                <div className="flex items-center gap-2 text-sm text-soft">
                  <span>Filtered by</span>
                  <span className="chip-accent">{filterTag}</span>
                  <button onClick={() => setFilterTag(null)} className="btn-ghost btn-sm">
                    clear
                  </button>
                </div>
              )}
              <ol className="space-y-3">
                {(filtered ?? []).map((l) => (
                  <li key={l.id} className="card card-hover">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-2xs text-mute">
                        <span>{new Date(l.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}</span>
                        {l.mood != null && (
                          <>
                            <span>·</span>
                            <span>
                              {moodEmoji(l.mood)} {MOOD_LABEL[clampMood(l.mood)]}
                            </span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => remove(l.id)}
                        className="btn-ghost btn-sm text-mute hover:text-danger"
                        aria-label="Delete entry"
                      >
                        ×
                      </button>
                    </div>
                    {l.note && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text">
                        {l.note}
                      </p>
                    )}
                    {l.tags && l.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {l.tags.map((t) => (
                          <button
                            key={t}
                            onClick={() => setFilterTag(t)}
                            className="chip-accent hover:bg-star-500/20"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        <div className="space-y-4">
          <Card title="Mood over time" hint="Last entries with mood scored">
            <MoodChart logs={logs ?? []} />
          </Card>

          {knownTags.length > 0 && (
            <Card title="Tags" hint={`${knownTags.length} unique`}>
              <div className="flex flex-wrap gap-1.5">
                {knownTags.map((t) => {
                  const active = filterTag === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setFilterTag(active ? null : t)}
                      className={active ? 'chip-accent' : 'chip hover:border-divider hover:text-text'}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          <Card title="Stats" hint="Across all entries">
            <Stats logs={logs ?? []} />
          </Card>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New journal entry" width="lg">
        <LogForm
          knownTags={knownTags}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>
    </AppShell>
  );
}

function Stats({ logs }: { logs: LogEntry[] }) {
  const total = logs.length;
  const moodful = logs.filter((l) => l.mood != null);
  const avgMood =
    moodful.length > 0
      ? moodful.reduce((acc, l) => acc + (l.mood ?? 0), 0) / moodful.length
      : null;

  return (
    <dl className="grid grid-cols-2 gap-3">
      <div>
        <dt className="text-2xs uppercase tracking-wider text-mute">Total entries</dt>
        <dd className="mt-1 text-xl font-semibold tabular-nums">{total}</dd>
      </div>
      <div>
        <dt className="text-2xs uppercase tracking-wider text-mute">Avg mood</dt>
        <dd className="mt-1 text-xl font-semibold tabular-nums">
          {avgMood != null ? `${moodEmoji(avgMood)} ${avgMood.toFixed(1)}` : '—'}
        </dd>
      </div>
    </dl>
  );
}

function clampMood(m: number) {
  if (m <= 2) return 1;
  if (m <= 4) return 2;
  if (m <= 6) return 3;
  if (m <= 8) return 4;
  return 5;
}

function moodEmoji(m: number) {
  const c = clampMood(Math.round(m));
  return ['', '😞', '😕', '😐', '🙂', '😄'][c];
}
