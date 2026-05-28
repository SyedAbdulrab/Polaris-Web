import { money } from '@/lib/format';
import { Goal } from '@/lib/types';

export function GoalProgress({ goal }: { goal: Goal }) {
  const target = Number(goal.targetAmount);
  const current = Number(goal.currentAmount);
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  const deadline = goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '—';

  return (
    <div className="rounded-xl bg-ink-800 p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-medium">{goal.name}</div>
        <div className="text-xs text-slate-500">due · {deadline}</div>
      </div>
      <div className="mt-1 text-xs text-slate-500">{goal.category}</div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded bg-ink-950">
        <div className="h-full bg-star-500" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>{money(current)}</span>
        <span>{money(target)}</span>
      </div>
    </div>
  );
}
