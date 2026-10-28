'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Right-side slide-over panel (no portal dependency). */
export function Sheet({ open, onClose, title, description, children, className }: { open: boolean; onClose: () => void; title?: React.ReactNode; description?: React.ReactNode; children: React.ReactNode; className?: string }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className={cn('fixed inset-0 z-50', open ? 'pointer-events-auto' : 'pointer-events-none')} aria-hidden={!open}>
      <div className={cn('absolute inset-0 bg-black/60 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        className={cn('absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-border bg-background shadow-2xl transition-transform duration-300', open ? 'translate-x-0' : 'translate-x-full', className)}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-background/90 p-5 backdrop-blur">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  );
}
