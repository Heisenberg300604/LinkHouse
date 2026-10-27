import NextLink from 'next/link';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Link2, Layers, BarChart3, Check } from 'lucide-react';
import { ThemeToggle } from '@/components/providers';
import { signedIn } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const authenticated = await signedIn();
  return (
    <>
      <header className="landing-nav">
        <Link className="wordmark" href="/">
          <span className="brand-icon">
            <Link2 size={20} />
          </span>
          linkhouse<span className="brand-period">.</span>
        </Link>
        <nav>
          <ThemeToggle />
          <Link href="/demo" className="nav-demo">
            Explore a page <ArrowUpRight size={14} />
          </Link>
          <Link href="/sign-in">Sign in</Link>
          <Link className="primary" href={authenticated ? '/dashboard' : '/sign-up'}>
            {authenticated ? 'Go to dashboard' : 'Get started'}
            <ArrowRight size={16} />
          </Link>
        </nav>
      </header>
      <main className="landing-main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="little-line" /> YOUR OWN CORNER OF THE INTERNET
            </p>
            <h1>
              Many sides of you.
              <br />
              <span>One simple link.</span>
            </h1>
            <p className="hero-description">
              Your work. Your ideas. Your next big thing.
              <br />
              Give everything you share a beautiful place to call home.
            </p>
            <div className="hero-actions">
              <Link className="primary large" href={authenticated ? '/dashboard' : '/sign-up'}>
                {authenticated ? 'Go to dashboard' : 'Create your Linkhouse'}
                <ArrowRight size={18} />
              </Link>
              <Link className="text-link" href="/demo">
                See it in action <ArrowUpRight size={16} />
              </Link>
            </div>
            <p className="hero-note">
              <Check size={14} /> A page that feels like you. Ready in minutes.
            </p>
            <div className="hero-divider" />
            <div className="hero-caption">
              <span>
                LESS NOISE.
                <br />
                MORE YOU.
              </span>
              <p>
                Made for creators, independent minds,
                <br />
                and anyone with something to share.
              </p>
            </div>
          </div>
          <div className="hero-example">
            <div className="example-label">
              <span className="status-dot">Your world, neatly connected</span>
              <span>01 / 01</span>
            </div>
            <div className="example-card">
              <div className="sample-avatar">
                am
                <span />
              </div>
              <span className="sample-handle">@alexmorgan</span>
              <h2>Alex Morgan</h2>
              <p>
                Designer, maker, and curious human.
                <br />A little corner of everything I create.
              </p>
              <div className="sample-links">
                <NextLink href="https://example.com" target="_blank" rel="noreferrer">
                  <span className="sample-icon">↗</span>
                  <span>
                    My portfolio<small>Thoughtful things, made with care</small>
                  </span>
                  <ArrowUpRight size={16} />
                </NextLink>
                <NextLink href="https://example.com/journal" target="_blank" rel="noreferrer">
                  <span className="sample-icon">≋</span>
                  <span>
                    Notes & little discoveries<small>A journal of the process</small>
                  </span>
                  <ArrowUpRight size={16} />
                </NextLink>
                <h3>Find me elsewhere</h3>
                <NextLink href="https://instagram.com" target="_blank" rel="noreferrer">
                  <span className="sample-icon">◎</span>
                  <span>Instagram</span>
                  <ArrowUpRight size={16} />
                </NextLink>
                <NextLink href="https://github.com" target="_blank" rel="noreferrer">
                  <span className="sample-icon">⌘</span>
                  <span>GitHub</span>
                  <ArrowUpRight size={16} />
                </NextLink>
              </div>
              <div className="sample-footer">
                <Link2 size={13} /> made with linkhouse
              </div>
            </div>
            <div className="example-bottom">
              <span>linkhouse / alexmorgan</span>
              <span>Yours to make.</span>
            </div>
          </div>
        </section>
        <section className="features-strip">
          <div>
            <Link2 size={21} />
            <h3>All your links. A single home.</h3>
            <p>One memorable address for everything you do.</p>
          </div>
          <div>
            <Layers size={21} />
            <h3>A little order goes a long way.</h3>
            <p>Organize your world with simple, custom sections.</p>
          </div>
          <div>
            <BarChart3 size={21} />
            <h3>Know what connects.</h3>
            <p>Clear insights into the links people love.</p>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Linkhouse</span>
        <span>A small page. A world of possibilities.</span>
        <NextLink href="/demo">
          Made to be shared <ArrowUpRight size={14} />
        </NextLink>
      </footer>
    </>
  );
}
