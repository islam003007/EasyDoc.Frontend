import { Link } from 'react-router-dom';

export function Brand({
  to = '/',
  className = '',
  edition = true,
}: {
  to?: string;
  className?: string;
  edition?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`brand ${className}`.trim()}
      aria-label="EasyDoc home"
    >
      <img src="/brand/easydoc-mark.png" alt="" width="41" height="41" />
      <span className="brand__type">
        <strong className="brand__word">EasyDoc</strong>
        {edition ? <small className="brand__edition">Care, scheduled</small> : null}
      </span>
    </Link>
  );
}
