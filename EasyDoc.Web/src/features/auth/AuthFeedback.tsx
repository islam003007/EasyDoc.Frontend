import { AlertCircle, RotateCw } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { describeError } from '../../api/client';
import { initials, monogramTone, type MonogramTone } from '../../lib/format';

const MONOGRAM_SIZES = {
  sm: 'auth-monogram--sm',
  md: 'auth-monogram--md',
  lg: 'auth-monogram--lg',
} as const;

export function AuthMonogram({
  name,
  size = 'sm',
  tone,
}: {
  name: string;
  size?: keyof typeof MONOGRAM_SIZES;
  tone?: MonogramTone;
}) {
  return (
    <span
      className={`auth-monogram auth-monogram--${tone ?? monogramTone(name)} ${MONOGRAM_SIZES[size]}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function AuthSpinner() {
  return <span className="auth-spinner" aria-hidden="true" />;
}

export function AuthSkeleton({
  width = '100%',
  height = '1rem',
  className = '',
  style,
}: {
  width?: string;
  height?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`auth-skeleton ${className}`.trim()}
      aria-hidden="true"
      style={{ width, height, ...style }}
    />
  );
}

export function AuthErrorPanel({
  error,
  title,
  onRetry,
}: {
  error: unknown;
  title: string;
  onRetry?: () => void;
}) {
  return (
    <div className="auth-error-panel" role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{describeError(error)}</p>
        {onRetry ? (
          <button
            type="button"
            className="auth-btn auth-btn--secondary auth-btn--sm"
            onClick={onRetry}
          >
            <RotateCw size={14} aria-hidden="true" />
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function AuthEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="auth-empty">
      {icon ? <div className="auth-empty__icon">{icon}</div> : null}
      <strong>{title}</strong>
      <p>{description}</p>
      {action ? <div className="auth-empty__action">{action}</div> : null}
    </div>
  );
}
