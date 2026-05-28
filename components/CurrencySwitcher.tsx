'use client';

import { useEffect, useRef, useState } from 'react';

import { CURRENCIES, CurrencyCode } from '@/lib/currency';
import { useCurrency } from '@/lib/currency-context';

export function CurrencySwitcher() {
  const { code, setCode } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const meta = CURRENCIES[code];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-secondary btn-sm gap-2"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-mute">{meta.symbol}</span>
        <span>{meta.code}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-elevated shadow-lift animate-fade-in"
          role="listbox"
        >
          {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => {
            const m = CURRENCIES[c];
            const active = c === code;
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCode(c);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                  active ? 'bg-star-500/10 text-star-300' : 'text-text hover:bg-hover'
                }`}
                role="option"
                aria-selected={active}
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 text-mute">{m.symbol}</span>
                  <span className="font-medium">{m.code}</span>
                  <span className="text-2xs text-mute">{m.name}</span>
                </span>
                {active && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
