import {
  Archive,
  CalendarDays,
  Code2,
  Eye,
  EyeOff,
  Globe,
  GripVertical,
  Newspaper,
  Pencil,
  Plus,
  Trash2,
  ExternalLink,
  BarChart3,
  Link2,
  UserRound,
  Settings,
} from 'lucide-react';

/* Static, decorative renderings of the real product UI. They reuse the app's own CSS
   classes so they cannot drift visually from the product. Numbers are illustrative. */

const rows = [
  { icon: Globe, title: 'Portfolio 2026', url: 'https://alexmorgan.design/', clicks: 214 },
  {
    icon: Newspaper,
    title: 'Notes on craft, my newsletter',
    url: 'https://notes.alexmorgan.design/',
    clicks: 168,
  },
  {
    icon: CalendarDays,
    title: 'Book a 30-minute call',
    url: 'https://cal.com/alexmorgan',
    clicks: 97,
  },
  { icon: Code2, title: 'GitHub', url: 'https://github.com/alexmorgan', clicks: 41 },
  {
    icon: Archive,
    title: 'Old portfolio',
    url: 'https://alexmorgan.dev/',
    clicks: 3,
    hidden: true,
  },
];

export function MockLinkList({ compact = false }: { compact?: boolean }) {
  return (
    <div className="card mock-links">
      <div className="link-group-body">
        {rows.slice(0, compact ? 4 : 5).map(({ icon: Icon, title, url, clicks, hidden }) => (
          <div className="sortable" key={title}>
            <span className="drag" aria-hidden>
              <GripVertical size={16} />
            </span>
            <div className="sortable-body">
              <div className="link-card" data-hidden={Boolean(hidden)}>
                <div className="icon-box">
                  <Icon size={18} aria-hidden />
                </div>
                <div className="link-copy">
                  <strong>{title}</strong>
                  <small>{url}</small>
                </div>
                <div className="link-meta">
                  {hidden && <span className="badge">Hidden</span>}
                  <span className="link-clicks num">
                    {clicks}
                    <small>clicks</small>
                  </span>
                </div>
                <div className="link-actions mock-actions">
                  <span className="icon-btn">
                    {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </span>
                  <span className="icon-btn">
                    <Pencil size={16} />
                  </span>
                  <span className="icon-btn">
                    <Trash2 size={16} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MockProfile({ sections = false }: { sections?: boolean }) {
  const item = (Icon: typeof Globe, title: string, small?: string) => (
    <div className="public-link" key={title}>
      <span className="public-link-icon">
        <Icon size="1.25em" />
      </span>
      <span>
        <strong>{title}</strong>
        {small && <small>{small}</small>}
      </span>
      <ExternalLink size="1em" />
    </div>
  );
  return (
    <div className="public-profile">
      <div className="avatar">
        <span className="avatar-initial">A</span>
      </div>
      <h2 style={{ fontSize: '1.75em', margin: '0 0 0.375em' }}>Alex Morgan</h2>
      <p className="public-handle">@alexmorgan</p>
      <p className="bio">Designer and maker. Notes on craft, tools and slow work.</p>
      <div className="public-links">
        {item(Globe, 'Portfolio 2026', 'Selected work, 2019 to now')}
        {item(Newspaper, 'Notes on craft', 'A fortnightly newsletter')}
        {!sections && item(CalendarDays, 'Book a 30-minute call')}
      </div>
      {sections && (
        <>
          <section className="public-section">
            <h3 className="section-title">Elsewhere</h3>
            <div className="public-links">
              {item(Code2, 'GitHub')}
              {item(CalendarDays, 'Book a call')}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export function MockPhone({ children, size = 11 }: { children: React.ReactNode; size?: number }) {
  return (
    <div className="phone mock-phone" aria-hidden>
      <div className="phone-screen" style={{ fontSize: size }}>
        <span className="phone-notch" />
        {children}
      </div>
    </div>
  );
}

export function MockWindow() {
  const nav = [Link2, UserRound, BarChart3, Settings];
  return (
    <figure
      className="mk-window"
      role="img"
      aria-label="The Linkhouse dashboard: a list of links with edit controls beside a live phone preview of the public page."
    >
      <div className="mk-window-bar" aria-hidden>
        <span />
        <span />
        <span />
        <div className="mk-window-url">linkhouse / dashboard</div>
      </div>
      <div className="mk-app" aria-hidden>
        <div className="mk-app-nav">
          <span className="brand-mark">
            <Link2 size={14} strokeWidth={2.4} />
          </span>
          {nav.map((Icon, i) => (
            <span key={i} className={'mk-app-nav-item' + (i === 0 ? ' is-active' : '')}>
              <Icon size={17} />
            </span>
          ))}
        </div>
        <div className="mk-app-main">
          <div className="mk-app-head">
            <div>
              <strong>Your links</strong>
              <small>Add, group and reorder what appears on your page.</small>
            </div>
            <span className="btn btn-primary btn-sm">
              <Plus size={14} /> Add link
            </span>
          </div>
          <MockLinkList />
        </div>
        <div className="mk-app-preview">
          <MockPhone size={10}>
            <MockProfile />
          </MockPhone>
        </div>
      </div>
    </figure>
  );
}
