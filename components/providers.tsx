'use client';
import { ThemeProvider, useTheme } from 'next-themes';
import { Toaster } from 'sonner';
import { Moon, Sun } from 'lucide-react';

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      toastOptions={{ style: { fontFamily: 'var(--font-sans)', fontSize: '0.8125rem' } }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ThemedToaster />
      {children}
    </ThemeProvider>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label="Toggle color theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun size={18} className="sun" aria-hidden />
      <Moon size={18} className="moon" aria-hidden />
    </button>
  );
}
