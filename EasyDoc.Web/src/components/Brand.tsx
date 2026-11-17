import { Link } from 'react-router-dom';

export function Brand({
  to = '/',
  compact = false,
  light = false,
}: {
  to?: string;
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`brand ${compact ? 'brand--compact' : ''} ${light ? 'brand--light' : ''}`.trim()}
      aria-label="EasyDoc"
    >
      <span className="brand__mark" aria-hidden="true">
        E
      </span>
      <span className="brand__text">
        <span className="brand__word">EasyDoc</span>
        {!compact ? <span className="brand__tag">care, scheduled</span> : null}
      </span>
    </Link>
  );
}
