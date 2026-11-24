import { Link } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { roleHome } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function ForbiddenScreen() {
  useDocumentTitle('Access denied');
  const { session } = useSession();
  const home = session ? roleHome(session.role) : '/login';

  return (
    <div className="page page--narrow">
      <div className="error-page">
        <p className="error-page__code" aria-hidden="true">
          403
        </p>
        <p className="mini-label">Access</p>
        <h1>You don’t have access to this page.</h1>
        <p className="error-page__lead">
          EasyDoc keeps each role to its own work: patients book and read their
          visits, doctors run the day, and admins keep the directory. The same
          rule applies throughout the app.
        </p>
        <div className="error-page__actions">
          <Link to={home} className="btn btn--primary">
            Go to my workspace
          </Link>
          <Link to="/account" className="btn btn--secondary">
            View your account
          </Link>
        </div>
      </div>
    </div>
  );
}
