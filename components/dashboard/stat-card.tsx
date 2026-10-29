import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({ icon: Icon, label, value, sub, tone = 'text-primary', className }: { icon: LucideIcon; label: string; value: string; sub?: string; tone?: string; className?: string }) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={cn('h-4 w-4', tone)} />
      </div>
      <div className={cn('mt-2 font-mono text-2xl font-bold', tone)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}
