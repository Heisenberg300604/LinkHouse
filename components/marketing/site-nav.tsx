'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/providers';

const links = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/demo', label: 'Live demo' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteNav({ authenticated }: { authenticated: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  const cta = authenticated ? 'Go to dashboard' : 'Get started';
  const ctaHref = authenticated ? '/dashboard' : '/sign-up';
  return (
    <header className="site-nav">
      <div className="mk-container site-nav-inner">
        <Brand />
        <nav className="site-nav-links" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="site-nav-actions">
          <ThemeToggle />
          {!authenticated && (
            <Link className="btn btn-ghost site-nav-signin" href="/sign-in">
              Sign in
            </Link>
          )}
          <Link className="btn btn-primary site-nav-cta" href={ctaHref}>
            {cta}
            <ArrowRight size={15} aria-hidden />
          </Link>
          <button
            type="button"
            className="icon-btn site-nav-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <div id="mobile-menu" className="site-menu" onClick={() => setOpen(false)}>
          <nav aria-label="Mobile">
            {links.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            {!authenticated && <Link href="/sign-in">Sign in</Link>}
            <Link className="btn btn-primary btn-lg btn-block" href={ctaHref}>
              {cta}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
