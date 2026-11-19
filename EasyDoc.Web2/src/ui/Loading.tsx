import type { CSSProperties } from 'react';

export function Spinner({ label }: { label?: string }) {
  return (
    <>
      <span className="spinner" aria-hidden="true" />
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  );
}

export function AppLoading({ label = 'Opening the clinic…' }: { label?: string }) {
  return (
    <div className="centre-screen">
      <div className="app-loading" role="status">
        <img src="/brand/easydoc-mark.png" alt="" width="64" height="64" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function Skeleton({
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
      className={`skeleton ${className}`.trim()}
      aria-hidden="true"
      style={{ width, height, ...style }}
    />
  );
}
