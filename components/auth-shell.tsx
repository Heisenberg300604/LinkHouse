import Link from 'next/link';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/providers';
import { MockPhone, MockProfile } from '@/components/marketing/mock';
import { Skeleton } from '@/components/ui/skeleton';

type AuthShellProps = {
  children: ReactNode;
  /** Omit for Clerk flows: Clerk renders its own step-specific <h1>. */
  eyebrow?: string;
  title?: string;
  description?: string;
};

const points = [
  'Your own web address',
  'Drag-and-drop link ordering',
  'Analytics for views and clicks',
];

export function AuthShell({ children, eyebrow, title, description }: AuthShellProps) {
  return (
    <div className="auth-page">
      <aside className="auth-intro" aria-label="About Linkhouse">
        <Brand className="auth-brand" />
        <div className="auth-intro-body">
          <div className="auth-intro-copy">
            <p className="auth-eyebrow">One link for everything you share</p>
            <h2>A home for your work, ideas and links.</h2>
            <ul>
              {points.map((point) => (
                <li key={point}>
                  <Check size={16} aria-hidden /> {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="auth-intro-visual">
            <MockPhone size={11}>
              <MockProfile />
            </MockPhone>
          </div>
        </div>
        <p className="auth-assurance">
          <ShieldCheck size={16} aria-hidden /> Sign-in is handled securely by Clerk.
        </p>
      </aside>

      <main className="auth-form-area" id="main">
        <div className="auth-topbar">
          <Link className="auth-back" href="/">
            <ArrowLeft size={15} aria-hidden /> Back to home
          </Link>
          <ThemeToggle />
        </div>
        <div className="auth-form-wrap">
          <Brand className="auth-mobile-brand" />
          {title && (
            <div className="auth-heading">
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              <h1>{title}</h1>
              {description && <p>{description}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

/** Mirrors the sign-in form's dimensions so the card does not jump when Clerk finishes loading. */
export function AuthFormLoading() {
  return (
    <div className="auth-loading" role="status" aria-live="polite">
      <span className="sr-only">Loading secure sign-in…</span>
      <Skeleton style={{ height: 42 }} />
      <div className="auth-loading-divider" aria-hidden>
        <span />
        <i />
        <span />
      </div>
      <Skeleton style={{ width: 70, height: 13 }} />
      <Skeleton style={{ height: 40 }} />
      <Skeleton style={{ width: 70, height: 13 }} />
      <Skeleton style={{ height: 40 }} />
      <Skeleton style={{ height: 40, marginTop: 6 }} />
    </div>
  );
}

export function AuthFormFailed() {
  return (
    <div className="form-error" role="alert">
      <ShieldCheck size={18} aria-hidden style={{ flex: 'none' }} />
      <div>
        <strong>Secure sign-in could not load.</strong>
        <p style={{ margin: '0.25rem 0 0', color: 'inherit', fontWeight: 400 }}>
          Check your connection, or disable any content blocker that may be stopping Clerk from
          loading, then refresh the page.
        </p>
      </div>
    </div>
  );
}
