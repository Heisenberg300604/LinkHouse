import Link from 'next/link';
import { Brand } from '@/components/brand';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="status-page" id="main">
      <div>
        <Brand />
        <p className="status-code">404</p>
        <h1>This page hasn’t found its home</h1>
        <p>Check the address, or head back and start fresh.</p>
        <Link className={buttonVariants({ size: 'lg' })} href="/">
          Back to Linkhouse
        </Link>
      </div>
    </main>
  );
}
