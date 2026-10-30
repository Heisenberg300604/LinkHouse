import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { ArrowUpRight } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/providers';
import { SignOutControl } from '@/components/sign-out-control';
import { AppNav } from '@/components/app-nav';
import { CopyLinkButton } from '@/components/copy-link-button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const publicPath = '/' + user.username;
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Brand href="/dashboard" />
        <AppNav variant="sidebar" />
        <div className="app-sidebar-foot">
          <div className="app-user">
            <UserButton />
            <div className="app-user-copy">
              <strong className="truncate">{user.displayName || user.username}</strong>
              <small className="truncate">@{user.username}</small>
            </div>
            <ThemeToggle />
          </div>
          <SignOutControl />
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <Brand href="/dashboard" className="app-topbar-brand" />
          <div className="app-address">
            <Badge tone="success" dot>
              Live
            </Badge>
            <span className="truncate">linkhouse{publicPath}</span>
            <CopyLinkButton path={publicPath} />
          </div>
          <div className="app-topbar-actions">
            <Link
              className="btn btn-secondary btn-sm"
              href={publicPath}
              target="_blank"
              rel="noreferrer"
            >
              View page <ArrowUpRight size={14} aria-hidden />
            </Link>
            <span className="app-topbar-user">
              <UserButton />
            </span>
          </div>
        </header>
        <main className="app-content" id="main">
          {children}
        </main>
      </div>
      <AppNav variant="tabs" />
    </div>
  );
}
