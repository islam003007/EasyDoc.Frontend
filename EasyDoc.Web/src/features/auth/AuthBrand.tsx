import { Link } from 'react-router-dom';

export function AuthBrand({
  to = '/login',
  light = false,
}: {
  to?: string;
  light?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`auth-brand ${light ? 'auth-brand--light' : ''}`.trim()}
      aria-label="EasyDoc home"
    >
      <span className="auth-brand__mark" aria-hidden="true">
        <img src="/brand/easydoc-mark.png" alt="" />
      </span>
      <span className="auth-brand__text">
        <span className="auth-brand__word">EasyDoc</span>
        <span className="auth-brand__tag">care, scheduled</span>
      </span>
    </Link>
  );
}
