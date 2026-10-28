import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'neon' | 'secondary';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_20px_-8px_hsl(var(--primary))]',
  secondary: 'bg-muted text-foreground hover:bg-muted/70 border border-border',
  outline: 'border border-border bg-transparent hover:bg-muted/50',
  ghost: 'bg-transparent hover:bg-muted/50',
  destructive: 'bg-cyber-red/90 text-white hover:bg-cyber-red',
  neon: 'bg-cyber-lime/15 text-cyber-lime border border-cyber-lime/40 hover:bg-cyber-lime/25',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-9 w-9 p-0',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
