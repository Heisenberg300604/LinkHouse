'use client';

import { useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';

export function SignOutControl({ className = '' }: { className?: string }) {
  const { signOut } = useClerk();

  return (
    <button
      className={'btn btn-ghost btn-sm signout-button ' + className}
      type="button"
      onClick={() => signOut({ redirectUrl: '/' })}
    >
      <LogOut size={15} aria-hidden />
      Sign out
    </button>
  );
}
