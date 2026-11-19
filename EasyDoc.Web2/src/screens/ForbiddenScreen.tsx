import { Link } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { roleHome } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function ForbiddenScreen() {
  useDocumentTitle('Not your seat');
  const { session } = useSession();
  const home = session ? roleHome(session.role) : '/login';

  return (
    <div className="page page--narrow">
      <div className="error-page">
        <p className="error-page__code" aria-hidden="true">
          403
        </p>
        <p className="mini-label">Role boundary</p>
        <h1>This seat cannot open that page.</h1>
        <p className="error-page__lead">
          EasyDoc keeps each role to its own work: patients book and read their
          visits, doctors run the day, and admins keep the directory. The clinic
          service enforces the same boundary.
        </p>
        <div className="error-page__actions">
          <Link to={home} className="btn btn--primary">
            Back to my workspace
          </Link>
          <Link to="/account" className="btn btn--secondary">
            View this seat
          </Link>
        </div>
      </div>
    </div>
  );
}
