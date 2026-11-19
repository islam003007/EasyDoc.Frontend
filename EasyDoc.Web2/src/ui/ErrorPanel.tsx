import { AlertCircle, RotateCw } from 'lucide-react';
import { describeError } from '../api/client';

export function ErrorPanel({
  error,
  title,
  onRetry,
}: {
  error: unknown;
  title: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-panel" role="alert">
      <h3>{title}</h3>
      <p>{describeError(error)}</p>
      {onRetry ? (
        <div className="error-panel__actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
            <RotateCw size={14} aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function InlineError({ error }: { error: unknown }) {
  return (
    <p className="form-error" role="alert">
      <AlertCircle size={14} aria-hidden="true" />
      <span>{describeError(error)}</span>
    </p>
  );
}
