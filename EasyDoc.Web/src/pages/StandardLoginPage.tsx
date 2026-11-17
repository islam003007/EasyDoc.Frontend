import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { Brand } from '../components/Brand';
import { roleHome } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function StandardLoginPage() {
  useDocumentTitle('Standard sign-in');
  const { session } = useSession();

  if (session) return <Navigate to={roleHome(session.role)} replace />;

  return (
    <div className="simple-screen">
      <header className="simple-screen__head">
        <Brand to="/login" />
        <Link to="/login" className="text-link">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to demo roles
        </Link>
      </header>

      <article className="simple-screen__card">
        <p className="eyebrow">
          <span className="eyebrow__index">↗</span>
          Standard account flow
        </p>
        <h1>
          Password sign-in is
          <br />
          <em>out of scope.</em>
        </h1>
        <p className="simple-screen__lead">
          EasyDoc’s API still supports its identity/password endpoints, but this
          portfolio demo intentionally keeps passwords out of the browser. Sessions
          are opened with a server-side demo allowlist.
        </p>

        <div className="simple-screen__grid">
          <div>
            <span className="mono-label">What works here</span>
            <p>One-click demo roles for a patient, a doctor, and an administrator.</p>
          </div>
          <div>
            <span className="mono-label">What is omitted</span>
            <p>
              Registration, email confirmation, password reset, profile uploads, and
              the standard email/password form.
            </p>
          </div>
        </div>

        <div className="simple-screen__actions">
          <Link to="/login" className="btn btn--primary">
            Use a demo role
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <span className="helper-note">
            The standard API endpoint remains <code>POST /auth/login</code>.
          </span>
        </div>
      </article>
    </div>
  );
}
