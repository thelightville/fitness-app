import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string; positive?: boolean };
  color?: 'green' | 'blue' | 'red' | 'amber' | 'slate' | 'flame';
}

const colorMap = {
  green: 'bg-primary-100 text-ink-900 ring-primary-200 dark:bg-primary-300 dark:text-ink-900 dark:ring-primary-200',
  blue: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-400/15 dark:text-cyan-200 dark:ring-cyan-300/20',
  red: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800',
  amber: 'bg-flame-100 text-flame-600 ring-flame-300 dark:bg-flame-500/15 dark:text-flame-300 dark:ring-flame-300/20',
  flame: 'bg-flame-100 text-flame-600 ring-flame-300 dark:bg-flame-500/15 dark:text-flame-300 dark:ring-flame-300/20',
  slate: 'bg-ink-900 text-primary-200 ring-ink-700 dark:bg-white/10 dark:text-primary-200 dark:ring-white/10',
};

export function StatCard({ label, value, icon: Icon, trend, color = 'slate' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ring-1 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className={trend.positive !== false ? 'font-semibold text-primary-700 dark:text-primary-400' : 'font-semibold text-red-600 dark:text-red-400'}>
            {trend.positive !== false ? '+' : ''}{trend.value}%
          </span>
          <span className="text-slate-500 dark:text-slate-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
