import Link from 'next/link';
import {
  ArrowRight,
  AtSign,
  Check,
  Eye,
  Layers,
  MousePointerClick,
  Moon,
  PanelRight,
  ShieldCheck,
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { signedIn } from '@/lib/auth';
import { sampleSeries } from '@/lib/demo-data';
import { SiteNav } from '@/components/marketing/site-nav';
import { MockLinkList, MockPhone, MockProfile, MockWindow } from '@/components/marketing/mock';
import { TimeSeriesChart } from '@/components/charts/time-series-chart';

export const dynamic = 'force-dynamic';

const faqs = [
  [
    'What is Linkhouse?',
    'Linkhouse is a link-in-bio page. You get one public address, such as linkhouse/yourname, that gathers your portfolio, writing, social profiles and anything else you want to share.',
  ],
  [
    'What can I put on my page?',
    'A profile (photo, name and short bio) and any number of web links, up to 200, optionally grouped under up to 30 section headings. You can hide a link or a whole section at any time without deleting it.',
  ],
  [
    'What do the analytics show?',
    'Page views and link clicks per day over 7, 30 or 90 days, a comparison with the previous period, and your most clicked links. The numbers in your dashboard are plain counts: they don’t include device, location or visitor identity.',
  ],
  [
    'Can I change my address later?',
    'Yes, from your profile. Keep in mind that the old address stops working as soon as you change it, so update anywhere you have shared it.',
  ],
  [
    'How does sign-in work, and can I delete my data?',
    'Sign-in and account security are handled by Clerk. From Settings you can manage your email and password, and permanently delete your account, which removes your page, links and analytics.',
  ],
  [
    'Can I try it before signing up?',
    'Yes. The live demo is a working copy of the editor and analytics with sample data. Nothing you do there is saved or sent anywhere.',
  ],
] as const;

const capabilities = [
  [AtSign, 'Your own address', 'Claim a short, memorable username and share one link everywhere.'],
  [
    PanelRight,
    'Live preview',
    'See your public page update as you edit, on a phone-sized preview.',
  ],
  [
    Eye,
    'Show or hide anything',
    'Take a link or a whole section off your page without deleting it.',
  ],
  [Layers, 'Sections', 'Group links under headings such as Work, Writing or Social.'],
  [Moon, 'Light and dark', 'Your page and your dashboard follow the visitor’s or your own theme.'],
  [
    ShieldCheck,
    'Secure sign-in',
    'Managed authentication, with password and security controls in Settings.',
  ],
] as const;

export default async function Home() {
  const authenticated = await signedIn();
  const primaryHref = authenticated ? '/dashboard' : '/sign-up';
  const sample = sampleSeries(30);
  const sampleViews = sample.reduce((n, p) => n + p.views, 0);
  const sampleClicks = sample.reduce((n, p) => n + p.clicks, 0);
  return (
    <>
      <SiteNav authenticated={authenticated} />
      <main id="main">
        <section className="hero">
          <div className="mk-container hero-grid">
            <div className="rise-in">
              <p className="hero-badge">
                <b>Link in bio</b> for creators and professionals
              </p>
              <h1 className="t-display">
                One link for <em>everything</em> you share.
              </h1>
              <p className="t-lead">
                Linkhouse gives you a single page at your own address for your portfolio, writing
                and socials. Arrange it in minutes, then see which links people actually click.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary btn-lg" href={primaryHref}>
                  {authenticated ? 'Go to dashboard' : 'Create your page'}
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <Link className="btn btn-secondary btn-lg" href="/demo">
                  Try the live demo
                </Link>
              </div>
              <ul className="hero-points">
                {['Your own web address', 'Drag-and-drop ordering', 'Built-in analytics'].map(
                  (t) => (
                    <li key={t}>
                      <Check size={15} aria-hidden /> {t}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="hero-visual rise-in" style={{ animationDelay: '80ms' }}>
              <MockWindow />
            </div>
          </div>
        </section>

        <section className="mk-section" id="features" style={{ paddingTop: 0 }}>
          <div className="mk-container">
            <div className="mk-section-head">
              <p className="eyebrow">What you get</p>
              <h2>Everything a link page needs, and nothing it doesn’t.</h2>
              <p>
                Three tools do the real work: a link manager, a page you can organize, and analytics
                that tell you what is landing.
              </p>
            </div>

            <div className="feature-row">
              <div className="feature-copy">
                <p className="eyebrow">Link manager</p>
                <h3>Add, reorder and hide links without friction.</h3>
                <p>
                  Everything lives in one list. Drag to reorder, switch a link off for a while, or
                  search when your list grows.
                </p>
                <ul className="check-list">
                  {[
                    'Drag-and-drop ordering, also with the keyboard',
                    'Hide or show any link instantly',
                    'Optional descriptions and automatic platform icons',
                    'Clicks from the last 30 days on every row',
                  ].map((t) => (
                    <li key={t}>
                      <Check size={16} aria-hidden />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <figure className="feature-visual" style={{ margin: 0 }}>
                <MockLinkList compact />
                <figcaption>Illustration with sample data</figcaption>
              </figure>
            </div>

            <div className="feature-row is-flipped">
              <div className="feature-copy">
                <p className="eyebrow">Your public page</p>
                <h3>A page that looks right on every phone.</h3>
                <p>
                  Add a photo, name and bio, group links into sections, and check the result in a
                  live preview before anyone else sees it.
                </p>
                <ul className="check-list">
                  {[
                    'Sections with their own headings',
                    'Profile photo, name and a 160-character bio',
                    'Light and dark themes that follow the visitor',
                    'Long names and URLs wrap cleanly',
                  ].map((t) => (
                    <li key={t}>
                      <Check size={16} aria-hidden />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <figure className="feature-visual" style={{ margin: 0 }}>
                <div className="visual-phones">
                  <MockPhone size={12}>
                    <MockProfile sections />
                  </MockPhone>
                </div>
                <figcaption>Illustration with sample data</figcaption>
              </figure>
            </div>

            <div className="feature-row">
              <div className="feature-copy">
                <p className="eyebrow">Analytics</p>
                <h3>See what people actually click.</h3>
                <p>
                  Compare views and clicks over 7, 30 or 90 days, spot your best-performing links,
                  and see how this period stacks up against the last.
                </p>
                <ul className="check-list">
                  {[
                    'Daily page views and link clicks',
                    'Change versus the previous period',
                    'Top links ranked by clicks',
                    'Plain counts, no visitor profiles',
                  ].map((t) => (
                    <li key={t}>
                      <Check size={16} aria-hidden />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <figure className="feature-visual" style={{ margin: 0 }}>
                <div className="visual-analytics">
                  <div className="visual-kpis">
                    <div>
                      <span>Page views</span>
                      <strong className="num">{sampleViews.toLocaleString('en-US')}</strong>
                    </div>
                    <div>
                      <span>Link clicks</span>
                      <strong className="num">{sampleClicks.toLocaleString('en-US')}</strong>
                    </div>
                    <div>
                      <span>Clicks per view</span>
                      <strong className="num">
                        {Math.round((sampleClicks / sampleViews) * 1000) / 10}%
                      </strong>
                    </div>
                  </div>
                  <TimeSeriesChart
                    points={sample}
                    label="Sample chart of daily page views and link clicks over 30 days"
                  />
                </div>
                <figcaption>Illustration with sample data</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="mk-section" style={{ paddingTop: 0 }} aria-labelledby="details-title">
          <div className="mk-container">
            <div className="mk-section-head is-center">
              <p className="eyebrow">The details</p>
              <h2 id="details-title">Small things, done properly.</h2>
            </div>
            <div className="cap-grid">
              {capabilities.map(([Icon, title, body]) => (
                <div className="cap" key={title}>
                  <Icon size={22} aria-hidden />
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mk-section" id="how-it-works" style={{ paddingTop: 0 }}>
          <div className="mk-container">
            <div className="mk-section-head">
              <p className="eyebrow">How it works</p>
              <h2>From sign-up to shared in a few minutes.</h2>
            </div>
            <ol className="steps">
              <li className="step">
                <h3>Claim your address</h3>
                <p>
                  Sign up, pick a username, and your page exists at linkhouse/yourname straight
                  away.
                </p>
              </li>
              <li className="step">
                <h3>Add your links</h3>
                <p>
                  Paste your portfolio, newsletter and profiles. Group them into sections and set
                  the order.
                </p>
              </li>
              <li className="step">
                <h3>Share it and learn</h3>
                <p>Put one link in your bio. Come back to see views, clicks and your top links.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="mk-section" id="faq" style={{ paddingTop: 0 }}>
          <div className="mk-container">
            <div className="mk-section-head is-center">
              <p className="eyebrow">FAQ</p>
              <h2>Good questions.</h2>
            </div>
            <div className="faq">
              {faqs.map(([q, a]) => (
                <details className="faq-item" key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="mk-container">
            <div className="cta-band">
              <MousePointerClick
                size={28}
                aria-hidden
                style={{ margin: '0 auto 1rem', opacity: 0.85 }}
              />
              <h2>Give everything you share a home.</h2>
              <p>
                Create your page, or explore a working demo first. No setup required to look around.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary btn-lg" href={primaryHref}>
                  {authenticated ? 'Go to dashboard' : 'Create your page'}
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <Link className="btn btn-secondary btn-lg" href="/demo">
                  Explore the demo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="mk-container site-footer-inner">
          <div>
            <Brand />
            <p>A small page for everything you share.</p>
          </div>
          <nav aria-label="Footer">
            <Link href="/demo">Live demo</Link>
            <Link href="/#features">Features</Link>
            <Link href="/#faq">FAQ</Link>
            <Link href="/sign-in">Sign in</Link>
            <Link href={primaryHref}>{authenticated ? 'Dashboard' : 'Get started'}</Link>
          </nav>
          <small className="muted">© {new Date().getFullYear()} Linkhouse</small>
        </div>
      </footer>
    </>
  );
}
