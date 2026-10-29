import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="grid-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="text-7xl font-black text-muted-foreground/40">404</div>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">The page you were looking for does not exist. The gateway logged this request as a 404 — scanners probing for weak spots look exactly like this.</p>
      <div className="mt-6 flex gap-3"><Link href="/"><Button variant="outline">Home</Button></Link><Link href="/dashboard"><Button>Open dashboard</Button></Link></div>
    </main>
  );
}
