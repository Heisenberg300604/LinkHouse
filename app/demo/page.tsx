import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { signedIn } from '@/lib/auth';
import { SiteNav } from '@/components/marketing/site-nav';
import { DemoWorkspace } from '@/features/demo';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Live demo',
  description:
    'Try Linkhouse with sample data: reorder links, edit a profile and explore analytics. Nothing is saved.',
};

export default async function DemoPage() {
  const authenticated = await signedIn();
  const primaryHref = authenticated ? '/dashboard' : '/sign-up';
  return (
    <>
      <SiteNav authenticated={authenticated} />
      <main id="main" className="demo-page">
        <div className="mk-container">
          <header className="demo-intro">
            <p className="eyebrow">Interactive demo</p>
            <h1 className="t-title">Try Linkhouse before you sign up.</h1>
            <p className="t-lead">
              This is a working copy of the editor with sample data for a fictional designer.
              Reorder links, change the profile and explore analytics. Everything stays in this tab
              and is gone when you refresh.
            </p>
          </header>
          <DemoWorkspace />
          <div className="demo-cta">
            <div>
              <h2>Like what you see?</h2>
              <p>Your page is a minute away. The real editor works exactly like this, and saves.</p>
            </div>
            <Link className="btn btn-primary btn-lg" href={primaryHref}>
              {authenticated ? 'Go to dashboard' : 'Create your page'}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
