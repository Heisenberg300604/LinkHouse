import { useId, type ReactNode } from 'react';

type ControlProps = { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true };

/**
 * Label + control + hint + error wiring. The label is a real <label for>, so the
 * accessible name is exactly `label` and errors are announced via role="alert".
 */
export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: (control: ControlProps) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? id + '-hint' : undefined;
  const errorId = error ? id + '-error' : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={'field' + (className ? ' ' + className : '')}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
