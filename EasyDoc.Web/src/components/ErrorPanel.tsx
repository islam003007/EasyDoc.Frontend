import { AlertCircle, RefreshCw } from 'lucide-react';
import { describeError } from '../api/client';

interface ErrorPanelProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorPanel({
  error,
  title = 'We could not load this',
  onRetry,
  compact = false,
}: ErrorPanelProps) {
  return (
    <div
      className={`state-panel state-panel--error ${compact ? 'state-panel--compact' : ''}`.trim()}
      role="alert"
    >
      <span className="state-panel__icon" aria-hidden="true">
        <AlertCircle />
      </span>
      <div className="state-panel__body">
        <h3>{title}</h3>
        <p>{describeError(error)}</p>
      </div>
      {onRetry ? (
        <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
          <RefreshCw size={14} aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </div>
  );
}
