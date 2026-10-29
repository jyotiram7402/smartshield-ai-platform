import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Protected site' };

export default function SitesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
