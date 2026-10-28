import Link from 'next/link';
import { ArrowUpRight, Link2 } from 'lucide-react';
import { ThemeToggle } from '@/components/providers';

const links = [
  ['My portfolio', 'Thoughtful things, made with care', 'https://example.com'],
  ['Latest writing', 'Notes from the process', 'https://example.com/journal'],
  ['Instagram', 'Behind the scenes and small moments', 'https://instagram.com'],
  ['GitHub', 'Experiments, code, and open source', 'https://github.com'],
];

export default function DemoPage() {
  return (
    <main className="public-page demo-page">
      <div className="public-theme">
        <ThemeToggle />
      </div>
      <Link className="demo-back" href="/">
        <Link2 size={15} /> Linkhouse
      </Link>
      <section className="public-profile" aria-labelledby="demo-title">
        <div className="avatar" aria-hidden="true">A</div>
        <p className="eyebrow demo-kicker">A LINKHOUSE DEMO</p>
        <h1 id="demo-title">Alex Morgan</h1>
        <p className="bio">Designer, maker, and curious human. A little corner of everything I create.</p>
        <div className="demo-links">
          {links.map(([title, description, href]) => (
            <a className="public-link" href={href} key={title} target="_blank" rel="noreferrer">
              <span className="demo-link-mark">↗</span>
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          ))}
        </div>
        <Link className="primary demo-cta" href="/sign-up">
          Make your own page <ArrowUpRight size={16} />
        </Link>
      </section>
    </main>
  );
}
