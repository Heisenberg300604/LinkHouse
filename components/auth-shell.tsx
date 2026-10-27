import Link from 'next/link';
import { ArrowUpRight, Check, Link2, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthShell({ children, eyebrow, title, description }: AuthShellProps) {
  return (
    <main className="auth-page">
      <section className="auth-intro" aria-label="About Linkhouse">
        <Link className="wordmark auth-wordmark" href="/">
          <span className="brand-icon"><Link2 size={17} strokeWidth={2.4} /></span>
          linkhouse<span className="brand-period">.</span>
        </Link>

        <div className="auth-copy">
          <p className="auth-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="auth-preview" aria-hidden="true">
          <div className="auth-preview-top">
            <span className="auth-avatar">L</span>
            <span>
              <strong>yourname</strong>
              <small>linkhouse.bio/yourname</small>
            </span>
          </div>
          <div className="auth-preview-link"><span className="auth-preview-dot" />Your latest work <ArrowUpRight size={15} /></div>
          <div className="auth-preview-link"><span className="auth-preview-dot" />Everything you share <ArrowUpRight size={15} /></div>
        </div>

        <p className="auth-assurance"><ShieldCheck size={16} /> Private, secure, and yours to control.</p>
      </section>

      <section className="auth-form-area">
        <Link className="auth-back" href="/">← Back to home</Link>
        <div className="auth-form-wrap">
          <div className="auth-mobile-heading">
            <p className="auth-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {children}
          <p className="auth-privacy"><Check size={14} /> Your data stays yours. Always.</p>
        </div>
      </section>
    </main>
  );
}

export function AuthFormLoading() {
  return (
    <div className="auth-loading" role="status" aria-live="polite">
      <span className="auth-loading-mark"><Link2 size={18} /></span>
      <p>Preparing your secure sign-in…</p>
      <div className="auth-loading-line auth-loading-line--wide" />
      <div className="auth-loading-line" />
      <div className="auth-loading-field" />
      <div className="auth-loading-button" />
    </div>
  );
}

export function AuthFormFailed() {
  return (
    <div className="auth-failed" role="alert">
      <ShieldCheck size={20} />
      <div>
        <strong>Secure sign-in could not load.</strong>
        <p>Check your connection or disable any blocker that may be preventing Clerk from loading, then refresh the page.</p>
      </div>
    </div>
  );
}
