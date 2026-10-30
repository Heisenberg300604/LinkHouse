import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const buttonVariants = cva('btn', {
  variants: {
    variant: {
      default: 'btn-primary',
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-secondary',
      ghost: 'btn-ghost',
      destructive: 'btn-danger',
      danger: 'btn-danger',
      'danger-ghost': 'btn-danger-ghost',
    },
    size: { default: '', sm: 'btn-sm', lg: 'btn-lg', icon: 'btn-icon' },
    block: { true: 'btn-block', false: '' },
  },
  defaultVariants: { variant: 'default', size: 'default', block: false },
});

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean };

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={twMerge(clsx(buttonVariants({ variant, size, block }), className))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <span className="spinner" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
}
