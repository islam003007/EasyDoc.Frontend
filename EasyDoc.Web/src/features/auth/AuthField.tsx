import type { ReactNode } from 'react';

export function AuthField({
  id,
  label,
  error,
  hint,
  children,
  optional = false,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <div className={`auth-field ${error ? 'auth-field--invalid' : ''}`.trim()}>
      <label htmlFor={id}>
        {label}
        {optional ? <span className="auth-field__optional">optional</span> : null}
      </label>
      {children}
      {error ? (
        <small className="auth-field__error" id={`${id}-error`}>
          {error}
        </small>
      ) : hint ? (
        <small className="auth-field__hint" id={`${id}-hint`}>
          {hint}
        </small>
      ) : null}
    </div>
  );
}
