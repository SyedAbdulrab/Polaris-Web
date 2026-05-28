interface Props {
  label: string;
  value: string;
  hint?: string;
  tone?: 'good' | 'bad' | 'neutral';
}

export function MetricCard({ label, value, hint, tone = 'neutral' }: Props) {
  const valueColor =
    tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : 'text-slate-100';
  return (
    <div className="card">
      <div className="card-title">{label}</div>
      <div className={`mt-2 text-3xl font-semibold ${valueColor}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
