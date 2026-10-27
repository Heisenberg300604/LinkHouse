import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'primary',
        outline: 'border border-[var(--border)] bg-[var(--surface)]',
        ghost: 'hover:bg-[var(--soft)]',
        destructive: 'danger',
      },
      size: { default: 'px-4 py-2', sm: 'px-3 py-1', icon: 'size-9' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);
export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp className={twMerge(clsx(buttonVariants({ variant, size }), className))} {...props} />
  );
}
