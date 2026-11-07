import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-line bg-primary-50/50 p-10 text-center dark:border-white/10 dark:bg-white/[0.04]">
      <div className="rounded-full bg-ink-900 p-3 text-primary-200 dark:bg-primary-300 dark:text-ink-900">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-black text-ink-900 dark:text-slate-100">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm font-semibold text-slate-600 dark:text-slate-300">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
