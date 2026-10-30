import Link from 'next/link';
import { Link2 } from 'lucide-react';

export function BrandMark({ size = 16 }: { size?: number }) {
  return (
    <span className="brand-mark" aria-hidden>
      <Link2 size={size} strokeWidth={2.4} />
    </span>
  );
}

export function Brand({ href = '/', className = '' }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={'brand ' + className} aria-label="Linkhouse home">
      <BrandMark />
      <span>
        linkhouse<span className="brand-period">.</span>
      </span>
    </Link>
  );
}
