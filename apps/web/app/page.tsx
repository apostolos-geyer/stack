console.log('[TRACE] app/page.tsx - START', Date.now());

import { Button } from '@_/ui.web/components/button';

console.log('[TRACE] app/page.tsx - after button import', Date.now());

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">web</h1>
      <Button>lowkey tuff</Button>
    </main>
  );
}
