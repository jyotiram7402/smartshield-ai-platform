import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'violet';

const variants: Record<Variant, string> = {
  default: 'bg-primary/15 text-primary border-primary/30',
  secondary: 'bg-muted text-muted-foreground border-border',
  success: 'bg-cyber-lime/15 text-cyber-lime border-cyber-lime/30',
  warning: 'bg-cyber-amber/15 text-cyber-amber border-cyber-amber/30',
  destructive: 'bg-cyber-red/15 text-cyber-red border-cyber-red/30',
  violet: 'bg-cyber-violet/15 text-cyber-violet border-cyber-violet/30',
  outline: 'bg-transparent text-foreground border-border',
};

export function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', variants[variant], className)}
      {...props}
    />
  );
}
