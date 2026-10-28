'use client';

import { cn } from '@/lib/utils';

export function Switch({ checked, onCheckedChange, className, label }: { checked: boolean; onCheckedChange: (v: boolean) => void; className?: string; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        checked ? 'bg-cyber-lime/80 border-cyber-lime' : 'bg-muted border-border',
        className,
      )}
    >
      <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  );
}
