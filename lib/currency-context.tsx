'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  CurrencyCode,
  CURRENCIES,
  convert,
  formatCompact,
  formatMoney,
  formatNative,
  fromUsd,
  toUsd,
} from './currency';

interface CurrencyContextValue {
  code: CurrencyCode;
  symbol: string;
  setCode: (code: CurrencyCode) => void;
  // Format a USD-base amount, converted to the active display currency.
  format: (amountUsd: number | string | null | undefined) => string;
  formatCompact: (amountUsd: number) => string;
  // Format a value already denominated in `srcCode` — used for account/transaction
  // amounts, which are stored in the account's own currency, not USD-base.
  formatNative: (amount: number | string | null | undefined, srcCode: string) => string;
  // Convert any source-currency amount to the active display currency.
  convertToDisplay: (amount: number, srcCode: string) => number;
  fromUsd: (amountUsd: number) => number;
  toUsd: (amount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = 'polaris.currency';

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCodeState] = useState<CurrencyCode>('USD');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
    if (stored && stored in CURRENCIES) setCodeState(stored);
  }, []);

  const setCode = useCallback((c: CurrencyCode) => {
    setCodeState(c);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, c);
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      code,
      symbol: CURRENCIES[code].symbol,
      setCode,
      format: (amount) => formatMoney(amount, code),
      formatCompact: (amount) => formatCompact(amount, code),
      formatNative: (amount, srcCode) => formatNative(amount, srcCode),
      convertToDisplay: (amount, srcCode) => convert(amount, srcCode, code),
      fromUsd: (amount) => fromUsd(amount, code),
      toUsd: (amount) => toUsd(amount, code),
    }),
    [code, setCode],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
