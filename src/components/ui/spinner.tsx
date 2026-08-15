import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 20, className = '', label }: SpinnerProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <Loader2 size={size} className="animate-spin" aria-hidden="true" />
      {label && <span className="text-sm text-slate-500">{label}</span>}
    </span>
  );
}
