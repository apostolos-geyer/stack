'use client';
console.log('[TRACE] app/page.tsx - START', Date.now());

import { useSession } from '@_/infra.auth/client';
import { Button } from '@_/ui.web/components/button';

console.log('[TRACE] app/page.tsx - after button import', Date.now());

export default function Home() {
  const { data, isPending, isRefetching, error, refetch } = useSession();
  return (
    <main className="flex h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">web</h1>
      <Button>lowkey tuff</Button>
      {isPending ? '' : JSON.stringify(data)}
    </main>
  );
}
