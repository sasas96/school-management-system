import type { Status, Progress } from '@/types';

export function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    Good: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    Monitor: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    Attention: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${map[status]}`}
    >
      {status}
    </span>
  );
}

export function ProgressBadge({ progress }: { progress: Progress }) {
  const map: Record<Progress, string> = {
    Improving: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    Stable: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    Declining: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    'Not enough data': 'bg-slate-100 text-slate-600 ring-slate-500/20',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${map[progress]}`}
    >
      {progress}
    </span>
  );
}
