'use client';

import { useEffect } from 'react';
import { Sidebar, MobileNav } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { ensureSimulation } from '@/lib/store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ensureSimulation();
  }, []);

  return (
    <div className="grid-bg min-h-screen md:grid md:grid-cols-[236px_minmax(0,1fr)]">
      <Sidebar />
      <div className="flex min-h-screen flex-col">
        <Topbar />
        <main className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 p-4 pb-24 md:p-6 md:pb-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
