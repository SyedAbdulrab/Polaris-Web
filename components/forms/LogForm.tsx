'use client';

import { FormEvent, useState } from 'react';

import { api, ApiError } from '@/lib/api';

interface Props {
  onSaved: () => void;
  onCancel: () => void;
  knownTags?: string[];
}

const MOODS = [
  { value: 1, emoji: '😞', label: 'Low' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'OK' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

export function LogForm({ onSaved, onCancel, knownTags = [] }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mood, setMood] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/api/v1/logs', {
        date: new Date(date).toISOString(),
        mood: mood ?? undefined,
        note: note.trim() || undefined,
        tags: tags.length ? tags : undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  const tagSuggestions = knownTags.filter((t) => !tags.includes(t)).slice(0, 6);

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Date</label>
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
        />
      </div>

      <div>
        <label className="label">How was the day?</label>
        <div className="grid grid-cols-5 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(mood === m.value ? null : m.value)}
              className={`flex flex-col items-center rounded-lg border px-2 py-2.5 transition-colors ${
                mood === m.value
                  ? 'border-violet/60 bg-violet/10'
                  : 'border-border bg-elevated hover:border-divider'
              }`}
            >
              <span className="text-2xl leading-none">{m.emoji}</span>
              <span className="mt-1 text-2xs text-soft">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Tags</label>
        {tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => removeTag(t)}
                className="chip-accent hover:bg-star-500/20"
              >
                {t}
                <span className="ml-1 text-mute">×</span>
              </button>
            ))}
          </div>
        )}
        <input
          className="input"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag(tagInput);
            } else if (e.key === 'Backspace' && !tagInput && tags.length) {
              setTags(tags.slice(0, -1));
            }
          }}
          placeholder="Press Enter to add (e.g. work, win, gym)"
        />
        {tagSuggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-2xs text-mute">Recent:</span>
            {tagSuggestions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addTag(t)}
                className="chip hover:border-divider hover:text-text"
              >
                + {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="label">Note</label>
        <textarea
          className="input min-h-[100px]"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What happened? How did it feel? What did you learn?"
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
          {busy ? 'Saving…' : 'Save entry'}
        </button>
      </div>
    </form>
  );
}
