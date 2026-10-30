import type { ReactNode } from 'react';

const tones = {
  neutral: '',
  accent: ' badge-accent',
  success: ' badge-success',
  warning: ' badge-warning',
  danger: ' badge-danger',
} as const;

export function Badge({
  tone = 'neutral',
  dot = false,
  children,
}: {
  tone?: keyof typeof tones;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={'badge' + tones[tone]}>
      {dot && <span className="dot" aria-hidden />}
      {children}
    </span>
  );
}
