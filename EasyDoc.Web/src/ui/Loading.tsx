import type { CSSProperties } from 'react';

export function Spinner({ label }: { label?: string }) {
  return (
    <>
      <span className="spinner" aria-hidden="true" />
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  );
}

export function AppLoading({
  label = 'Opening the clinic…',
  detail,
}: {
  label?: string;
  detail?: string;
}) {
  return (
    <div className="recovery-screen">
      <div className="app-loading" role="status" aria-live="polite">
        <div className="app-loading__mark" aria-hidden="true">
          <img src="/brand/easydoc-mark.png" alt="" width="72" height="72" />
        </div>
        <p className="mini-label">EasyDoc · getting ready</p>
        <p className="app-loading__label">{label}</p>
        {detail ? <p className="app-loading__detail">{detail}</p> : null}
        <Spinner label={label} />
      </div>
    </div>
  );
}

export function ScreenLoading({ label = 'Opening this screen…' }: { label?: string }) {
  return (
    <div className="screen-loading" role="status" aria-live="polite">
      <img src="/brand/easydoc-mark.png" alt="" width="44" height="44" />
      <span>{label}</span>
      <Spinner />
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
