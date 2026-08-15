import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string; positive?: boolean };
  color?: 'green' | 'blue' | 'red' | 'amber' | 'slate';
}

const colorMap = {
  green: 'bg-primary-50 text-primary-700 ring-primary-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
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
          <span className={trend.positive !== false ? 'font-semibold text-primary-700' : 'font-semibold text-red-600'}>
            {trend.positive !== false ? '+' : ''}{trend.value}%
          </span>
          <span className="text-slate-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
