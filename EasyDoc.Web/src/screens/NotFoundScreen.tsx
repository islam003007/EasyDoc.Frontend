import { Link } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { roleHome } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function NotFoundScreen() {
  useDocumentTitle('Page not found');
  const { session } = useSession();
  const home = session ? roleHome(session.role) : '/login';

  return (
    <div className="page page--narrow">
      <div className="error-page">
        <p className="error-page__code" aria-hidden="true">
          404
        </p>
        <p className="mini-label">Missing page</p>
        <h1>We couldn’t find that page.</h1>
        <p className="error-page__lead">
          The address may be wrong, or the page may have moved. Go back to your
          workspace to continue.
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
