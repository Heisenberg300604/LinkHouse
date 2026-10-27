import NextLink from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Link2, UserRound, BarChart3, Settings, ArrowUpRight } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { ThemeToggle } from '@/components/providers';
export const dynamic = 'force-dynamic';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <NextLink href="/" className="wordmark">
          <Link2 />
          linkhouse.
        </NextLink>
        <p className="eyebrow workspace-label">YOUR WORKSPACE</p>
        <nav>
          <NextLink href="/dashboard">
            <Link2 size={19} />
            Links
          </NextLink>
          <NextLink href="/dashboard/profile">
            <UserRound size={19} />
            Profile
          </NextLink>
          <NextLink href="/dashboard/analytics">
            <BarChart3 size={19} />
            Analytics
          </NextLink>
          <NextLink href="/dashboard/settings">
            <Settings size={19} />
            Settings
          </NextLink>
        </nav>
        <div className="sidebar-bottom">
          <p className="muted">
            A little space.
            <br />A lot of possibility.
          </p>
          <div className="row">
            <UserButton />
            <span>{user.displayName || user.username}</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-header">
          <span>My Linkhouse</span>
          <NextLink href={'/' + user.username} target="_blank" rel="noreferrer">
            View public page <ArrowUpRight size={16} />
          </NextLink>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
