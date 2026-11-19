import type { ReactNode } from 'react';

export function Field({
  id,
  label,
  error,
  hint,
  children,
  className = '',
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`field ${error ? 'field--invalid' : ''} ${className}`.trim()}
    >
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <small className="field__error" id={`${id}-error`}>
          {error}
        </small>
      ) : hint ? (
        <small className="field__hint" id={`${id}-hint`}>
          {hint}
        </small>
      ) : null}
    </div>
  );
}
