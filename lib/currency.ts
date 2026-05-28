// All amounts in the database are stored in USD (the base currency).
// The user picks a *display* currency, which affects:
//   - how amounts are rendered everywhere on the dashboard
//   - how user-entered values are interpreted (form inputs are in display currency,
//     converted to USD before being POSTed to the API)
//
// Rates here are a manual snapshot, not live. They're approximate and meant for a
// personal-tracker context where you mentally track in your local currency but want
// the underlying numbers consistent over time.

export type CurrencyCode = 'USD' | 'QAR' | 'PKR' | 'EUR' | 'GBP' | 'INR' | 'AED';

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  name: string;
  // 1 USD = perUsd of this currency.
  perUsd: number;
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', perUsd: 1, decimals: 2 },
  QAR: { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal', perUsd: 3.64, decimals: 2 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', perUsd: 3.67, decimals: 2 },
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', perUsd: 278, decimals: 0 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', perUsd: 83.5, decimals: 0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', perUsd: 0.92, decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', perUsd: 0.78, decimals: 2 },
};

export const RATES_AS_OF = '2025-Q1 (snapshot)';

export function fromUsd(amountUsd: number, code: CurrencyCode): number {
  return amountUsd * CURRENCIES[code].perUsd;
}

// USD is the base currency we persist in, and the API enforces 2-decimal-place
// precision on monetary fields. Any time we cross *into* USD we collapse to its
// native precision so we can't accidentally ship `368000 / 278 = 1323.7410071...`
// to the API and get a 400.
export function toUsd(amount: number, code: CurrencyCode): number {
  const usd = amount / CURRENCIES[code].perUsd;
  return Math.round(usd * 100) / 100;
}

export function formatMoney(amountUsd: number | string | null | undefined, code: CurrencyCode): string {
  const usd = typeof amountUsd === 'number' ? amountUsd : Number(amountUsd ?? 0);
  const v = fromUsd(usd, code);
  return formatNative(v, code);
}

// Format a value that's already denominated in `code`. Used for account balances
// and transactions, which are stored in the account's native currency rather than
// USD-base.
export function formatNative(amount: number | string | null | undefined, code: CurrencyCode | string): string {
  const v = typeof amount === 'number' ? amount : Number(amount ?? 0);
  const meta = (CURRENCIES as Record<string, CurrencyMeta>)[code] ?? {
    symbol: code + ' ',
    decimals: 2,
  } as CurrencyMeta;
  const abs = Math.abs(v);
  if (abs >= 1_000_000) {
    return `${meta.symbol}${(v / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 100_000 && meta.decimals === 0) {
    return `${meta.symbol}${(v / 1000).toFixed(0)}k`;
  }
  return `${meta.symbol}${v.toLocaleString('en-US', {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  })}`;
}

// Convert an amount in `srcCode` to its equivalent in `dstCode`, going through USD.
// Used for cross-currency aggregation like net worth.
export function convert(amount: number, srcCode: string, dstCode: CurrencyCode): number {
  const src = (CURRENCIES as Record<string, CurrencyMeta>)[srcCode];
  const dst = CURRENCIES[dstCode];
  if (!src || !dst) return amount;
  const usd = amount / src.perUsd;
  return usd * dst.perUsd;
}

export function formatCompact(amountUsd: number, code: CurrencyCode): string {
  const meta = CURRENCIES[code];
  const v = fromUsd(amountUsd, code);
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${meta.symbol}${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1000) return `${meta.symbol}${(v / 1000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `${meta.symbol}${Math.round(v)}`;
}

export function percent(n: number | string | null | undefined): string {
  const v = typeof n === 'number' ? n : Number(n ?? 0);
  return `${(v * 100).toFixed(1)}%`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function relativeDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 86_400_000;
  const diff = Math.floor((today.getTime() - d.getTime()) / dayMs);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
