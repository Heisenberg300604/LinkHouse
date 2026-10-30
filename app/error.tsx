'use client';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="status-page" id="main">
      <div>
        <Brand />
        <h1>Something didn’t load</h1>
        <p>Please try again in a moment. If it keeps happening, your changes are still safe.</p>
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
