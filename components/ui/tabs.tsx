'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const Ctx = React.createContext<{ value: string; set: (v: string) => void } | null>(null);

export function Tabs({ value, onValueChange, children, className }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode; className?: string }) {
  return (
    <Ctx.Provider value={{ value, set: onValueChange }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}
export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div role="tablist" className={cn('inline-flex rounded-lg border border-border bg-muted/40 p-1 gap-1', className)}>{children}</div>;
}
export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(Ctx)!;
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.set(value)}
      className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors', active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground', className)}
    >
      {children}
    </button>
  );
}
export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(Ctx)!;
  if (ctx.value !== value) return null;
  return <div role="tabpanel" className={cn('mt-3', className)}>{children}</div>;
}
