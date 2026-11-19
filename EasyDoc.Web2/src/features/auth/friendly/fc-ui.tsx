import { AlertCircle, RotateCw } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { describeError } from '../../../api/client';
import { initials, monogramTone, type MonogramTone } from '../../../lib/format';

export function FcBrand({
  to = '/login',
  light = false,
}: {
  to?: string;
  light?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`fc-brand ${light ? 'fc-brand--light' : ''}`.trim()}
      aria-label="EasyDoc home"
    >
      <span className="fc-brand__mark" aria-hidden="true">
        <img src="/brand/easydoc-mark.png" alt="" />
      </span>
      <span className="fc-brand__text">
        <span className="fc-brand__word">EasyDoc</span>
        <span className="fc-brand__tag">care, scheduled</span>
      </span>
    </Link>
  );
}

const FC_MONOGRAM_SIZES = {
  sm: 'fc-monogram--sm',
  md: 'fc-monogram--md',
  lg: 'fc-monogram--lg',
} as const;

export function FcMonogram({
  name,
  size = 'sm',
  tone,
}: {
  name: string;
  size?: keyof typeof FC_MONOGRAM_SIZES;
  tone?: MonogramTone;
}) {
  return (
    <span
      className={`fc-monogram fc-monogram--${tone ?? monogramTone(name)} ${FC_MONOGRAM_SIZES[size]}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function FcSpinner() {
  return <span className="fc-spinner" aria-hidden="true" />;
}

export function FcSkeleton({
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
      className={`fc-skeleton ${className}`.trim()}
      aria-hidden="true"
      style={{ width, height, ...style }}
    />
  );
}

export function FcField({
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
    <div className={`fc-field ${error ? 'fc-field--invalid' : ''}`.trim()}>
      <label htmlFor={id}>
        {label}
        {optional ? <span className="fc-field__optional">optional</span> : null}
      </label>
      {children}
      {error ? (
        <small className="fc-field__error" id={`${id}-error`}>
          {error}
        </small>
      ) : hint ? (
        <small className="fc-field__hint" id={`${id}-hint`}>
          {hint}
        </small>
      ) : null}
    </div>
  );
}

export function FcErrorPanel({
  error,
  title,
  onRetry,
}: {
  error: unknown;
  title: string;
  onRetry?: () => void;
}) {
  return (
    <div className="fc-error-panel" role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{describeError(error)}</p>
        {onRetry ? (
          <button
            type="button"
            className="fc-btn fc-btn--secondary fc-btn--sm"
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

export function FcEmpty({
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
    <div className="fc-empty">
      {icon ? <div className="fc-empty__icon">{icon}</div> : null}
      <strong>{title}</strong>
      <p>{description}</p>
      {action ? <div className="fc-empty__action">{action}</div> : null}
    </div>
  );
}
