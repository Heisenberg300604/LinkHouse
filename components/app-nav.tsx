'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Link2, Settings, UserRound } from 'lucide-react';

const items = [
  { href: '/dashboard', label: 'Links', icon: Link2, exact: true },
  { href: '/dashboard/profile', label: 'Profile', icon: UserRound },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

/** One nav definition rendered as a desktop sidebar list or a mobile tab bar. */
export function AppNav({ variant }: { variant: 'sidebar' | 'tabs' }) {
  const pathname = usePathname();
  return (
    <nav className={'app-nav app-nav-' + variant} aria-label="Workspace">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
            <Icon size={variant === 'sidebar' ? 18 : 20} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
