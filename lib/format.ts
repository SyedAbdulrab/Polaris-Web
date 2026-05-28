export function money(n: number | string | null | undefined): string {
  const v = typeof n === 'number' ? n : Number(n ?? 0);
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function percent(n: number | string | null | undefined): string {
  const v = typeof n === 'number' ? n : Number(n ?? 0);
  return `${(v * 100).toFixed(1)}%`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
