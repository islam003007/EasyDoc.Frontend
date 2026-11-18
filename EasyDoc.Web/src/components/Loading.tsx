import { LoaderCircle } from 'lucide-react';

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="spinner" role={label ? 'status' : undefined}>
      <LoaderCircle aria-hidden="true" />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

export function Skeleton({
  width,
  height,
  className = '',
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function LoadingPanel({
  label = 'Loading',
  lines = 3,
}: {
  label?: string;
  lines?: number;
}) {
  return (
    <div className="loading-panel" aria-busy="true" aria-label={label}>
      <Skeleton width="42%" height="0.85rem" />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '68%' : '100%'}
          height="1.1rem"
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function AppLoading() {
  return (
    <div className="app-loading">
      <div className="app-loading__mark" aria-hidden="true">
        <img src="/brand/easydoc-mark.png" alt="" />
      </div>
      <p className="mono-label">EasyDoc · getting ready</p>
      <Spinner label="Loading EasyDoc" />
    </div>
  );
}
